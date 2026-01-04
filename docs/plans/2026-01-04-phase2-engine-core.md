# Phase 2: Work Items + Engine Core Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add WorkItem persistence and build the workflow engine that routes items through tasks automatically.

**Architecture:** WorkItem model tracks items moving through workflows. Engine class handles routing logic: moveToTask() recursively processes automatic tasks (decision, begin) until landing on a user task or end. Decision tasks evaluate conditions against objectData JSON.

**Tech Stack:** Prisma (schema extension), TypeScript engine class, Next.js API routes

---

## Task 1: Add WorkItem and WorkItemHistory to Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add WorkItem model**

Add after the existing models in `prisma/schema.prisma`:

```prisma
model WorkItem {
  id            String    @id @default(cuid())
  workflowId    String
  workflow      Workflow  @relation(fields: [workflowId], references: [id])
  currentTaskId String
  currentTask   Task      @relation(fields: [currentTaskId], references: [id])

  // Business object (embedded metadata)
  objectType    String    // "invoice", "purchase_order", etc.
  objectData    String    // JSON: the actual business object fields

  // Status tracking
  status        String    @default("active") // active, completed, cancelled
  priority      String    @default("normal") // low, normal, high, urgent

  // Assignment
  claimedById   String?
  claimedBy     User?     @relation("ClaimedItems", fields: [claimedById], references: [id])
  claimedAt     DateTime?

  // Audit trail
  history       WorkItemHistory[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model WorkItemHistory {
  id          String   @id @default(cuid())
  workItemId  String
  workItem    WorkItem @relation(fields: [workItemId], references: [id], onDelete: Cascade)
  taskId      String
  taskName    String
  action      String   // "created", "arrived", "claimed", "released", "auto-routed", "completed"
  routeLabel  String?
  userId      String?
  notes       String?
  timestamp   DateTime @default(now())
}
```

**Step 2: Update Workflow model to add WorkItem relation**

Find the Workflow model and add:

```prisma
model Workflow {
  // ... existing fields
  workItems  WorkItem[]
}
```

**Step 3: Update Task model to add WorkItem relation**

Find the Task model and add:

```prisma
model Task {
  // ... existing fields
  workItems  WorkItem[]
}
```

**Step 4: Update User model to add claimedItems relation**

Find the User model and add:

```prisma
model User {
  // ... existing fields
  claimedItems WorkItem[] @relation("ClaimedItems")
}
```

**Step 5: Push schema changes**

```bash
npx prisma db push
```

Expected: Database updated with WorkItem and WorkItemHistory tables

**Step 6: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add WorkItem and WorkItemHistory models"
```

---

## Task 2: Create Workflow Engine Core

**Files:**
- Create: `src/lib/engine/index.ts`
- Create: `src/lib/engine/types.ts`

**Step 1: Create engine types**

Create `src/lib/engine/types.ts`:

```typescript
export interface EngineResult {
  success: boolean
  workItemId: string
  currentTaskId: string
  currentTaskName: string
  status: 'active' | 'completed'
  error?: string
}

export interface RouteCondition {
  field: string
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith'
  value: string | number | boolean
}

export interface DecisionTaskConfig {
  type: 'decision'
  conditions: Array<{
    id: string
    routeId: string
    fieldId: string
    operator: string
    value: string | number | boolean
    priority: number
  }>
  defaultRouteId: string | null
}

export interface UserTaskConfig {
  type: 'user'
  distributionMethod: 'queue' | 'round-robin' | 'manual'
  assignees: {
    type: 'user' | 'group'
    ids: string[]
  }
  formFields?: string[]
  instructions?: string
}
```

**Step 2: Create engine core**

Create `src/lib/engine/index.ts`:

```typescript
import { prisma } from '@/lib/prisma'
import type { EngineResult, DecisionTaskConfig } from './types'

