'use client';

import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { cn } from '@/lib/utils';
import type { Task, TaskType, TaskMetrics } from '@/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TaskMetricsTooltip } from '../TaskMetricsTooltip';
import {
  Play,
  Square,
  User,
  GitBranch,
  Split,
  Merge,
  Clock,
  Users,
  Cog,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface TaskNodeProps {
  data: {
    task: Task;
    label: string;
    onSelect?: (taskId: string) => void;
    onDrillDown?: (taskId: string) => void;
    subflowInfo?: {
      taskCount: number;
      decisionCount: number;
      nestedSubflows: number;
    };
    metrics?: TaskMetrics;
  };
  selected?: boolean;
}

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

const taskThemes: Record<TaskType, {
  gradient: string;
  iconBg: string;
  border: string;
  glow: string;
  text: string;
}> = {
  begin: {
    gradient: 'from-emerald-500/20 via-emerald-500/10 to-transparent',
    iconBg: 'bg-emerald-500',
    border: 'border-emerald-500/30 hover:border-emerald-500/50',
    glow: 'shadow-emerald-500/20',
    text: 'text-emerald-400',
  },
  end: {
    gradient: 'from-rose-500/20 via-rose-500/10 to-transparent',
    iconBg: 'bg-rose-500',
    border: 'border-rose-500/30 hover:border-rose-500/50',
    glow: 'shadow-rose-500/20',
    text: 'text-rose-400',
  },
  user: {
    gradient: 'from-blue-500/20 via-blue-500/10 to-transparent',
    iconBg: 'bg-blue-500',
    border: 'border-blue-500/30 hover:border-blue-500/50',
    glow: 'shadow-blue-500/20',
    text: 'text-blue-400',
  },
  decision: {
    gradient: 'from-amber-500/20 via-amber-500/10 to-transparent',
    iconBg: 'bg-amber-500',
    border: 'border-amber-500/30 hover:border-amber-500/50',
    glow: 'shadow-amber-500/20',
    text: 'text-amber-400',
  },
  broadcast: {
    gradient: 'from-violet-500/20 via-violet-500/10 to-transparent',
    iconBg: 'bg-violet-500',
    border: 'border-violet-500/30 hover:border-violet-500/50',
    glow: 'shadow-violet-500/20',
    text: 'text-violet-400',
  },
  rendezvous: {
    gradient: 'from-violet-500/20 via-violet-500/10 to-transparent',
    iconBg: 'bg-violet-500',
    border: 'border-violet-500/30 hover:border-violet-500/50',
    glow: 'shadow-violet-500/20',
    text: 'text-violet-400',
  },
  service: {
    gradient: 'from-cyan-500/20 via-cyan-500/10 to-transparent',
    iconBg: 'bg-cyan-500',
    border: 'border-cyan-500/30 hover:border-cyan-500/50',
    glow: 'shadow-cyan-500/20',
    text: 'text-cyan-400',
  },
  subflow: {
    gradient: 'from-indigo-500/20 via-indigo-500/10 to-transparent',
    iconBg: 'bg-indigo-500',
    border: 'border-indigo-500/30 hover:border-indigo-500/50',
    glow: 'shadow-indigo-500/20',
    text: 'text-indigo-400',
  },
};

const typeLabels: Record<TaskType, string> = {
  begin: 'Start',
  end: 'End',
  user: 'User Task',
  decision: 'Decision',
  broadcast: 'Broadcast',
  rendezvous: 'Rendezvous',
  service: 'Service Task',
  subflow: 'Subflow',
};

function TaskNode({ data, selected }: TaskNodeProps) {
  const task = data.task;
  const Icon = taskIcons[task.type];
  const theme = taskThemes[task.type];
  const isSubflow = task.type === 'subflow';
  const isService = task.type === 'service';

  // Check if task has assignment or SLA (for visual indicators)
  const hasAssignment = task.config && 'assignees' in task.config;
  const hasSLA = task.config && 'slaHours' in task.config;

  // Get service task type label if applicable
  const serviceTypeLabel = isService && task.config && 'serviceType' in task.config
    ? (task.config as any).serviceType?.replace('_', ' ')
    : null;

  // Handle double-click for subflow drill-down
  const handleDoubleClick = () => {
    if (isSubflow && data.onDrillDown) {
      data.onDrillDown(task.id);
    }
  };

  return (
    <div
      className={cn(
        'group relative',
        isSubflow ? 'min-w-[240px] max-w-[280px]' : 'min-w-[180px] max-w-[220px]',
        'rounded-xl border bg-card/95 backdrop-blur-sm',
        'shadow-lg transition-all duration-200',
        theme.border,
        selected && [
          'ring-2 ring-primary ring-offset-2 ring-offset-background',
          `shadow-xl ${theme.glow}`,
        ]
      )}
      onClick={() => data.onSelect?.(task.id)}
      onDoubleClick={handleDoubleClick}
    >
      {/* Metrics badges - top right corner with hover tooltip */}
      {data.metrics && (data.metrics.activeCount > 0 || data.metrics.overdueCount > 0) && (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="absolute -top-2 -right-2 flex gap-1 z-10 cursor-pointer">
                {data.metrics.activeCount > 0 && (
                  <div className="px-1.5 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-bold min-w-[20px] text-center shadow-lg">
                    {data.metrics.activeCount}
                  </div>
                )}
                {data.metrics.overdueCount > 0 && (
                  <div className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold min-w-[20px] text-center shadow-lg animate-pulse">
                    {data.metrics.overdueCount}
                  </div>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" align="end" className="p-0 border-0 bg-transparent">
              <TaskMetricsTooltip
                taskName={task.name}
                metrics={data.metrics}
                isAggregated={isSubflow}
                aggregatedTaskCount={isSubflow && data.subflowInfo ? data.subflowInfo.taskCount : 0}
              />
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Gradient overlay */}
      <div
        className={cn(
          'absolute inset-0 rounded-xl bg-gradient-to-br opacity-50',
          theme.gradient
        )}
      />

      {/* Content */}
      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-2">
          <div
            className={cn(
              'p-2.5 rounded-lg shadow-lg',
              theme.iconBg,
              'transition-transform duration-200 group-hover:scale-105'
            )}
          >
            <Icon className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="font-semibold text-sm text-foreground truncate">
              {task.name}
            </p>
            <p className={cn('text-xs font-medium', theme.text)}>
              {serviceTypeLabel || typeLabels[task.type]}
            </p>
          </div>
        </div>

        {/* Subflow summary info */}
        {isSubflow && data.subflowInfo && (
          <div className="flex flex-col gap-1 pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              {data.subflowInfo.taskCount} tasks · {data.subflowInfo.decisionCount} decisions
            </p>
            {data.subflowInfo.nestedSubflows > 0 && (
              <p className="text-xs text-indigo-400">
                Contains {data.subflowInfo.nestedSubflows} subflow{data.subflowInfo.nestedSubflows > 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}

        {/* Standard indicators (assignment, SLA) */}
        {!isSubflow && (hasAssignment || hasSLA) && (
          <div className="flex items-center gap-2 pt-2 border-t border-border/50">
            {hasAssignment && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>Assigned</span>
              </div>
            )}
            {hasSLA && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>SLA</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Drill-down indicator for subflows */}
      {isSubflow && (
        <div className="absolute bottom-2 right-2 p-1 rounded bg-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowRight className="h-3 w-3 text-indigo-400" />
        </div>
      )}

      {/* Input Handle (not for begin) */}
      {task.type !== 'begin' && (
        <Handle
          type="target"
          position={Position.Left}
          className={cn(
            '!w-3 !h-3 !-left-1.5',
            '!bg-muted-foreground/30 !border-2 !border-muted-foreground/50',
            'transition-all duration-200',
            'hover:!bg-primary hover:!border-primary hover:!scale-125'
          )}
        />
      )}

      {/* Output Handle (not for end) */}
      {task.type !== 'end' && (
        <Handle
          type="source"
          position={Position.Right}
          className={cn(
            '!w-3 !h-3 !-right-1.5',
            '!bg-muted-foreground/30 !border-2 !border-muted-foreground/50',
            'transition-all duration-200',
            'hover:!bg-primary hover:!border-primary hover:!scale-125'
          )}
        />
      )}

      {/* Secondary output for decision/broadcast */}
      {(task.type === 'decision' || task.type === 'broadcast') && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="secondary"
          className={cn(
            '!w-3 !h-3 !-bottom-1.5',
            '!bg-muted-foreground/30 !border-2 !border-muted-foreground/50',
            'transition-all duration-200',
            'hover:!bg-primary hover:!border-primary hover:!scale-125'
          )}
        />
      )}
    </div>
  );
}

export default memo(TaskNode);
