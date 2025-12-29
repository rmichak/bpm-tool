# Data Model: BPM Workflow Builder

**Feature**: 001-bpm-workflow-builder
**Date**: 2025-12-26
**Status**: Phase 1 (Mock Data Structures)

## Overview

This document defines the TypeScript interfaces for the BPM Workflow Builder mockup. These types will be used for in-memory mock data in Phase 1 and will map directly to Supabase tables in Phase 2.

## Entity Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Process   │───────│  Workflow   │───────│    Task     │
└─────────────┘  1:N  └─────────────┘  1:N  └─────────────┘
       │                                           │
       │ 1:N                                       │ 1:N
       ▼                                           ▼
┌─────────────┐                             ┌─────────────┐
│FieldDefn   │                             │    Route    │
└─────────────┘                             └─────────────┘
       │
       │ used by
       ▼
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  WorkItem   │───────│    User     │───────│    Group    │
└─────────────┘  N:1  └─────────────┘  N:M  └─────────────┘
```

## Core Entities

### Process

The top-level container representing a business process.

```typescript
interface Process {
  id: string;                    // UUID
  name: string;                  // e.g., "Invoice Approval"
  description: string;           // Human-readable description
  status: ProcessStatus;         // draft | active | archived
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
  createdBy: string;             // User ID
}

type ProcessStatus = 'draft' | 'active' | 'archived';
```

### Workflow

A flow of tasks within a process.

```typescript
interface Workflow {
  id: string;                    // UUID
  processId: string;             // FK to Process
  name: string;                  // e.g., "Main Approval Flow"
  description: string;
  isMainFlow: boolean;           // true if primary workflow
  version: number;               // Incremented on changes
  createdAt: string;
  updatedAt: string;
}
```

### Task

An activity node within a workflow.

```typescript
interface Task {
  id: string;                    // UUID
  workflowId: string;            // FK to Workflow
  type: TaskType;                // begin | end | user | decision | broadcast | rendezvous
  name: string;                  // Display label
  description: string;
  config: TaskConfig;            // Type-specific configuration
  position: Position;            // Canvas coordinates
  createdAt: string;
  updatedAt: string;
}

type TaskType = 'begin' | 'end' | 'user' | 'decision' | 'broadcast' | 'rendezvous';

interface Position {
  x: number;
  y: number;
}

// Type-specific configurations
type TaskConfig =
  | BeginTaskConfig
  | EndTaskConfig
  | UserTaskConfig
  | DecisionTaskConfig
  | BroadcastTaskConfig
  | RendezvousTaskConfig;

interface BeginTaskConfig {
  type: 'begin';
  // No additional config for begin
}

interface EndTaskConfig {
  type: 'end';
  // No additional config for end
}

interface UserTaskConfig {
  type: 'user';
  assignees: AssigneeConfig;
  formFields: string[];          // Field IDs to display
  instructions: string;          // Instructions for user
}

interface DecisionTaskConfig {
  type: 'decision';
  conditions: DecisionCondition[];
  defaultRouteId: string | null; // Fallback if no conditions match
}

interface BroadcastTaskConfig {
  type: 'broadcast';
  // Routes define parallel paths
}

interface RendezvousTaskConfig {
  type: 'rendezvous';
  waitMode: 'all' | 'any';       // Wait for all branches or first
}

interface AssigneeConfig {
  type: 'user' | 'group';
  ids: string[];                 // User or Group IDs
}

interface DecisionCondition {
  id: string;
  routeId: string;               // Which route to take
  fieldId: string;               // Field to evaluate
  operator: ComparisonOperator;
  value: string | number | boolean;
  priority: number;              // Evaluation order
}

type ComparisonOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith';
```

### Route

A connection between two tasks.

```typescript
interface Route {
  id: string;                    // UUID
  workflowId: string;            // FK to Workflow
  sourceTaskId: string;          // FK to Task
  targetTaskId: string;          // FK to Task
  label: string;                 // Optional display label
  createdAt: string;
}
```

### FieldDefinition

Dynamic form field configuration.

```typescript
interface FieldDefinition {
  id: string;                    // UUID
  processId: string;             // FK to Process
  name: string;                  // Internal name (e.g., "invoice_number")
  label: string;                 // Display label
  type: FieldType;
  required: boolean;
  order: number;                 // Display order
  config: FieldConfig;           // Type-specific settings
  createdAt: string;
  updatedAt: string;
}

