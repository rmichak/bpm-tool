# Mock API Contracts: BPM Workflow Builder

**Feature**: 001-bpm-workflow-builder
**Date**: 2025-12-26
**Status**: Phase 1 (Mock Implementation)

## Overview

This document defines the API contracts that will be implemented as in-memory mock functions in Phase 1. These contracts will translate directly to Supabase API calls in Phase 2.

## Mock Implementation Pattern

```typescript
// Phase 1: In-memory mock
import { mockProcesses } from '@/lib/mock-data/processes';

export async function getProcesses(): Promise<Process[]> {
  // Simulate network delay
  await new Promise(r => setTimeout(r, 100));
  return mockProcesses;
}

// Phase 2: Replace with Supabase
import { supabase } from '@/lib/supabase';

export async function getProcesses(): Promise<Process[]> {
  const { data, error } = await supabase
    .from('processes')
    .select('*');
  if (error) throw error;
  return data;
}
```

---

## Process APIs

### GET /api/processes

List all processes.

**Response**: `Process[]`

```typescript
interface GetProcessesResponse {
  data: Process[];
  total: number;
}

// Mock implementation
async function getProcesses(status?: ProcessStatus): Promise<GetProcessesResponse>
```

### GET /api/processes/:id

Get a single process with its field definitions.

**Response**: `ProcessDetail`

```typescript
interface ProcessDetail extends Process {
  fieldDefinitions: FieldDefinition[];
  workflows: Workflow[];
}

async function getProcess(id: string): Promise<ProcessDetail>
```

### POST /api/processes

Create a new process.

**Request**:
```typescript
interface CreateProcessRequest {
  name: string;
  description: string;
}
```

**Response**: `Process`

### PUT /api/processes/:id

Update a process.

**Request**:
```typescript
interface UpdateProcessRequest {
  name?: string;
  description?: string;
  status?: ProcessStatus;
}
```

### DELETE /api/processes/:id

Archive a process (soft delete).

---

## Workflow APIs

### GET /api/workflows/:id

Get a workflow with all tasks and routes.

**Response**: `WorkflowDetail`

```typescript
interface WorkflowDetail extends Workflow {
  tasks: Task[];
  routes: Route[];
}

async function getWorkflow(id: string): Promise<WorkflowDetail>
```

### PUT /api/workflows/:id

Update a workflow (including tasks and routes).

**Request**:
```typescript
interface UpdateWorkflowRequest {
  name?: string;
  description?: string;
  tasks: Task[];        // Full replacement
  routes: Route[];      // Full replacement
}
```

### POST /api/workflows/:id/validate

Validate workflow integrity.

**Response**:
```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  code: string;
  message: string;
  taskId?: string;
}

interface ValidationWarning {
  code: string;
  message: string;
  taskId?: string;
}
```

**Validation Rules**:
- `ERR_NO_BEGIN`: Workflow must have exactly one Begin task
- `ERR_NO_END`: Workflow must have at least one End task
- `ERR_ORPHAN_TASK`: Task has no incoming or outgoing routes
- `ERR_CIRCULAR_ROUTE`: Detected circular path
- `WARN_UNREACHABLE`: Task cannot be reached from Begin

---

## Field Definition APIs

### GET /api/processes/:processId/fields

List all field definitions for a process.

**Response**: `FieldDefinition[]`

### POST /api/processes/:processId/fields

Add a field definition.

**Request**:
```typescript
interface CreateFieldRequest {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  config: FieldConfig;
}
```

### PUT /api/fields/:id

Update a field definition.

### DELETE /api/fields/:id

Remove a field definition.

### PUT /api/processes/:processId/fields/order

Reorder fields.

**Request**:
```typescript
interface ReorderFieldsRequest {
  fieldIds: string[];  // Ordered list of field IDs
}
```

---

## Work Item APIs

### GET /api/work-items

List work items (with filters).

**Query Parameters**:
- `assignedTo`: User ID
- `groupId`: Group ID (for group queue)
- `status`: WorkItemStatus
- `processId`: Process ID

**Response**:
```typescript
interface WorkItemListResponse {
  data: WorkItemSummary[];
  total: number;
}

interface WorkItemSummary {
  id: string;
  processName: string;
  currentTaskName: string;
  status: WorkItemStatus;
  priority: WorkItemPriority;
  assignedTo: AssignmentInfo;
  createdAt: string;
  updatedAt: string;
}
```

### GET /api/work-items/:id

Get a work item with full details.

**Response**:
```typescript
interface WorkItemDetail extends WorkItem {
  process: Process;
  currentTask: Task;
  fieldDefinitions: FieldDefinition[];
  availableActions: WorkItemAction[];
  history: WorkItemHistoryEntry[];
}

interface WorkItemAction {
  type: 'complete' | 'claim' | 'release' | 'cancel';
  label: string;
  available: boolean;
  reason?: string;  // Why not available
}

interface WorkItemHistoryEntry {
  id: string;
  action: string;
  fromTaskId: string | null;
  toTaskId: string | null;
  performedBy: string;
  performedAt: string;
  notes: string | null;
}
```

### POST /api/work-items

Create a new work item.

**Request**:
```typescript
interface CreateWorkItemRequest {
  processId: string;
  fieldValues: Record<string, FieldValue>;
  priority?: WorkItemPriority;
}
```

### PUT /api/work-items/:id

Update work item field values.

**Request**:
```typescript
interface UpdateWorkItemRequest {
  fieldValues: Record<string, FieldValue>;
}
```

### POST /api/work-items/:id/claim

Claim a group-assigned work item.

**Response**: Updated `WorkItemDetail`

### POST /api/work-items/:id/release

Release a claimed work item back to group queue.

### POST /api/work-items/:id/complete

Complete the current task and route to next.

**Request**:
```typescript
interface CompleteWorkItemRequest {
  fieldValues: Record<string, FieldValue>;
  notes?: string;
}
```

**Response**:
```typescript
interface CompleteWorkItemResponse {
  workItem: WorkItemDetail;
  routedTo: Task | null;  // null if completed (reached End)
  branchWorkItems?: WorkItem[];  // If hit Broadcast
}
```

---

## User & Group APIs

### GET /api/users/me

Get current user profile.

**Response**: `User`

### GET /api/users

List all users (admin only).

### GET /api/groups

List all groups.

### GET /api/groups/:id/members

List group members.

---

## Mock Data Hooks

React hooks for Phase 1 that wrap these APIs:

```typescript
// hooks/useWorkItems.ts
function useWorkItems(filters?: WorkItemFilters): {
  items: WorkItemSummary[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

// hooks/useWorkItem.ts
function useWorkItem(id: string): {
  item: WorkItemDetail | null;
  loading: boolean;
  error: Error | null;
  update: (values: Record<string, FieldValue>) => Promise<void>;
  complete: () => Promise<void>;
  claim: () => Promise<void>;
  release: () => Promise<void>;
}

// hooks/useWorkflow.ts
function useWorkflow(id: string): {
  workflow: WorkflowDetail | null;
  loading: boolean;
  error: Error | null;
  updateNodes: (nodes: Task[]) => void;
  updateEdges: (edges: Route[]) => void;
  save: () => Promise<ValidationResult>;
  validate: () => ValidationResult;
}

// hooks/useProcesses.ts
function useProcesses(): {
  processes: Process[];
  loading: boolean;
  create: (data: CreateProcessRequest) => Promise<Process>;
}
```
