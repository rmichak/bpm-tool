import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/workflows/[id]/routes - List routes
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const routes = await prisma.route.findMany({
      where: { workflowId: id },
    })

    return NextResponse.json(
      routes.map((route) => ({
        ...route,
        condition: route.condition ? JSON.parse(route.condition) : null,
      }))
    )
  } catch (error) {
    console.error('Failed to fetch routes:', error)
    return NextResponse.json({ error: 'Failed to fetch routes' }, { status: 500 })
  }
}

// POST /api/workflows/[id]/routes - Create route
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { sourceTaskId, targetTaskId, label, condition } = body

    if (!sourceTaskId || !targetTaskId) {
      return NextResponse.json(
        { error: 'sourceTaskId and targetTaskId are required' },
        { status: 400 }
      )
    }

    const route = await prisma.route.create({
      data: {
        workflowId: id,
        sourceTaskId,
        targetTaskId,
        label: label || null,
        condition: condition ? JSON.stringify(condition) : null,
      },
    })

    return NextResponse.json(
      {
        ...route,
        condition: route.condition ? JSON.parse(route.condition) : null,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to create route:', error)
    return NextResponse.json({ error: 'Failed to create route' }, { status: 500 })
  }
}