export class WorkflowEngine {
  /**
   * Start a new work item in a workflow
   */
  async startWorkflow(
    workflowId: string,
    objectType: string,
    objectData: Record<string, unknown>,
    priority: string = 'normal'
  ): Promise<EngineResult> {
    // Find the BEGIN task
    const beginTask = await prisma.task.findFirst({
      where: { workflowId, type: 'begin' },
      include: { outboundRoutes: true },
    })

    if (!beginTask) {
      return {
        success: false,
        workItemId: '',
        currentTaskId: '',
        currentTaskName: '',
        status: 'active',
        error: 'Workflow has no BEGIN task',
      }
    }

    // Create the work item at the BEGIN task
    const workItem = await prisma.workItem.create({
      data: {
        workflowId,
        currentTaskId: beginTask.id,
        objectType,
        objectData: JSON.stringify(objectData),
        priority,
        status: 'active',
        history: {
          create: {
            taskId: beginTask.id,
            taskName: beginTask.name,
            action: 'created',
            notes: `Started workflow with ${objectType}`,
          },
        },
      },
    })

    // Immediately route from BEGIN to the first real task
    if (beginTask.outboundRoutes.length > 0) {
      const firstRoute = beginTask.outboundRoutes[0]
      return this.moveToTask(workItem.id, firstRoute.targetTaskId)
    }

    return {
      success: true,
      workItemId: workItem.id,
      currentTaskId: beginTask.id,
      currentTaskName: beginTask.name,
      status: 'active',
    }
  }

  /**
   * Move a work item to a specific task
   * Handles automatic routing for decision tasks
   */
  async moveToTask(workItemId: string, targetTaskId: string): Promise<EngineResult> {
    const task = await prisma.task.findUnique({
      where: { id: targetTaskId },
      include: { outboundRoutes: true },
    })

    if (!task) {
      return {
        success: false,
        workItemId,
        currentTaskId: '',
        currentTaskName: '',
        status: 'active',
        error: 'Target task not found',
      }
    }

    const workItem = await prisma.workItem.findUnique({
      where: { id: workItemId },
    })

    if (!workItem) {
      return {
        success: false,
        workItemId,
        currentTaskId: '',
        currentTaskName: '',
        status: 'active',
        error: 'Work item not found',
      }
    }

    // Handle END task
    if (task.type === 'end') {
      await prisma.workItem.update({
        where: { id: workItemId },
        data: {
          currentTaskId: targetTaskId,
          status: 'completed',
          history: {
            create: {
              taskId: task.id,
              taskName: task.name,
              action: 'completed',
            },
          },
        },
      })

      return {
        success: true,
        workItemId,
        currentTaskId: task.id,
        currentTaskName: task.name,
        status: 'completed',
      }
    }

    // Handle DECISION task (automatic routing)
    if (task.type === 'decision') {
      const config = JSON.parse(task.config) as DecisionTaskConfig
      const objectData = JSON.parse(workItem.objectData)

      // Log arrival at decision task
      await prisma.workItemHistory.create({
        data: {
          workItemId,
          taskId: task.id,
          taskName: task.name,
          action: 'auto-routed',
          notes: 'Evaluating decision conditions',
        },
      })

      // Evaluate conditions to find matching route
      const matchingRoute = this.evaluateDecisionConditions(config, objectData, task.outboundRoutes)

      if (matchingRoute) {
        // Update current task temporarily, then recurse
        await prisma.workItem.update({
          where: { id: workItemId },
          data: { currentTaskId: targetTaskId },
        })
        return this.moveToTask(workItemId, matchingRoute.targetTaskId)
      }

      // No matching route - error state
      return {
        success: false,
        workItemId,
        currentTaskId: task.id,
        currentTaskName: task.name,
        status: 'active',
        error: 'No matching route found for decision',
      }
    }

    // Handle USER task (stop here, wait for user action)
    if (task.type === 'user') {
      await prisma.workItem.update({
        where: { id: workItemId },
        data: {
          currentTaskId: targetTaskId,
          claimedById: null, // Reset claim when moving to new task
          claimedAt: null,
          history: {
            create: {
              taskId: task.id,
              taskName: task.name,
              action: 'arrived',
            },
          },
        },
      })

      return {
        success: true,
        workItemId,
        currentTaskId: task.id,
        currentTaskName: task.name,
        status: 'active',
      }
    }

    // Handle other task types (service, broadcast, etc.) - for now, just move there
    await prisma.workItem.update({
      where: { id: workItemId },
      data: {
        currentTaskId: targetTaskId,
        history: {
          create: {
            taskId: task.id,
            taskName: task.name,
            action: 'arrived',
          },
        },
      },
    })

    return {
      success: true,
      workItemId,
      currentTaskId: task.id,
      currentTaskName: task.name,
      status: 'active',
    }
  }

