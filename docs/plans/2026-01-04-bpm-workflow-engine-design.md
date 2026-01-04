# BPM Workflow Engine Design

**Date:** 2026-01-04
**Status:** Approved

## Overview

Transform the existing frontend-only BPM prototype into a fully functional workflow system with:
- SQLite database with Prisma ORM
- Real workflow engine that routes items through tasks
- Inbasket for users to manage their work
- Support for user tasks, decision tasks, and service tasks

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Database | SQLite + Prisma | Zero config, type-safe, easy migration to Postgres later |
| Engine Architecture | Hybrid event-driven with SQLite job queue | Fast for user→user, reliable for service tasks |
| Work Item Identity | Embedded metadata (objectType + objectData JSON) | Flexible, self-contained, loosely coupled |
| Task Assignment | Configurable per task (queue, round-robin, manual) | Real BPM needs all three modes |
| Routing | User tasks = user chooses route; Decision tasks = auto-evaluate | Clean separation of concerns |
| Inbasket | Separate views (My Work + Available Work) | Clear UX for owned vs claimable items |
| Workflow Start | Both manual UI and API endpoint | Supports user-initiated and system-triggered |

## Data Model

### Prisma Schema

```prisma
// Core workflow definition
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
  process    Process  @relation(fields: [processId], references: [id])
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
  workflow     Workflow @relation(fields: [workflowId], references: [id])
  type         String   // begin, end, user, decision, service, broadcast, rendezvous, subflow
  name         String
  position     Json     // {x, y}
  config       Json     // Type-specific config (assignees, distribution, conditions, etc.)

  inboundRoutes  Route[] @relation("TargetTask")
  outboundRoutes Route[] @relation("SourceTask")
  workItems      WorkItem[]
}

model Route {
  id           String  @id @default(cuid())
  workflowId   String
  workflow     Workflow @relation(fields: [workflowId], references: [id])
  sourceTaskId String
  targetTaskId String
  sourceTask   Task    @relation("SourceTask", fields: [sourceTaskId], references: [id])
  targetTask   Task    @relation("TargetTask", fields: [targetTaskId], references: [id])
  label        String? // "Approve", "Reject", etc.
  condition    Json?   // For decision tasks: {field, operator, value}
}

model WorkItem {
  id            String    @id @default(cuid())
  workflowId    String
  currentTaskId String
  currentTask   Task      @relation(fields: [currentTaskId], references: [id])

  // Business object (embedded metadata approach)
  objectType    String    // "invoice", "purchase_order", etc.
  objectData    Json      // The actual business object fields

  // Status tracking
  status        String    @default("active") // active, completed, cancelled
  priority      String    @default("normal") // low, normal, high, urgent

  // Assignment
  claimedById   String?   // User who claimed this item
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
  workItem    WorkItem @relation(fields: [workItemId], references: [id])
  taskId      String   // Which task this occurred at
  taskName    String   // Denormalized for history readability
  action      String   // "arrived", "claimed", "released", "auto-routed"
  routeLabel  String?  // If released, which route was chosen
  userId      String?  // Who performed the action (null for auto)
  timestamp   DateTime @default(now())
  notes       String?
}

model User {
  id           String     @id @default(cuid())
  email        String     @unique
  name         String
  groups       UserGroup[]
  claimedItems WorkItem[] @relation("ClaimedItems")
}

model Group {
  id      String      @id @default(cuid())
  name    String
  users   UserGroup[]
}

model UserGroup {
  userId  String
  groupId String
  user    User   @relation(fields: [userId], references: [id])
  group   Group  @relation(fields: [groupId], references: [id])
  @@id([userId, groupId])
}

// SQLite-based job queue for async work
model JobQueue {
  id          String   @id @default(cuid())
  type        String   // "route_item", "service_task", "service_timeout_check", "auto_distribute"
  payload     Json     // Task-specific data
  status      String   @default("pending") // pending, processing, completed, failed
  attempts    Int      @default(0)
  maxAttempts Int      @default(3)
  error       String?
  runAt       DateTime @default(now()) // For delayed jobs
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Task Type Behaviors

### User Task
- Item arrives → applies distribution method
- **Queue**: item sits in shared queue, users claim
- **Round-robin**: auto-assign to least-loaded user in group
- **Manual**: assign to supervisor queue for explicit assignment
- User works item, then **chooses** outbound route (buttons from route labels)

### Decision Task
- **Automatic** - no user interaction
- Engine evaluates conditions against `objectData`
- Immediately routes based on matching condition
- Conditions: `{field, operator, value}` (e.g., `amount > 5000`)

### Service Task
- Acts as **automated actor** (robot user)
- Engine "assigns" item to service, triggers it, returns immediately
- Service works asynchronously (could be seconds or hours)
- Service calls back when done: `POST /api/work-items/{id}/service-complete`
- Chooses outbound route (Success/Failure/Timeout)
- Timeout monitoring job handles stuck services

### Begin Task
- Entry point for workflow
- Item created here, immediately routes to next task

### End Task
- Terminal point
- Item marked as completed

## Engine Flow

```
User clicks "Approve" on item at REVIEW task
  │
  ├─► API: POST /api/work-items/{id}/release
  │     body: { routeLabel: "Approve" }
  │
  ├─► Engine.release(workItemId, routeLabel, userId)
  │     1. Validate user owns this item
  │     2. Find route matching label from current task
  │     3. Log history: "released via Approve"
  │     4. Call Engine.moveToTask(item, targetTask)
  │
  └─► Engine.moveToTask(item, task)
        │
        ├─► If task.type === "end"
        │     → Mark item completed, done
        │
        ├─► If task.type === "decision"
        │     → Evaluate conditions against objectData
        │     → Find matching route
        │     → Recurse: moveToTask(item, nextTask)
        │
        ├─► If task.type === "service"
        │     → Assign to service, trigger callback
        │     → Service calls back when done
        │     → Engine routes via chosen route
        │
        └─► If task.type === "user"
              → Apply distribution method
              → Log history: "arrived"
              → Item waits for user action
