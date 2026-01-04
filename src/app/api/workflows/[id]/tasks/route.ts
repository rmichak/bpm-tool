import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/workflows/[id]/tasks - List tasks
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tasks = await prisma.task.findMany({
      where: { workflowId: id },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(
      tasks.map((task) => ({
        ...task,
        position: JSON.parse(task.position),
        config: JSON.parse(task.config),
      }))
    )
  } catch (error) {
    console.error('Failed to fetch tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

// POST /api/workflows/[id]/tasks - Create task
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { type, name, position, config } = body

    if (!type || !name || !position) {
      return NextResponse.json(
        { error: 'type, name, and position are required' },
        { status: 400 }
      )
    }

    const task = await prisma.task.create({
      data: {
        workflowId: id,
        type,
        name,
        position: JSON.stringify(position),
        config: JSON.stringify(config || { type }),
      },
    })

    return NextResponse.json(
      {
        ...task,
        position: JSON.parse(task.position),
        config: JSON.parse(task.config),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to create task:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
