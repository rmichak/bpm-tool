// Process Types
export type ProcessStatus = 'draft' | 'active' | 'archived';

export interface Process {
  id: string;
  name: string;
  description: string;
  status: ProcessStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Workflow Types
export type WorkflowStatus = 'draft' | 'published' | 'archived';

export interface Workflow {
  id: string;
  processId: string;
  name: string;
  description: string;
  isMainFlow: boolean;
  version: number;
  status: WorkflowStatus;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowDetail extends Workflow {
  tasks: Task[];
  routes: Route[];
}

// Task Types
export type TaskType = 'begin' | 'end' | 'user' | 'decision' | 'broadcast' | 'rendezvous' | 'subflow' | 'service';

export interface Position {
  x: number;
  y: number;
}

export interface Task {
  id: string;
  workflowId: string;
  type: TaskType;
  name: string;
  description: string;
  config: TaskConfig;
  position: Position;
  createdAt: string;
  updatedAt: string;
}

export type TaskConfig =
  | BeginTaskConfig
  | EndTaskConfig
  | UserTaskConfig
  | DecisionTaskConfig
  | BroadcastTaskConfig
  | RendezvousTaskConfig
  | SubflowTaskConfig
  | ServiceTaskConfig;

export interface BeginTaskConfig {
  type: 'begin';
}

export interface EndTaskConfig {
  type: 'end';
}

export interface UserTaskConfig {
  type: 'user';
  assignees: AssigneeConfig;
  formFields: string[];
  instructions: string;
}

export interface DecisionTaskConfig {
  type: 'decision';
  conditions: DecisionCondition[];
  defaultRouteId: string | null;
}

export interface BroadcastTaskConfig {
  type: 'broadcast';
}

export interface RendezvousTaskConfig {
  type: 'rendezvous';
  waitMode: 'all' | 'any';
}

export interface SubflowTaskConfig {
  type: 'subflow';
  subflowId: string;
  dataMapping?: {
    parentField: string;
    subflowField: string;
  }[];
}

export interface ServiceTaskConfig {
  type: 'service';
  serviceType: 'api_call' | 'email' | 'notification' | 'script' | 'integration';
  config: {
    endpoint?: string;
    method?: string;
    template?: string;
    retryCount?: number;
  };
  timeout?: number;
  onError: 'fail' | 'continue' | 'retry';
}

export interface AssigneeConfig {
  type: 'user' | 'group';
  ids: string[];
}

export interface DecisionCondition {
  id: string;
  routeId: string;
  fieldId: string;
  operator: ComparisonOperator;
  value: string | number | boolean;
  priority: number;
}

export type ComparisonOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith';

// Route Types
export interface Route {
  id: string;
  workflowId: string;
  sourceTaskId: string;
  targetTaskId: string;
  label: string;
  createdAt: string;
}

// Field Definition Types
export type FieldType = 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea';

export interface FieldDefinition {
  id: string;
  processId: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  order: number;
  config: FieldConfig;
  createdAt: string;
  updatedAt: string;
}

export interface FieldConfig {
  placeholder?: string;
  defaultValue?: string | number | boolean;
  options?: SelectOption[];
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

// Work Item Types
export type WorkItemStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type WorkItemPriority = 'low' | 'medium' | 'high' | 'urgent';
export type FieldValue = string | number | boolean | null;

export interface WorkItem {
  id: string;
  processId: string;
  workflowId: string;
  currentTaskId: string;
  status: WorkItemStatus;
  priority: WorkItemPriority;
  fieldValues: Record<string, FieldValue>;
  assignedTo: AssignmentInfo;
  parentWorkItemId: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface AssignmentInfo {
  type: 'user' | 'group' | 'unassigned';
  userId: string | null;
  groupId: string | null;
  assignedAt: string | null;
  claimedAt: string | null;
}

// User Types
export type UserRole = 'admin' | 'user';
export type UserStatus = 'active' | 'inactive';

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

// Group Types
export interface Group {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface GroupMembership {
  groupId: string;
  userId: string;
  joinedAt: string;
}

// Task Metrics Types (for simulation/live metrics)
export interface TaskMetrics {
  taskId: string;
  activeCount: number;
  overdueCount: number;
  avgWaitTime: number;
  throughputPerDay: number;
  oldestItemAge: number;
}

export interface SimulationState {
  isRunning: boolean;
  speed: number;
  totalProcessed: number;
  items: SimulationItem[];
}

export interface SimulationItem {
  id: string;
  taskId: string;
  createdAt: number;
  isOverdue: boolean;
}
