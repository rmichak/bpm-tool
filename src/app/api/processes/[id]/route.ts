import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/processes/[id] - Get process with workflows
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const process = await prisma.process.findUnique({
      where: { id },
      include: {
        workflows: {
          include: {
            tasks: true,
            routes: true,
          },
        },
      },
    })

    if (!process) {
      return NextResponse.json({ error: 'Process not found' }, { status: 404 })
    }

    return NextResponse.json(process)
  } catch (error) {
    console.error('Failed to fetch process:', error)
    return NextResponse.json({ error: 'Failed to fetch process' }, { status: 500 })
  }
}

// PUT /api/processes/[id] - Update process
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, status } = body

    const process = await prisma.process.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
      },
      include: {
        workflows: true,
      },
    })

    return NextResponse.json(process)
  } catch (error) {
    console.error('Failed to update process:', error)
    return NextResponse.json({ error: 'Failed to update process' }, { status: 500 })
  }
}

// DELETE /api/processes/[id] - Delete process (only if draft)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const process = await prisma.process.findUnique({
      where: { id },
    })

    if (!process) {
      return NextResponse.json({ error: 'Process not found' }, { status: 404 })
    }

    if (process.status !== 'draft') {
      return NextResponse.json(
        { error: 'Can only delete draft processes' },
        { status: 400 }
      )
    }

    await prisma.process.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete process:', error)
    return NextResponse.json({ error: 'Failed to delete process' }, { status: 500 })
  }
}
