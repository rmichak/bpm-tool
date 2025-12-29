# Tasks: BPM Workflow Builder

**Input**: Design documents from `/specs/001-bpm-workflow-builder/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are NOT included (not explicitly requested in specification). Add test tasks if TDD approach is desired.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md, this is a Next.js App Router project:
- Source: `src/`
- Routes: `src/app/`
- Components: `src/components/`
- Types: `src/types/`
- Hooks: `src/hooks/`
- Mock data: `src/lib/mock-data/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize Next.js project with core dependencies

- [ ] T001 Create Next.js 14 project with TypeScript and App Router at repository root
- [ ] T002 Install core dependencies: React Flow (@xyflow/react), Tailwind CSS, @dnd-kit/core, Zustand, React Hook Form, Zod
- [ ] T003 [P] Initialize shadcn/ui and install base components (button, card, input, select, dialog, form) in src/components/ui/
- [ ] T004 [P] Configure Tailwind CSS with custom theme in tailwind.config.ts
- [ ] T005 [P] Create global styles in src/styles/globals.css
- [ ] T006 [P] Configure ESLint and Prettier for TypeScript/React

**Checkpoint**: Project builds and runs with `npm run dev`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Type Definitions

- [ ] T007 [P] Create Process types in src/types/process.ts (Process, ProcessStatus, ProcessDetail)
- [ ] T008 [P] Create Workflow types in src/types/workflow.ts (Workflow, WorkflowDetail)
- [ ] T009 [P] Create Task types in src/types/task.ts (Task, TaskType, TaskConfig variants, Position)
- [ ] T010 [P] Create Route types in src/types/route.ts (Route)
- [ ] T011 [P] Create FieldDefinition types in src/types/field.ts (FieldDefinition, FieldType, FieldConfig)
- [ ] T012 [P] Create WorkItem types in src/types/work-item.ts (WorkItem, WorkItemStatus, AssignmentInfo)
- [ ] T013 [P] Create User and Group types in src/types/user.ts (User, Group, GroupMembership)
- [ ] T014 Create shared index barrel export in src/types/index.ts

### Mock Data Infrastructure

- [ ] T015 [P] Create mock users data in src/lib/mock-data/users.ts
- [ ] T016 [P] Create mock groups data in src/lib/mock-data/groups.ts
- [ ] T017 [P] Create mock processes data in src/lib/mock-data/processes.ts
- [ ] T018 [P] Create mock workflows data with sample tasks/routes in src/lib/mock-data/workflows.ts
- [ ] T019 [P] Create mock work items data in src/lib/mock-data/work-items.ts
- [ ] T020 Create mock data index with simulated async functions in src/lib/mock-data/index.ts

### Shared Layout & Navigation

- [ ] T021 Create root layout with providers in src/app/layout.tsx
- [ ] T022 [P] Create shared Header component in src/components/shared/Header.tsx
- [ ] T023 [P] Create shared Sidebar navigation in src/components/shared/Sidebar.tsx
- [ ] T024 Create landing page with navigation to inbox/builder in src/app/page.tsx

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Administrator Creates a Workflow (Priority: P1) 🎯 MVP

**Goal**: Visual drag-and-drop workflow designer with task palette and route connections

**Independent Test**: Admin can create a workflow with Begin → User Task → End, connect tasks, and save

### Workflow Builder Components

- [ ] T025 [P] [US1] Create BeginNode custom node component in src/components/builder/nodes/BeginNode.tsx
- [ ] T026 [P] [US1] Create EndNode custom node component in src/components/builder/nodes/EndNode.tsx
- [ ] T027 [P] [US1] Create UserTaskNode custom node component in src/components/builder/nodes/UserTaskNode.tsx
- [ ] T028 [P] [US1] Create DecisionNode custom node component in src/components/builder/nodes/DecisionNode.tsx
- [ ] T029 [P] [US1] Create BroadcastNode custom node component in src/components/builder/nodes/BroadcastNode.tsx
- [ ] T030 [P] [US1] Create RendezvousNode custom node component in src/components/builder/nodes/RendezvousNode.tsx
- [ ] T031 Create node types registry in src/components/builder/nodes/index.ts
- [ ] T032 [P] [US1] Create RouteEdge custom edge component in src/components/builder/RouteEdge.tsx
- [ ] T033 [P] [US1] Create TaskPalette with draggable task types in src/components/builder/TaskPalette.tsx

