import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma/client'

const prisma = new PrismaClient()

// GET /api/processes/[id]/object-types - List all object types for a process
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: processId } = await params

    const objectTypes = await prisma.objectType.findMany({
      where: { processId },
      include: {
        fields: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Parse config JSON for each field
    const result = objectTypes.map((ot) => ({
      ...ot,
      fields: ot.fields.map((f) => ({
        ...f,
        config: JSON.parse(f.config),
      })),
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to fetch object types:', error)
    return NextResponse.json(
      { error: 'Failed to fetch object types' },
      { status: 500 }
    )
  }
}

// POST /api/processes/[id]/object-types - Create a new object type
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: processId } = await params
    const body = await request.json()
    const { name, description } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Check if process exists
    const process = await prisma.process.findUnique({
      where: { id: processId },
    })

    if (!process) {
      return NextResponse.json(
        { error: 'Process not found' },
        { status: 404 }
      )
    }

    // Check for duplicate name
    const existing = await prisma.objectType.findUnique({
      where: {
        processId_name: { processId, name },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'An object type with this name already exists' },
        { status: 409 }
      )
    }

    const objectType = await prisma.objectType.create({
      data: {
        processId,
        name,
        description: description || null,
      },
      include: {
        fields: true,
      },
    })

    return NextResponse.json(objectType, { status: 201 })
  } catch (error) {
    console.error('Failed to create object type:', error)
    return NextResponse.json(
      { error: 'Failed to create object type' },
      { status: 500 }
    )
  }
}
