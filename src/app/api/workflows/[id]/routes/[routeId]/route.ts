import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/workflows/[id]/routes/[routeId] - Get single route
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; routeId: string }> }
) {
  try {
    const { routeId } = await params
    const route = await prisma.route.findUnique({
      where: { id: routeId },
    })

    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...route,
      condition: route.condition ? JSON.parse(route.condition) : null,
    })
  } catch (error) {
    console.error('Failed to fetch route:', error)
    return NextResponse.json({ error: 'Failed to fetch route' }, { status: 500 })
  }
}

// PUT /api/workflows/[id]/routes/[routeId] - Update route
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; routeId: string }> }
) {
  try {
    const { routeId } = await params
    const body = await request.json()
    const { label, condition } = body

    const route = await prisma.route.update({
      where: { id: routeId },
      data: {
        ...(label !== undefined && { label }),
        ...(condition !== undefined && {
          condition: condition ? JSON.stringify(condition) : null,
        }),
      },
    })

    return NextResponse.json({
      ...route,
      condition: route.condition ? JSON.parse(route.condition) : null,
    })
  } catch (error) {
    console.error('Failed to update route:', error)
    return NextResponse.json({ error: 'Failed to update route' }, { status: 500 })
  }
}

// DELETE /api/workflows/[id]/routes/[routeId] - Delete route
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; routeId: string }> }
) {
  try {
    const { routeId } = await params
    await prisma.route.delete({
      where: { id: routeId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete route:', error)
    return NextResponse.json({ error: 'Failed to delete route' }, { status: 500 })
  }
}