  /**
   * Release a work item via a specific route (user action)
   */
  async release(
    workItemId: string,
    routeLabel: string,
    userId: string
  ): Promise<EngineResult> {
    const workItem = await prisma.workItem.findUnique({
      where: { id: workItemId },
      include: {
        currentTask: {
          include: { outboundRoutes: true },
        },
      },
    })

    if (!workItem) {
      return {
        success: false,
        workItemId,
        currentTaskId: '',
        currentTaskName: '',
        status: 'active',
        error: 'Work item not found',
      }
    }

    // Verify user owns this item
    if (workItem.claimedById !== userId) {
      return {
        success: false,
        workItemId,
        currentTaskId: workItem.currentTaskId,
        currentTaskName: workItem.currentTask.name,
        status: 'active',
        error: 'User does not own this work item',
      }
    }

    // Find the route by label
    const route = workItem.currentTask.outboundRoutes.find(
      (r) => r.label === routeLabel
    )

    if (!route) {
      return {
        success: false,
        workItemId,
        currentTaskId: workItem.currentTaskId,
        currentTaskName: workItem.currentTask.name,
        status: 'active',
        error: `Route "${routeLabel}" not found`,
      }
    }

    // Log the release action
    await prisma.workItemHistory.create({
      data: {
        workItemId,
        taskId: workItem.currentTaskId,
        taskName: workItem.currentTask.name,
        action: 'released',
        routeLabel,
        userId,
      },
    })

    // Move to the target task
    return this.moveToTask(workItemId, route.targetTaskId)
  }

  /**
   * Evaluate decision conditions against object data
   */
  private evaluateDecisionConditions(
    config: DecisionTaskConfig,
    objectData: Record<string, unknown>,
    routes: Array<{ id: string; targetTaskId: string; label: string | null }>
  ): { id: string; targetTaskId: string } | null {
    // Sort conditions by priority
    const sortedConditions = [...config.conditions].sort(
      (a, b) => a.priority - b.priority
    )

    for (const condition of sortedConditions) {
      const fieldValue = objectData[condition.fieldId]
      const matches = this.evaluateCondition(
        fieldValue,
        condition.operator,
        condition.value
      )

      if (matches) {
        const route = routes.find((r) => r.id === condition.routeId)
        if (route) {
          return { id: route.id, targetTaskId: route.targetTaskId }
        }
      }
    }

    // Return default route if no conditions matched
    if (config.defaultRouteId) {
      const defaultRoute = routes.find((r) => r.id === config.defaultRouteId)
      if (defaultRoute) {
        return { id: defaultRoute.id, targetTaskId: defaultRoute.targetTaskId }
      }
    }

    return null
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(
    fieldValue: unknown,
    operator: string,
    compareValue: string | number | boolean
  ): boolean {
    switch (operator) {
      case 'eq':
        return fieldValue === compareValue
      case 'neq':
        return fieldValue !== compareValue
      case 'gt':
        return typeof fieldValue === 'number' && fieldValue > Number(compareValue)
      case 'gte':
        return typeof fieldValue === 'number' && fieldValue >= Number(compareValue)
      case 'lt':
        return typeof fieldValue === 'number' && fieldValue < Number(compareValue)
      case 'lte':
        return typeof fieldValue === 'number' && fieldValue <= Number(compareValue)
      case 'contains':
        return typeof fieldValue === 'string' && fieldValue.includes(String(compareValue))
      case 'startsWith':
        return typeof fieldValue === 'string' && fieldValue.startsWith(String(compareValue))
      default:
        return false
    }
  }
}

// Singleton instance
export const engine = new WorkflowEngine()
```

**Step 3: Commit**

```bash
git add src/lib/engine/
git commit -m "feat: add workflow engine core with decision routing"
```

---

## Task 3: Create Start Workflow API Endpoint

**Files:**
- Create: `src/app/api/workflows/[id]/start/route.ts`

**Step 1: Create start workflow endpoint**

Create `src/app/api/workflows/[id]/start/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { engine } from '@/lib/engine'

// POST /api/workflows/[id]/start - Start a new work item
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workflowId } = await params
    const body = await request.json()
    const { objectType, objectData, priority } = body

    if (!objectType || !objectData) {
      return NextResponse.json(
        { error: 'objectType and objectData are required' },
        { status: 400 }
      )
    }

    const result = await engine.startWorkflow(
      workflowId,
      objectType,
      objectData,
      priority || 'normal'
    )

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Failed to start workflow:', error)
    return NextResponse.json(
      { error: 'Failed to start workflow' },
      { status: 500 }
    )
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/workflows/[id]/start/
git commit -m "feat: add start workflow API endpoint"
```

---

## Task 4: Create Work Item API Endpoints

**Files:**
- Create: `src/app/api/work-items/route.ts`
- Create: `src/app/api/work-items/[id]/route.ts`
- Create: `src/app/api/work-items/[id]/claim/route.ts`
- Create: `src/app/api/work-items/[id]/release/route.ts`

**Step 1: Create work items list endpoint**

Create `src/app/api/work-items/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/work-items - Query work items
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const taskId = searchParams.get('taskId')
    const claimedById = searchParams.get('claimedById')

    const workItems = await prisma.workItem.findMany({
      where: {
        ...(status && { status }),
        ...(taskId && { currentTaskId: taskId }),
        ...(claimedById && { claimedById }),
      },
      include: {
        workflow: {
          select: { id: true, name: true },
        },
        currentTask: {
          select: { id: true, name: true, type: true, config: true },
        },
        claimedBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(
      workItems.map((item) => ({
        ...item,
        objectData: JSON.parse(item.objectData),
        currentTask: {
          ...item.currentTask,
          config: JSON.parse(item.currentTask.config),
        },
      }))
    )
  } catch (error) {
    console.error('Failed to fetch work items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch work items' },
      { status: 500 }
    )
  }
}
```

**Step 2: Create work item detail endpoint**

Create `src/app/api/work-items/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/work-items/[id] - Get work item with history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const workItem = await prisma.workItem.findUnique({
      where: { id },
      include: {
        workflow: {
          select: { id: true, name: true },
        },
        currentTask: {
          select: { id: true, name: true, type: true, config: true },
          include: {
            outboundRoutes: {
              select: { id: true, label: true, targetTaskId: true },
            },
          },
        },
        claimedBy: {
          select: { id: true, name: true, email: true },
        },
        history: {
          orderBy: { timestamp: 'desc' },
        },
      },
    })

    if (!workItem) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...workItem,
      objectData: JSON.parse(workItem.objectData),
      currentTask: {
        ...workItem.currentTask,
        config: JSON.parse(workItem.currentTask.config),
      },
    })
  } catch (error) {
    console.error('Failed to fetch work item:', error)
    return NextResponse.json(
      { error: 'Failed to fetch work item' },
      { status: 500 }
    )
  }
}

