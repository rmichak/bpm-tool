export interface StartWorkflowResult {
  success: boolean
  workItemId: string
  currentTaskId: string
  currentTaskName: string
  status: 'active' | 'completed'
  error?: string
}

export interface WorkItemListItem {
  id: string
  status: string
  priority: string
  objectType: string
  objectData: Record<string, unknown>
  claimedById: string | null
  claimedAt: string | null
  createdAt: string
  updatedAt: string
  currentTask: {
    id: string
    name: string
    type: string
    config: Record<string, unknown>
    position: { x: number; y: number }
  }
  workflow: {
    id: string
    name: string
    process: {
      id: string
      name: string
    }
  }
  claimedBy: {
    id: string
    name: string
    email: string
  } | null
}

export interface OutboundRoute {
  id: string
  label: string | null
  targetTaskId: string
  targetTask: {
    id: string
    name: string
    type: string
  }
}

export interface HistoryEntry {
  id: string
  taskId: string
  taskName: string
  action: string
  routeLabel: string | null
  userId: string | null
  notes: string | null
  timestamp: string
}

export interface WorkItemDetail extends WorkItemListItem {
  currentTask: WorkItemListItem['currentTask'] & {
    outboundRoutes: OutboundRoute[]
  }
  history: HistoryEntry[]
}

export const workItemApi = {
  async list(params?: {
    status?: string
    claimedById?: string | null
  }): Promise<WorkItemListItem[]> {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    if (params?.claimedById !== undefined) {
      searchParams.set('claimedById', params.claimedById === null ? 'null' : params.claimedById)
    }
    const res = await fetch(`/api/work-items?${searchParams}`)
    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(error.details || error.error || 'Failed to fetch work items')
    }
    return res.json()
  },

  async get(id: string): Promise<WorkItemDetail> {
    const res = await fetch(`/api/work-items/${id}`)
    if (!res.ok) throw new Error('Failed to fetch work item')
    return res.json()
  },

  async claim(id: string, userId: string): Promise<WorkItemListItem> {
    const res = await fetch(`/api/work-items/${id}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to claim work item')
    }
    return res.json()
  },

  async unclaim(id: string): Promise<WorkItemListItem> {
    const res = await fetch(`/api/work-items/${id}/claim`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to unclaim work item')
    }
    return res.json()
  },

  async release(
    id: string,
    routeLabel: string,
    userId: string
  ): Promise<WorkItemDetail> {
    const res = await fetch(`/api/work-items/${id}/release`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ routeLabel, userId }),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to release work item')
    }
    return res.json()
  },

  async update(
    id: string,
    data: { objectData?: Record<string, unknown>; priority?: string }
  ): Promise<WorkItemListItem> {
    const res = await fetch(`/api/work-items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to update work item')
    }
    return res.json()
  },

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
  },

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
  },
}
