# Phase 4-5: Distribution Methods & Start Workflow UI

**Date:** 2026-01-04
**Status:** Draft
**Goal:** Add distribution methods (queue, round-robin, manual) and a UI to start new workflows.

---

## Phase 4: Distribution Methods

Currently all items go to a queue where users claim them. This phase adds support for:
- **Queue (default)** - Already works: items unclaimed, users pull from queue
- **Round-robin** - Auto-assign to users in group rotation
- **Manual** - Item goes to supervisor queue for manual assignment

### Architecture Overview

```
                                Distribution Method
                                       |
              +------------------------+------------------------+
              |                        |                        |
           queue                  round-robin                manual
              |                        |                        |
    [unclaimed in queue]     [auto-assign to next        [goes to supervisor
     users claim work]        user in group rotation]     queue for assignment]
```

### Data Model Changes

**Schema Update:** Add `lastRoundRobinUserId` to Group for rotation tracking.

```prisma
model Group {
  id                   String      @id @default(cuid())
  name                 String
  description          String?
  lastRoundRobinUserId String?     // Track last assigned user for round-robin
  users                UserGroup[]
  createdAt            DateTime    @default(now())
}
```

**Existing UserTaskConfig** (already has distributionMethod):

```typescript
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

---

### Task 4.1: Add lastRoundRobinUserId to Group Schema

**Goal:** Track round-robin rotation state in the Group model.

**File:** `prisma/schema.prisma`

Add to Group model:
```prisma
model Group {
  id                   String      @id @default(cuid())
  name                 String
  description          String?
  lastRoundRobinUserId String?     // Track last assigned user for round-robin
  users                UserGroup[]
  createdAt            DateTime    @default(now())
}
```

**Commands:**
```bash
npx prisma migrate dev --name add-round-robin-tracking
npx prisma generate
```

**Commit:** `feat: add lastRoundRobinUserId to Group for round-robin distribution`

---

### Task 4.2: Implement Round-Robin Assignment in Engine

**Goal:** When work item arrives at a user task with `distributionMethod: 'round-robin'`, auto-assign to next user.

**File:** `src/lib/engine/index.ts`

Update `moveToTask` to handle round-robin distribution when arriving at a user task:

```typescript
// After moving to USER task, check distribution method
if (targetTask.type === 'user') {
  let config: UserTaskConfig
  try {
    config = JSON.parse(targetTask.config) as UserTaskConfig
  } catch {
    config = { type: 'user', distributionMethod: 'queue', assignees: { type: 'group', ids: [] } }
  }

  if (config.distributionMethod === 'round-robin' && config.assignees.type === 'group') {
    const assignedUserId = await this.assignRoundRobin(config.assignees.ids[0])
    if (assignedUserId) {
      await prisma.workItem.update({
        where: { id: workItemId },
        data: {
          claimedById: assignedUserId,
          claimedAt: new Date(),
        },
      })
      await prisma.workItemHistory.create({
        data: {
          workItemId,
          taskId: targetTaskId,
          taskName: targetTask.name,
          action: 'auto-assigned',
          notes: 'Assigned via round-robin distribution',
        },
      })
    }
  }
}
```

Add `assignRoundRobin` method:

```typescript
/**
 * Assigns work to next user in group rotation.
 * Returns userId of assigned user, or null if group is empty.
 */