// PUT /api/work-items/[id] - Update work item data
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { objectData, priority } = body

    const workItem = await prisma.workItem.update({
      where: { id },
      data: {
        ...(objectData && { objectData: JSON.stringify(objectData) }),
        ...(priority && { priority }),
      },
    })

    return NextResponse.json({
      ...workItem,
      objectData: JSON.parse(workItem.objectData),
    })
  } catch (error) {
    console.error('Failed to update work item:', error)
    return NextResponse.json(
      { error: 'Failed to update work item' },
      { status: 500 }
    )
  }
}
```

**Step 3: Create claim endpoint**

Create `src/app/api/work-items/[id]/claim/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/work-items/[id]/claim - Claim a work item
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const workItem = await prisma.workItem.findUnique({
      where: { id },
    })

    if (!workItem) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 })
    }

    if (workItem.claimedById) {
      return NextResponse.json(
        { error: 'Work item is already claimed' },
        { status: 400 }
      )
    }

    const updatedItem = await prisma.workItem.update({
      where: { id },
      data: {
        claimedById: userId,
        claimedAt: new Date(),
        history: {
          create: {
            taskId: workItem.currentTaskId,
            taskName: '', // Will be filled by trigger or we can query
            action: 'claimed',
            userId,
          },
        },
      },
      include: {
        currentTask: { select: { name: true } },
      },
    })

    // Update history with task name
    await prisma.workItemHistory.updateMany({
      where: {
        workItemId: id,
        action: 'claimed',
        taskName: '',
      },
      data: {
        taskName: updatedItem.currentTask.name,
      },
    })

    return NextResponse.json({ success: true, claimedAt: updatedItem.claimedAt })
  } catch (error) {
    console.error('Failed to claim work item:', error)
    return NextResponse.json(
      { error: 'Failed to claim work item' },
      { status: 500 }
    )
  }
}

