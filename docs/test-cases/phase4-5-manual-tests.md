# Phase 4-5 Manual Test Cases

Step-by-step test cases for Distribution Methods (Phase 4) and Start Workflow UI (Phase 5).

---

## Prerequisites

Before running these tests, ensure:
1. Development server is running: `npm run dev`
2. Database is seeded with test data: `npx prisma db seed`
3. Browser is open to `http://localhost:3000`

---

## Phase 4: Distribution Methods

### Test Case 4.1: Queue Distribution (Default)

**Goal:** Verify items with queue distribution appear in "Available" tab for self-service claiming.

**Steps:**

1. **Login as Admin**
   - Navigate to the application
   - Switch to "Admin View" using the role switcher in the header
   - Go to Processes page

2. **Create a test workflow with queue distribution**
   - Create or edit a process with a USER task
   - Set the task config to:
     ```json
     {
       "type": "user",
       "distributionMethod": "queue",
       "assignees": { "type": "group", "ids": ["<group-id>"] }
     }
     ```
   - Save the workflow

3. **Start a workflow**
   - Switch to "User View"
   - Go to Inbasket page
   - Click "New Work Item" button
   - Select the workflow with queue distribution
   - Enter object type: `test-queue`
   - Add a field: `testId` = `queue-001`
   - Click "Start Workflow"

4. **Verify queue behavior**
   - [ ] Toast shows "Workflow Started" with task name
   - [ ] Check "Available" tab - new item should appear
   - [ ] Item should NOT be in "My Work" tab (not claimed)
   - [ ] Click "Claim" button on the item
   - [ ] Item moves to "My Work" tab
   - [ ] Item no longer in "Available" tab

**Expected Result:** Work item appears in Available tab, user can claim it, claimed item appears in My Work.

---

### Test Case 4.2: Round-Robin Distribution

**Goal:** Verify items with round-robin distribution are auto-assigned to users in rotation.

**Steps:**

1. **Setup test workflow**
   - As Admin, create/edit a process with a USER task
   - Set the task config to:
     ```json
     {
       "type": "user",
       "distributionMethod": "round-robin",
       "assignees": { "type": "group", "ids": ["<group-id>"] }
     }
     ```
   - Ensure the group has at least 2 users

2. **Start multiple workflows**
   - Switch to "User View"
   - Start workflow 3 times with different objectData:
     - `testId` = `rr-001`
     - `testId` = `rr-002`
     - `testId` = `rr-003`

3. **Verify round-robin assignment**
   - [ ] Each work item should be auto-assigned (not in "Available" tab)
   - [ ] Check different users' "My Work" tabs
   - [ ] Items should be distributed across users in the group
   - [ ] Open work item detail - history should show "auto-assigned" action

4. **Verify rotation tracking**
   - Check database: `npx prisma studio`
   - [ ] Group's `lastRoundRobinUserId` should update after each assignment

**Expected Result:** Work items are auto-assigned to different users in rotation, history shows "auto-assigned".

---

### Test Case 4.3: Manual Distribution (Supervisor Assignment)

**Goal:** Verify items with manual distribution appear in "To Assign" tab for supervisor assignment.

**Steps:**

1. **Setup test workflow**
   - As Admin, create/edit a process with a USER task
   - Set the task config to:
     ```json
     {
       "type": "user",
       "distributionMethod": "manual",
       "assignees": { "type": "group", "ids": ["<group-id>"] }
     }
     ```

2. **Start a workflow**
   - Switch to "User View"
   - Start workflow with:
     - Object type: `test-manual`
     - `testId` = `manual-001`

3. **Verify supervisor view**
   - [ ] Item appears in "To Assign" tab
   - [ ] Item has "Manual Assignment" badge
   - [ ] Item does NOT appear in "Available" tab
   - [ ] "Assign" button is visible on the item

4. **Assign the work item**
   - Click "Assign" button
   - [ ] Dialog opens showing group users
   - Select a user from the list
   - [ ] Dialog closes after selection
   - [ ] Toast shows "Item Assigned"
   - [ ] Item moves to assigned user's "My Work" tab
   - [ ] Item no longer in "To Assign" tab

5. **Verify history**
   - Open the work item detail
   - [ ] History shows "assigned" action with supervisor's name

**Expected Result:** Manual distribution items appear in To Assign tab, supervisor can assign to users.

---

## Phase 5: Start Workflow UI

### Test Case 5.1: Open Start Workflow Dialog

**Goal:** Verify the Start Workflow dialog opens and loads available workflows.

**Steps:**

1. Navigate to Inbasket page (`/inbox`)
2. [ ] "New Work Item" button is visible in the header
3. Click "New Work Item" button
4. [ ] Dialog opens with title "Start New Workflow"
5. [ ] Loading spinner appears briefly
6. [ ] Available workflows are listed

**Expected Result:** Dialog opens and shows available workflows.

