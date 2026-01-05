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
      status: 'paused',
    },
  })

  console.log('Created process:', invoiceProcess)

  // Create Invoice object type with fields
  const invoiceObjectType = await prisma.objectType.upsert({
    where: { id: 'invoice-object-type' },
    update: {},
    create: {
      id: 'invoice-object-type',
      processId: invoiceProcess.id,
      name: 'Invoice',
      description: 'Invoice document for approval workflow',
    },
  })

  console.log('Created object type:', invoiceObjectType)

  // Create field definitions for Invoice
  const invoiceNumberField = await prisma.fieldDefinition.upsert({
    where: { id: 'field-invoice-number' },
    update: {},
    create: {
      id: 'field-invoice-number',
      objectTypeId: invoiceObjectType.id,
      name: 'invoiceNumber',
      label: 'Invoice Number',
      type: 'text',
      required: true,
      order: 1,
      config: JSON.stringify({ placeholder: 'INV-2024-001' }),
    },
  })

  const vendorField = await prisma.fieldDefinition.upsert({
    where: { id: 'field-vendor' },
    update: {},
    create: {
      id: 'field-vendor',
      objectTypeId: invoiceObjectType.id,
      name: 'vendor',
      label: 'Vendor Name',
      type: 'text',
      required: true,
      order: 2,
      config: JSON.stringify({ placeholder: 'Enter vendor name' }),
    },
  })

  // Amount field - used by decision task (> $5000 triggers manager approval)
  const amountField = await prisma.fieldDefinition.upsert({
    where: { id: 'field-amount' },
    update: {},
    create: {
      id: 'field-amount',
      objectTypeId: invoiceObjectType.id,
      name: 'amount',
      label: 'Amount ($)',
      type: 'number',
      required: true,
      order: 3,
      config: JSON.stringify({ min: 0, step: 0.01 }),
    },
  })

  const dueDateField = await prisma.fieldDefinition.upsert({
    where: { id: 'field-due-date' },
    update: {},
    create: {
      id: 'field-due-date',
      objectTypeId: invoiceObjectType.id,
      name: 'dueDate',
      label: 'Due Date',
      type: 'date',
      required: true,
      order: 4,
      config: JSON.stringify({}),
    },
  })

  const notesField = await prisma.fieldDefinition.upsert({
    where: { id: 'field-notes' },
    update: {},
    create: {
      id: 'field-notes',
      objectTypeId: invoiceObjectType.id,
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      required: false,
      order: 5,
      config: JSON.stringify({ placeholder: 'Additional notes...' }),
    },
  })

  const approvalNotesField = await prisma.fieldDefinition.upsert({
    where: { id: 'field-approval-notes' },
    update: {},
    create: {
      id: 'field-approval-notes',
      objectTypeId: invoiceObjectType.id,
      name: 'approvalNotes',
      label: 'Approval Notes',
      type: 'textarea',
      required: false,
      order: 6,
      config: JSON.stringify({ placeholder: 'Manager approval comments...' }),
    },
  })

  console.log('Created field definitions')

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

  // Create verification subflow
  const verificationSubflow = await prisma.workflow.upsert({
    where: { id: 'verification-subflow' },
    update: {},
    create: {
      id: 'verification-subflow',
      processId: invoiceProcess.id,
      name: 'Quick Verification',
      isSubflow: true,
      version: 1,
    },
  })

  console.log('Created subflow:', verificationSubflow)

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
      position: JSON.stringify({ x: 600, y: 200 }),
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
      position: JSON.stringify({ x: 800, y: 200 }),
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
      position: JSON.stringify({ x: 1000, y: 100 }),
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
      position: JSON.stringify({ x: 1300, y: 200 }),
      config: JSON.stringify({ type: 'end' }),
    },
  })

  // Verification task in main workflow (calls the subflow)
  const verificationTask = await prisma.task.upsert({
    where: { id: 'task-verification' },
    update: {},
    create: {
      id: 'task-verification',
      workflowId: mainWorkflow.id,
      type: 'subflow',
      name: 'Verification',
      position: JSON.stringify({ x: 400, y: 200 }),
      config: JSON.stringify({
        type: 'subflow',
        subflowId: 'verification-subflow',
      }),
    },
  })

  // Subflow tasks
  const subflowBegin = await prisma.task.upsert({
    where: { id: 'subflow-begin' },
    update: {},
    create: {
      id: 'subflow-begin',
      workflowId: verificationSubflow.id,
      type: 'begin',
      name: 'Start',
      position: JSON.stringify({ x: 100, y: 200 }),
      config: JSON.stringify({ type: 'begin' }),
    },
  })

  const subflowCheck = await prisma.task.upsert({
    where: { id: 'subflow-check' },
    update: {},
    create: {
      id: 'subflow-check',
      workflowId: verificationSubflow.id,
      type: 'user',
      name: 'Quick Check',
      position: JSON.stringify({ x: 300, y: 200 }),
      config: JSON.stringify({
        type: 'user',
        distributionMethod: 'queue',
        assignees: { type: 'group', ids: ['ap-clerks'] },
        formFields: [],
        instructions: 'Verify invoice details are complete before review.',
      }),
    },
  })

  const subflowEnd = await prisma.task.upsert({
    where: { id: 'subflow-end' },
    update: {},
    create: {
      id: 'subflow-end',
      workflowId: verificationSubflow.id,
      type: 'end',
      name: 'Complete',
      position: JSON.stringify({ x: 500, y: 200 }),
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
    where: { id: 'route-entry-verification' },
    update: {},
    create: {
      id: 'route-entry-verification',
      workflowId: mainWorkflow.id,
      sourceTaskId: entryTask.id,
      targetTaskId: verificationTask.id,
    },
  })

  await prisma.route.upsert({
    where: { id: 'route-verification-review' },
    update: {},
    create: {
      id: 'route-verification-review',
      workflowId: mainWorkflow.id,
      sourceTaskId: verificationTask.id,
      targetTaskId: reviewTask.id,
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

  // Subflow internal routes
  await prisma.route.upsert({
    where: { id: 'route-subflow-begin-check' },
    update: {},
    create: {
      id: 'route-subflow-begin-check',
      workflowId: verificationSubflow.id,
      sourceTaskId: subflowBegin.id,
      targetTaskId: subflowCheck.id,
    },
  })

  await prisma.route.upsert({
    where: { id: 'route-subflow-check-end' },
    update: {},
    create: {
      id: 'route-subflow-check-end',
      workflowId: verificationSubflow.id,
      sourceTaskId: subflowCheck.id,
      targetTaskId: subflowEnd.id,
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
      objectType: 'Invoice',
      objectTypeId: invoiceObjectType.id,
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
