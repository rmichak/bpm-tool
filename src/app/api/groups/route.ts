import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/groups - List all groups
export async function GET() {
  try {
    const groups = await prisma.group.findMany({
      include: {
        users: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(
      groups.map((group) => ({
        ...group,
        users: group.users.map((ug) => ug.user),
      }))
    )
  } catch (error) {
    console.error('Failed to fetch groups:', error)
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 })
  }
}

// POST /api/groups - Create group
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, userIds } = body

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const group = await prisma.group.create({
      data: {
        name,
        description: description || null,
        users: userIds
          ? {
              create: userIds.map((userId: string) => ({
                userId,
              })),
            }
          : undefined,
      },
      include: {
        users: {
          include: {
            user: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        ...group,
        users: group.users.map((ug) => ug.user),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to create group:', error)
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 })
  }
}