---

### Test Case 5.2: Select Workflow and Enter Data

**Goal:** Verify workflow selection and data entry works correctly.

**Steps:**

1. Open Start Workflow dialog
2. **Select a workflow**
   - [ ] Clicking a workflow highlights it with primary border
   - [ ] Only one workflow can be selected at a time

3. **Enter object type**
   - [ ] Default is "document"
   - [ ] Change to "invoice"

4. **Select priority**
   - [ ] Default is "Normal"
   - [ ] Dropdown shows: Low, Normal, High, Urgent

5. **Add object data fields**
   - Click "Add Field" button
   - [ ] New key-value row appears
   - Enter: `invoiceNumber` = `INV-2024-001`
   - Click "Add Field" again
   - Enter: `amount` = `5000`
   - Enter: `vendor` = `Acme Corp`

6. **Remove a field**
   - [ ] Trash icon appears when more than 1 field
   - Click trash icon on a field
   - [ ] Field is removed

**Expected Result:** Can select workflow, enter object data, add/remove fields.

---

### Test Case 5.3: Start Workflow Successfully

**Goal:** Verify workflow starts and work item is created.

**Steps:**

1. Open Start Workflow dialog
2. Select a workflow
3. Enter object data:
   - Object type: `test-item`
   - Priority: `high`
   - Fields: `testId` = `success-001`

4. Click "Start Workflow" button
   - [ ] Button shows loading spinner
   - [ ] Dialog closes automatically
   - [ ] Toast shows "Workflow Started" with task name

5. **Verify work item created**
   - [ ] New work item appears in Inbasket (My Work or Available depending on distribution)
   - Click on the work item
   - [ ] Object data shows the entered values
   - [ ] Priority shows "High"
   - [ ] History shows "created" action

**Expected Result:** Workflow starts, work item created with correct data.

---

### Test Case 5.4: Cancel Start Workflow

**Goal:** Verify canceling the dialog works correctly.

**Steps:**

1. Open Start Workflow dialog
2. Select a workflow and enter some data
3. Click "Cancel" button
4. [ ] Dialog closes
5. [ ] No toast notification
6. [ ] No new work item created

**Expected Result:** Dialog closes without creating a work item.

---

### Test Case 5.5: No Active Workflows Available

**Goal:** Verify proper handling when no workflows are available.

**Steps:**

1. (Setup) Deactivate all processes in Admin
2. Open Start Workflow dialog
3. [ ] Message shows "No active workflows available"
4. [ ] Start button is disabled

**Expected Result:** Empty state is shown when no workflows available.

---

### Test Case 5.6: Start Workflow Error Handling

**Goal:** Verify errors are handled gracefully.

**Steps:**

1. Open Start Workflow dialog
2. Select a workflow
3. (Simulate error by disconnecting network or stopping server)
4. Click "Start Workflow"
5. [ ] Error toast appears with message
6. [ ] Dialog remains open for retry
7. [ ] Button re-enables after error

**Expected Result:** Errors shown in toast, dialog stays open for retry.

---

## Integration Tests

### Test Case INT-1: Complete Workflow Flow

**Goal:** Verify end-to-end workflow from start to completion.

**Steps:**

1. **Start a new workflow**
   - Click "New Work Item"
   - Select workflow with multiple user tasks
   - Enter object data
   - Start workflow

2. **Work through the workflow**
   - Find item in My Work or Available
   - Claim if needed
   - Open work item detail
   - Complete task by selecting a route
   - [ ] Item moves to next task
   - Repeat until workflow completes

3. **Verify completion**
   - [ ] Work item status changes to "completed"
   - [ ] History shows all actions taken

**Expected Result:** Can start workflow, work through all tasks, complete successfully.

---

### Test Case INT-2: Mixed Distribution Methods

**Goal:** Verify workflow with different distribution methods at each step.

**Steps:**

1. **Setup workflow**
   - Task 1: `distributionMethod: "queue"` - User claims
   - Task 2: `distributionMethod: "round-robin"` - Auto-assigned
   - Task 3: `distributionMethod: "manual"` - Supervisor assigns

2. **Start workflow and process**
   - Start workflow
   - [ ] Item in Available (queue)
   - Claim and complete Task 1
   - [ ] Item auto-assigned to next user (round-robin)
   - Complete Task 2 as that user
   - [ ] Item in To Assign tab (manual)
   - Assign and complete Task 3

**Expected Result:** Each distribution method works correctly in sequence.

---

## Quick Verification Checklist

Use this for smoke testing after deployments:

- [ ] Inbasket page loads
- [ ] "New Work Item" button visible
- [ ] Start dialog opens and shows workflows
- [ ] Can start a workflow with data
- [ ] Work item appears in correct tab
- [ ] Can claim items from Available
- [ ] Can assign items from To Assign
- [ ] Work item detail page loads
- [ ] History shows all actions
