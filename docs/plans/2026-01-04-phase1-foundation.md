# Phase 1: Foundation (Database + CRUD) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Set up SQLite database with Prisma ORM and build CRUD API routes for workflow builder persistence.

**Architecture:** Prisma ORM connects to SQLite file database. Next.js API routes provide REST endpoints. Existing React Flow canvas connects to real persistence instead of mock data.

**Tech Stack:** Prisma 5.x, SQLite, Next.js 14 API routes, TypeScript

---

## Task 1: Install Prisma and Initialize

**Files:**
- Create: `prisma/schema.prisma`
- Modify: `package.json`

**Step 1: Install Prisma dependencies**

```bash
npm install prisma @prisma/client --save-dev
npm install @prisma/client
```

**Step 2: Initialize Prisma with SQLite**

```bash
npx prisma init --datasource-provider sqlite
```

**Step 3: Verify prisma directory created**

Expected: `prisma/schema.prisma` exists with SQLite datasource

**Step 4: Commit**

```bash
git add package.json package-lock.json prisma/
git commit -m "chore: initialize Prisma with SQLite"
```

---

## Task 2: Define Core Schema - Process and Workflow

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add Process and Workflow models**

Replace the contents of `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Process {
  id          String     @id @default(cuid())
  name        String
  description String?
  status      String     @default("draft") // draft, active, archived
  workflows   Workflow[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}

model Workflow {
  id         String   @id @default(cuid())
  processId  String
  process    Process  @relation(fields: [processId], references: [id], onDelete: Cascade)
  name       String
  isSubflow  Boolean  @default(false)
  version    Int      @default(1)
  tasks      Task[]
  routes     Route[]
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

model Task {
  id           String   @id @default(cuid())
  workflowId   String
  workflow     Workflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  type         String   // begin, end, user, decision, service, broadcast, rendezvous, subflow
  name         String
  position     String   // JSON: {x, y}
  config       String   // JSON: type-specific config

  inboundRoutes  Route[] @relation("TargetTask")
  outboundRoutes Route[] @relation("SourceTask")

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Route {
  id           String   @id @default(cuid())
  workflowId   String
  workflow     Workflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  sourceTaskId String
  targetTaskId String
  sourceTask   Task     @relation("SourceTask", fields: [sourceTaskId], references: [id], onDelete: Cascade)
  targetTask   Task     @relation("TargetTask", fields: [targetTaskId], references: [id], onDelete: Cascade)
  label        String?
  condition    String?  // JSON: for decision tasks

  createdAt    DateTime @default(now())
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  role      String   @default("user") // admin, user
  groups    UserGroup[]
  createdAt DateTime @default(now())
}

model Group {
  id          String      @id @default(cuid())
  name        String
  description String?
  users       UserGroup[]
  createdAt   DateTime    @default(now())
}

model UserGroup {
  userId    String
  groupId   String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  group     Group    @relation(fields: [groupId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@id([userId, groupId])
}
```

**Step 2: Update .env with database URL**

Create/update `.env`:

```
DATABASE_URL="file:./dev.db"
```

**Step 3: Add .env to .gitignore if not present**

Check `.gitignore` contains `.env` (it should already)

**Step 4: Generate Prisma client and create database**

```bash
npx prisma db push
```

Expected: Database created at `prisma/dev.db`, Prisma client generated

**Step 5: Commit**

```bash
git add prisma/schema.prisma .env.example
git commit -m "feat: add Prisma schema for Process, Workflow, Task, Route"
```

Note: Create `.env.example` with `DATABASE_URL="file:./dev.db"` for reference

---

## Task 3: Create Prisma Client Singleton

**Files:**
- Create: `src/lib/prisma.ts`

**Step 1: Create Prisma client singleton**

