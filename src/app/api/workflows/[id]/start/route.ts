import { NextRequest, NextResponse } from 'next/server'
import { engine } from '@/lib/engine'

// POST /api/workflows/[id]/start - Start a new work item
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workflowId } = await params
    const body = await request.json()
    const { objectType, objectData, priority, objectTypeId } = body

    if (!objectType || !objectData) {
      return NextResponse.json(
        { error: 'objectType and objectData are required' },
        { status: 400 }
      )
    }

    const result = await engine.startWorkflow(
      workflowId,
      objectType,
      objectData,
      priority || 'normal',
      objectTypeId
    )

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Failed to start workflow:', error)
    return NextResponse.json(
      { error: 'Failed to start workflow' },
      { status: 500 }
    )
  }
}
