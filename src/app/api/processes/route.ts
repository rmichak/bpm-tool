import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/processes - List all processes
export async function GET() {
  try {
    const processes = await prisma.process.findMany({
      include: {
        workflows: {
          select: {
            id: true,
            name: true,
            isSubflow: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json(processes)
  } catch (error) {
    console.error('Failed to fetch processes:', error)
    return NextResponse.json({ error: 'Failed to fetch processes' }, { status: 500 })
  }
}

// POST /api/processes - Create new process
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const process = await prisma.process.create({
      data: {
        name,
        description: description || null,
        workflows: {
          create: {
            name: 'Main Flow',
            isSubflow: false,
          },
        },
      },
      include: {
        workflows: true,
      },
    })

    return NextResponse.json(process, { status: 201 })
  } catch (error) {
    console.error('Failed to create process:', error)
    return NextResponse.json({ error: 'Failed to create process' }, { status: 500 })
  }
}
