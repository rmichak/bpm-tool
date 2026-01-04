import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/work-items - Query work items with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const taskId = searchParams.get('taskId')
    const claimedById = searchParams.get('claimedById')

    // Build where clause with optional filters
    const where: {
      status?: string
      currentTaskId?: string
      claimedById?: string | null
    } = {}

    if (status) {
      where.status = status
    }
    if (taskId) {
      where.currentTaskId = taskId
    }
    if (claimedById) {
      // Handle 'null' string to query unclaimed items
      where.claimedById = claimedById === 'null' ? null : claimedById
    }

    const workItems = await prisma.workItem.findMany({
      where,
      include: {
        workflow: {
          select: {
            id: true,
            name: true,
            process: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        currentTask: true,
        claimedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Parse JSON fields and transform for response
    const parsed = workItems.map((item) => ({
      ...item,
      objectData: JSON.parse(item.objectData),
      currentTask: {
        ...item.currentTask,
        position: JSON.parse(item.currentTask.position),
        config: JSON.parse(item.currentTask.config),
      },
    }))

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Failed to fetch work items:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to fetch work items', details: message }, { status: 500 })
  }
}