// DELETE /api/work-items/[id]/claim - Unclaim a work item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const workItem = await prisma.workItem.findUnique({
      where: { id },
      include: { currentTask: { select: { name: true } } },
    })

    if (!workItem) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 })
    }

    await prisma.workItem.update({
      where: { id },
      data: {
        claimedById: null,
        claimedAt: null,
        history: {
          create: {
            taskId: workItem.currentTaskId,
            taskName: workItem.currentTask.name,
            action: 'released',
            userId: workItem.claimedById,
            notes: 'Unclaimed by user',
          },
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to unclaim work item:', error)
    return NextResponse.json(
      { error: 'Failed to unclaim work item' },
      { status: 500 }
    )
  }
}
```

**Step 4: Create release endpoint**

Create `src/app/api/work-items/[id]/release/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { engine } from '@/lib/engine'

// POST /api/work-items/[id]/release - Release work item via route
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { routeLabel, userId } = body

    if (!routeLabel || !userId) {
      return NextResponse.json(
        { error: 'routeLabel and userId are required' },
        { status: 400 }
      )
    }

    const result = await engine.release(id, routeLabel, userId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to release work item:', error)
    return NextResponse.json(
      { error: 'Failed to release work item' },
      { status: 500 }
    )
  }
}
```

**Step 5: Commit**

```bash
git add src/app/api/work-items/
git commit -m "feat: add Work Item API routes (list, get, claim, release)"
```

---

## Task 5: Update API Client with Work Item Methods

**Files:**
- Modify: `src/lib/api.ts`

**Step 1: Add work item API methods**

Add to `src/lib/api.ts`:

```typescript
// Work Item API
export const workItemApi = {
  list: (params?: { status?: string; taskId?: string; claimedById?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    if (params?.taskId) searchParams.set('taskId', params.taskId)
    if (params?.claimedById) searchParams.set('claimedById', params.claimedById)
    const query = searchParams.toString()
    return fetch(`${API_BASE}/work-items${query ? `?${query}` : ''}`).then(handleResponse)
  },

  get: (id: string) =>
    fetch(`${API_BASE}/work-items/${id}`).then(handleResponse),

  update: (id: string, data: { objectData?: object; priority?: string }) =>
    fetch(`${API_BASE}/work-items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),

  claim: (id: string, userId: string) =>
    fetch(`${API_BASE}/work-items/${id}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    }).then(handleResponse),

  unclaim: (id: string) =>
    fetch(`${API_BASE}/work-items/${id}/claim`, { method: 'DELETE' }).then(handleResponse),

  release: (id: string, routeLabel: string, userId: string) =>
    fetch(`${API_BASE}/work-items/${id}/release`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ routeLabel, userId }),
    }).then(handleResponse),
}

