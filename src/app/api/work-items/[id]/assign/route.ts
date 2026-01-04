import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/work-items/[id]/assign - Manually assign work item to user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { userId, assignedBy } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
    }

    const workItem = await prisma.workItem.findUnique({
      where: { id },
      include: { currentTask: true },
    })

    if (!workItem) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 })
    }

    if (workItem.status !== 'active') {
      return NextResponse.json({ error: 'Work item is not active' }, { status: 400 })
    }

    if (workItem.claimedById) {
      return NextResponse.json({ error: 'Work item is already assigned' }, { status: 409 })
    }

    const updated = await prisma.workItem.update({
      where: { id },
      data: { claimedById: userId, claimedAt: new Date() },
      include: {
        workflow: { select: { id: true, name: true } },
        currentTask: true,
        claimedBy: { select: { id: true, name: true, email: true } },
      },
    })

    await prisma.workItemHistory.create({
      data: {
        workItemId: id,
        taskId: workItem.currentTaskId,
        taskName: workItem.currentTask.name,
        action: 'assigned',
        userId: assignedBy,
        notes: `Manually assigned to ${targetUser.name}`,
      },
    })

    return NextResponse.json({
      ...updated,
      objectData: JSON.parse(updated.objectData),
      currentTask: {
        ...updated.currentTask,
        position: JSON.parse(updated.currentTask.position),
        config: JSON.parse(updated.currentTask.config),
      },
    })
  } catch (error) {
    console.error('Failed to assign work item:', error)
    return NextResponse.json({ error: 'Failed to assign work item' }, { status: 500 })
  }
}