Create `src/lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

**Step 2: Verify import works**

```bash
npx tsc --noEmit src/lib/prisma.ts
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/prisma.ts
git commit -m "feat: add Prisma client singleton"
```

---

## Task 4: Create Process API Routes

**Files:**
- Create: `src/app/api/processes/route.ts`
- Create: `src/app/api/processes/[id]/route.ts`

**Step 1: Create processes list/create endpoint**

Create `src/app/api/processes/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/processes - List all processes
export async function GET() {
  try {
    const processes = await prisma.process.findMany({
      include: {
        workflows: {
          select: {
            id: true,
            name: true,
            isSubflow: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json(processes)
  } catch (error) {
    console.error('Failed to fetch processes:', error)
    return NextResponse.json({ error: 'Failed to fetch processes' }, { status: 500 })
  }
}

// POST /api/processes - Create new process
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const process = await prisma.process.create({
      data: {
        name,
        description: description || null,
        workflows: {
          create: {
            name: 'Main Flow',
            isSubflow: false,
          },
        },
      },
      include: {
        workflows: true,
      },
    })

    return NextResponse.json(process, { status: 201 })
  } catch (error) {
    console.error('Failed to create process:', error)
    return NextResponse.json({ error: 'Failed to create process' }, { status: 500 })
  }
}
```

**Step 2: Create process detail endpoint**

Create `src/app/api/processes/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/processes/[id] - Get process with workflows
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const process = await prisma.process.findUnique({
      where: { id: params.id },
      include: {
        workflows: {
          include: {
            tasks: true,
            routes: true,
          },
        },
      },
    })

    if (!process) {
      return NextResponse.json({ error: 'Process not found' }, { status: 404 })
    }

    return NextResponse.json(process)
  } catch (error) {
    console.error('Failed to fetch process:', error)
    return NextResponse.json({ error: 'Failed to fetch process' }, { status: 500 })
  }
}

// PUT /api/processes/[id] - Update process
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, description, status } = body

    const process = await prisma.process.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
      },
      include: {
        workflows: true,
      },
    })

    return NextResponse.json(process)
  } catch (error) {
    console.error('Failed to update process:', error)
    return NextResponse.json({ error: 'Failed to update process' }, { status: 500 })
  }
}

// DELETE /api/processes/[id] - Delete process (only if draft)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const process = await prisma.process.findUnique({
      where: { id: params.id },
    })

    if (!process) {
      return NextResponse.json({ error: 'Process not found' }, { status: 404 })
    }

    if (process.status !== 'draft') {
      return NextResponse.json(
        { error: 'Can only delete draft processes' },
        { status: 400 }
      )
    }

    await prisma.process.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete process:', error)
    return NextResponse.json({ error: 'Failed to delete process' }, { status: 500 })
  }
}
```

**Step 3: Test with curl**

```bash
# Start dev server in background
npm run dev &

# Wait for server to start
sleep 5

# Create a process
curl -X POST http://localhost:3000/api/processes \
  -H "Content-Type: application/json" \
  -d '{"name": "Invoice Approval", "description": "Standard invoice workflow"}'

# List processes
curl http://localhost:3000/api/processes
```

Expected: Process created and listed with auto-created "Main Flow" workflow

**Step 4: Commit**

```bash
git add src/app/api/processes/
git commit -m "feat: add Process API routes (list, create, get, update, delete)"
```

---

## Task 5: Create Workflow API Routes

**Files:**
- Create: `src/app/api/workflows/[id]/route.ts`

**Step 1: Create workflow detail/update endpoint**

Create `src/app/api/workflows/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/workflows/[id] - Get workflow with tasks and routes
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id: params.id },
      include: {
        process: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        tasks: {
          orderBy: { createdAt: 'asc' },
        },
        routes: true,
      },
    })

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    // Parse JSON fields for tasks
    const parsedWorkflow = {
      ...workflow,
      tasks: workflow.tasks.map((task) => ({
        ...task,
        position: JSON.parse(task.position),
        config: JSON.parse(task.config),
      })),
      routes: workflow.routes.map((route) => ({
        ...route,
        condition: route.condition ? JSON.parse(route.condition) : null,
      })),
    }

    return NextResponse.json(parsedWorkflow)
  } catch (error) {
    console.error('Failed to fetch workflow:', error)
    return NextResponse.json({ error: 'Failed to fetch workflow' }, { status: 500 })
  }
}

