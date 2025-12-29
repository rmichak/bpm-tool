'use client';

import { cn } from '@/lib/utils';
import {
  BarChart3,
  AlertTriangle,
  Clock,
  TrendingUp,
  Timer,
} from 'lucide-react';
import type { TaskMetrics } from '@/types';

interface TaskMetricsTooltipProps {
  taskName: string;
  metrics: TaskMetrics;
  isAggregated?: boolean;
  aggregatedTaskCount?: number;
  className?: string;
}

function formatDuration(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)}m`;
  } else if (hours < 24) {
    return `${hours.toFixed(1)}h`;
  } else {
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    return `${days}d ${remainingHours}h`;
  }
}

function formatAge(hours: number, isOverdue: boolean): string {
  const duration = formatDuration(hours);
  return isOverdue ? `${duration} (overdue)` : duration;
}

export function TaskMetricsTooltip({
  taskName,
  metrics,
  isAggregated = false,
  aggregatedTaskCount = 0,
  className,
}: TaskMetricsTooltipProps) {
  const hasOverdue = metrics.overdueCount > 0;

  return (
    <div
      className={cn(
        'w-64 rounded-xl border border-border bg-popover/95 backdrop-blur-sm shadow-xl',
        'p-4 text-sm',
        className
      )}
    >
      {/* Header */}
      <div className="border-b border-border pb-3 mb-3">
        <h4 className="font-semibold text-foreground">{taskName}</h4>
        {isAggregated && aggregatedTaskCount > 0 && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Aggregated from {aggregatedTaskCount} tasks
          </p>
        )}
      </div>

      {/* Metrics grid */}
      <div className="space-y-2.5">
        {/* Active Items */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <BarChart3 className="h-4 w-4 text-blue-400" />
            <span>Active Items</span>
          </div>
          <span className="font-semibold text-foreground">
            {metrics.activeCount}
          </span>
        </div>

        {/* Overdue */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle
              className={cn(
                'h-4 w-4',
                hasOverdue ? 'text-red-400' : 'text-muted-foreground/50'
              )}
            />
            <span>Overdue</span>
          </div>
          <span
            className={cn(
              'font-semibold',
              hasOverdue ? 'text-red-400' : 'text-foreground'
            )}
          >
            {metrics.overdueCount}
          </span>
        </div>

        {/* Avg Wait Time */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 text-amber-400" />
            <span>Avg Wait Time</span>
          </div>
          <span className="font-semibold text-foreground">
            {formatDuration(metrics.avgWaitTime)}
          </span>
        </div>

        {/* Throughput */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span>Throughput</span>
          </div>
          <span className="font-semibold text-foreground">
            {metrics.throughputPerDay}/day
          </span>
        </div>
      </div>

      {/* Oldest item */}
      {metrics.activeCount > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <Timer
              className={cn(
                'h-4 w-4',
                hasOverdue ? 'text-red-400' : 'text-muted-foreground'
              )}
            />
            <span className="text-muted-foreground">Oldest:</span>
            <span
              className={cn(
                'font-medium',
                hasOverdue ? 'text-red-400' : 'text-foreground'
              )}
            >
              {formatAge(metrics.oldestItemAge, hasOverdue)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
