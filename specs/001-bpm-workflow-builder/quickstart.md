# Quickstart: BPM Workflow Builder

**Feature**: 001-bpm-workflow-builder
**Date**: 2025-12-26
**Phase**: 1 (UI Mockup)

## Prerequisites

- Node.js 18.17 or later
- npm or pnpm package manager
- Modern web browser (Chrome, Firefox, Safari, Edge)

## Quick Setup

```bash
# Clone repository (if not already done)
cd epowerbpm

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js routes
│   ├── inbox/              # User work queue
│   └── builder/            # Workflow designer
├── components/             # React components
├── lib/mock-data/          # Sample data
├── hooks/                  # Custom React hooks
└── types/                  # TypeScript definitions
```

## Available Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page (redirects to inbox) |
| `/inbox` | User work queue - view assigned items |
| `/inbox/[itemId]` | Work item detail - process an item |
| `/builder` | Workflow list - manage workflows |
| `/builder/[workflowId]` | Workflow designer - drag-drop editor |

## Using the User Inbox

1. Navigate to `/inbox` to see your assigned work items
2. Click any item to open the detail view
3. Fill in the required fields
4. Click "Complete" to process the item

**Mock Data**: The inbox is pre-populated with sample work items for testing.

## Using the Workflow Builder

1. Navigate to `/builder` to see available workflows
2. Click "New Workflow" or select an existing one
3. Drag tasks from the left palette onto the canvas
4. Connect tasks by dragging from one node's handle to another
5. Click a task to configure its properties
6. Click "Save" to persist changes (mock only)

### Task Types

| Type | Icon | Description |
|------|------|-------------|
| Begin | ▶️ | Start of workflow |
| End | ⏹️ | End of workflow |
| User Task | 👤 | Requires user action |
| Decision | ◆ | Routes based on conditions |
| Broadcast | ⇶ | Splits into parallel paths |
| Rendezvous | ⇷ | Merges parallel paths |

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Delete` | Remove selected task(s) |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+A` | Select all |
| `Escape` | Deselect |

## Development Commands

```bash
# Start development server with hot reload
npm run dev

# Run type checking
npm run typecheck

# Run linter
npm run lint

# Run tests
npm test

# Build for production
npm run build
```

## Mock Data

Phase 1 uses in-memory mock data located in `src/lib/mock-data/`:

- `processes.ts` - Sample business processes
- `workflows.ts` - Workflow definitions with tasks/routes
- `work-items.ts` - Sample work items in various states
- `users.ts` - Mock user accounts

To modify mock data, edit these files and refresh the page.

## Common Tasks

### Add a New Process

1. Go to `/builder`
2. Click "New Process"
3. Enter name and description
4. Add field definitions for the dynamic form
5. Create the main workflow

### Configure Dynamic Fields

1. Open a process in the builder
2. Click "Fields" tab
3. Click "Add Field"
4. Set field properties (name, type, required)
5. Drag to reorder fields

### Test a Workflow

1. Create a simple workflow (Begin → User Task → End)
2. Create a work item from the process
3. Open the inbox to see the item
4. Complete the user task
5. Verify the item moves to End

## Troubleshooting

### Canvas not rendering

- Ensure you're using a Client Component (`'use client'`)
- Check browser console for React Flow errors
- Verify the workflow has valid tasks array

### Drag-drop not working

- Check if React Flow is properly initialized
- Ensure the canvas container has defined dimensions
- Try refreshing the page

### Mock data not updating

- Mock data persists only in React state
- Page refresh will reset to initial mock data
- For persistence, localStorage could be added (optional)

## Next Steps

After Phase 1 mockup is complete:

1. **Phase 2**: Integrate Supabase for real database
2. **Phase 3**: Add authentication with Supabase Auth
3. **Phase 4**: Implement background workers for automation
4. **Phase 5**: Deploy to AWS
