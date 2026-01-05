import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma/client'

const prisma = new PrismaClient()

interface TaskMetrics {
  taskId: string
  activeCount: number
  overdueCount: number
  avgWaitTime: number
  throughputPerDay: number
  oldestItemAge: number
}

// GET /api/workflows/[id]/metrics - Get real work item counts by task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workflowId } = await params

    // Verify workflow exists
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: { tasks: true },
    })

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    // Get all active work items for this workflow
    const workItems = await prisma.workItem.findMany({
      where: {
        workflowId,
        status: 'active',
      },
      select: {
        id: true,
        currentTaskId: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Define SLA threshold (4 hours)
    const SLA_HOURS = 4
    const now = new Date()
    const overdueThreshold = new Date(now.getTime() - SLA_HOURS * 60 * 60 * 1000)

    // Calculate metrics per task
    const metricsMap: Record<string, TaskMetrics> = {}

    // Initialize all tasks with zero counts
    for (const task of workflow.tasks) {
      metricsMap[task.id] = {
        taskId: task.id,
        activeCount: 0,
        overdueCount: 0,
        avgWaitTime: 0,
        throughputPerDay: 0,
        oldestItemAge: 0,
      }
    }

    // Group work items by task and calculate metrics
    const taskItems: Record<string, Array<{ createdAt: Date; updatedAt: Date }>> = {}

    for (const item of workItems) {
      const taskId = item.currentTaskId

      if (!taskItems[taskId]) {
        taskItems[taskId] = []
      }
      taskItems[taskId].push({
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })

      // Increment active count
      if (metricsMap[taskId]) {
        metricsMap[taskId].activeCount++

        // Check if overdue
        if (item.updatedAt < overdueThreshold) {
          metricsMap[taskId].overdueCount++
        }
      }
    }

    // Calculate additional metrics for each task
    for (const taskId in taskItems) {
      const items = taskItems[taskId]
      if (items.length === 0 || !metricsMap[taskId]) continue

      // Calculate average wait time (in hours)
      let totalWaitTime = 0
      let oldestAge = 0

      for (const item of items) {
        const waitTimeMs = now.getTime() - item.updatedAt.getTime()
        const waitTimeHours = waitTimeMs / (1000 * 60 * 60)
        totalWaitTime += waitTimeHours

        if (waitTimeHours > oldestAge) {
          oldestAge = waitTimeHours
        }
      }

      metricsMap[taskId].avgWaitTime = Math.round((totalWaitTime / items.length) * 10) / 10
      metricsMap[taskId].oldestItemAge = Math.round(oldestAge * 10) / 10
    }

    // Get completed items in the last 7 days for throughput calculation
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const completedHistory = await prisma.workItemHistory.findMany({
      where: {
        workItem: {
          workflowId,
        },
        action: { in: ['arrived', 'auto-routed'] },
        timestamp: { gte: sevenDaysAgo },
      },
      select: {
        taskId: true,
      },
    })

    // Count completions per task
    const completionCounts: Record<string, number> = {}
    for (const entry of completedHistory) {
      completionCounts[entry.taskId] = (completionCounts[entry.taskId] || 0) + 1
    }

    // Calculate throughput (items per day)
    for (const taskId in completionCounts) {
      if (metricsMap[taskId]) {
        metricsMap[taskId].throughputPerDay = Math.round((completionCounts[taskId] / 7) * 10) / 10
      }
    }

    return NextResponse.json(metricsMap)
  } catch (error) {
    console.error('Failed to fetch workflow metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflow metrics' },
      { status: 500 }
    )
  }
}
