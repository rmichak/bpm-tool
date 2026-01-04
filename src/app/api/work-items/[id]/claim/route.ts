import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/work-items/[id]/claim - Claim a work item
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Verify user exists first
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Atomic claim: only update if item exists, is active, and not already claimed
    // This prevents race conditions where two requests could both pass a check-then-update
    const result = await prisma.workItem.updateMany({
      where: {
        id,
        status: 'active',
        claimedById: null,
      },
      data: {
        claimedById: userId,
        claimedAt: new Date(),
      },
    })

    // If no rows updated, determine why and return appropriate error
    if (result.count === 0) {
      const existing = await prisma.workItem.findUnique({
        where: { id },
      })

      if (!existing) {
        return NextResponse.json({ error: 'Work item not found' }, { status: 404 })
      }

      if (existing.status !== 'active') {
        return NextResponse.json(
          { error: 'Cannot claim a work item that is not active' },
          { status: 400 }
        )
      }

      // Item exists and is active, so it must already be claimed
      return NextResponse.json(
        { error: 'Work item is already claimed' },
        { status: 409 }
      )
    }

    // Claim succeeded, fetch the full item for response and history
    const workItem = await prisma.workItem.findUnique({
      where: { id },
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

    // Create history entry for claim action
    await prisma.workItemHistory.create({
      data: {
        workItemId: id,
        taskId: workItem!.currentTaskId,
        taskName: workItem!.currentTask.name,
        action: 'claimed',
        userId,
        notes: `Claimed by ${user.name}`,
      },
    })

    // Parse JSON fields for response
    const parsed = {
      ...workItem,
      objectData: JSON.parse(workItem!.objectData),
      currentTask: {
        ...workItem!.currentTask,
        position: JSON.parse(workItem!.currentTask.position),
        config: JSON.parse(workItem!.currentTask.config),
      },
    }

    return NextResponse.json(parsed, { status: 201 })
  } catch (error) {
    console.error('Failed to claim work item:', error)
    return NextResponse.json({ error: 'Failed to claim work item' }, { status: 500 })
  }
}

// DELETE /api/work-items/[id]/claim - Unclaim a work item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if work item exists and is claimed
    const existing = await prisma.workItem.findUnique({
      where: { id },
      include: {
        currentTask: true,
        claimedBy: true,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 })
    }

    if (!existing.claimedById) {
      return NextResponse.json(
        { error: 'Work item is not claimed' },
        { status: 400 }
      )
    }

    const previousClaimant = existing.claimedBy

    // Unclaim the work item
    const workItem = await prisma.workItem.update({
      where: { id },
      data: {
        claimedById: null,
        claimedAt: null,
      },
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

    // Create history entry for unclaim action
    await prisma.workItemHistory.create({
      data: {
        workItemId: id,
        taskId: existing.currentTaskId,
        taskName: existing.currentTask.name,
        action: 'unclaimed',
        userId: existing.claimedById,
        notes: `Unclaimed by ${previousClaimant?.name || 'unknown'}`,
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
    console.error('Failed to unclaim work item:', error)
    return NextResponse.json({ error: 'Failed to unclaim work item' }, { status: 500 })
  }
}