private async assignRoundRobin(groupId: string): Promise<string | null> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      users: {
        include: { user: true },
        orderBy: { user: { name: 'asc' } },
      },
    },
  })

  if (!group || group.users.length === 0) return null

  const userIds = group.users.map((ug) => ug.userId)
  const lastIndex = group.lastRoundRobinUserId
    ? userIds.indexOf(group.lastRoundRobinUserId)
    : -1
  const nextIndex = (lastIndex + 1) % userIds.length
  const nextUserId = userIds[nextIndex]

  // Update group's last assigned user
  await prisma.group.update({
    where: { id: groupId },
    data: { lastRoundRobinUserId: nextUserId },
  })

  return nextUserId
}
```

**Commit:** `feat: implement round-robin distribution in workflow engine`

---

### Task 4.3: Implement Manual Assignment API

**Goal:** Add API endpoint for supervisors to manually assign work items.

**File:** `src/app/api/work-items/[id]/assign/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/work-items/[id]/assign - Manually assign work item to user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { userId, assignedBy } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
    }

    // Get work item and verify it's assignable
    const workItem = await prisma.workItem.findUnique({
      where: { id },
      include: { currentTask: true },
    })

    if (!workItem) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 })
    }

    if (workItem.status !== 'active') {
      return NextResponse.json({ error: 'Work item is not active' }, { status: 400 })
    }

    if (workItem.claimedById) {
      return NextResponse.json({ error: 'Work item is already assigned' }, { status: 409 })
    }

    // Assign the work item
    const updated = await prisma.workItem.update({
      where: { id },
      data: {
        claimedById: userId,
        claimedAt: new Date(),
      },
      include: {
        workflow: { select: { id: true, name: true } },
        currentTask: true,
        claimedBy: { select: { id: true, name: true, email: true } },
      },
    })

    // Create history entry
    await prisma.workItemHistory.create({
      data: {
        workItemId: id,
        taskId: workItem.currentTaskId,
        taskName: workItem.currentTask.name,
        action: 'assigned',
        userId: assignedBy,
        notes: `Manually assigned to ${targetUser.name}`,
      },
    })

    return NextResponse.json({
      ...updated,
      objectData: JSON.parse(updated.objectData),
      currentTask: {
        ...updated.currentTask,
        position: JSON.parse(updated.currentTask.position),
        config: JSON.parse(updated.currentTask.config),
      },
    })
  } catch (error) {
    console.error('Failed to assign work item:', error)
    return NextResponse.json({ error: 'Failed to assign work item' }, { status: 500 })
  }
}
```

**Update:** `src/lib/api/work-items.ts` - Add assign method:

```typescript
async assign(id: string, userId: string, assignedBy: string): Promise<WorkItemListItem> {
  const res = await fetch(`/api/work-items/${id}/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, assignedBy }),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to assign work item')
  }
  return res.json()
}
```

**Commit:** `feat: add manual assignment API for supervisor distribution`

---

### Task 4.4: Add Supervisor Assignment UI

**Goal:** Add UI for supervisors to view and assign manual-distribution items.

**File:** `src/app/inbox/page.tsx` (update)

Add a third tab "To Assign" for supervisors viewing items with `distributionMethod: 'manual'`:

```typescript
// Add state for supervisor items
const [toAssign, setToAssign] = useState<WorkItemListItem[]>([])

// In loadData, add query for manual items:
const manualItems = await workItemApi.list({ claimedById: null })
const manualDistribution = manualItems.filter((item) => {
  const config = item.currentTask.config as UserTaskConfig
  return config?.distributionMethod === 'manual'
})
setToAssign(manualDistribution)

// Add tab for supervisors
<TabsTrigger value="to-assign" className="gap-2">
  <UserPlus className="h-4 w-4" />
  To Assign
  {toAssign.length > 0 && (
    <Badge variant="secondary" className="ml-1">
      {toAssign.length}
    </Badge>
  )}
</TabsTrigger>

<TabsContent value="to-assign">
  <div className="space-y-3">
    {toAssign.length === 0
      ? renderEmptyState('to-assign')
      : toAssign.map((item) => renderAssignableItem(item))}
  </div>
</TabsContent>
```

**File:** `src/components/inbox/AssignDialog.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2 } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
}

interface AssignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupIds: string[]
  onAssign: (userId: string) => Promise<void>
}

export function AssignDialog({ open, onOpenChange, groupIds, onAssign }: AssignDialogProps) {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAssigning, setIsAssigning] = useState<string | null>(null)

  useEffect(() => {
    if (open && groupIds.length > 0) {
      loadGroupUsers()
    }
  }, [open, groupIds])

  const loadGroupUsers = async () => {
    setIsLoading(true)
    try {
      // Fetch users for the specified groups
      const res = await fetch(`/api/groups/${groupIds[0]}/users`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssign = async (userId: string) => {
    setIsAssigning(userId)
    try {
      await onAssign(userId)
      onOpenChange(false)
    } finally {
      setIsAssigning(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Work Item</DialogTitle>
          <DialogDescription>
            Select a user to assign this work item to.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {users.map((user) => (
              <Button
                key={user.id}
                variant="ghost"
                className="w-full justify-start gap-3"
                onClick={() => handleAssign(user.id)}
                disabled={isAssigning !== null}
              >
                {isAssigning === user.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {user.name.split(' ').map((n) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="text-left">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </Button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

**File:** `src/app/api/groups/[id]/users/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/groups/[id]/users - Get users in a group
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    const users = group.users.map((ug) => ug.user)
    return NextResponse.json(users)
  } catch (error) {
    console.error('Failed to fetch group users:', error)
    return NextResponse.json({ error: 'Failed to fetch group users' }, { status: 500 })
  }
}
```

**Commit:** `feat: add supervisor assignment UI for manual distribution`

---

### Task 4.5: Update History Actions

**Goal:** Add 'auto-assigned' and 'assigned' to WorkItemHistory action types for tracking.

**Documentation Note:** The `action` field in WorkItemHistory now supports:
- `created` - Workflow started
- `arrived` - Work item arrived at task
- `claimed` - User claimed from queue
- `unclaimed` - User released back to queue
- `released` - User completed and routed to next task
- `auto-routed` - Decision task auto-routed
- `auto-assigned` - Round-robin auto-assignment
- `assigned` - Manual supervisor assignment
- `completed` - Workflow completed

**Commit:** `docs: document distribution method history actions`

---

## Phase 5: Start Workflow UI

Currently there's no way to start new workflows from the UI. This phase adds:
- "New Work Item" button on inbasket page
- Workflow selector modal/dialog
- Object data form (simple key-value for now)

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Inbasket Header                             │
│  [Refresh]                                   [+ New Work Item]   │
└─────────────────────────────────────────────────────────────────┘
                                                       │
                                                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Start Workflow Dialog                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Step 1: Select Process/Workflow                            │ │
│  │  [Invoice Approval] [Purchase Request] [...]                │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Step 2: Enter Object Data (key-value form)                 │ │
│  │  Object Type: [invoice          ]                           │ │
│  │  Priority:    [Normal        ▼]                             │ │
│  │  ┌────────────────────────────────────────────────────────┐ │ │
│  │  │  Key: [invoiceNumber] Value: [INV-001]    [+ Add]      │ │ │
│  │  │  Key: [amount       ] Value: [5000   ]                 │ │ │
│  │  │  Key: [vendor       ] Value: [Acme   ]                 │ │ │
│  │  └────────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                              [Cancel] [Start]    │
└─────────────────────────────────────────────────────────────────┘
```