// PUT /api/workflows/[id] - Update workflow metadata
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, version } = body

    const workflow = await prisma.workflow.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(version && { version }),
      },
    })

    return NextResponse.json(workflow)
  } catch (error) {
    console.error('Failed to update workflow:', error)
    return NextResponse.json({ error: 'Failed to update workflow' }, { status: 500 })
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/workflows/
git commit -m "feat: add Workflow API routes (get, update)"
```

---

## Task 6: Create Task API Routes

**Files:**
- Create: `src/app/api/workflows/[id]/tasks/route.ts`
- Create: `src/app/api/workflows/[id]/tasks/[taskId]/route.ts`

**Step 1: Create tasks list/create endpoint**

Create `src/app/api/workflows/[id]/tasks/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/workflows/[id]/tasks - List tasks
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tasks = await prisma.task.findMany({
      where: { workflowId: params.id },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(
      tasks.map((task) => ({
        ...task,
        position: JSON.parse(task.position),
        config: JSON.parse(task.config),
      }))
    )
  } catch (error) {
    console.error('Failed to fetch tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

// POST /api/workflows/[id]/tasks - Create task
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { type, name, position, config } = body

    if (!type || !name || !position) {
      return NextResponse.json(
        { error: 'type, name, and position are required' },
        { status: 400 }
      )
    }

    const task = await prisma.task.create({
      data: {
        workflowId: params.id,
        type,
        name,
        position: JSON.stringify(position),
        config: JSON.stringify(config || { type }),
      },
    })

    return NextResponse.json(
      {
        ...task,
        position: JSON.parse(task.position),
        config: JSON.parse(task.config),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to create task:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
```

**Step 2: Create task detail endpoint**

Create `src/app/api/workflows/[id]/tasks/[taskId]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT /api/workflows/[id]/tasks/[taskId] - Update task
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const body = await request.json()
    const { name, position, config } = body

    const task = await prisma.task.update({
      where: { id: params.taskId },
      data: {
        ...(name && { name }),
        ...(position && { position: JSON.stringify(position) }),
        ...(config && { config: JSON.stringify(config) }),
      },
    })

    return NextResponse.json({
      ...task,
      position: JSON.parse(task.position),
      config: JSON.parse(task.config),
    })
  } catch (error) {
    console.error('Failed to update task:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

// DELETE /api/workflows/[id]/tasks/[taskId] - Delete task
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    await prisma.task.delete({
      where: { id: params.taskId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete task:', error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
```

**Step 3: Commit**

```bash
git add src/app/api/workflows/[id]/tasks/
git commit -m "feat: add Task API routes (list, create, update, delete)"
```

---

## Task 7: Create Route API Routes

**Files:**
- Create: `src/app/api/workflows/[id]/routes/route.ts`
- Create: `src/app/api/workflows/[id]/routes/[routeId]/route.ts`

**Step 1: Create routes list/create endpoint**

Create `src/app/api/workflows/[id]/routes/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/workflows/[id]/routes - List routes
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const routes = await prisma.route.findMany({
      where: { workflowId: params.id },
    })

    return NextResponse.json(
      routes.map((route) => ({
        ...route,
        condition: route.condition ? JSON.parse(route.condition) : null,
      }))
    )
  } catch (error) {
    console.error('Failed to fetch routes:', error)
    return NextResponse.json({ error: 'Failed to fetch routes' }, { status: 500 })
  }
}

// POST /api/workflows/[id]/routes - Create route
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { sourceTaskId, targetTaskId, label, condition } = body

    if (!sourceTaskId || !targetTaskId) {
      return NextResponse.json(
        { error: 'sourceTaskId and targetTaskId are required' },
        { status: 400 }
      )
    }

    const route = await prisma.route.create({
      data: {
        workflowId: params.id,
        sourceTaskId,
        targetTaskId,
        label: label || null,
        condition: condition ? JSON.stringify(condition) : null,
      },
    })

    return NextResponse.json(
      {
        ...route,
        condition: route.condition ? JSON.parse(route.condition) : null,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to create route:', error)
    return NextResponse.json({ error: 'Failed to create route' }, { status: 500 })
  }
}
```

**Step 2: Create route detail endpoint**

Create `src/app/api/workflows/[id]/routes/[routeId]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT /api/workflows/[id]/routes/[routeId] - Update route
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; routeId: string } }
) {
  try {
    const body = await request.json()
    const { label, condition } = body

    const route = await prisma.route.update({
      where: { id: params.routeId },
      data: {
        ...(label !== undefined && { label }),
        ...(condition !== undefined && {
          condition: condition ? JSON.stringify(condition) : null,
        }),
      },
    })

    return NextResponse.json({
      ...route,
      condition: route.condition ? JSON.parse(route.condition) : null,
    })
  } catch (error) {
    console.error('Failed to update route:', error)
    return NextResponse.json({ error: 'Failed to update route' }, { status: 500 })
  }
}

// DELETE /api/workflows/[id]/routes/[routeId] - Delete route
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; routeId: string } }
) {
  try {
    await prisma.route.delete({
      where: { id: params.routeId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete route:', error)
    return NextResponse.json({ error: 'Failed to delete route' }, { status: 500 })
  }
}
```

**Step 3: Commit**

```bash
git add src/app/api/workflows/[id]/routes/
git commit -m "feat: add Route API routes (list, create, update, delete)"
```

---

## Task 8: Create User and Group API Routes

**Files:**
- Create: `src/app/api/users/route.ts`
- Create: `src/app/api/groups/route.ts`

**Step 1: Create users endpoint**

Create `src/app/api/users/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/users - List all users
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        groups: {
          include: {
            group: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(
      users.map((user) => ({
        ...user,
        groups: user.groups.map((ug) => ug.group),
      }))
    )
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

// POST /api/users - Create user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, role } = body

    if (!email || !name) {
      return NextResponse.json(
        { error: 'email and name are required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        role: role || 'user',
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Failed to create user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
```

**Step 2: Create groups endpoint**

Create `src/app/api/groups/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/groups - List all groups
export async function GET() {
  try {
    const groups = await prisma.group.findMany({
      include: {
        users: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(
      groups.map((group) => ({
        ...group,
        users: group.users.map((ug) => ug.user),
      }))
    )
  } catch (error) {
    console.error('Failed to fetch groups:', error)
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 })
  }
}

// POST /api/groups - Create group
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, userIds } = body

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const group = await prisma.group.create({
      data: {
        name,
        description: description || null,
        users: userIds
          ? {
              create: userIds.map((userId: string) => ({
                userId,
              })),
            }
          : undefined,
      },
      include: {
        users: {
          include: {
            user: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        ...group,
        users: group.users.map((ug) => ug.user),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to create group:', error)
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 })
  }
}
```

**Step 3: Commit**

```bash
git add src/app/api/users/ src/app/api/groups/
git commit -m "feat: add User and Group API routes"
```

---

## Task 9: Create Database Seed Script

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json`

**Step 1: Install ts-node for seeding**

```bash
npm install ts-node --save-dev
```

**Step 2: Create seed script**

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
    },
  })

  const johnDoe = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      name: 'John Doe',
      role: 'user',
    },
  })

  const janeSmith = await prisma.user.upsert({
    where: { email: 'jane@example.com' },
    update: {},
    create: {
      email: 'jane@example.com',
      name: 'Jane Smith',
      role: 'user',
    },
  })

  const bobManager = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      name: 'Bob Manager',
      role: 'user',
    },
  })

  console.log('Created users:', { adminUser, johnDoe, janeSmith, bobManager })

  // Create groups
  const apClerks = await prisma.group.upsert({
    where: { id: 'ap-clerks' },
    update: {},
    create: {
      id: 'ap-clerks',
      name: 'AP Clerks',
      description: 'Accounts Payable team members',
    },
  })

  const reviewers = await prisma.group.upsert({
    where: { id: 'reviewers' },
    update: {},
    create: {
      id: 'reviewers',
      name: 'Reviewers',
      description: 'Invoice reviewers',
    },
  })

  const managers = await prisma.group.upsert({
    where: { id: 'managers' },
    update: {},
    create: {
      id: 'managers',
      name: 'Managers',
      description: 'Approval managers',
    },
  })

  console.log('Created groups:', { apClerks, reviewers, managers })

  // Add users to groups
  await prisma.userGroup.upsert({
    where: { userId_groupId: { userId: johnDoe.id, groupId: apClerks.id } },
    update: {},
    create: { userId: johnDoe.id, groupId: apClerks.id },
  })

  await prisma.userGroup.upsert({
    where: { userId_groupId: { userId: janeSmith.id, groupId: reviewers.id } },
    update: {},
    create: { userId: janeSmith.id, groupId: reviewers.id },
  })

  await prisma.userGroup.upsert({
    where: { userId_groupId: { userId: bobManager.id, groupId: managers.id } },
    update: {},
    create: { userId: bobManager.id, groupId: managers.id },
  })

  console.log('Added users to groups')

  // Create Invoice Approval process
  const invoiceProcess = await prisma.process.upsert({
    where: { id: 'invoice-approval' },
    update: {},
    create: {
      id: 'invoice-approval',
      name: 'Invoice Approval',
      description: 'Standard invoice approval workflow',
      status: 'draft',
    },
  })

  console.log('Created process:', invoiceProcess)

  // Create main workflow
  const mainWorkflow = await prisma.workflow.upsert({
    where: { id: 'invoice-main-flow' },
    update: {},
    create: {
      id: 'invoice-main-flow',
      processId: invoiceProcess.id,
      name: 'Main Flow',
      isSubflow: false,
      version: 1,
    },
  })

  console.log('Created workflow:', mainWorkflow)

  // Create tasks
  const beginTask = await prisma.task.upsert({
    where: { id: 'task-begin' },
    update: {},
    create: {
      id: 'task-begin',
      workflowId: mainWorkflow.id,
      type: 'begin',
      name: 'Start',
      position: JSON.stringify({ x: 100, y: 200 }),
      config: JSON.stringify({ type: 'begin' }),
    },
  })

  const entryTask = await prisma.task.upsert({
    where: { id: 'task-entry' },
    update: {},
    create: {
      id: 'task-entry',
      workflowId: mainWorkflow.id,
      type: 'user',
      name: 'Invoice Entry',
      position: JSON.stringify({ x: 300, y: 200 }),
      config: JSON.stringify({
        type: 'user',
        distributionMethod: 'queue',
        assignees: { type: 'group', ids: ['ap-clerks'] },
        formFields: ['invoiceNumber', 'vendor', 'amount', 'dueDate'],
        instructions: 'Enter invoice details',
      }),
    },
  })

  const reviewTask = await prisma.task.upsert({
    where: { id: 'task-review' },
    update: {},
    create: {
      id: 'task-review',
      workflowId: mainWorkflow.id,
      type: 'user',
      name: 'Review',
      position: JSON.stringify({ x: 500, y: 200 }),
      config: JSON.stringify({
        type: 'user',
        distributionMethod: 'queue',
        assignees: { type: 'group', ids: ['reviewers'] },
        formFields: ['notes'],
        instructions: 'Review the invoice for accuracy',
      }),
    },
  })

  const decisionTask = await prisma.task.upsert({
    where: { id: 'task-decision' },
    update: {},
    create: {
      id: 'task-decision',
      workflowId: mainWorkflow.id,
      type: 'decision',
      name: 'Amount Check',
      position: JSON.stringify({ x: 700, y: 200 }),
      config: JSON.stringify({
        type: 'decision',
        conditions: [
          {
            id: 'cond-1',
            routeId: 'route-to-manager',
            fieldId: 'amount',
            operator: 'gt',
            value: 5000,
            priority: 1,
          },
        ],
        defaultRouteId: 'route-to-end',
      }),
    },
  })

  const managerTask = await prisma.task.upsert({
    where: { id: 'task-manager' },
    update: {},
    create: {
      id: 'task-manager',
      workflowId: mainWorkflow.id,
      type: 'user',
      name: 'Manager Approval',
      position: JSON.stringify({ x: 900, y: 100 }),
      config: JSON.stringify({
        type: 'user',
        distributionMethod: 'manual',
        assignees: { type: 'group', ids: ['managers'] },
        formFields: ['approvalNotes'],
        instructions: 'Review and approve high-value invoice',
      }),
    },
  })

  const endTask = await prisma.task.upsert({
    where: { id: 'task-end' },
    update: {},
    create: {
      id: 'task-end',
      workflowId: mainWorkflow.id,
      type: 'end',
      name: 'Complete',
      position: JSON.stringify({ x: 1100, y: 200 }),
      config: JSON.stringify({ type: 'end' }),
    },
  })

  console.log('Created tasks')

  // Create routes
  await prisma.route.upsert({
    where: { id: 'route-begin-entry' },
    update: {},
    create: {
      id: 'route-begin-entry',
      workflowId: mainWorkflow.id,
      sourceTaskId: beginTask.id,
      targetTaskId: entryTask.id,
    },
  })

  await prisma.route.upsert({
    where: { id: 'route-entry-review' },
    update: {},
    create: {
      id: 'route-entry-review',
      workflowId: mainWorkflow.id,
      sourceTaskId: entryTask.id,
      targetTaskId: reviewTask.id,
      label: 'Submit',
    },
  })

  await prisma.route.upsert({
    where: { id: 'route-review-decision' },
    update: {},
    create: {
      id: 'route-review-decision',
      workflowId: mainWorkflow.id,
      sourceTaskId: reviewTask.id,
      targetTaskId: decisionTask.id,
      label: 'Approve',
    },
  })

  await prisma.route.upsert({
    where: { id: 'route-review-entry' },
    update: {},
    create: {
      id: 'route-review-entry',
      workflowId: mainWorkflow.id,
      sourceTaskId: reviewTask.id,
      targetTaskId: entryTask.id,
      label: 'Reject',
    },
  })

  await prisma.route.upsert({
    where: { id: 'route-to-manager' },
    update: {},
    create: {
      id: 'route-to-manager',
      workflowId: mainWorkflow.id,
      sourceTaskId: decisionTask.id,
      targetTaskId: managerTask.id,
      label: 'High Value',
      condition: JSON.stringify({ field: 'amount', operator: 'gt', value: 5000 }),
    },
  })

  await prisma.route.upsert({
    where: { id: 'route-to-end' },
    update: {},
    create: {
      id: 'route-to-end',
      workflowId: mainWorkflow.id,
      sourceTaskId: decisionTask.id,
      targetTaskId: endTask.id,
      label: 'Standard',
    },
  })

  await prisma.route.upsert({
    where: { id: 'route-manager-end' },
    update: {},
    create: {
      id: 'route-manager-end',
      workflowId: mainWorkflow.id,
      sourceTaskId: managerTask.id,
      targetTaskId: endTask.id,
      label: 'Approved',
    },
  })

  console.log('Created routes')
  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

**Step 3: Add seed script to package.json**

Add to `package.json`:

```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

**Step 4: Run the seed**

```bash
npx prisma db seed
```

Expected: Database seeded with users, groups, and Invoice Approval workflow

**Step 5: Commit**

```bash
git add prisma/seed.ts package.json package-lock.json
git commit -m "feat: add database seed with Invoice Approval workflow"
```

---

## Task 10: Create API Client Utilities

**Files:**
- Create: `src/lib/api.ts`

**Step 1: Create API client**

Create `src/lib/api.ts`:

```typescript
const API_BASE = '/api'

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }
  return response.json()
}