```

## API Routes

### Builder CRUD
```
GET/POST   /api/processes           - List/create processes
GET/PUT/DEL /api/processes/{id}     - Process operations

GET/PUT    /api/workflows/{id}      - Get/update workflow
POST       /api/workflows/{id}/tasks - Create task
PUT/DEL    /api/workflows/{id}/tasks/{taskId} - Task operations
POST/DEL   /api/workflows/{id}/routes - Route operations
```

### Workflow Operations
```
POST       /api/workflows/{id}/start - Start new work item
           body: { objectType, objectData }
```

### Work Item Operations
```
GET        /api/work-items           - Query work items
GET/PUT    /api/work-items/{id}      - Get/update item
POST       /api/work-items/{id}/claim - Claim from queue
POST       /api/work-items/{id}/unclaim - Release claim
POST       /api/work-items/{id}/release - Release via route
           body: { routeLabel: "Approve" }
POST       /api/work-items/{id}/service-complete - Service callback
           body: { routeLabel: "Success", resultData: {...} }
```

### Inbasket
```
GET        /api/inbasket/my-work     - Items claimed by user
GET        /api/inbasket/available   - Queue items user can claim
```

## Inbasket UI

### My Work View
- Shows items claimed/assigned to current user
- Each item displays: ID, task name, priority, age, object summary
- Route buttons dynamically generated from outbound route labels
- Click to expand full object details
- [+ New] button to start new workflow item

### Available Work View
- Shows unclaimed items in queues user has access to (via group membership)
- [Claim] button moves item to My Work
- Filter by task/workflow/priority

## Implementation Phases

### Phase 1: Foundation (Database + CRUD)
- Set up Prisma with SQLite
- Create schema (Process, Workflow, Task, Route, User, Group)
- Build API routes for builder CRUD
- Connect existing React Flow canvas to real persistence
- Seed with sample Invoice workflow

### Phase 2: Work Items + Engine Core
- Add WorkItem, WorkItemHistory, JobQueue models
- Build engine core: `moveToTask()`, route evaluation
- Implement decision task auto-routing (condition evaluation)
- API: start workflow, get work item
- Simple test harness to verify routing logic

### Phase 3: Inbasket + User Operations
- Build inbasket API (my-work, available)
- Implement claim/unclaim/release endpoints
- Add distribution methods (queue, round-robin, manual)
- Build inbasket UI (My Work + Available Work views)
- Work item detail panel with dynamic route buttons

### Phase 4: Service Tasks + Job Processing
- Service task callback endpoint
- Timeout monitoring job
- Job queue worker (polling loop)
- Service task configuration UI

### Phase 5: Polish
- History view for completed items
- Error handling and edge cases
- Form field rendering based on task config

## Starting Point

### Sample Object Type: Invoice
```typescript
{
  invoiceNumber: string
  vendor: string
  amount: number
  dueDate: string
  status: string
  notes: string
}
```

### Sample Workflow: Invoice Approval
```
BEGIN → Entry (user) → Review (user) → [Decision: amount > 5000?]
                                           ├─ Yes → Manager Approval (user) → END
                                           └─ No → END
```

- Entry task: queue distribution, AP Clerks group
- Review task: queue distribution, Reviewers group
- Manager Approval: manual distribution, Managers group
- Decision evaluates `amount > 5000`