### Canvas & State Management

- [ ] T034 [US1] Create useWorkflow hook with Zustand store in src/hooks/useWorkflow.ts
- [ ] T035 [US1] Create workflow validation utility in src/lib/utils/validate-workflow.ts
- [ ] T036 [US1] Create Canvas component with React Flow in src/components/builder/Canvas.tsx
- [ ] T037 [US1] Implement drag-from-palette-to-canvas with @dnd-kit in src/components/builder/Canvas.tsx

### Task Configuration

- [ ] T038 [P] [US1] Create TaskConfigPanel component in src/components/builder/TaskConfigPanel.tsx
- [ ] T039 [US1] Create DecisionConditionEditor in src/components/builder/config/DecisionConditionEditor.tsx

### Builder Pages

- [ ] T040 [US1] Create workflow list page in src/app/builder/page.tsx
- [ ] T041 [US1] Create workflow editor page in src/app/builder/[workflowId]/page.tsx
- [ ] T042 [US1] Add loading.tsx for builder routes in src/app/builder/loading.tsx

### Save & Validation

- [ ] T043 [US1] Implement save workflow with validation feedback in src/components/builder/Canvas.tsx
- [ ] T044 [US1] Create ValidationMessages component to display errors/warnings in src/components/builder/ValidationMessages.tsx

**Checkpoint**: Admin can create, edit, and save workflows with all 6 task types

---

## Phase 4: User Story 2 - Administrator Configures Dynamic Form Fields (Priority: P2)

**Goal**: Admin can define custom fields per process that appear in work items

**Independent Test**: Configure fields for a process (text, date, number), verify they appear on work item form

### Field Configuration Components

- [ ] T045 [P] [US2] Create FieldDefinitionList component in src/components/builder/fields/FieldDefinitionList.tsx
- [ ] T046 [P] [US2] Create FieldDefinitionCard component in src/components/builder/fields/FieldDefinitionCard.tsx
- [ ] T047 [US2] Create AddFieldDialog component in src/components/builder/fields/AddFieldDialog.tsx
- [ ] T048 [US2] Create FieldConfigEditor component with type-specific options in src/components/builder/fields/FieldConfigEditor.tsx

### Field Management Hooks

- [ ] T049 [US2] Create useFieldDefinitions hook in src/hooks/useFieldDefinitions.ts
- [ ] T050 [US2] Implement field reordering with drag-drop in src/components/builder/fields/FieldDefinitionList.tsx

### Process Configuration UI

- [ ] T051 [US2] Create ProcessConfigTabs component (Workflow | Fields) in src/components/builder/ProcessConfigTabs.tsx
- [ ] T052 [US2] Integrate field configuration into builder page in src/app/builder/[workflowId]/page.tsx

**Checkpoint**: Admin can add, edit, reorder, and remove field definitions for a process

---

## Phase 5: User Story 3 - User Processes Their Assigned Work (Priority: P3)

**Goal**: Users view inbox, open work items, fill dynamic fields, and complete tasks

**Independent Test**: User sees assigned work item, opens it, fills fields, clicks complete, item routes to next task

### Inbox Components

- [ ] T053 [P] [US3] Create WorkQueue component in src/components/inbox/WorkQueue.tsx
- [ ] T054 [P] [US3] Create WorkItemCard component in src/components/inbox/WorkItemCard.tsx
- [ ] T055 [P] [US3] Create WorkItemFilters component in src/components/inbox/WorkItemFilters.tsx

### Work Item Detail Components

- [ ] T056 [US3] Create DynamicFormField component for each field type in src/components/inbox/DynamicFormField.tsx
- [ ] T057 [US3] Create WorkItemForm component with React Hook Form + Zod in src/components/inbox/WorkItemForm.tsx
- [ ] T058 [US3] Create WorkItemActions component (Complete button) in src/components/inbox/WorkItemActions.tsx
- [ ] T059 [US3] Create WorkItemHeader with process/task info in src/components/inbox/WorkItemHeader.tsx

