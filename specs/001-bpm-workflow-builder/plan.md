# Implementation Plan: BPM Workflow Builder

**Branch**: `001-bpm-workflow-builder` | **Date**: 2025-12-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-bpm-workflow-builder/spec.md`

## Summary

Build a working UI mockup for the ePower BPM application with two main interfaces:
1. **User Work Interface** - In-basket showing assigned work items with ability to open and process items
2. **Workflow Builder** - Admin tool for drag-and-drop workflow design with task palette and route connections

**Phase 1 Scope**: Frontend mockup only. All data will use in-memory/mock state. Database integration (Supabase) deferred to Phase 2.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 14 (App Router)
**Primary Dependencies**: Next.js 14, React 18, React Flow (workflow canvas), Tailwind CSS, shadcn/ui
**Storage**: In-memory mock data (Supabase integration deferred to Phase 2)
**Testing**: Jest + React Testing Library (unit), Playwright (E2E - optional for Phase 1)
**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge), AWS hosting (Phase 2+)
**Project Type**: Web application (Next.js monorepo structure)
**Performance Goals**: <3s initial page load, 60fps drag-drop interactions, responsive up to 50 nodes
**Constraints**: Mockup-only (no real persistence), desktop-first responsive design
**Scale/Scope**: Single-tenant mockup, 2 primary views (user inbox, workflow builder)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. User Experience First ✅

| Non-Negotiable | Status | Evidence |
|----------------|--------|----------|
| User workflows mapped before implementation | ✅ PASS | 5 user stories defined in spec with acceptance scenarios |
| Interface complexity justified by user value | ✅ PASS | Two focused interfaces: work processing + workflow design |
| Error states provide actionable guidance | ✅ PASS | Will implement user-friendly validation messages |
| Performance degradation treated as blocking | ✅ PASS | 60fps target for drag-drop, <3s load defined |
| Accessibility (WCAG 2.1 AA) considered | ✅ PASS | Using shadcn/ui which provides accessible components |

### II. Scalable Design ⚠️ DEFERRED

| Non-Negotiable | Status | Evidence |
|----------------|--------|----------|
| Database concurrent access + pooling | ⏸️ DEFERRED | No database in Phase 1 (mockup only) |
| Background services stateless/distributed | ⏸️ DEFERRED | No background services in Phase 1 |
| API rate limiting + graceful degradation | ⏸️ DEFERRED | No real API in Phase 1 |
| Long-running ops async with progress | ⏸️ DEFERRED | No long-running ops in Phase 1 |
| Infrastructure scaling documented | ⏸️ DEFERRED | AWS architecture for Phase 2 |

**Justification**: Phase 1 is explicitly scoped as a UI mockup to validate UX before investing in backend infrastructure. Scalability requirements will be addressed when database integration begins.

### III. Incremental Delivery ✅

| Non-Negotiable | Status | Evidence |
|----------------|--------|----------|
| Each increment independently testable | ✅ PASS | User inbox and workflow builder are separate deliverables |
| Feature branches mergeable within sprint | ✅ PASS | Mockup scope fits single sprint |
| Partial implementations safely deployable | ✅ PASS | Static mockup can deploy without backend |
| Breaking changes follow deprecation cycle | ✅ PASS | N/A for initial implementation |
| Each release includes changelog entry | ✅ PASS | Will document in release |

## Project Structure

### Documentation (this feature)

```text
specs/001-bpm-workflow-builder/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (mock data structures)
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (mock API contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── app/                     # Next.js App Router
│   ├── layout.tsx           # Root layout with providers
│   ├── page.tsx             # Landing/redirect
│   ├── inbox/               # User work interface
│   │   ├── page.tsx         # Work queue list
│   │   └── [itemId]/        # Work item detail
│   │       └── page.tsx
│   └── builder/             # Workflow designer
│       ├── page.tsx         # Workflow canvas
│       └── [workflowId]/    # Edit specific workflow
│           └── page.tsx
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── inbox/               # User inbox components
│   │   ├── WorkQueue.tsx
│   │   ├── WorkItemCard.tsx
│   │   └── WorkItemForm.tsx
│   ├── builder/             # Workflow builder components
│   │   ├── Canvas.tsx       # React Flow canvas wrapper
│   │   ├── TaskPalette.tsx  # Draggable task types
│   │   ├── TaskNode.tsx     # Custom node component
│   │   └── RouteEdge.tsx    # Custom edge component
│   └── shared/              # Shared components
│       ├── Header.tsx
│       └── Sidebar.tsx
├── lib/
│   ├── mock-data/           # Mock data for Phase 1
│   │   ├── processes.ts
│   │   ├── workflows.ts
│   │   ├── work-items.ts
│   │   └── users.ts
│   └── utils/               # Utility functions
├── hooks/                   # Custom React hooks
│   ├── useWorkflow.ts
│   └── useWorkItems.ts
├── types/                   # TypeScript type definitions
│   ├── process.ts
│   ├── workflow.ts
│   ├── task.ts
│   └── work-item.ts
└── styles/
    └── globals.css          # Tailwind base styles

tests/
├── unit/                    # Component tests
├── integration/             # Feature tests
└── e2e/                     # Playwright tests (optional Phase 1)
```

**Structure Decision**: Next.js App Router structure with feature-based component organization. The `app/` directory contains routes, `components/` contains reusable UI, and `lib/mock-data/` provides in-memory state for the mockup phase.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Scalable Design deferred | Phase 1 is UI mockup only | Implementing full backend before validating UX would be premature investment |
| React Flow library | Visual workflow builder requires node-edge graph | Building custom canvas from scratch would delay mockup significantly |