type FieldType = 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea';

interface FieldConfig {
  placeholder?: string;
  defaultValue?: string | number | boolean;
  options?: SelectOption[];      // For select type
  minLength?: number;            // For text/textarea
  maxLength?: number;
  min?: number;                  // For number
  max?: number;
  pattern?: string;              // Regex pattern
}

interface SelectOption {
  value: string;
  label: string;
}
```

### WorkItem

An instance of work flowing through a process.

```typescript
interface WorkItem {
  id: string;                    // UUID
  processId: string;             // FK to Process
  workflowId: string;            // FK to Workflow
  currentTaskId: string;         // FK to Task (current location)
  status: WorkItemStatus;
  priority: WorkItemPriority;
  fieldValues: Record<string, FieldValue>;  // Dynamic field data
  assignedTo: AssignmentInfo;
  parentWorkItemId: string | null;  // For broadcast-created items
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

type WorkItemStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
type WorkItemPriority = 'low' | 'medium' | 'high' | 'urgent';

type FieldValue = string | number | boolean | null;

interface AssignmentInfo {
  type: 'user' | 'group' | 'unassigned';
  userId: string | null;         // Assigned user (if claimed)
  groupId: string | null;        // Assigned group
  assignedAt: string | null;
  claimedAt: string | null;
}
```

### User

A person who can process work.

```typescript
interface User {
  id: string;                    // UUID
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

type UserRole = 'admin' | 'user';
type UserStatus = 'active' | 'inactive';
```

### Group

A collection of users for shared assignments.

```typescript
interface Group {
  id: string;                    // UUID
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface GroupMembership {
  groupId: string;               // FK to Group
  userId: string;                // FK to User
  joinedAt: string;
}
```

## State Transitions

### WorkItem Status Flow

```
                    ┌──────────────┐
                    │   pending    │
                    └──────┬───────┘
                           │ assign/claim
                           ▼
                    ┌──────────────┐
                    │ in_progress  │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │ complete   │            │ cancel
              ▼            │            ▼
       ┌──────────────┐    │     ┌──────────────┐
       │  completed   │    │     │  cancelled   │
       └──────────────┘    │     └──────────────┘
                           │
                           ▼ (at rendezvous)
                    ┌──────────────┐
                    │   pending    │ (new merged item)
                    └──────────────┘
```

### Process Status Flow

```
       ┌──────────────┐
       │    draft     │
       └──────┬───────┘
              │ activate
              ▼
       ┌──────────────┐
       │    active    │
       └──────┬───────┘
              │ archive
              ▼
       ┌──────────────┐
       │   archived   │
       └──────────────┘
```

## Validation Rules

| Entity | Field | Rule |
|--------|-------|------|
| Process | name | Required, 1-100 characters |
| Workflow | tasks | Must have exactly one 'begin' task |
| Workflow | tasks | Must have at least one 'end' task |
| Task | position | x and y must be >= 0 |
| Route | source/target | Cannot create circular routes (begin→...→begin) |
| FieldDefinition | name | Unique within process, alphanumeric + underscore |
| WorkItem | fieldValues | Required fields must have non-null values |

## React Flow Mapping

For the workflow builder, entities map to React Flow structures:

```typescript
// Task → React Flow Node
interface WorkflowNode extends Node {
  id: string;                    // Task.id
  type: TaskType;                // Maps to custom node component
  position: Position;            // Task.position
  data: {
    task: Task;
    label: string;
  };
}

// Route → React Flow Edge
interface WorkflowEdge extends Edge {
  id: string;                    // Route.id
  source: string;                // Route.sourceTaskId
  target: string;                // Route.targetTaskId
  label?: string;                // Route.label
  type: 'smoothstep';            // Edge rendering style
}
```
