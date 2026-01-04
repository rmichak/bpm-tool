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

export interface DecisionCondition {
  id: string
  routeId: string
  fieldId: string
  operator: string
  value: string | number | boolean
  priority: number
}

export interface DecisionTaskConfig {
  type: 'decision'
  conditions: DecisionCondition[]
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

export type TaskConfig = DecisionTaskConfig | UserTaskConfig | Record<string, unknown>
