import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma/client'

const prisma = new PrismaClient()

const VALID_FIELD_TYPES = ['text', 'number', 'date', 'select', 'checkbox', 'textarea']

// PUT /api/processes/[id]/object-types/[typeId]/fields/[fieldId] - Update a field
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; typeId: string; fieldId: string }> }
) {
  try {
    const { id: processId, typeId, fieldId } = await params
    const body = await request.json()
    const { name, label, type, required, order, config } = body

    // Verify object type exists and belongs to process
    const objectType = await prisma.objectType.findFirst({
      where: {
        id: typeId,
        processId,
      },
    })

    if (!objectType) {
      return NextResponse.json(
        { error: 'Object type not found' },
        { status: 404 }
      )
    }

    // Check if field exists
    const existing = await prisma.fieldDefinition.findFirst({
      where: {
        id: fieldId,
        objectTypeId: typeId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Field not found' },
        { status: 404 }
      )
    }

    // Validate type if provided
    if (type && !VALID_FIELD_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid field type. Must be one of: ${VALID_FIELD_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    // Check for duplicate name if name is being changed
    if (name && name !== existing.name) {
      const duplicate = await prisma.fieldDefinition.findUnique({
        where: {
          objectTypeId_name: { objectTypeId: typeId, name },
        },
      })

      if (duplicate) {
        return NextResponse.json(
          { error: 'A field with this name already exists' },
          { status: 409 }
        )
      }
    }

    const field = await prisma.fieldDefinition.update({
      where: { id: fieldId },
      data: {
        ...(name && { name }),
        ...(label && { label }),
        ...(type && { type }),
        ...(required !== undefined && { required }),
        ...(order !== undefined && { order }),
        ...(config !== undefined && { config: JSON.stringify(config) }),
      },
    })

    return NextResponse.json({
      ...field,
      config: JSON.parse(field.config),
    })
  } catch (error) {
    console.error('Failed to update field:', error)
    return NextResponse.json(
      { error: 'Failed to update field' },
      { status: 500 }
    )
  }
}

// DELETE /api/processes/[id]/object-types/[typeId]/fields/[fieldId] - Delete a field
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; typeId: string; fieldId: string }> }
) {
  try {
    const { id: processId, typeId, fieldId } = await params

    // Verify object type exists and belongs to process
    const objectType = await prisma.objectType.findFirst({
      where: {
        id: typeId,
        processId,
      },
    })

    if (!objectType) {
      return NextResponse.json(
        { error: 'Object type not found' },
        { status: 404 }
      )
    }

    // Check if field exists
    const existing = await prisma.fieldDefinition.findFirst({
      where: {
        id: fieldId,
        objectTypeId: typeId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Field not found' },
        { status: 404 }
      )
    }

    await prisma.fieldDefinition.delete({
      where: { id: fieldId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete field:', error)
    return NextResponse.json(
      { error: 'Failed to delete field' },
      { status: 500 }
    )
  }
}
