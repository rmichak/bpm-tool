# Subflows and Live Metrics Design

**Date:** 2024-12-29
**Status:** Approved

## Overview

This design adds two major features to the workflow builder:
1. **Subflows** - Nested workflows for organizing complex processes
2. **Live Metrics** - Real-time visualization of active/overdue items with simulation

---

## Part 1: Subflows

### Data Model

New task type `subflow` added to represent nested workflows:

```typescript
type TaskType = 'begin' | 'end' | 'user' | 'decision' | 'broadcast' | 'rendezvous' | 'subflow' | 'service';

interface SubflowTaskConfig {
  type: 'subflow';
  subflowId: string;        // References a Workflow.id within same Process
  dataMapping?: {           // Optional field mapping
    parentField: string;
    subflowField: string;
  }[];
}
```

**Hierarchy Rules:**
- A Process contains multiple Workflows
- One Workflow has `isMainFlow: true` (entry point)
- Other Workflows are subflows, referenced by subflow tasks
- Subflows can contain nested subflow tasks (unlimited depth)
- Circular references prevented at validation time

**Execution Model:**
- Inline expansion - subflow tasks execute as part of same work item
- Work item enters subflow's Begin, flows through, exits at End
- No child work items created - purely visual organization

### Subflow Node Visual Design

**Appearance:**
- Width: 240px (1.5x standard 180px nodes)
- Icon: Layers/stack icon
- Color: Indigo/purple gradient
- Content:
  - Subflow name (title)
  - "Subflow" type label
  - Summary: "5 tasks · 2 decision points"
  - Depth indicator: "Contains 2 subflows" (if applicable)

**Interactions:**
- Single click: Select (shows config panel)
- Double click: Drill down into subflow
- Hover: Tooltip with description and stats

**Visual Indicators:**
- Small "enter" arrow in bottom-right corner
- Metric badges show aggregated counts from all nested tasks

### Navigation

**Breadcrumb Bar (above toolbar):**
```
🏠 Invoice Approval Flow  >  Manager Review  >  Compliance Check
```
- Appears when depth > 0
- Each segment clickable to jump back
- Current level bold, not clickable
- Home icon returns to main flow

**Process Tree Sidebar:**
```
📋 Invoice Approval Flow (main)
   ├─ Begin
   ├─ Initial Review
   ├─ 📂 Manager Review
   │    ├─ Begin
   │    ├─ Review Task
   │    ├─ 📂 Compliance Check
   │    │    └─ ...
   │    └─ End
   ├─ Finance Approval
   └─ End
```
- Shows full hierarchy regardless of current view
- Current location highlighted
- Click any node to navigate directly
- Toggle between "Task Palette" and "Process Tree" views

---

## Part 2: Service Tasks

### Data Model

```typescript
interface ServiceTaskConfig {
  type: 'service';
  serviceType: 'api_call' | 'email' | 'notification' | 'script' | 'integration';
  config: {
    endpoint?: string;
    method?: string;
    template?: string;
    retryCount?: number;
  };
  timeout?: number;
  onError: 'fail' | 'continue' | 'retry';
}
```

### Visual Design

- Icon: Cog/gear or lightning bolt
- Color: Cyan/teal gradient
- Size: Standard (180px)
- Label: Shows service type (e.g., "Send Email")

### Updated Task Palette

```
FLOW CONTROL
  ├─ Begin
  └─ End

ACTIVITIES
  ├─ User Task        (blue)
  └─ Service Task     (cyan)

BRANCHING
  ├─ Decision
  ├─ Broadcast
  └─ Rendezvous

STRUCTURE
  └─ Subflow          (indigo)
```

---

## Part 3: Live Metrics

### Badge Display

Badges appear in top-right corner of each task node:

- **Blue badge:** Active items at this task
- **Red badge:** Overdue items (past SLA)
- Hidden when count is 0
- Pulses when overdue count increases

### Hover Tooltip

```
┌──────────────────────────────┐
│ Manager Approval             │
│ ─────────────────────────────│
│ 📊 Active Items:        12   │
│ ⚠️  Overdue:             3   │
│ ⏱️  Avg Wait Time:    4.2h   │
│ 📈 Throughput:    8/day      │
│ ─────────────────────────────│
│ Oldest: 2d 4h (overdue)      │
└──────────────────────────────┘
```

### Subflow Aggregation

- Subflow badges show sum of all nested task counts
- Tooltip notes "Aggregated from N tasks"
- Red badge appears if any nested task has overdue items

---

## Part 4: Simulation Control Panel

### Panel Design

Floating panel in bottom-right corner (draggable):

```
┌─────────────────────────────────────┐
│ 🎮 Simulation                   ─ ✕ │
├─────────────────────────────────────┤
│  [▶ Play]  [⏸ Pause]  [↺ Reset]    │
│  Speed: [━━━●━━━━━] 2x              │
│                                     │
│  + Inject Item at Begin             │
│  + Add 5 Random Items               │
│  ⚡ Trigger Bottleneck              │
│  🔥 Age All Items +1 hour           │
│                                     │
│  Active: 24  │  Overdue: 5         │
│  Total Processed: 142              │
└─────────────────────────────────────┘
```

### Controls

- **Play/Pause:** Toggle automatic item flow
- **Reset:** Clear all items
- **Speed:** 0.5x to 5x simulation speed
- **Inject Item:** Add one item at Begin
- **Add 5 Random:** Scatter items across tasks
- **Trigger Bottleneck:** Add 10 items to random User Task
- **Age All Items:** Advance timestamps to force overdues

### Simulation Behavior

- Service tasks: 2-5 second completion
- User tasks: 10-30 second completion
- Decision nodes: Random route selection
- Broadcast: Creates parallel items
- Rendezvous: Waits for all parallel items
- Panel minimizes to icon when not in use

---

## Implementation Components

### New/Modified Files

**Types:**
- `src/types/index.ts` - Add subflow, service task types

**Components:**
- `src/components/builder/nodes/SubflowNode.tsx` - New
- `src/components/builder/nodes/ServiceNode.tsx` - New
- `src/components/builder/ProcessTree.tsx` - New
- `src/components/builder/Breadcrumbs.tsx` - New
- `src/components/builder/SimulationPanel.tsx` - New
- `src/components/builder/TaskMetricsBadge.tsx` - New
- `src/components/builder/TaskMetricsTooltip.tsx` - New
- `src/components/builder/TaskPalette.tsx` - Update categories
- `src/components/builder/Canvas.tsx` - Integrate navigation, metrics

**Hooks:**
- `src/hooks/useSimulation.ts` - Simulation state management
- `src/hooks/useWorkflowNavigation.ts` - Breadcrumb/tree navigation

**Mock Data:**
- `src/lib/mock-data/index.ts` - Add sample subflows, service tasks, metrics