### Work Item Hooks

- [ ] T060 [US3] Create useWorkItems hook for inbox list in src/hooks/useWorkItems.ts
- [ ] T061 [US3] Create useWorkItem hook for single item with actions in src/hooks/useWorkItem.ts

### Routing Logic

- [ ] T062 [US3] Create routing engine utility in src/lib/utils/route-work-item.ts
- [ ] T063 [US3] Implement complete action with routing in src/hooks/useWorkItem.ts

### Inbox Pages

- [ ] T064 [US3] Create inbox list page in src/app/inbox/page.tsx
- [ ] T065 [US3] Create work item detail page in src/app/inbox/[itemId]/page.tsx
- [ ] T066 [US3] Add loading.tsx for inbox routes in src/app/inbox/loading.tsx

**Checkpoint**: User can view inbox, open work item, fill fields, complete task, see item route to next task

---

## Phase 6: User Story 4 - Administrator Assigns Users and Groups to Tasks (Priority: P4)

**Goal**: Admin assigns users/groups to User Tasks; work appears in assignee queues

**Independent Test**: Assign a group to User Task, create work item, verify group members see it in queue

### Assignment UI Components

- [ ] T067 [P] [US4] Create UserPicker component in src/components/builder/assignment/UserPicker.tsx
- [ ] T068 [P] [US4] Create GroupPicker component in src/components/builder/assignment/GroupPicker.tsx
- [ ] T069 [US4] Create AssignmentEditor component in src/components/builder/assignment/AssignmentEditor.tsx

### Group Queue Components

- [ ] T070 [US4] Create GroupQueueBadge component in src/components/inbox/GroupQueueBadge.tsx
- [ ] T071 [US4] Implement claim/release actions in src/hooks/useWorkItem.ts
- [ ] T072 [US4] Add claim button to WorkItemActions in src/components/inbox/WorkItemActions.tsx

### Assignment Integration

- [ ] T073 [US4] Integrate AssignmentEditor into UserTaskNode config in src/components/builder/TaskConfigPanel.tsx
- [ ] T074 [US4] Filter inbox by assignment (user/group) in src/hooks/useWorkItems.ts

**Checkpoint**: Admin assigns users/groups to tasks; users see group queue items and can claim them

---

## Phase 7: User Story 5 - System Executes Automated Tasks (Priority: P5)

**Goal**: Decision tasks auto-route based on criteria; Broadcast/Rendezvous split/merge work

**Independent Test**: Create workflow with Decision node, submit work item, verify auto-routing based on field value

### Decision Evaluation

- [ ] T075 [US5] Create decision evaluator utility in src/lib/utils/evaluate-decision.ts
- [ ] T076 [US5] Integrate decision evaluation into routing engine in src/lib/utils/route-work-item.ts

### Broadcast/Rendezvous Logic

- [ ] T077 [US5] Implement Broadcast task handling (create parallel work items) in src/lib/utils/route-work-item.ts
- [ ] T078 [US5] Implement Rendezvous task handling (wait/merge logic) in src/lib/utils/route-work-item.ts

### Auto-Processing Simulation

- [ ] T079 [US5] Create useAutoProcessor hook to simulate background processing in src/hooks/useAutoProcessor.ts
- [ ] T080 [US5] Add auto-process trigger on work item completion in src/hooks/useWorkItem.ts

### Status Visibility

- [ ] T081 [US5] Create WorkItemHistory component in src/components/inbox/WorkItemHistory.tsx
- [ ] T082 [US5] Display routing history in work item detail in src/app/inbox/[itemId]/page.tsx

