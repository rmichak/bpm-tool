'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { WorkItem, Process, Task } from '@/types';
import {
  Clock,
  Users,
  ArrowRight,
  AlertTriangle,
  Timer,
  FileText,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkItemCardProps {
  workItem: WorkItem;
  process: Process;
  currentTask: Task;
  selected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
}

const priorityConfig = {
  low: {
    border: 'border-l-muted-foreground',
    badge: 'bg-muted text-muted-foreground',
    label: 'Low',
  },
  medium: {
    border: 'border-l-blue-500',
    badge: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    label: 'Medium',
  },
  high: {
    border: 'border-l-warning',
    badge: 'bg-warning/10 text-warning border-warning/20',
    label: 'High',
  },
  urgent: {
    border: 'border-l-destructive',
    badge: 'bg-destructive/10 text-destructive border-destructive/20',
    label: 'Urgent',
  },
};

const statusConfig = {
  pending: {
    badge: 'bg-muted text-muted-foreground',
    label: 'Pending',
  },
  in_progress: {
    badge: 'bg-primary/10 text-primary border-primary/20',
    label: 'In Progress',
  },
  completed: {
    badge: 'bg-success/10 text-success border-success/20',
    label: 'Completed',
  },
  cancelled: {
    badge: 'bg-destructive/10 text-destructive border-destructive/20',
    label: 'Cancelled',
  },
};

function getSLAStatus(dueAt: string | undefined): {
  label: string;
  urgent: boolean;
  overdue: boolean;
} {
  if (!dueAt) return { label: '', urgent: false, overdue: false };

  const now = new Date();
  const due = new Date(dueAt);
  const diff = due.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (diff < 0) {
    const overdueDays = Math.abs(days);
    const overdueHours = Math.abs(hours) % 24;
    if (overdueDays > 0) {
      return { label: `${overdueDays}d overdue`, urgent: true, overdue: true };
    }
    return { label: `${overdueHours}h overdue`, urgent: true, overdue: true };
  }

  if (hours < 4) {
    return { label: `${hours}h left`, urgent: true, overdue: false };
  }

  if (days > 0) {
    return { label: `${days}d ${hours % 24}h left`, urgent: false, overdue: false };
  }

  return { label: `${hours}h left`, urgent: hours < 8, overdue: false };
}

export function WorkItemCard({
  workItem,
  process,
  currentTask,
  selected = false,
  onSelect,
}: WorkItemCardProps) {
  const isGroupAssigned =
    workItem.assignedTo.type === 'group' && !workItem.assignedTo.claimedAt;
  const createdDate = new Date(workItem.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const priority = priorityConfig[workItem.priority];
  const status = statusConfig[workItem.status];
  const sla = getSLAStatus((workItem as any).dueAt);

  return (
    <div
      className={cn(
        'group relative rounded-xl border bg-card transition-all duration-200',
        'hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5',
        priority.border,
        'border-l-4',
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
      )}
    >
      <div className="flex items-start gap-4 p-4">
        {/* Checkbox */}
        {onSelect && (
          <div className="pt-1">
            <Checkbox
              checked={selected}
              onCheckedChange={(checked) => onSelect(workItem.id, checked === true)}
              className="border-muted-foreground/30"
            />
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Header badges */}
          <div className="flex items-center flex-wrap gap-2 mb-2">
            <Badge variant="outline" className={cn('text-xs', status.badge)}>
              {status.label}
            </Badge>
            <Badge variant="outline" className={cn('text-xs capitalize', priority.badge)}>
              {priority.label}
            </Badge>
            {isGroupAssigned && (
              <Badge
                variant="outline"
                className="text-xs bg-violet-500/10 text-violet-500 border-violet-500/20"
              >
                <Users className="h-3 w-3 mr-1" />
                Queue
              </Badge>
            )}
            {sla.label && (
              <Badge
                variant="outline"
                className={cn(
                  'text-xs gap-1',
                  sla.overdue
                    ? 'bg-destructive/10 text-destructive border-destructive/20'
                    : sla.urgent
                    ? 'bg-warning/10 text-warning border-warning/20'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {sla.urgent ? (
                  <AlertTriangle className="h-3 w-3" />
                ) : (
                  <Timer className="h-3 w-3" />
                )}
                {sla.label}
              </Badge>
            )}
          </div>

          {/* Title and task */}
          <div className="mb-3">
            <h3 className="font-semibold text-base mb-0.5 truncate group-hover:text-primary transition-colors">
              {process.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground/70 font-medium">
                {currentTask.name}
              </span>
            </p>
          </div>

          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{createdDate}</span>
            </div>
            {workItem.fieldValues.invoice_number && (
              <div className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                <span className="font-mono">
                  #{workItem.fieldValues.invoice_number}
                </span>
              </div>
            )}
            {workItem.fieldValues.amount && (
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5" />
                <span className="font-semibold">
                  {Number(workItem.fieldValues.amount).toLocaleString()}
                </span>
              </div>
            )}
            {workItem.fieldValues.customer_name && (
              <div className="flex items-center gap-1.5 text-foreground/70">
                {workItem.fieldValues.customer_name}
              </div>
            )}
          </div>
        </div>

        {/* Action button */}
        <div className="pt-1">
          <Link href={`/inbox/${workItem.id}`}>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all"
            >
              {isGroupAssigned ? 'Claim' : 'Open'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
