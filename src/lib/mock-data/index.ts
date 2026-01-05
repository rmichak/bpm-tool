import type {
  Process,
  Workflow,
  WorkflowDetail,
  Task,
  Route,
  FieldDefinition,
  WorkItem,
  User,
  Group,
} from '@/types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'user-2',
    email: 'john@example.com',
    name: 'John Smith',
    role: 'user',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'user-3',
    email: 'jane@example.com',
    name: 'Jane Doe',
    role: 'user',
    createdAt: '2024-01-01T00:00:00Z',
  },
];

// Mock Groups
export const mockGroups: Group[] = [
  {
    id: 'group-1',
    name: 'Approvers',
    description: 'Invoice approval team',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'group-2',
    name: 'Finance Team',
    description: 'Finance department members',
    createdAt: '2024-01-01T00:00:00Z',
  },
];

// Mock Processes
export const mockProcesses: Process[] = [
  {
    id: 'process-1',
    name: 'Invoice Approval',
    description: 'Standard invoice approval workflow',
    status: 'running',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
    createdBy: 'user-1',
  },
  {
    id: 'process-2',
    name: 'Purchase Request',
    description: 'Purchase order request and approval',
    status: 'paused',
    createdAt: '2024-02-01T09:00:00Z',
    updatedAt: '2024-02-01T09:00:00Z',
    createdBy: 'user-1',
  },
];

// Mock Field Definitions (now tied to object types, not processes directly)
export const mockFieldDefinitions: FieldDefinition[] = [
  {
    id: 'field-1',
    objectTypeId: 'object-type-1',
    name: 'invoice_number',
    label: 'Invoice Number',
    type: 'text',
    required: true,
    order: 1,
    config: { placeholder: 'INV-001' },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'field-2',
    objectTypeId: 'object-type-1',
    name: 'amount',
    label: 'Amount ($)',
    type: 'number',
    required: true,
    order: 2,
    config: { min: 0 },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'field-3',
    objectTypeId: 'object-type-1',
    name: 'vendor_name',
    label: 'Vendor Name',
    type: 'text',
    required: true,
    order: 3,
    config: {},
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'field-4',
    objectTypeId: 'object-type-1',
    name: 'invoice_date',
    label: 'Invoice Date',
    type: 'date',
    required: true,
    order: 4,
    config: {},
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'field-5',
    objectTypeId: 'object-type-1',
    name: 'notes',
    label: 'Notes',
    type: 'textarea',
    required: false,
    order: 5,
    config: { placeholder: 'Additional notes...' },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'field-6',
    objectTypeId: 'object-type-1',
    name: 'priority',
    label: 'Priority',
    type: 'select',
    required: true,
    order: 6,
    config: {
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
      ],
    },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
];