---

### Task 5.1: Create Start Workflow Dialog Component

**Goal:** Build reusable dialog for selecting a workflow and entering object data.

**File:** `src/components/inbox/StartWorkflowDialog.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Trash2, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Process {
  id: string
  name: string
  description: string | null
  status: string
  workflows: Array<{
    id: string
    name: string
    isSubflow: boolean
  }>
}

interface StartWorkflowDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onStart: (workflowId: string, objectType: string, objectData: Record<string, string>, priority: string) => Promise<void>
}

const priorityOptions = ['low', 'normal', 'high', 'urgent']

export function StartWorkflowDialog({ open, onOpenChange, onStart }: StartWorkflowDialogProps) {
  const [processes, setProcesses] = useState<Process[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isStarting, setIsStarting] = useState(false)

  // Form state
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null)
  const [objectType, setObjectType] = useState('document')
  const [priority, setPriority] = useState('normal')
  const [fields, setFields] = useState<Array<{ key: string; value: string }>>([
    { key: '', value: '' },
  ])

  useEffect(() => {
    if (open) {
      loadProcesses()
    }
  }, [open])

  const loadProcesses = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/processes')
      if (res.ok) {
        const data = await res.json()
        // Filter to only active processes with non-subflow workflows
        setProcesses(data.filter((p: Process) =>
          p.status === 'active' || p.workflows.some((w) => !w.isSubflow)
        ))
      }
    } catch (error) {
      console.error('Failed to load processes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddField = () => {
    setFields([...fields, { key: '', value: '' }])
  }

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index))
  }

  const handleFieldChange = (index: number, field: 'key' | 'value', value: string) => {
    const newFields = [...fields]
    newFields[index][field] = value
    setFields(newFields)
  }

  const handleStart = async () => {
    if (!selectedWorkflowId) return

    const objectData: Record<string, string> = {}
    fields.forEach(({ key, value }) => {
      if (key.trim()) {
        objectData[key.trim()] = value
      }
    })

    setIsStarting(true)
    try {
      await onStart(selectedWorkflowId, objectType, objectData, priority)
      // Reset form
      setSelectedWorkflowId(null)
      setObjectType('document')
      setPriority('normal')
      setFields([{ key: '', value: '' }])
      onOpenChange(false)
    } finally {
      setIsStarting(false)
    }
  }

  const selectedProcess = processes.find((p) =>
    p.workflows.some((w) => w.id === selectedWorkflowId)
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Start New Workflow</DialogTitle>
          <DialogDescription>
            Select a workflow and provide the initial object data.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Workflow Selection */}
            <div className="space-y-3">
              <Label>Select Workflow</Label>
              <div className="grid gap-2 max-h-40 overflow-y-auto">
                {processes.map((process) => {
                  const mainWorkflow = process.workflows.find((w) => !w.isSubflow)
                  if (!mainWorkflow) return null

                  return (
                    <button
                      key={process.id}
                      type="button"
                      onClick={() => setSelectedWorkflowId(mainWorkflow.id)}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-lg border text-left transition-colors',
                        selectedWorkflowId === mainWorkflow.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <div>
                        <p className="font-medium text-sm">{process.name}</p>
                        {process.description && (
                          <p className="text-xs text-muted-foreground">
                            {process.description}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {process.status}
                      </Badge>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Object Type & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="objectType">Object Type</Label>
                <Input
                  id="objectType"
                  value={objectType}
                  onChange={(e) => setObjectType(e.target.value)}
                  placeholder="invoice, order, request..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {priorityOptions.map((p) => (
                    <option key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Object Data Fields */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Object Data</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAddField}
                  className="gap-1 h-7"
                >
                  <Plus className="h-3 w-3" />
                  Add Field
                </Button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {fields.map((field, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      placeholder="Key"
                      value={field.key}
                      onChange={(e) => handleFieldChange(index, 'key', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Value"
                      value={field.value}
                      onChange={(e) => handleFieldChange(index, 'value', e.target.value)}
                      className="flex-1"
                    />
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveField(index)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleStart}
            disabled={!selectedWorkflowId || isStarting}
            className="gap-2"
          >
            {isStarting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Start Workflow
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

**Commit:** `feat: create StartWorkflowDialog component`

---

### Task 5.2: Add Workflow API Client Method

**Goal:** Add typed API method for starting workflows.

**File:** `src/lib/api/work-items.ts` (update)

Add new method:

```typescript
export interface StartWorkflowResult {
  success: boolean
  workItemId: string
  currentTaskId: string
  currentTaskName: string
  status: 'active' | 'completed'
  error?: string
}

