import { PrismaClient } from '../src/generated/prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
    },
  })

  const johnDoe = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      name: 'John Doe',
      role: 'user',
    },
  })

  const janeSmith = await prisma.user.upsert({
    where: { email: 'jane@example.com' },
    update: {},
    create: {
      email: 'jane@example.com',
      name: 'Jane Smith',
      role: 'user',
    },
  })

  const bobManager = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      name: 'Bob Manager',
      role: 'user',
    },
  })

  console.log('Created users:', { adminUser, johnDoe, janeSmith, bobManager })

  // Create groups
  const apClerks = await prisma.group.upsert({
    where: { id: 'ap-clerks' },
    update: {},
    create: {
      id: 'ap-clerks',
      name: 'AP Clerks',
      description: 'Accounts Payable team members',
    },
  })

  const reviewers = await prisma.group.upsert({
    where: { id: 'reviewers' },
    update: {},
    create: {
      id: 'reviewers',
      name: 'Reviewers',
      description: 'Invoice reviewers',
    },
  })

  const managers = await prisma.group.upsert({
    where: { id: 'managers' },
    update: {},
    create: {
      id: 'managers',
      name: 'Managers',
      description: 'Approval managers',
    },
  })

  console.log('Created groups:', { apClerks, reviewers, managers })

  // Add users to groups
  await prisma.userGroup.upsert({
    where: { userId_groupId: { userId: johnDoe.id, groupId: apClerks.id } },
    update: {},
    create: { userId: johnDoe.id, groupId: apClerks.id },
  })

  await prisma.userGroup.upsert({
    where: { userId_groupId: { userId: janeSmith.id, groupId: reviewers.id } },
    update: {},
    create: { userId: janeSmith.id, groupId: reviewers.id },
  })

  await prisma.userGroup.upsert({
    where: { userId_groupId: { userId: bobManager.id, groupId: managers.id } },
    update: {},
    create: { userId: bobManager.id, groupId: managers.id },
  })

  console.log('Added users to groups')

  // Create Invoice Approval process
  const invoiceProcess = await prisma.process.upsert({
    where: { id: 'invoice-approval' },
    update: {},
    create: {
      id: 'invoice-approval',
      name: 'Invoice Approval',
      description: 'Standard invoice approval workflow',
      status: 'draft',
    },
  })

  console.log('Created process:', invoiceProcess)

  // Create main workflow
  const mainWorkflow = await prisma.workflow.upsert({
    where: { id: 'invoice-main-flow' },
    update: {},
    create: {
      id: 'invoice-main-flow',
      processId: invoiceProcess.id,
      name: 'Main Flow',
      isSubflow: false,
      version: 1,
    },
  })

  console.log('Created workflow:', mainWorkflow)

  // Create tasks
  const beginTask = await prisma.task.upsert({
    where: { id: 'task-begin' },
    update: {},
    create: {
      id: 'task-begin',
      workflowId: mainWorkflow.id,
      type: 'begin',
      name: 'Start',
      position: JSON.stringify({ x: 100, y: 200 }),
      config: JSON.stringify({ type: 'begin' }),
    },
  })

  const entryTask = await prisma.task.upsert({
    where: { id: 'task-entry' },
    update: {},
    create: {
      id: 'task-entry',
      workflowId: mainWorkflow.id,
      type: 'user',
      name: 'Invoice Entry',
      position: JSON.stringify({ x: 300, y: 200 }),
      config: JSON.stringify({
        type: 'user',
        distributionMethod: 'queue',
        assignees: { type: 'group', ids: ['ap-clerks'] },
        formFields: ['invoiceNumber', 'vendor', 'amount', 'dueDate'],
        instructions: 'Enter invoice details',
      }),
    },
  })

  const reviewTask = await prisma.task.upsert({
    where: { id: 'task-review' },
    update: {},
    create: {
      id: 'task-review',
      workflowId: mainWorkflow.id,
      type: 'user',
      name: 'Review',
      position: JSON.stringify({ x: 500, y: 200 }),
      config: JSON.stringify({
        type: 'user',
        distributionMethod: 'queue',
        assignees: { type: 'group', ids: ['reviewers'] },
        formFields: ['notes'],
        instructions: 'Review the invoice for accuracy',
      }),
    },
  })

  const decisionTask = await prisma.task.upsert({
    where: { id: 'task-decision' },
    update: {},
    create: {
      id: 'task-decision',
      workflowId: mainWorkflow.id,
      type: 'decision',
      name: 'Amount Check',
      position: JSON.stringify({ x: 700, y: 200 }),
      config: JSON.stringify({
        type: 'decision',
        conditions: [
          {
            id: 'cond-1',
            routeId: 'route-to-manager',
            fieldId: 'amount',
            operator: 'gt',
            value: 5000,
            priority: 1,
          },
        ],
        defaultRouteId: 'route-to-end',
      }),
    },
  })

  const managerTask = await prisma.task.upsert({
    where: { id: 'task-manager' },
    update: {},
    create: {
      id: 'task-manager',
      workflowId: mainWorkflow.id,
      type: 'user',
      name: 'Manager Approval',
      position: JSON.stringify({ x: 900, y: 100 }),
      config: JSON.stringify({
        type: 'user',
        distributionMethod: 'manual',
        assignees: { type: 'group', ids: ['managers'] },
        formFields: ['approvalNotes'],
        instructions: 'Review and approve high-value invoice',
      }),
    },
  })

  const endTask = await prisma.task.upsert({
    where: { id: 'task-end' },
    update: {},
    create: {
      id: 'task-end',
      workflowId: mainWorkflow.id,
      type: 'end',
      name: 'Complete',
      position: JSON.stringify({ x: 1100, y: 200 }),
      config: JSON.stringify({ type: 'end' }),
    },
  })

  console.log('Created tasks')

  // Create routes
  await prisma.route.upsert({
    where: { id: 'route-begin-entry' },
    update: {},
    create: {
      id: 'route-begin-entry',
      workflowId: mainWorkflow.id,
      sourceTaskId: beginTask.id,
      targetTaskId: entryTask.id,
    },
  })

  await prisma.route.upsert({
    where: { id: 'route-entry-review' },
    update: {},
    create: {
      id: 'route-entry-review',
      workflowId: mainWorkflow.id,
      sourceTaskId: entryTask.id,
      targetTaskId: reviewTask.id,
      label: 'Submit',
    },
  })

  await prisma.route.upsert({
    where: { id: 'route-review-decision' },
    update: {},
    create: {
      id: 'route-review-decision',
      workflowId: mainWorkflow.id,
      sourceTaskId: reviewTask.id,
      targetTaskId: decisionTask.id,
      label: 'Approve',
    },
  })

  await prisma.route.upsert({
    where: { id: 'route-review-entry' },
    update: {},
    create: {
      id: 'route-review-entry',
      workflowId: mainWorkflow.id,
      sourceTaskId: reviewTask.id,
      targetTaskId: entryTask.id,
      label: 'Reject',
    },
  })

  await prisma.route.upsert({
    where: { id: 'route-to-manager' },
    update: {},
    create: {
      id: 'route-to-manager',
      workflowId: mainWorkflow.id,
      sourceTaskId: decisionTask.id,
      targetTaskId: managerTask.id,
      label: 'High Value',
      condition: JSON.stringify({ field: 'amount', operator: 'gt', value: 5000 }),
    },
  })

  await prisma.route.upsert({
    where: { id: 'route-to-end' },
    update: {},
    create: {
      id: 'route-to-end',
      workflowId: mainWorkflow.id,
      sourceTaskId: decisionTask.id,
      targetTaskId: endTask.id,
      label: 'Standard',
    },
  })

  await prisma.route.upsert({
    where: { id: 'route-manager-end' },
    update: {},
    create: {
      id: 'route-manager-end',
      workflowId: mainWorkflow.id,
      sourceTaskId: managerTask.id,
      targetTaskId: endTask.id,
      label: 'Approved',
    },
  })

  console.log('Created routes')

  // Create a test work item to demonstrate the engine
  const testInvoice = {
    invoiceNumber: 'INV-2024-001',
    vendor: 'Acme Corp',
    amount: 7500, // Above $5000 threshold for manager approval
    dueDate: '2024-02-15',
    status: 'pending',
    notes: 'Test invoice for workflow demonstration',
  }

  // Start at Invoice Entry task (after begin)
  const testWorkItem = await prisma.workItem.upsert({
    where: { id: 'test-work-item-1' },
    update: {},
    create: {
      id: 'test-work-item-1',
      workflowId: mainWorkflow.id,
      currentTaskId: entryTask.id,
      objectType: 'invoice',
      objectData: JSON.stringify(testInvoice),
      priority: 'high',
      status: 'active',
    },
  })

  // Add initial history
  await prisma.workItemHistory.upsert({
    where: { id: 'history-1' },
    update: {},
    create: {
      id: 'history-1',
      workItemId: testWorkItem.id,
      taskId: beginTask.id,
      taskName: 'Start',
      action: 'created',
      notes: 'Test invoice created',
    },
  })

  await prisma.workItemHistory.upsert({
    where: { id: 'history-2' },
    update: {},
    create: {
      id: 'history-2',
      workItemId: testWorkItem.id,
      taskId: entryTask.id,
      taskName: 'Invoice Entry',
      action: 'arrived',
    },
  })

  console.log('Created test work item:', testWorkItem.id)
  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
