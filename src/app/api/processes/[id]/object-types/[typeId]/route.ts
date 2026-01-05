import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma/client'

const prisma = new PrismaClient()

// GET /api/processes/[id]/object-types/[typeId] - Get a single object type
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; typeId: string }> }
) {
  try {
    const { id: processId, typeId } = await params

    const objectType = await prisma.objectType.findFirst({
      where: {
        id: typeId,
        processId,
      },
      include: {
        fields: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!objectType) {
      return NextResponse.json(
        { error: 'Object type not found' },
        { status: 404 }
      )
    }

    // Parse config JSON for each field
    const result = {
      ...objectType,
      fields: objectType.fields.map((f) => ({
        ...f,
        config: JSON.parse(f.config),
      })),
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to fetch object type:', error)
    return NextResponse.json(
      { error: 'Failed to fetch object type' },
      { status: 500 }
    )
  }
}

// PUT /api/processes/[id]/object-types/[typeId] - Update an object type
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; typeId: string }> }
) {
  try {
    const { id: processId, typeId } = await params
    const body = await request.json()
    const { name, description } = body

    // Check if object type exists
    const existing = await prisma.objectType.findFirst({
      where: {
        id: typeId,
        processId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Object type not found' },
        { status: 404 }
      )
    }

    // Check for duplicate name if name is being changed
    if (name && name !== existing.name) {
      const duplicate = await prisma.objectType.findUnique({
        where: {
          processId_name: { processId, name },
        },
      })

      if (duplicate) {
        return NextResponse.json(
          { error: 'An object type with this name already exists' },
          { status: 409 }
        )
      }
    }

    const objectType = await prisma.objectType.update({
      where: { id: typeId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description: description || null }),
      },
      include: {
        fields: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return NextResponse.json(objectType)
  } catch (error) {
    console.error('Failed to update object type:', error)
    return NextResponse.json(
      { error: 'Failed to update object type' },
      { status: 500 }
    )
  }
}

// DELETE /api/processes/[id]/object-types/[typeId] - Delete an object type
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; typeId: string }> }
) {
  try {
    const { id: processId, typeId } = await params

    // Check if object type exists
    const existing = await prisma.objectType.findFirst({
      where: {
        id: typeId,
        processId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Object type not found' },
        { status: 404 }
      )
    }

    // Check if any work items are using this object type
    const workItemCount = await prisma.workItem.count({
      where: { objectTypeId: typeId },
    })

    if (workItemCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${workItemCount} work items are using this object type` },
        { status: 409 }
      )
    }

    await prisma.objectType.delete({
      where: { id: typeId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete object type:', error)
    return NextResponse.json(
      { error: 'Failed to delete object type' },
      { status: 500 }
    )
  }
}
