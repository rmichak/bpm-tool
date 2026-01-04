import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/workflows/[id] - Get workflow with tasks and routes
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const workflow = await prisma.workflow.findUnique({
      where: { id },
      include: {
        process: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        tasks: {
          orderBy: { createdAt: 'asc' },
        },
        routes: true,
      },
    })

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    // Parse JSON fields for tasks
    const parsedWorkflow = {
      ...workflow,
      tasks: workflow.tasks.map((task) => ({
        ...task,
        position: JSON.parse(task.position),
        config: JSON.parse(task.config),
      })),
      routes: workflow.routes.map((route) => ({
        ...route,
        condition: route.condition ? JSON.parse(route.condition) : null,
      })),
    }

    return NextResponse.json(parsedWorkflow)
  } catch (error) {
    console.error('Failed to fetch workflow:', error)
    return NextResponse.json({ error: 'Failed to fetch workflow' }, { status: 500 })
  }
}

// PUT /api/workflows/[id] - Update workflow metadata
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, version } = body

    const workflow = await prisma.workflow.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(version && { version }),
      },
    })

    return NextResponse.json(workflow)
  } catch (error) {
    console.error('Failed to update workflow:', error)
    return NextResponse.json({ error: 'Failed to update workflow' }, { status: 500 })
  }
}
