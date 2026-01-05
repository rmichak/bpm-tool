import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma/client'

const prisma = new PrismaClient()

const VALID_FIELD_TYPES = ['text', 'number', 'date', 'select', 'checkbox', 'textarea']

// GET /api/processes/[id]/object-types/[typeId]/fields - List all fields
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; typeId: string }> }
) {
  try {
    const { id: processId, typeId } = await params

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

    const fields = await prisma.fieldDefinition.findMany({
      where: { objectTypeId: typeId },
      orderBy: { order: 'asc' },
    })

    // Parse config JSON for each field
    const result = fields.map((f) => ({
      ...f,
      config: JSON.parse(f.config),
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to fetch fields:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fields' },
      { status: 500 }
    )
  }
}

// POST /api/processes/[id]/object-types/[typeId]/fields - Create a new field
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; typeId: string }> }
) {
  try {
    const { id: processId, typeId } = await params
    const body = await request.json()
    const { name, label, type, required, config } = body

    // Validate required fields
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Field name is required' },
        { status: 400 }
      )
    }

    if (!label || typeof label !== 'string') {
      return NextResponse.json(
        { error: 'Field label is required' },
        { status: 400 }
      )
    }

    if (!type || !VALID_FIELD_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid field type. Must be one of: ${VALID_FIELD_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

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

    // Check for duplicate field name
    const existing = await prisma.fieldDefinition.findUnique({
      where: {
        objectTypeId_name: { objectTypeId: typeId, name },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A field with this name already exists' },
        { status: 409 }
      )
    }

    // Get the next order value
    const maxOrder = await prisma.fieldDefinition.aggregate({
      where: { objectTypeId: typeId },
      _max: { order: true },
    })
    const nextOrder = (maxOrder._max.order ?? -1) + 1

    const field = await prisma.fieldDefinition.create({
      data: {
        objectTypeId: typeId,
        name,
        label,
        type,
        required: required ?? false,
        order: nextOrder,
        config: JSON.stringify(config || {}),
      },
    })

    return NextResponse.json(
      {
        ...field,
        config: JSON.parse(field.config),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to create field:', error)
    return NextResponse.json(
      { error: 'Failed to create field' },
      { status: 500 }
    )
  }
}
