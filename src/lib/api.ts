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

  start: (workflowId: string, data: { objectType: string; objectData: object; priority?: string }) =>
    fetch(`${API_BASE}/workflows/${workflowId}/start`, {
      method: 'POST',
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
