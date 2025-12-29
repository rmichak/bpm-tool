'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
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
  Cog,
  Layers,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  FileText,
} from 'lucide-react';
import type { Task, TaskType, Workflow } from '@/types';

const taskIcons: Record<TaskType, React.ElementType> = {
  begin: Play,
  end: Square,
  user: User,
  decision: GitBranch,
  broadcast: Split,
  rendezvous: Merge,
  service: Cog,
  subflow: Layers,
};

const taskColors: Record<TaskType, string> = {
  begin: 'text-emerald-400',
  end: 'text-rose-400',
  user: 'text-blue-400',
  decision: 'text-amber-400',
  broadcast: 'text-violet-400',
  rendezvous: 'text-violet-400',
  service: 'text-cyan-400',
  subflow: 'text-indigo-400',
};

export interface ProcessTreeNode {
  id: string;
  name: string;
  type: 'workflow' | 'task';
  taskType?: TaskType;
  workflowId: string;
  isMainFlow?: boolean;
  children?: ProcessTreeNode[];
}

interface ProcessTreeProps {
  tree: ProcessTreeNode;
  currentWorkflowId: string;
  currentTaskId?: string;
  onNavigate: (workflowId: string) => void;
  onSelectTask?: (taskId: string) => void;
  collapsed?: boolean;
  onToggle?: () => void;
}

function TreeNode({
  node,
  depth,
  currentWorkflowId,
  currentTaskId,
  onNavigate,
  onSelectTask,
  expandedNodes,
  toggleNode,
}: {
  node: ProcessTreeNode;
  depth: number;
  currentWorkflowId: string;
  currentTaskId?: string;
  onNavigate: (workflowId: string) => void;
  onSelectTask?: (taskId: string) => void;
  expandedNodes: Set<string>;
  toggleNode: (id: string) => void;
}) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodes.has(node.id);
  const isCurrentWorkflow = node.type === 'workflow' && node.workflowId === currentWorkflowId;
  const isCurrentTask = node.type === 'task' && node.id === currentTaskId;

  const Icon = node.type === 'workflow'
    ? (node.isMainFlow ? FileText : Layers)
    : (node.taskType ? taskIcons[node.taskType] : FileText);

  const iconColor = node.type === 'task' && node.taskType
    ? taskColors[node.taskType]
    : (node.isMainFlow ? 'text-primary' : 'text-indigo-400');

  const handleClick = () => {
    if (node.type === 'workflow') {
      onNavigate(node.workflowId);
    } else if (node.type === 'task' && onSelectTask) {
      // Navigate to the workflow containing this task, then select it
      onNavigate(node.workflowId);
      onSelectTask(node.id);
    }
  };

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1 py-1 px-2 rounded-md transition-colors cursor-pointer',
          'hover:bg-muted/50',
          (isCurrentWorkflow || isCurrentTask) && 'bg-primary/10 text-primary'
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {/* Expand/collapse toggle */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleNode(node.id);
            }}
            className="p-0.5 hover:bg-muted rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
          </button>
        ) : (
          <div className="w-4" />
        )}

        {/* Node content */}
        <button
          onClick={handleClick}
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
        >
          <Icon className={cn('h-3.5 w-3.5 flex-shrink-0', iconColor)} />
          <span
            className={cn(
              'text-xs truncate',
              (isCurrentWorkflow || isCurrentTask) ? 'font-semibold' : 'font-medium'
            )}
          >
            {node.name}
          </span>
          {node.isMainFlow && (
            <span className="text-[10px] text-muted-foreground">(main)</span>
          )}
        </button>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              currentWorkflowId={currentWorkflowId}
              currentTaskId={currentTaskId}
              onNavigate={onNavigate}
              onSelectTask={onSelectTask}
              expandedNodes={expandedNodes}
              toggleNode={toggleNode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ProcessTree({
  tree,
  currentWorkflowId,
  currentTaskId,
  onNavigate,
  onSelectTask,
  collapsed = false,
  onToggle,
}: ProcessTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    // Start with all workflow nodes expanded
    const expanded = new Set<string>();
    const expandWorkflows = (node: ProcessTreeNode) => {
      if (node.type === 'workflow') {
        expanded.add(node.id);
      }
      node.children?.forEach(expandWorkflows);
    };
    expandWorkflows(tree);
    return expanded;
  });

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
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
        <div className="flex-1 flex flex-col gap-2 items-center">
          <div className="p-2 rounded-lg bg-primary/10" title={tree.name}>
            <FileText className="h-4 w-4 text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 border-r border-border bg-card/50 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h3 className="font-semibold text-sm">Process Tree</h3>
          <p className="text-xs text-muted-foreground">Navigate hierarchy</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onToggle}>
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </div>

      {/* Tree content */}
      <div className="flex-1 overflow-y-auto p-2">
        <TreeNode
          node={tree}
          depth={0}
          currentWorkflowId={currentWorkflowId}
          currentTaskId={currentTaskId}
          onNavigate={onNavigate}
          onSelectTask={onSelectTask}
          expandedNodes={expandedNodes}
          toggleNode={toggleNode}
        />
      </div>

      {/* Legend */}
      <div className="p-3 border-t border-border">
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-2">
            <FileText className="h-3 w-3 text-primary" />
            <span>Main Flow</span>
          </div>
          <div className="flex items-center gap-2">
            <Layers className="h-3 w-3 text-indigo-400" />
            <span>Subflow</span>
          </div>
        </div>
      </div>
    </div>
  );
}
