import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/groups/[id]/users - Get users in a group
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        users: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    const users = group.users.map((ug) => ug.user)
    return NextResponse.json(users)
  } catch (error) {
    console.error('Failed to fetch group users:', error)
    return NextResponse.json({ error: 'Failed to fetch group users' }, { status: 500 })
  }
}
