import { prisma } from '@/lib/prisma'
import type { Route, Task } from '@/generated/prisma/client'
import type { DecisionCondition, DecisionTaskConfig, EngineResult } from './types'

export class WorkflowEngine {
  /**
   * Starts a new workflow instance by creating a work item at the BEGIN task
   * and immediately routing to the first task.
   */
  async startWorkflow(
    workflowId: string,
    objectType: string,
    objectData: Record<string, unknown>,
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
  ): Promise<EngineResult> {
    // Find the BEGIN task for this workflow
    const beginTask = await prisma.task.findFirst({
      where: {
        workflowId,
        type: 'begin',
      },
      include: {
        outboundRoutes: {
          include: {
            targetTask: true,
          },
        },
      },
    })

    if (!beginTask) {
      return {
        success: false,
        workItemId: '',
        currentTaskId: '',
        currentTaskName: '',
        status: 'active',
        error: 'No BEGIN task found in workflow',
      }
    }

    // Create the work item at the BEGIN task
    const workItem = await prisma.workItem.create({
      data: {
        workflowId,
        currentTaskId: beginTask.id,
        objectType,
        objectData: JSON.stringify(objectData),
        status: 'active',
        priority,
        history: {
          create: {
            taskId: beginTask.id,
            taskName: beginTask.name,
            action: 'created',
            notes: `Workflow started with object type: ${objectType}`,
          },
        },
      },
    })

    // Auto-route from BEGIN to first task
    if (beginTask.outboundRoutes.length === 0) {
      return {
        success: false,
        workItemId: workItem.id,
        currentTaskId: beginTask.id,
        currentTaskName: beginTask.name,
        status: 'active',
        error: 'BEGIN task has no outbound routes',
      }
    }

    // Take the first outbound route from BEGIN
    const firstRoute = beginTask.outboundRoutes[0]
    const targetTaskId = firstRoute.targetTaskId

    // Add history entry for auto-routing from BEGIN
    await prisma.workItemHistory.create({
      data: {
        workItemId: workItem.id,
        taskId: beginTask.id,
        taskName: beginTask.name,
        action: 'auto-routed',
        routeLabel: firstRoute.label || 'default',
        notes: `Auto-routed from BEGIN to ${firstRoute.targetTask.name}`,
      },
    })

    // Move to the target task
    return this.moveToTask(workItem.id, targetTaskId)
  }

