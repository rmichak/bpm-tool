import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/work-items/[id] - Get work item with history and outbound routes
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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
        },
      },
    })

    if (!workItem) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 })
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
    }

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Failed to fetch work item:', error)
    return NextResponse.json({ error: 'Failed to fetch work item' }, { status: 500 })
  }
}

// PUT /api/work-items/[id] - Update work item (objectData, priority)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { objectData, priority } = body

    // Validate priority if provided
    const validPriorities = ['low', 'normal', 'high', 'urgent']
    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority. Must be one of: low, normal, high, urgent' },
        { status: 400 }
      )
    }

    // Check if work item exists
    const existing = await prisma.workItem.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 })
    }

    // Build update data
    const updateData: { objectData?: string; priority?: string } = {}
    if (objectData !== undefined) {
      updateData.objectData = JSON.stringify(objectData)
    }
    if (priority) {
      updateData.priority = priority
    }

    const workItem = await prisma.workItem.update({
      where: { id },
      data: updateData,
      include: {
        workflow: {
          select: {
            id: true,
            name: true,
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
    })

    // Parse JSON fields for response
    const parsed = {
      ...workItem,
      objectData: JSON.parse(workItem.objectData),
      currentTask: {
        ...workItem.currentTask,
        position: JSON.parse(workItem.currentTask.position),
        config: JSON.parse(workItem.currentTask.config),
      },
    }

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Failed to update work item:', error)
    return NextResponse.json({ error: 'Failed to update work item' }, { status: 500 })
  }
}