// Process API
export const processApi = {
  list: () =>
    fetch(`${API_BASE}/processes`).then(handleResponse),

  get: (id: string) =>
    fetch(`${API_BASE}/processes/${id}`).then(handleResponse),

  create: (data: { name: string; description?: string }) =>
    fetch(`${API_BASE}/processes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),

  update: (id: string, data: { name?: string; description?: string; status?: string }) =>
    fetch(`${API_BASE}/processes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),

  delete: (id: string) =>
    fetch(`${API_BASE}/processes/${id}`, { method: 'DELETE' }).then(handleResponse),
}

// Workflow API
export const workflowApi = {
  get: (id: string) =>
    fetch(`${API_BASE}/workflows/${id}`).then(handleResponse),

  update: (id: string, data: { name?: string; version?: number }) =>
    fetch(`${API_BASE}/workflows/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
}

// Task API
export const taskApi = {
  list: (workflowId: string) =>
    fetch(`${API_BASE}/workflows/${workflowId}/tasks`).then(handleResponse),

  create: (workflowId: string, data: { type: string; name: string; position: { x: number; y: number }; config?: object }) =>
    fetch(`${API_BASE}/workflows/${workflowId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),

  update: (workflowId: string, taskId: string, data: { name?: string; position?: { x: number; y: number }; config?: object }) =>
    fetch(`${API_BASE}/workflows/${workflowId}/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),

  delete: (workflowId: string, taskId: string) =>
    fetch(`${API_BASE}/workflows/${workflowId}/tasks/${taskId}`, { method: 'DELETE' }).then(handleResponse),
}

// Route API
export const routeApi = {
  list: (workflowId: string) =>
    fetch(`${API_BASE}/workflows/${workflowId}/routes`).then(handleResponse),

  create: (workflowId: string, data: { sourceTaskId: string; targetTaskId: string; label?: string; condition?: object }) =>
    fetch(`${API_BASE}/workflows/${workflowId}/routes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),

  update: (workflowId: string, routeId: string, data: { label?: string; condition?: object }) =>
    fetch(`${API_BASE}/workflows/${workflowId}/routes/${routeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),

  delete: (workflowId: string, routeId: string) =>
    fetch(`${API_BASE}/workflows/${workflowId}/routes/${routeId}`, { method: 'DELETE' }).then(handleResponse),
}

// User API
export const userApi = {
  list: () =>
    fetch(`${API_BASE}/users`).then(handleResponse),

  create: (data: { email: string; name: string; role?: string }) =>
    fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
}

// Group API
export const groupApi = {
  list: () =>
    fetch(`${API_BASE}/groups`).then(handleResponse),

  create: (data: { name: string; description?: string; userIds?: string[] }) =>
    fetch(`${API_BASE}/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
}
```

**Step 2: Commit**

```bash
git add src/lib/api.ts
git commit -m "feat: add API client utilities"
```

---

## Task 11: Update Builder Page to Use Real Data

**Files:**
- Modify: `src/app/builder/page.tsx`

**Step 1: Read current builder page**

Read `src/app/builder/page.tsx` to understand current structure.

**Step 2: Update to fetch from API**

Replace mock data imports with API fetch. Key changes:
- Replace `mockProcesses` with `processApi.list()`
- Add loading and error states
- Add "Create Process" functionality

The page should:
```typescript
'use client'

import { useEffect, useState } from 'react'
import { processApi } from '@/lib/api'
// ... existing imports

export default function BuilderPage() {
  const [processes, setProcesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    processApi.list()
      .then(setProcesses)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  // ... rest of component
}
```

**Step 3: Test the page**

```bash
npm run dev
# Open http://localhost:3000/builder
```

Expected: Page loads with seeded "Invoice Approval" process

**Step 4: Commit**

```bash
git add src/app/builder/page.tsx
git commit -m "feat: connect builder page to real API"
```

---

## Task 12: Update Workflow Editor to Use Real Data

**Files:**
- Modify: `src/app/builder/[workflowId]/page.tsx`
- Modify: `src/components/builder/Canvas.tsx`

**Step 1: Update workflow editor page**

Update `src/app/builder/[workflowId]/page.tsx` to:
- Fetch workflow data from `workflowApi.get(workflowId)`
- Pass real data to Canvas component
- Handle loading/error states

**Step 2: Update Canvas to persist changes**

Update `src/components/builder/Canvas.tsx` to:
- Call `taskApi.create()` when nodes are added
- Call `taskApi.update()` when nodes are moved
- Call `taskApi.delete()` when nodes are deleted
- Call `routeApi.create()` when edges are connected
- Call `routeApi.delete()` when edges are deleted

Key pattern for node changes:
```typescript
const onNodesChange = useCallback((changes) => {
  // Apply changes locally
  setNodes((nds) => applyNodeChanges(changes, nds))

  // Persist position changes to API
  changes.forEach((change) => {
    if (change.type === 'position' && change.position) {
      taskApi.update(workflowId, change.id, { position: change.position })
    }
  })
}, [workflowId])
```

**Step 3: Test the editor**

```bash
npm run dev
# Open http://localhost:3000/builder/invoice-main-flow
```

Expected:
- Workflow loads with seeded tasks and routes
- Moving nodes persists to database
- Adding/removing nodes and edges persists

**Step 4: Commit**

```bash
git add src/app/builder/[workflowId]/page.tsx src/components/builder/Canvas.tsx
git commit -m "feat: connect workflow editor to real API with persistence"
```

---

## Summary

After completing all tasks, you will have:

1. **SQLite database** with Prisma ORM
2. **Full schema** for Process, Workflow, Task, Route, User, Group
3. **REST API routes** for all CRUD operations
4. **Seed data** with Invoice Approval workflow
5. **Connected UI** - builder page and workflow editor use real persistence

Next phase (Phase 2) will add:
- WorkItem and WorkItemHistory models
- Workflow engine core (moveToTask, route evaluation)
- Start workflow endpoint