  /**
   * Moves a work item to a specific task.
   * Handles END (marks completed), DECISION (auto-evaluates), and USER (waits) tasks.
   */
  async moveToTask(workItemId: string, targetTaskId: string): Promise<EngineResult> {
    // Get the target task with its routes
    const targetTask = await prisma.task.findUnique({
      where: { id: targetTaskId },
      include: {
        outboundRoutes: {
          include: {
            targetTask: true,
          },
        },
      },
    })

    if (!targetTask) {
      const workItem = await prisma.workItem.findUnique({
        where: { id: workItemId },
        include: { currentTask: true },
      })
      return {
        success: false,
        workItemId,
        currentTaskId: workItem?.currentTaskId || '',
        currentTaskName: workItem?.currentTask.name || '',
        status: 'active',
        error: `Target task not found: ${targetTaskId}`,
      }
    }

    // Handle END task - mark workflow as completed
    if (targetTask.type === 'end') {
      const updatedWorkItem = await prisma.workItem.update({
        where: { id: workItemId },
        data: {
          currentTaskId: targetTaskId,
          status: 'completed',
          claimedById: null,
          claimedAt: null,
        },
        include: { currentTask: true },
      })

      await prisma.workItemHistory.create({
        data: {
          workItemId,
          taskId: targetTaskId,
          taskName: targetTask.name,
          action: 'completed',
          notes: 'Workflow completed',
        },
      })

      return {
        success: true,
        workItemId,
        currentTaskId: targetTaskId,
        currentTaskName: targetTask.name,
        status: 'completed',
      }
    }

    // Handle DECISION task - auto-evaluate conditions and route
    if (targetTask.type === 'decision') {
      // Update work item position first
      await prisma.workItem.update({
        where: { id: workItemId },
        data: {
          currentTaskId: targetTaskId,
          claimedById: null,
          claimedAt: null,
        },
      })

      // Get the work item's object data for condition evaluation
      const workItem = await prisma.workItem.findUnique({
        where: { id: workItemId },
      })

      if (!workItem) {
        return {
          success: false,
          workItemId,
          currentTaskId: targetTaskId,
          currentTaskName: targetTask.name,
          status: 'active',
          error: 'Work item not found',
        }
      }

      const objectData = JSON.parse(workItem.objectData) as Record<string, unknown>

      // Parse the decision task config
      let config: DecisionTaskConfig
      try {
        config = JSON.parse(targetTask.config) as DecisionTaskConfig
      } catch {
        config = { type: 'decision', conditions: [], defaultRouteId: null }
      }

      // Evaluate conditions to find the target route
      const nextRouteId = this.evaluateDecisionConditions(
        config,
        objectData,
        targetTask.outboundRoutes
      )

      if (!nextRouteId) {
        await prisma.workItemHistory.create({
          data: {
            workItemId,
            taskId: targetTaskId,
            taskName: targetTask.name,
            action: 'arrived',
            notes: 'Decision task: no matching route found',
          },
        })

        return {
          success: false,
          workItemId,
          currentTaskId: targetTaskId,
          currentTaskName: targetTask.name,
          status: 'active',
          error: 'Decision task has no matching route and no default',
        }
      }

      // Find the target task from the route
      const nextRoute = targetTask.outboundRoutes.find((r) => r.id === nextRouteId)
      if (!nextRoute) {
        return {
          success: false,
          workItemId,
          currentTaskId: targetTaskId,
          currentTaskName: targetTask.name,
          status: 'active',
          error: `Route not found: ${nextRouteId}`,
        }
      }

      // Add history entry for decision routing
      await prisma.workItemHistory.create({
        data: {
          workItemId,
          taskId: targetTaskId,
          taskName: targetTask.name,
          action: 'auto-routed',
          routeLabel: nextRoute.label || 'default',
          notes: `Decision routed via: ${nextRoute.label || 'default'}`,
        },
      })

      // Recursively move to the next task
      return this.moveToTask(workItemId, nextRoute.targetTaskId)
    }

    // Handle USER task - check for round-robin distribution
    if (targetTask.type === 'user') {
      // Update work item position first
      await prisma.workItem.update({
        where: { id: workItemId },
        data: {
          currentTaskId: targetTaskId,
          claimedById: null,
          claimedAt: null,
        },
      })

      await prisma.workItemHistory.create({
        data: {
          workItemId,
          taskId: targetTaskId,
          taskName: targetTask.name,
          action: 'arrived',
          notes: `Work item arrived at ${targetTask.type} task`,
        },
      })

      // Check for round-robin distribution
      let config: { type: string; distributionMethod?: string; assignees?: { type: string; ids: string[] } }
      try {
        config = JSON.parse(targetTask.config) as { type: string; distributionMethod?: string; assignees?: { type: string; ids: string[] } }
      } catch {
        config = { type: 'user' }
      }

      if (
        config.distributionMethod === 'round-robin' &&
        config.assignees?.type === 'group' &&
        config.assignees.ids.length > 0
      ) {
        const assignedUserId = await this.assignRoundRobin(config.assignees.ids[0])
        if (assignedUserId) {
          await prisma.workItem.update({
            where: { id: workItemId },
            data: { claimedById: assignedUserId, claimedAt: new Date() },
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

      return {
        success: true,
        workItemId,
        currentTaskId: targetTaskId,
        currentTaskName: targetTask.name,
        status: 'active',
      }
    }

    // Handle other task types - stop and wait for user action
    const updatedWorkItem = await prisma.workItem.update({
      where: { id: workItemId },
      data: {
        currentTaskId: targetTaskId,
        claimedById: null,
        claimedAt: null,
      },
      include: { currentTask: true },
    })

    await prisma.workItemHistory.create({
      data: {
        workItemId,
        taskId: targetTaskId,
        taskName: targetTask.name,
        action: 'arrived',
        notes: `Work item arrived at ${targetTask.type} task`,
      },
    })

    return {
      success: true,
      workItemId,
      currentTaskId: targetTaskId,
      currentTaskName: targetTask.name,
      status: 'active',
    }
  }

  /**
   * Releases a work item via a specific route.
   * Used when a user completes their work on a task.
   */
  async release(
    workItemId: string,
    routeLabel: string,
    userId: string
  ): Promise<EngineResult> {
    // Get the work item with its current task and routes
    const workItem = await prisma.workItem.findUnique({
      where: { id: workItemId },
      include: {
        currentTask: {
          include: {
            outboundRoutes: {
              include: {
                targetTask: true,
              },
            },
          },
        },
      },
    })

    if (!workItem) {
      return {
        success: false,
        workItemId,
        currentTaskId: '',
        currentTaskName: '',
        status: 'active',
        error: 'Work item not found',
      }
    }

    // Verify the user owns (has claimed) this work item
    if (workItem.claimedById !== userId) {
      return {
        success: false,
        workItemId,
        currentTaskId: workItem.currentTaskId,
        currentTaskName: workItem.currentTask.name,
        status: 'active',
        error: 'User does not have this work item claimed',
      }
    }

    // Find the route by label
    const route = workItem.currentTask.outboundRoutes.find(
      (r) => r.label === routeLabel || (routeLabel === 'default' && !r.label)
    )

    if (!route) {
      return {
        success: false,
        workItemId,
        currentTaskId: workItem.currentTaskId,
        currentTaskName: workItem.currentTask.name,
        status: 'active',
        error: `Route not found: ${routeLabel}`,
      }
    }

    // Add history entry for the release action
    await prisma.workItemHistory.create({
      data: {
        workItemId,
        taskId: workItem.currentTaskId,
        taskName: workItem.currentTask.name,
        action: 'released',
        routeLabel: route.label || 'default',
        userId,
        notes: `Released by user via route: ${route.label || 'default'}`,
      },
    })

    // Move to the target task
    return this.moveToTask(workItemId, route.targetTaskId)
  }

  /**
   * Evaluates decision conditions against object data and returns the matching route ID.
   * Conditions are evaluated by priority (lower number = higher priority).
   */
  private evaluateDecisionConditions(
    config: DecisionTaskConfig,
    objectData: Record<string, unknown>,
    routes: Route[]
  ): string | null {
    // Sort conditions by priority (ascending - lower number = higher priority)
    const sortedConditions = [...config.conditions].sort(
      (a, b) => a.priority - b.priority
    )

    // Evaluate each condition in priority order
    for (const condition of sortedConditions) {
      const fieldValue = this.getNestedValue(objectData, condition.fieldId)

      if (this.evaluateCondition(fieldValue, condition.operator, condition.value)) {
        // Verify the route exists in the available routes
        const matchingRoute = routes.find((r) => r.id === condition.routeId)
        if (matchingRoute) {
          return condition.routeId
        }
      }
    }

    // No condition matched, return default route if specified
    if (config.defaultRouteId) {
      const defaultRoute = routes.find((r) => r.id === config.defaultRouteId)
      if (defaultRoute) {
        return config.defaultRouteId
      }
    }

    // If no default specified, try to find a route labeled 'default' or the first route
    const defaultLabelRoute = routes.find((r) => r.label?.toLowerCase() === 'default')
    if (defaultLabelRoute) {
      return defaultLabelRoute.id
    }

    // Last resort: return first available route
    if (routes.length > 0) {
      return routes[0].id
    }

    return null
  }

  /**
   * Evaluates a single condition against a field value.
   */
  private evaluateCondition(
    fieldValue: unknown,
    operator: string,
    compareValue: string | number | boolean
  ): boolean {
    // Handle null/undefined field values
    if (fieldValue === null || fieldValue === undefined) {
      if (operator === 'eq') {
        return compareValue === null || compareValue === undefined || compareValue === ''
      }
      if (operator === 'neq') {
        return compareValue !== null && compareValue !== undefined && compareValue !== ''
      }
      return false
    }

    switch (operator) {
      case 'eq':
        return fieldValue === compareValue || String(fieldValue) === String(compareValue)

      case 'neq':
        return fieldValue !== compareValue && String(fieldValue) !== String(compareValue)

      case 'gt':
        return Number(fieldValue) > Number(compareValue)

      case 'gte':
        return Number(fieldValue) >= Number(compareValue)

      case 'lt':
        return Number(fieldValue) < Number(compareValue)

      case 'lte':
        return Number(fieldValue) <= Number(compareValue)

      case 'contains':
        return String(fieldValue)
          .toLowerCase()
          .includes(String(compareValue).toLowerCase())

      case 'startsWith':
        return String(fieldValue)
          .toLowerCase()
          .startsWith(String(compareValue).toLowerCase())

      default:
        // Unknown operator, return false
        return false
    }
  }

  /**
   * Gets a nested value from an object using dot notation.
   * e.g., getNestedValue({a: {b: 1}}, 'a.b') returns 1
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    const keys = path.split('.')
    let current: unknown = obj

    for (const key of keys) {
      if (current === null || current === undefined) {
        return undefined
      }
      if (typeof current !== 'object') {
        return undefined
      }
      current = (current as Record<string, unknown>)[key]
    }

    return current
  }

  /**
   * Assigns a work item to the next user in round-robin order within a group.
   * Tracks the last assigned user to ensure fair distribution.
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

    await prisma.group.update({
      where: { id: groupId },
      data: { lastRoundRobinUserId: nextUserId },
    })

    return nextUserId
  }
}

// Export singleton instance
export const engine = new WorkflowEngine()

// Re-export types for convenience
export * from './types'
