# ePowerBPM - Workflow Builder

A modern Business Process Management (BPM) platform built with Next.js, React Flow, and TypeScript. Design, simulate, and manage complex business workflows with an intuitive visual interface.

## Features

### Workflow Builder
- **Visual Canvas** - Drag-and-drop workflow design with React Flow
- **Task Types** - Begin, End, User Task, Service Task, Decision, Broadcast, Rendezvous, Subflow
- **Subflows** - Nested workflows for organizing complex processes
- **Live Simulation** - Real-time visualization of workflow execution with metrics

### Task Palette
- Categorized task types (Flow Control, Activities, Branching, Structure)
- Drag tasks onto the canvas to build workflows
- Toggle between Task Palette and Process Tree views

### Live Metrics & Simulation
- Active/overdue item badges on each task
- Hover tooltips with detailed metrics (wait time, throughput, oldest item)
- Simulation panel with play/pause, speed control, and item injection
- Bottleneck detection and visualization

### Navigation
- Breadcrumb navigation for subflow drill-down
- Process tree sidebar showing full workflow hierarchy
- Double-click subflow nodes to navigate into them

### Additional Pages
- **Dashboard** - Admin metrics and analytics
- **Inbox** - User work items and task management
- **Queues** - Group work queues
- **History** - Completed work items
- **Admin** - Process management, user administration, settings

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: React 18, Tailwind CSS, shadcn/ui
- **Workflow Canvas**: React Flow (@xyflow/react)
- **Drag & Drop**: @dnd-kit/core
- **Charts**: Recharts
- **Icons**: Lucide React
- **Language**: TypeScript 5.x

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/rmichak/bpm-tool.git
cd bpm-tool

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/              # Admin pages (dashboard, processes, users, settings)
│   ├── builder/            # Workflow builder pages
│   ├── inbox/              # User inbox pages
│   ├── history/            # Work item history
│   └── queues/             # Group queues
├── components/
│   ├── builder/            # Workflow builder components
│   │   ├── nodes/          # Task node components
│   │   ├── edges/          # Edge components
│   │   ├── Canvas.tsx      # Main workflow canvas
│   │   ├── TaskPalette.tsx # Draggable task palette
│   │   ├── ProcessTree.tsx # Workflow hierarchy tree
│   │   └── SimulationPanel.tsx
│   ├── ui/                 # shadcn/ui components
│   └── shared/             # Shared components
├── hooks/                  # Custom React hooks
│   └── useSimulation.ts    # Workflow simulation logic
├── lib/
│   └── mock-data/          # Mock data for development
├── types/                  # TypeScript type definitions
└── styles/                 # Global styles
```

## Task Types

| Type | Description | Icon |
|------|-------------|------|
| Begin | Workflow entry point | Play |
| End | Workflow exit point | Square |
| User Task | Human activity requiring action | User |
| Service Task | Automated system action | Cog |
| Decision | Conditional routing based on data | GitBranch |
| Broadcast | Parallel split (fork) | Split |
| Rendezvous | Parallel join (sync) | Merge |
| Subflow | Nested workflow reference | Layers |

## License

MIT