**Checkpoint**: Automated tasks (Decision, Broadcast, Rendezvous) execute without user intervention

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T083 [P] Add keyboard shortcuts for workflow builder (delete, undo/redo, select all) in src/components/builder/Canvas.tsx
- [ ] T084 [P] Add empty states for inbox and builder lists in src/components/shared/EmptyState.tsx
- [ ] T085 [P] Add error boundary component in src/components/shared/ErrorBoundary.tsx
- [ ] T086 [P] Add toast notifications for save/complete actions in src/components/shared/Toast.tsx
- [ ] T087 Implement undo/redo for workflow changes in src/hooks/useWorkflow.ts
- [ ] T088 Add minimap to workflow canvas in src/components/builder/Canvas.tsx
- [ ] T089 Add responsive layout adjustments for tablet in src/app/layout.tsx
- [ ] T090 Run quickstart.md validation - verify all documented flows work

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3-7 (User Stories) → Phase 8 (Polish)
                                               ↓
                              Can run in priority order OR in parallel
```

- **Setup (Phase 1)**: No dependencies - start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational completion
  - **US1 (Workflow Builder)**: Independent - no story dependencies
  - **US2 (Dynamic Fields)**: Independent - can parallel with US1
  - **US3 (User Inbox)**: Best after US1+US2 complete (needs workflows with fields)
  - **US4 (Assignments)**: Best after US1 complete (extends UserTask config)
  - **US5 (Automation)**: Best after US3 complete (extends routing logic)
- **Polish (Phase 8)**: After desired user stories complete

### Recommended Execution Path (MVP First)

1. **Setup** (T001-T006)
2. **Foundational** (T007-T024)
3. **US1: Workflow Builder** (T025-T044) ← MVP deliverable
4. *VALIDATE: Demo workflow creation*
5. **US2: Dynamic Fields** (T045-T052)
6. **US3: User Inbox** (T053-T066)
7. *VALIDATE: Demo end-to-end flow*
8. **US4: Assignments** (T067-T074)
9. **US5: Automation** (T075-T082)
10. **Polish** (T083-T090)

### Parallel Opportunities

**Within Phase 1 (Setup)**:
```
T003, T004, T005, T006 can run in parallel after T001-T002
```

**Within Phase 2 (Foundational)**:
```
# All types can be created in parallel:
T007, T008, T009, T010, T011, T012, T013

# All mock data can be created in parallel:
T015, T016, T017, T018, T019

# Shared components can be created in parallel:
T022, T023
```

**Within Phase 3 (US1)**:
```
# All custom nodes in parallel:
T025, T026, T027, T028, T029, T030

# After nodes complete:
T032, T033 in parallel
```

**Cross-Story Parallelism**:
After Foundational phase, if multiple developers available:
- Developer A: US1 (Workflow Builder)
- Developer B: US2 (Dynamic Fields)

After US1+US2 complete:
- Developer A: US3 (User Inbox)
- Developer B: US4 (Assignments)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Workflow Builder)
4. **STOP and VALIDATE**: Test workflow creation independently
5. Deploy/demo if ready

**MVP Deliverables**:
- Admin can open workflow builder
- Admin can drag 6 task types onto canvas
- Admin can connect tasks with routes
- Admin can save workflow with validation

### Incremental Delivery

| Increment | Stories | Deliverable |
|-----------|---------|-------------|
| MVP | US1 | Workflow Builder |
| v0.2 | US1 + US2 | Builder + Dynamic Fields |
| v0.3 | US1 + US2 + US3 | Full User Interface |
| v0.4 | US1-4 | Group Assignments |
| v1.0 | US1-5 + Polish | Complete Mockup |

---

## Task Summary

| Phase | Tasks | Parallel Tasks |
|-------|-------|----------------|
| Phase 1: Setup | 6 | 4 |
| Phase 2: Foundational | 18 | 14 |
| Phase 3: US1 - Workflow Builder | 20 | 10 |
| Phase 4: US2 - Dynamic Fields | 8 | 2 |
| Phase 5: US3 - User Inbox | 14 | 3 |
| Phase 6: US4 - Assignments | 8 | 2 |
| Phase 7: US5 - Automation | 8 | 0 |
| Phase 8: Polish | 8 | 5 |
| **Total** | **90** | **40** |

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- No tests generated (not requested) - add test tasks if TDD desired
