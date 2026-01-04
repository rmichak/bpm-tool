import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { engine } from '@/lib/engine'

// POST /api/work-items/[id]/release - Release work item via route
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { routeLabel, userId } = body

    // Validate required fields
    if (!routeLabel) {
      return NextResponse.json({ error: 'routeLabel is required' }, { status: 400 })
    }
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Check if work item exists
    const existing = await prisma.workItem.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 })
    }

    // Use engine to release the work item
    const result = await engine.release(id, routeLabel, userId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Fetch the updated work item with full details
    const workItem = await prisma.workItem.findUnique({
      where: { id },
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
        currentTask: {
          include: {
            outboundRoutes: {
              select: {
                id: true,
                label: true,
                targetTaskId: true,
                targetTask: {
                  select: {
                    id: true,
                    name: true,
                    type: true,
                  },
                },
              },
            },
          },
        },
        claimedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        history: {
          orderBy: { timestamp: 'desc' },
          take: 10, // Return last 10 history entries
        },
      },
    })

    if (!workItem) {
      return NextResponse.json({ error: 'Work item not found after release' }, { status: 500 })
    }

    // Parse JSON fields for response
    const parsed = {
      ...workItem,
      objectData: JSON.parse(workItem.objectData),
      currentTask: {
        ...workItem.currentTask,
        position: JSON.parse(workItem.currentTask.position),
        config: JSON.parse(workItem.currentTask.config),
      },
      engineResult: result,
    }

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Failed to release work item:', error)
    return NextResponse.json({ error: 'Failed to release work item' }, { status: 500 })
  }
}
