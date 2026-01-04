/**
 * Test script for the workflow engine
 * Run with: npx tsx scripts/test-engine.ts
 */

import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { WorkflowEngine } from '../src/lib/engine'

const prisma = new PrismaClient()
const engine = new WorkflowEngine()

async function testEngine() {
  console.log('=== Workflow Engine Test ===\n')

  // Find the main workflow
  const workflow = await prisma.workflow.findFirst({
    where: { id: 'invoice-main-flow' },
  })

  if (!workflow) {
    console.error('Workflow not found. Run: npx prisma db seed')
    return
  }

  // 1. Start a new workflow with a low-value invoice (should skip manager)
  console.log('Test 1: Start workflow with low-value invoice ($3000)')
  const lowValueResult = await engine.startWorkflow(
    workflow.id,
    'invoice',
    {
      invoiceNumber: 'INV-TEST-LOW',
      vendor: 'Small Vendor',
      amount: 3000, // Below $5000 threshold
      dueDate: '2024-03-01',
    }
  )
  console.log('Result:', lowValueResult)
  console.log('')

  // Check where it landed
  const lowValueItem = await prisma.workItem.findUnique({
    where: { id: lowValueResult.workItemId },
    include: { currentTask: true, history: true },
  })
  console.log('Current task:', lowValueItem?.currentTask.name)
  console.log('History:', lowValueItem?.history.map(h => `${h.action} at ${h.taskName}`))
  console.log('')

  // 2. Start a workflow with a high-value invoice
  console.log('Test 2: Start workflow with high-value invoice ($10000)')
  const highValueResult = await engine.startWorkflow(
    workflow.id,
    'invoice',
    {
      invoiceNumber: 'INV-TEST-HIGH',
      vendor: 'Big Corp',
      amount: 10000, // Above $5000 threshold
      dueDate: '2024-03-15',
    }
  )
  console.log('Result:', highValueResult)
  console.log('')

  // 3. Test claiming and releasing
  console.log('Test 3: Claim and release the low-value item')

  // Get a test user
  const testUser = await prisma.user.findFirst({ where: { email: 'john@example.com' } })
  if (!testUser) {
    console.log('No test user found, skipping claim/release test')
    await prisma.$disconnect()
    return
  }

  // Claim the item
  await prisma.workItem.update({
    where: { id: lowValueResult.workItemId },
    data: { claimedById: testUser.id, claimedAt: new Date() },
  })
  console.log('Claimed by:', testUser.name)

  // Get current task routes
  const itemWithRoutes = await prisma.workItem.findUnique({
    where: { id: lowValueResult.workItemId },
    include: { currentTask: { include: { outboundRoutes: true } } },
  })
  console.log('Available routes:', itemWithRoutes?.currentTask.outboundRoutes.map(r => r.label))

  // Release via first available route
  const firstRoute = itemWithRoutes?.currentTask.outboundRoutes[0]
  if (firstRoute?.label) {
    const releaseResult = await engine.release(
      lowValueResult.workItemId,
      firstRoute.label,
      testUser.id
    )
    console.log('Release result:', releaseResult)
  }

  // Check new position
  const afterRelease = await prisma.workItem.findUnique({
    where: { id: lowValueResult.workItemId },
    include: { currentTask: true },
  })
  console.log('Now at task:', afterRelease?.currentTask.name)
  console.log('')

  // 4. Summary
  console.log('=== Test Summary ===')
  const allItems = await prisma.workItem.findMany({
    include: { currentTask: true },
  })
  console.log('Total work items:', allItems.length)
  allItems.forEach(item => {
    console.log(`- ${item.id.substring(0, 20)}... at "${item.currentTask.name}" (${item.status})`)
  })

  await prisma.$disconnect()
}

testEngine().catch(console.error)