// Mock Tasks for Invoice Approval Workflow (includes service and subflow tasks)
export const mockTasks: Task[] = [
  {
    id: 'task-1',
    workflowId: 'workflow-1',
    type: 'begin',
    name: 'Start',
    description: 'Invoice submission',
    config: { type: 'begin' },
    position: { x: 100, y: 200 },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'task-2',
    workflowId: 'workflow-1',
    type: 'user',
    name: 'Review Invoice',
    description: 'Review invoice details',
    config: {
      type: 'user',
      assignees: { type: 'group', ids: ['group-1'] },
      formFields: ['field-1', 'field-2', 'field-3', 'field-4', 'field-5'],
      instructions: 'Please review the invoice details and approve or reject.',
    },
    position: { x: 300, y: 200 },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'task-3',
    workflowId: 'workflow-1',
    type: 'decision',
    name: 'Amount Check',
    description: 'Check if amount requires additional approval',
    config: {
      type: 'decision',
      conditions: [
        {
          id: 'cond-1',
          routeId: 'route-3',
          fieldId: 'field-2',
          operator: 'gte',
          value: 10000,
          priority: 1,
        },
      ],
      defaultRouteId: 'route-4',
    },
    position: { x: 500, y: 200 },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'task-4',
    workflowId: 'workflow-1',
    type: 'user',
    name: 'Manager Approval',
    description: 'Manager reviews high-value invoices',
    config: {
      type: 'user',
      assignees: { type: 'user', ids: ['user-1'] },
      formFields: ['field-1', 'field-2', 'field-6'],
      instructions: 'High-value invoice requires manager approval.',
    },
    position: { x: 700, y: 100 },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'task-5',
    workflowId: 'workflow-1',
    type: 'end',
    name: 'Complete',
    description: 'Invoice processed',
    config: { type: 'end' },
    position: { x: 1100, y: 200 },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  // New Service Task - Send Notification
  {
    id: 'task-6',
    workflowId: 'workflow-1',
    type: 'service',
    name: 'Send Notification',
    description: 'Send email notification to stakeholders',
    config: {
      type: 'service',
      serviceType: 'email',
      config: {
        template: 'invoice-approved',
        retryCount: 3,
      },
      timeout: 30000,
      onError: 'continue',
    },
    position: { x: 900, y: 100 },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  // New Subflow Task - Compliance Check
  {
    id: 'task-7',
    workflowId: 'workflow-1',
    type: 'subflow',
    name: 'Compliance Check',
    description: 'Run compliance verification subflow',
    config: {
      type: 'subflow',
      subflowId: 'workflow-2',
      dataMapping: [
        { parentField: 'field-2', subflowField: 'compliance-amount' },
        { parentField: 'field-3', subflowField: 'compliance-vendor' },
      ],
    },
    position: { x: 700, y: 300 },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  // Subflow tasks (workflow-2: Compliance Check Subflow)
  {
    id: 'task-sub-1',
    workflowId: 'workflow-2',
    type: 'begin',
    name: 'Start Compliance',
    description: 'Begin compliance check',
    config: { type: 'begin' },
    position: { x: 100, y: 200 },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'task-sub-2',
    workflowId: 'workflow-2',
    type: 'service',
    name: 'Verify Vendor',
    description: 'Check vendor against blocklist',
    config: {
      type: 'service',
      serviceType: 'api_call',
      config: {
        endpoint: '/api/vendors/verify',
        method: 'POST',
        retryCount: 2,
      },
      timeout: 15000,
      onError: 'fail',
    },
    position: { x: 300, y: 200 },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'task-sub-3',
    workflowId: 'workflow-2',
    type: 'decision',
    name: 'Vendor Status',
    description: 'Check vendor verification result',
    config: {
      type: 'decision',
      conditions: [],
      defaultRouteId: null,
    },
    position: { x: 500, y: 200 },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'task-sub-4',
    workflowId: 'workflow-2',
    type: 'user',
    name: 'Manual Review',
    description: 'Manual compliance review required',
    config: {
      type: 'user',
      assignees: { type: 'group', ids: ['group-2'] },
      formFields: [],
      instructions: 'Review vendor compliance manually.',
    },
    position: { x: 700, y: 100 },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'task-sub-5',
    workflowId: 'workflow-2',
    type: 'end',
    name: 'Compliance Complete',
    description: 'Compliance check finished',
    config: { type: 'end' },
    position: { x: 900, y: 200 },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
];

// Mock Routes
export const mockRoutes: Route[] = [
  // Main workflow routes
  {
    id: 'route-1',
    workflowId: 'workflow-1',
    sourceTaskId: 'task-1',
    targetTaskId: 'task-2',
    label: '',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'route-2',
    workflowId: 'workflow-1',
    sourceTaskId: 'task-2',
    targetTaskId: 'task-3',
    label: '',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'route-3',
    workflowId: 'workflow-1',
    sourceTaskId: 'task-3',
    targetTaskId: 'task-4',
    label: '≥ $10,000',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'route-4',
    workflowId: 'workflow-1',
    sourceTaskId: 'task-3',
    targetTaskId: 'task-7',
    label: '< $10,000',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'route-5',
    workflowId: 'workflow-1',
    sourceTaskId: 'task-4',
    targetTaskId: 'task-6',
    label: '',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'route-6',
    workflowId: 'workflow-1',
    sourceTaskId: 'task-6',
    targetTaskId: 'task-5',
    label: '',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'route-7',
    workflowId: 'workflow-1',
    sourceTaskId: 'task-7',
    targetTaskId: 'task-5',
    label: '',
    createdAt: '2024-01-15T10:00:00Z',
  },
  // Subflow routes (workflow-2)
  {
    id: 'route-sub-1',
    workflowId: 'workflow-2',
    sourceTaskId: 'task-sub-1',
    targetTaskId: 'task-sub-2',
    label: '',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'route-sub-2',
    workflowId: 'workflow-2',
    sourceTaskId: 'task-sub-2',
    targetTaskId: 'task-sub-3',
    label: '',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'route-sub-3',
    workflowId: 'workflow-2',
    sourceTaskId: 'task-sub-3',
    targetTaskId: 'task-sub-4',
    label: 'Needs Review',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'route-sub-4',
    workflowId: 'workflow-2',
    sourceTaskId: 'task-sub-3',
    targetTaskId: 'task-sub-5',
    label: 'Verified',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'route-sub-5',
    workflowId: 'workflow-2',
    sourceTaskId: 'task-sub-4',
    targetTaskId: 'task-sub-5',
    label: '',
    createdAt: '2024-01-15T10:00:00Z',
  },
];

// Mock Workflows
export const mockWorkflows: Workflow[] = [
  {
    id: 'workflow-1',
    processId: 'process-1',
    name: 'Invoice Approval Flow',
    description: 'Main invoice approval workflow',
    isMainFlow: true,
    version: 1,
    status: 'published',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
  },
  {
    id: 'workflow-2',
    processId: 'process-1',
    name: 'Compliance Check',
    description: 'Subflow for vendor compliance verification',
    isMainFlow: false,
    version: 1,
    status: 'published',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-18T11:00:00Z',
  },
];

// Mock Work Items
export const mockWorkItems: WorkItem[] = [
  {
    id: 'workitem-1',
    processId: 'process-1',
    workflowId: 'workflow-1',
    currentTaskId: 'task-2',
    status: 'in_progress',
    priority: 'high',
    fieldValues: {
      invoice_number: 'INV-2024-001',
      amount: 15000,
      vendor_name: 'Acme Corp',
      invoice_date: '2024-01-20',
      notes: 'Urgent - equipment purchase',
      priority: 'high',
    },
    assignedTo: {
      type: 'user',
      userId: 'user-2',
      groupId: 'group-1',
      assignedAt: '2024-01-21T09:00:00Z',
      claimedAt: '2024-01-21T09:30:00Z',
    },
    parentWorkItemId: null,
    createdAt: '2024-01-20T15:00:00Z',
    updatedAt: '2024-01-21T09:30:00Z',
    completedAt: null,
  },
  {
    id: 'workitem-2',
    processId: 'process-1',
    workflowId: 'workflow-1',
    currentTaskId: 'task-2',
    status: 'pending',
    priority: 'medium',
    fieldValues: {
      invoice_number: 'INV-2024-002',
      amount: 2500,
      vendor_name: 'Office Supplies Inc',
      invoice_date: '2024-01-22',
      notes: '',
      priority: 'medium',
    },
    assignedTo: {
      type: 'group',
      userId: null,
      groupId: 'group-1',
      assignedAt: '2024-01-22T10:00:00Z',
      claimedAt: null,
    },
    parentWorkItemId: null,
    createdAt: '2024-01-22T10:00:00Z',
    updatedAt: '2024-01-22T10:00:00Z',
    completedAt: null,
  },
  {
    id: 'workitem-3',
    processId: 'process-1',
    workflowId: 'workflow-1',
    currentTaskId: 'task-4',
    status: 'pending',
    priority: 'high',
    fieldValues: {
      invoice_number: 'INV-2024-003',
      amount: 50000,
      vendor_name: 'Tech Solutions Ltd',
      invoice_date: '2024-01-23',
      notes: 'Annual license renewal',
      priority: 'high',
    },
    assignedTo: {
      type: 'user',
      userId: 'user-1',
      groupId: null,
      assignedAt: '2024-01-23T14:00:00Z',
      claimedAt: null,
    },
    parentWorkItemId: null,
    createdAt: '2024-01-23T11:00:00Z',
    updatedAt: '2024-01-23T14:00:00Z',
    completedAt: null,
  },
];

// Helper function to get workflow with tasks and routes
export function getWorkflowDetail(workflowId: string): WorkflowDetail | null {
  const workflow = mockWorkflows.find((w) => w.id === workflowId);
  if (!workflow) return null;

  return {
    ...workflow,
    tasks: mockTasks.filter((t) => t.workflowId === workflowId),
    routes: mockRoutes.filter((r) => r.workflowId === workflowId),
  };
}

// Helper to get current user (mock - always returns user-2 for demo)
export function getCurrentUser(): User {
  return mockUsers[1]; // John Smith
}

// Helper to get work items for current user
export function getWorkItemsForUser(userId: string): WorkItem[] {
  return mockWorkItems.filter(
    (item) =>
      item.assignedTo.userId === userId ||
      (item.assignedTo.type === 'group' && item.assignedTo.groupId)
  );
}

// Helper to get field definitions for an object type
export function getFieldDefinitionsForObjectType(objectTypeId: string): FieldDefinition[] {
  return mockFieldDefinitions
    .filter((f) => f.objectTypeId === objectTypeId)
    .sort((a, b) => a.order - b.order);
}

// Helper to get task by ID
export function getTaskById(taskId: string): Task | undefined {
  return mockTasks.find((t) => t.id === taskId);
}

// Helper to get process by ID
export function getProcessById(processId: string): Process | undefined {
  return mockProcesses.find((p) => p.id === processId);
}

// ============================================
// Dashboard Mock Data
// ============================================

export const dashboardMetrics = {
  activeItems: { value: 247, trend: 12, isPositive: true },
  pendingSLA: { value: 23, trend: -8, isPositive: true },
  avgCompletionTime: { value: 4.2, unit: 'hours', trend: -15, isPositive: true },
  activeUsers: { value: 18, trend: 5, isPositive: true },
}

export const workloadData = [
  { name: 'John Smith', items: 24, color: 'hsl(var(--chart-1))' },
  { name: 'Jane Doe', items: 18, color: 'hsl(var(--chart-2))' },
  { name: 'Bob Wilson', items: 31, color: 'hsl(var(--chart-3))' },
  { name: 'Sarah Chen', items: 15, color: 'hsl(var(--chart-4))' },
  { name: 'Mike Johnson', items: 22, color: 'hsl(var(--chart-5))' },
  { name: 'Emily Davis', items: 28, color: 'hsl(var(--chart-1))' },
]

export const throughputData = [
  { date: 'Mon', completed: 42, submitted: 38 },
  { date: 'Tue', completed: 55, submitted: 48 },
  { date: 'Wed', completed: 38, submitted: 52 },
  { date: 'Thu', completed: 67, submitted: 61 },
  { date: 'Fri', completed: 52, submitted: 45 },
  { date: 'Sat', completed: 28, submitted: 22 },
  { date: 'Sun', completed: 15, submitted: 18 },
]

export const slaComplianceData = [
  { name: 'On Time', value: 75, color: 'hsl(var(--success))' },
  { name: 'At Risk', value: 15, color: 'hsl(var(--warning))' },
  { name: 'Overdue', value: 10, color: 'hsl(var(--destructive))' },
]

export const bottleneckTasks = [
  { id: 1, taskName: 'Manager Approval', process: 'Invoice Approval', avgWaitTime: '6.2h', itemsStuck: 12 },
  { id: 2, taskName: 'Legal Review', process: 'Contract Approval', avgWaitTime: '18.4h', itemsStuck: 8 },
  { id: 3, taskName: 'QA Verification', process: 'Release Process', avgWaitTime: '4.1h', itemsStuck: 6 },
  { id: 4, taskName: 'Budget Check', process: 'Purchase Request', avgWaitTime: '2.8h', itemsStuck: 5 },
]

export const activityFeed = [
  { id: 1, type: 'completed', user: 'John Smith', action: 'completed', item: 'INV-2024-089', time: '2 min ago' },
  { id: 2, type: 'assigned', user: 'System', action: 'assigned', item: 'PO-2024-156', target: 'Jane Doe', time: '5 min ago' },
  { id: 3, type: 'created', user: 'Mike Johnson', action: 'created', item: 'INV-2024-090', time: '12 min ago' },
  { id: 4, type: 'escalated', user: 'System', action: 'escalated', item: 'INV-2024-078', reason: 'SLA breach', time: '18 min ago' },
  { id: 5, type: 'completed', user: 'Sarah Chen', action: 'completed', item: 'CONTRACT-2024-023', time: '25 min ago' },
  { id: 6, type: 'published', user: 'Admin User', action: 'published', item: 'Expense Report v2.0', time: '1 hour ago' },
  { id: 7, type: 'completed', user: 'Emily Davis', action: 'completed', item: 'PO-2024-154', time: '1.5 hours ago' },
  { id: 8, type: 'assigned', user: 'System', action: 'assigned', item: 'INV-2024-088', target: 'Bob Wilson', time: '2 hours ago' },
]

// Extended user data for admin views
export const extendedUsers = [
  { ...mockUsers[0], lastActiveAt: '2024-01-25T14:30:00Z', groups: ['group-1', 'group-2'] },
  { ...mockUsers[1], lastActiveAt: '2024-01-25T15:45:00Z', groups: ['group-1'] },
  { ...mockUsers[2], lastActiveAt: '2024-01-25T12:00:00Z', groups: ['group-2'] },
  { id: 'user-4', email: 'bob@example.com', displayName: 'Bob Wilson', avatarUrl: null, role: 'user' as const, status: 'active' as const, createdAt: '2024-01-05T00:00:00Z', lastActiveAt: '2024-01-25T16:00:00Z', groups: ['group-1'] },
  { id: 'user-5', email: 'sarah@example.com', displayName: 'Sarah Chen', avatarUrl: null, role: 'user' as const, status: 'active' as const, createdAt: '2024-01-10T00:00:00Z', lastActiveAt: '2024-01-25T11:30:00Z', groups: ['group-2'] },
  { id: 'user-6', email: 'mike@example.com', displayName: 'Mike Johnson', avatarUrl: null, role: 'admin' as const, status: 'active' as const, createdAt: '2024-01-12T00:00:00Z', lastActiveAt: '2024-01-24T18:00:00Z', groups: ['group-1', 'group-2'] },
  { id: 'user-7', email: 'emily@example.com', displayName: 'Emily Davis', avatarUrl: null, role: 'user' as const, status: 'inactive' as const, createdAt: '2024-01-15T00:00:00Z', lastActiveAt: '2024-01-20T10:00:00Z', groups: [] },
]

export const groupMemberships = [
  { groupId: 'group-1', userIds: ['user-1', 'user-2', 'user-4', 'user-6'] },
  { groupId: 'group-2', userIds: ['user-1', 'user-3', 'user-5', 'user-6'] },
]

// Completed work items for history
export const completedWorkItems = [
  { id: 'completed-1', processName: 'Invoice Approval', itemId: 'INV-2024-050', completedAt: '2024-01-24T16:00:00Z', completedBy: 'John Smith', duration: '3.2h', finalStatus: 'approved' },
  { id: 'completed-2', processName: 'Purchase Request', itemId: 'PO-2024-120', completedAt: '2024-01-24T14:30:00Z', completedBy: 'Jane Doe', duration: '5.8h', finalStatus: 'approved' },
  { id: 'completed-3', processName: 'Invoice Approval', itemId: 'INV-2024-049', completedAt: '2024-01-24T11:00:00Z', completedBy: 'Sarah Chen', duration: '2.1h', finalStatus: 'rejected' },
  { id: 'completed-4', processName: 'Contract Approval', itemId: 'CONTRACT-2024-022', completedAt: '2024-01-23T17:00:00Z', completedBy: 'Admin User', duration: '24.5h', finalStatus: 'approved' },
  { id: 'completed-5', processName: 'Invoice Approval', itemId: 'INV-2024-048', completedAt: '2024-01-23T15:00:00Z', completedBy: 'Bob Wilson', duration: '1.8h', finalStatus: 'approved' },
]

// Queue data for end users
export const queueData = [
  { groupId: 'group-1', groupName: 'Approvers', queueDepth: 8, items: [
    { id: 'q-1', processName: 'Invoice Approval', itemId: 'INV-2024-091', priority: 'high', createdAt: '2024-01-25T08:00:00Z' },
    { id: 'q-2', processName: 'Invoice Approval', itemId: 'INV-2024-092', priority: 'medium', createdAt: '2024-01-25T09:30:00Z' },
    { id: 'q-3', processName: 'Purchase Request', itemId: 'PO-2024-157', priority: 'low', createdAt: '2024-01-25T10:00:00Z' },
  ]},
  { groupId: 'group-2', groupName: 'Finance Team', queueDepth: 5, items: [
    { id: 'q-4', processName: 'Budget Review', itemId: 'BUD-2024-015', priority: 'high', createdAt: '2024-01-25T07:00:00Z' },
    { id: 'q-5', processName: 'Expense Report', itemId: 'EXP-2024-089', priority: 'medium', createdAt: '2024-01-25T08:30:00Z' },
  ]},
]
