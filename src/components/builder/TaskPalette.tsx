'use client';

import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import type { TaskType } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Play,
  Square,
  User,
  GitBranch,
  Split,
  Merge,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  GripVertical,
  Cog,
  Layers,
} from 'lucide-react';

interface TaskTypeItem {
  type: TaskType;
  name: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  iconBg: string;
}

interface TaskCategory {
  name: string;
  tasks: TaskTypeItem[];
}

const taskCategories: TaskCategory[] = [
  {
    name: 'Flow Control',
    tasks: [
      {
        type: 'begin',
        name: 'Begin',
        description: 'Workflow start point',
        icon: Play,
        gradient: 'from-emerald-500/20 to-transparent',
        iconBg: 'bg-emerald-500',
      },
      {
        type: 'end',
        name: 'End',
        description: 'Workflow end point',
        icon: Square,
        gradient: 'from-rose-500/20 to-transparent',
        iconBg: 'bg-rose-500',
      },
    ],
  },
  {
    name: 'Activities',
    tasks: [
      {
        type: 'user',
        name: 'User Task',
        description: 'Human activity',
        icon: User,
        gradient: 'from-blue-500/20 to-transparent',
        iconBg: 'bg-blue-500',
      },
      {
        type: 'service',
        name: 'Service Task',
        description: 'Automated action',
        icon: Cog,
        gradient: 'from-cyan-500/20 to-transparent',
        iconBg: 'bg-cyan-500',
      },
    ],
  },
  {
    name: 'Branching',
    tasks: [
      {
        type: 'decision',
        name: 'Decision',
        description: 'Conditional routing',
        icon: GitBranch,
        gradient: 'from-amber-500/20 to-transparent',
        iconBg: 'bg-amber-500',
      },
      {
        type: 'broadcast',
        name: 'Broadcast',
        description: 'Parallel split',
        icon: Split,
        gradient: 'from-violet-500/20 to-transparent',
        iconBg: 'bg-violet-500',
      },
      {
        type: 'rendezvous',
        name: 'Rendezvous',
        description: 'Parallel join',
        icon: Merge,
        gradient: 'from-violet-500/20 to-transparent',
        iconBg: 'bg-violet-500',
      },
    ],
  },
  {
    name: 'Structure',
    tasks: [
      {
        type: 'subflow',
        name: 'Subflow',
        description: 'Nested workflow',
        icon: Layers,
        gradient: 'from-indigo-500/20 to-transparent',
        iconBg: 'bg-indigo-500',
      },
    ],
  },
];

function DraggableTask({ item }: { item: TaskTypeItem }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${item.type}`,
    data: {
      type: item.type,
      fromPalette: true,
    },
  });

  const Icon = item.icon;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'group relative flex items-center gap-3 p-3 rounded-xl border bg-card cursor-grab transition-all duration-200',
        'hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5',
        isDragging && 'opacity-50 shadow-xl scale-105 cursor-grabbing'
      )}
    >
      {/* Gradient overlay */}
      <div
        className={cn(
          'absolute inset-0 rounded-xl bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity',
          item.gradient
        )}
      />

      {/* Drag handle */}
      <div className="relative text-muted-foreground/40 group-hover:text-muted-foreground transition-colors">
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Icon */}
      <div
        className={cn(
          'relative p-2 rounded-lg shadow-lg transition-transform group-hover:scale-105',
          item.iconBg
        )}
      >
        <Icon className="h-4 w-4 text-white" />
      </div>

      {/* Text */}
      <div className="relative flex-1 min-w-0">
        <p className="font-medium text-sm">{item.name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {item.description}
        </p>
      </div>
    </div>
  );
}

interface TaskPaletteProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function TaskPalette({ collapsed = false, onToggle }: TaskPaletteProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(taskCategories.map((c) => c.name))
  );

  const toggleCategory = (name: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(name)) {
      newExpanded.delete(name);
    } else {
      newExpanded.add(name);
    }
    setExpandedCategories(newExpanded);
  };

  if (collapsed) {
    return (
      <div className="w-14 border-r border-border bg-muted/30 flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="mb-4"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 flex flex-col gap-2">
          {taskCategories.flatMap((cat) =>
            cat.tasks.map((task) => {
              const Icon = task.icon;
              return (
                <div
                  key={task.type}
                  className={cn(
                    'p-2 rounded-lg cursor-not-allowed opacity-50',
                    task.iconBg
                  )}
                  title={task.name}
                >
                  <Icon className="h-4 w-4 text-white" />
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 border-r border-border bg-card/50 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h3 className="font-semibold text-sm">Task Palette</h3>
          <p className="text-xs text-muted-foreground">Drag to add</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onToggle}>
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {taskCategories.map((category) => {
          const isExpanded = expandedCategories.has(category.name);

          return (
            <Collapsible
              key={category.name}
              open={isExpanded}
              onOpenChange={() => toggleCategory(category.name)}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {category.name}
                </span>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2 space-y-2">
                {category.tasks.map((item) => (
                  <DraggableTask key={item.type} item={item} />
                ))}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>

      {/* Tips */}
      <div className="p-3 border-t border-border">
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-xs text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Quick Tip</p>
          <p>
            Drag tasks onto the canvas, then click to configure. Connect tasks
            by dragging from handles.
          </p>
        </div>
      </div>
    </div>
  );
}