// Add to workItemApi object:
async startWorkflow(
  workflowId: string,
  objectType: string,
  objectData: Record<string, unknown>,
  priority: string = 'normal'
): Promise<StartWorkflowResult> {
  const res = await fetch(`/api/workflows/${workflowId}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ objectType, objectData, priority }),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to start workflow')
  }
  return res.json()
}
```

**Commit:** `feat: add startWorkflow method to work items API client`

---

### Task 5.3: Add Start Button to Inbasket Page

**Goal:** Add "New Work Item" button to inbasket header that opens the start dialog.

**File:** `src/app/inbox/page.tsx` (update)

```typescript
// Add imports
import { Plus } from 'lucide-react'
import { StartWorkflowDialog } from '@/components/inbox/StartWorkflowDialog'
import { workItemApi } from '@/lib/api/work-items'

// Add state
const [showStartDialog, setShowStartDialog] = useState(false)

// Add handler
const handleStartWorkflow = async (
  workflowId: string,
  objectType: string,
  objectData: Record<string, string>,
  priority: string
) => {
  try {
    const result = await workItemApi.startWorkflow(workflowId, objectType, objectData, priority)
    toast({
      title: 'Workflow Started',
      description: `Work item created at ${result.currentTaskName}`,
    })
    loadData()
  } catch (error) {
    toast({
      title: 'Error',
      description: (error as Error).message,
      variant: 'destructive',
    })
    throw error
  }
}

// Update header section to add button
<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
  {/* ... existing header content ... */}
  <div className="flex items-center gap-2">
    <Button
      variant="default"
      className="gap-2"
      onClick={() => setShowStartDialog(true)}
    >
      <Plus className="h-4 w-4" />
      New Work Item
    </Button>
    <Button
      variant="outline"
      className="gap-2"
      onClick={handleRefresh}
      disabled={isRefreshing}
    >
      <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
      Refresh
    </Button>
  </div>
</div>

// Add dialog at end of component
<StartWorkflowDialog
  open={showStartDialog}
  onOpenChange={setShowStartDialog}
  onStart={handleStartWorkflow}
/>
```

**Commit:** `feat: add New Work Item button to inbasket with start dialog`

---

### Task 5.4: Integration Testing

**Goal:** Verify end-to-end functionality of both phases.

**Manual Test Plan:**

**Phase 4 - Distribution Methods:**
1. Verify round-robin distribution:
   - Create a user task with `distributionMethod: 'round-robin'`
   - Start multiple workflows
   - Verify items are auto-assigned to different users in rotation
   - Check history shows 'auto-assigned' action

2. Verify manual distribution:
   - Create a user task with `distributionMethod: 'manual'`
   - Start a workflow
   - Verify item appears in "To Assign" tab
   - Use assign dialog to assign to a user
   - Check history shows 'assigned' action

3. Verify queue distribution still works:
   - Confirm existing queue-based workflow unchanged

**Phase 5 - Start Workflow UI:**
1. Click "New Work Item" button on inbasket
2. Verify dialog shows available workflows
3. Select a workflow
4. Enter object type and data fields
5. Click "Start Workflow"
6. Verify toast notification
7. Verify new work item appears in inbox
8. Open work item and verify object data is correct

**Commit:** `test: verify distribution methods and start workflow integration`

---

## Summary

### Phase 4 Tasks

| Task | Description | Files | Commit |
|------|-------------|-------|--------|
| 4.1 | Add lastRoundRobinUserId to Group | `schema.prisma` | `feat: add round-robin tracking` |
| 4.2 | Implement round-robin in engine | `engine/index.ts` | `feat: implement round-robin distribution` |
| 4.3 | Add manual assignment API | `api/work-items/[id]/assign/route.ts`, `api/work-items.ts` | `feat: add manual assignment API` |
| 4.4 | Add supervisor assignment UI | `inbox/page.tsx`, `AssignDialog.tsx`, `api/groups/[id]/users/route.ts` | `feat: add supervisor assignment UI` |
| 4.5 | Document history actions | - | `docs: document distribution history actions` |

### Phase 5 Tasks

| Task | Description | Files | Commit |
|------|-------------|-------|--------|
| 5.1 | Create StartWorkflowDialog | `StartWorkflowDialog.tsx` | `feat: create StartWorkflowDialog` |
| 5.2 | Add startWorkflow API method | `lib/api/work-items.ts` | `feat: add startWorkflow API method` |
| 5.3 | Add start button to inbasket | `inbox/page.tsx` | `feat: add New Work Item button` |
| 5.4 | Integration testing | - | `test: verify distribution and start integration` |

## Dependencies

- Phase 3 must be complete (Inbasket UI with My Work/Available tabs)
- Database must have seeded users and groups
- At least one active process with a main workflow