// Workflow start helper
export const workflowApi = {
  // ... existing methods (get, update)

  start: (workflowId: string, data: { objectType: string; objectData: object; priority?: string }) =>
    fetch(`${API_BASE}/workflows/${workflowId}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
}
```

**Step 2: Commit**

```bash
git add src/lib/api.ts
git commit -m "feat: add Work Item API client methods"
```

---

## Task 6: Add Seed Data for Testing Engine

**Files:**
- Modify: `prisma/seed.ts`

**Step 1: Add test work item to seed**

Add to the end of `prisma/seed.ts` (before the `main()` closing):

```typescript
  // Create a test work item to demonstrate the engine
  const testInvoice = {
    invoiceNumber: 'INV-2024-001',
    vendor: 'Acme Corp',
    amount: 7500, // Above $5000 threshold for manager approval
    dueDate: '2024-02-15',
    status: 'pending',
    notes: 'Test invoice for workflow demonstration',
  }

  // Start at Invoice Entry task (after begin)
  const testWorkItem = await prisma.workItem.upsert({
    where: { id: 'test-work-item-1' },
    update: {},
    create: {
      id: 'test-work-item-1',
      workflowId: mainWorkflow.id,
      currentTaskId: entryTask.id,
      objectType: 'invoice',
      objectData: JSON.stringify(testInvoice),
      priority: 'high',
      status: 'active',
    },
  })

  // Add initial history
  await prisma.workItemHistory.upsert({
    where: { id: 'history-1' },
    update: {},
    create: {
      id: 'history-1',
      workItemId: testWorkItem.id,
      taskId: beginTask.id,
      taskName: 'Start',
      action: 'created',
      notes: 'Test invoice created',
    },
  })

  await prisma.workItemHistory.upsert({
    where: { id: 'history-2' },
    update: {},
    create: {
      id: 'history-2',
      workItemId: testWorkItem.id,
      taskId: entryTask.id,
      taskName: 'Invoice Entry',
      action: 'arrived',
    },
  })

  console.log('Created test work item:', testWorkItem)
```

**Step 2: Re-run seed**

```bash
npx prisma db seed
```

**Step 3: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat: add test work item to seed data"
```

---

## Task 7: Create Engine Test Script

**Files:**
- Create: `scripts/test-engine.ts`

**Step 1: Create test script**

Create `scripts/test-engine.ts`:

```typescript
/**
 * Test script for the workflow engine
 * Run with: npx tsx scripts/test-engine.ts
 */

import { PrismaClient } from '../src/generated/prisma/client'
import { WorkflowEngine } from '../src/lib/engine'

const prisma = new PrismaClient()
const engine = new WorkflowEngine()

async function testEngine() {
  console.log('=== Workflow Engine Test ===\n')

  // 1. Start a new workflow with a low-value invoice (should skip manager)
  console.log('Test 1: Start workflow with low-value invoice ($3000)')
  const lowValueResult = await engine.startWorkflow(
    'invoice-main-flow',
    'invoice',
    {
      invoiceNumber: 'INV-TEST-LOW',
      vendor: 'Small Vendor',
      amount: 3000, // Below $5000 threshold
      dueDate: '2024-03-01',
    }
  )
  console.log('Result:', lowValueResult)
  console.log('')

  // Check where it landed
  const lowValueItem = await prisma.workItem.findUnique({
    where: { id: lowValueResult.workItemId },
    include: { currentTask: true, history: true },
  })
  console.log('Current task:', lowValueItem?.currentTask.name)
  console.log('History:', lowValueItem?.history.map(h => `${h.action} at ${h.taskName}`))
  console.log('')

  // 2. Start a new workflow with a high-value invoice
  console.log('Test 2: Start workflow with high-value invoice ($10000)')
  const highValueResult = await engine.startWorkflow(
    'invoice-main-flow',
    'invoice',
    {
      invoiceNumber: 'INV-TEST-HIGH',
      vendor: 'Big Corp',
      amount: 10000, // Above $5000 threshold
      dueDate: '2024-03-15',
    }
  )
  console.log('Result:', highValueResult)
  console.log('')

  // 3. Test claiming and releasing
  console.log('Test 3: Claim and release the low-value item')

  // Get a test user
  const testUser = await prisma.user.findFirst({ where: { email: 'john@example.com' } })
  if (!testUser) {
    console.log('No test user found, skipping claim/release test')
    return
  }

  // Claim the item
  await prisma.workItem.update({
    where: { id: lowValueResult.workItemId },
    data: { claimedById: testUser.id, claimedAt: new Date() },
  })
  console.log('Claimed by:', testUser.name)

  // Release via "Submit" route
  const releaseResult = await engine.release(
    lowValueResult.workItemId,
    'Submit',
    testUser.id
  )
  console.log('Release result:', releaseResult)

  // Check new position
  const afterRelease = await prisma.workItem.findUnique({
    where: { id: lowValueResult.workItemId },
    include: { currentTask: true },
  })
  console.log('Now at task:', afterRelease?.currentTask.name)
  console.log('')

  // 4. Summary
  console.log('=== Test Summary ===')
  const allItems = await prisma.workItem.findMany({
    include: { currentTask: true },
  })
  console.log('Total work items:', allItems.length)
  allItems.forEach(item => {
    console.log(`- ${item.id.substring(0, 8)}... at "${item.currentTask.name}" (${item.status})`)
  })

  await prisma.$disconnect()
}

testEngine().catch(console.error)
```

**Step 2: Run the test**

```bash
npx tsx scripts/test-engine.ts
```

Expected output shows:
- Low-value invoice lands at Invoice Entry (user task)
- High-value invoice lands at Invoice Entry (user task)
- After release, item moves to Review task

**Step 3: Commit**

```bash
git add scripts/test-engine.ts
git commit -m "feat: add engine test script"
```

---

## Summary

After completing Phase 2, you will have:

1. **WorkItem and WorkItemHistory models** - Track items and their journey through workflows
2. **Workflow Engine** - Core routing logic with decision task evaluation
3. **Start Workflow API** - Create new work items via API
4. **Work Item APIs** - List, get, claim, unclaim, release operations
5. **API Client** - Frontend utilities for work item operations
6. **Test Script** - Verify engine routing logic

**Next phase (Phase 3)** will add:
- Inbasket UI (My Work + Available Work views)
- Distribution methods (queue, round-robin, manual)
- Work item detail panel with dynamic route buttons
