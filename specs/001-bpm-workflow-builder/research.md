# Research: BPM Workflow Builder

**Feature**: 001-bpm-workflow-builder
**Date**: 2025-12-26
**Status**: Complete

## Technology Decisions

### 1. Workflow Canvas Library

**Decision**: React Flow (@xyflow/react)

**Rationale**:
- Purpose-built for node-based diagrams and workflow editors
- Excellent drag-and-drop support with customizable nodes and edges
- Built-in features: zoom, pan, minimap, node selection, connection validation
- Active maintenance, strong TypeScript support
- MIT licensed, production-ready

**Alternatives Considered**:
| Library | Pros | Cons | Rejected Because |
|---------|------|------|------------------|
| JointJS | Feature-rich, enterprise support | Commercial license, heavier bundle | Cost + complexity for mockup |
| GoJS | Mature, comprehensive | Commercial license required | Cost prohibitive for Phase 1 |
| Cytoscape.js | Scientific visualization focus | Less intuitive for workflow UX | Not optimized for drag-drop editing |
| Custom Canvas | Full control | Significant development time | Would delay mockup by weeks |

### 2. UI Component Framework

**Decision**: shadcn/ui with Tailwind CSS

**Rationale**:
- Copy-paste components (no dependency lock-in)
- Built on Radix UI primitives (accessible by default)
- Tailwind integration for consistent styling
- Highly customizable, not a black box
- Growing adoption in Next.js ecosystem

**Alternatives Considered**:
| Framework | Pros | Cons | Rejected Because |
|-----------|------|------|------------------|
| Material UI | Mature, comprehensive | Opinionated styling, heavier | Harder to customize look/feel |
| Chakra UI | Good DX, accessible | Styling conflicts with Tailwind | Redundant with Tailwind approach |
| Ant Design | Enterprise features | Heavy, distinct visual style | Too prescriptive for custom BPM UX |

### 3. State Management (Phase 1)

**Decision**: React Context + useReducer for mock data, Zustand for complex state

**Rationale**:
- Context sufficient for simple mock data distribution
- Zustand for workflow builder state (nodes, edges, selection)
- No over-engineering for mockup phase
- Easy migration path to server state (React Query) in Phase 2

**Alternatives Considered**:
| Approach | Pros | Cons | Rejected Because |
|----------|------|------|------------------|
| Redux Toolkit | Predictable, dev tools | Boilerplate overhead | Overkill for mockup |
| Jotai | Atomic, minimal | Learning curve for team | Less familiar pattern |
| Server-only state | Simpler mental model | Requires backend | Phase 1 is frontend-only |

### 4. Drag-and-Drop Implementation

**Decision**: React Flow's built-in drag-drop + @dnd-kit for palette

**Rationale**:
- React Flow handles canvas drag-drop natively
- @dnd-kit for dragging from task palette to canvas
- Keyboard accessible, touch-friendly
- Well-documented integration patterns

**Alternatives Considered**:
| Library | Pros | Cons | Rejected Because |
|---------|------|------|------------------|
| react-beautiful-dnd | Popular, mature | Archived, not maintained | No longer recommended |
| react-dnd | Flexible, powerful | Complex setup, HTML5 backend issues | Over-complicated for our needs |
| Native Drag API | No dependencies | Poor accessibility, inconsistent | Doesn't meet WCAG requirements |

### 5. Form Handling

**Decision**: React Hook Form + Zod validation

**Rationale**:
- Minimal re-renders, performant for dynamic forms
- Zod provides type-safe schema validation
- Works well with shadcn/ui form components
- Easy to extend for dynamic field definitions

**Alternatives Considered**:
| Library | Pros | Cons | Rejected Because |
|---------|------|------|------------------|
| Formik | Well-known | More re-renders, heavier | Performance for dynamic forms |
| Native forms | Simple | No validation abstraction | Too manual for complex forms |

## Best Practices Research

### Next.js 14 App Router Patterns

- Use Server Components by default, Client Components only when needed
- Colocate loading.tsx and error.tsx with routes
- Use route groups for shared layouts (e.g., `(dashboard)`)
- Implement parallel routes for modals if needed

### React Flow Integration

- Initialize ReactFlow in a Client Component (`'use client'`)
- Use `useNodesState` and `useEdgesState` hooks for state
- Implement custom nodes as separate components
- Use `nodeTypes` and `edgeTypes` for registration
- Handle `onConnect`, `onNodesChange`, `onEdgesChange` callbacks

### Accessibility for Workflow Builder

- Implement keyboard navigation for node selection
- Provide screen reader announcements for drag operations
- Ensure focus management when adding/removing nodes
- Use ARIA live regions for state changes

## Open Questions (Resolved)

| Question | Resolution |
|----------|------------|
| Which drag-drop library for palette? | @dnd-kit - accessible, modern, well-maintained |
| How to persist mock workflow state? | Local state with Zustand, localStorage optional |
| Authentication for mockup? | Skip for Phase 1, hardcoded mock user |
| Mobile support in Phase 1? | Desktop-first, responsive for tablet, mobile deferred |

## Phase 2 Considerations (Documented for Future)

These items are out of scope for Phase 1 but documented for planning:

1. **Supabase Integration**: Row-level security policies for multi-tenant
2. **Real-time Collaboration**: Supabase Realtime for concurrent editing
3. **Background Workers**: Supabase Edge Functions or AWS Lambda
4. **Authentication**: Supabase Auth with OAuth providers
5. **File Storage**: Supabase Storage for attachments
