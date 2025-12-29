'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DynamicForm } from '@/components/inbox/DynamicForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  mockWorkItems,
  getProcessById,
  getTaskById,
  getFieldDefinitionsForProcess,
  getCurrentUser,
} from '@/lib/mock-data';
import type { FieldValue, UserTaskConfig } from '@/types';
import {
  ArrowLeft,
  Clock,
  User,
  GitBranch,
  CheckCircle,
  AlertCircle,
  Users,
  Timer,
  History,
  FileText,
  Play,
  ArrowRight,
  AlertTriangle,
  XCircle,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface PageProps {
  params: Promise<{ itemId: string }>;
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

// Mock history entries
const mockHistory = [
  {
    id: '1',
    taskName: 'Begin',
    action: 'Started',
    user: 'System',
    timestamp: '2024-01-15T09:00:00Z',
    duration: null,
  },
  {
    id: '2',
    taskName: 'Initial Review',
    action: 'Completed',
    user: 'Sarah Connor',
    timestamp: '2024-01-15T10:30:00Z',
    duration: '1h 30m',
    notes: 'Verified customer information and validated request.',
  },
  {
    id: '3',
    taskName: 'Manager Approval',
    action: 'In Progress',
    user: 'John Smith',
    timestamp: '2024-01-15T10:35:00Z',
    duration: null,
  },
];

export default function WorkItemDetailPage({ params }: PageProps) {
  const { itemId } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRouteDialog, setShowRouteDialog] = useState(false);
  const [pendingValues, setPendingValues] = useState<Record<string, FieldValue> | null>(null);

  const workItem = mockWorkItems.find((w) => w.id === itemId);

  if (!workItem) {
    return (
      <div className="container py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Work Item Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The work item you are looking for does not exist or has been removed.
          </p>
          <Link href="/inbox">
            <Button className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Inbox
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const process = getProcessById(workItem.processId);
  const currentTask = getTaskById(workItem.currentTaskId);
  const allFields = getFieldDefinitionsForProcess(workItem.processId);
  const currentUser = getCurrentUser();

  // Get fields to show based on task config
  let fieldsToShow = allFields;
  if (currentTask?.config.type === 'user') {
    const userConfig = currentTask.config as UserTaskConfig;
    if (userConfig.formFields && userConfig.formFields.length > 0) {
      fieldsToShow = allFields.filter((f) => userConfig.formFields.includes(f.id));
    }
  }

  const isGroupAssigned =
    workItem.assignedTo.type === 'group' && !workItem.assignedTo.claimedAt;
  const isAssignedToMe = workItem.assignedTo.userId === currentUser.id;
  const priority = priorityConfig[workItem.priority];

  // Mock SLA calculation
  const dueAt = (workItem as any).dueAt;
  const getSLAInfo = () => {
    if (!dueAt) return null;
    const now = new Date();
    const due = new Date(dueAt);
    const diff = due.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const isOverdue = diff < 0;
    const isUrgent = hours < 4 && hours >= 0;

    return { hours, isOverdue, isUrgent, dueDate: due };
  };
  const slaInfo = getSLAInfo();

  const handleSave = (values: Record<string, FieldValue>) => {
    toast({
      title: 'Draft Saved',
      description: 'Your changes have been saved. (Mockup)',
    });
  };

  const handleComplete = (values: Record<string, FieldValue>) => {
    // Check if this is a decision task with multiple routes
    const isDecisionTask = currentTask?.type === 'decision';
    if (isDecisionTask) {
      setPendingValues(values);
      setShowRouteDialog(true);
      return;
    }

    submitCompletion(values, 'default');
  };

  const submitCompletion = (values: Record<string, FieldValue>, route: string) => {
    setIsSubmitting(true);
    setShowRouteDialog(false);

    setTimeout(() => {
      toast({
        title: 'Task Completed',
        description: 'Work item has been routed to the next step. (Mockup)',
        variant: 'success',
      });
      setIsSubmitting(false);
      router.push('/inbox');
    }, 1000);
  };

  const handleClaim = () => {
    toast({
      title: 'Item Claimed',
      description: 'You are now the owner of this work item. (Mockup)',
      variant: 'success',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-4 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/inbox">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Inbox
                </Button>
              </Link>
              <div className="w-px h-6 bg-border" />
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={cn('capitalize', priority.badge)}>
                  {priority.label}
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    workItem.status === 'in_progress'
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'bg-muted text-muted-foreground'
                  }
                >
                  {workItem.status.replace('_', ' ')}
                </Badge>
                {slaInfo && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'gap-1',
                      slaInfo.isOverdue
                        ? 'bg-destructive/10 text-destructive border-destructive/20'
                        : slaInfo.isUrgent
                        ? 'bg-warning/10 text-warning border-warning/20'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {slaInfo.isOverdue || slaInfo.isUrgent ? (
                      <AlertTriangle className="h-3 w-3" />
                    ) : (
                      <Timer className="h-3 w-3" />
                    )}
                    {slaInfo.isOverdue
                      ? 'Overdue'
                      : `${Math.abs(slaInfo.hours)}h left`}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isGroupAssigned ? (
                <Button onClick={handleClaim} className="gap-2">
                  <User className="h-4 w-4" />
                  Claim Item
                </Button>
              ) : (
                !isAssignedToMe && (
                  <Badge variant="outline" className="text-muted-foreground">
                    Read Only
                  </Badge>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Split Layout */}
      <div className="container py-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Panel - Form (60%) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Process Info Card */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-bold truncate">{process?.name}</h1>
                  <p className="text-muted-foreground">
                    ID: <code className="font-mono text-sm">{workItem.id}</code>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Current Step</p>
                  <p className="font-medium text-sm flex items-center gap-1.5">
                    <GitBranch className="h-4 w-4 text-primary" />
                    {currentTask?.name}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Created</p>
                  <p className="font-medium text-sm flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {new Date(workItem.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Assigned</p>
                  <p className="font-medium text-sm flex items-center gap-1.5">
                    {workItem.assignedTo.type === 'group' ? (
                      <>
                        <Users className="h-4 w-4" />
                        Queue
                      </>
                    ) : (
                      <>
                        <User className="h-4 w-4" />
                        {isAssignedToMe ? 'You' : 'Other'}
                      </>
                    )}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Task Type</p>
                  <p className="font-medium text-sm capitalize">{currentTask?.type}</p>
                </div>
              </div>

              {/* Instructions */}
              {currentTask?.config.type === 'user' &&
                (currentTask.config as UserTaskConfig).instructions && (
                  <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="flex items-start gap-3">
                      <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium text-sm mb-1">Instructions</p>
                        <p className="text-sm text-muted-foreground">
                          {(currentTask.config as UserTaskConfig).instructions}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
            </div>

            {/* Form Card */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-semibold text-lg mb-6">Work Item Details</h2>

              {isGroupAssigned ? (
                <div className="text-center py-12">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Claim Required</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                    This work item is in a group queue. Claim it to start working
                    on it.
                  </p>
                  <Button onClick={handleClaim} className="gap-2">
                    <User className="h-4 w-4" />
                    Claim This Item
                  </Button>
                </div>
              ) : (
                <DynamicForm
                  fields={fieldsToShow}
                  values={workItem.fieldValues}
                  onSubmit={handleSave}
                  onComplete={handleComplete}
                  isReadOnly={!isAssignedToMe}
                />
              )}
            </div>
          </div>

          {/* Right Panel - Context (40%) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mini Workflow View */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Workflow Progress</h3>
                <Badge variant="secondary" className="text-xs">
                  Step 3 of 5
                </Badge>
              </div>

              <div className="space-y-3">
                {['Begin', 'Initial Review', 'Manager Approval', 'Finance Check', 'End'].map(
                  (step, index) => {
                    const isCompleted = index < 2;
                    const isCurrent = index === 2;
                    const isPending = index > 2;

                    return (
                      <div key={step} className="flex items-center gap-3">
                        <div
                          className={cn(
                            'h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium',
                            isCompleted && 'bg-success/10 text-success',
                            isCurrent && 'bg-primary/10 text-primary ring-2 ring-primary',
                            isPending && 'bg-muted text-muted-foreground'
                          )}
                        >
                          {isCompleted ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <div className="flex-1">
                          <p
                            className={cn(
                              'text-sm font-medium',
                              isPending && 'text-muted-foreground'
                            )}
                          >
                            {step}
                          </p>
                        </div>
                        {isCurrent && (
                          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                            Current
                          </Badge>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            {/* History */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <History className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">History</h3>
              </div>

              <div className="space-y-4">
                {mockHistory.map((entry, index) => (
                  <div key={entry.id} className="relative pl-6">
                    {/* Timeline line */}
                    {index < mockHistory.length - 1 && (
                      <div className="absolute left-[9px] top-6 bottom-0 w-px bg-border" />
                    )}

                    {/* Timeline dot */}
                    <div
                      className={cn(
                        'absolute left-0 top-1.5 h-[18px] w-[18px] rounded-full border-2 bg-card',
                        entry.action === 'Completed'
                          ? 'border-success'
                          : entry.action === 'In Progress'
                          ? 'border-primary'
                          : 'border-muted-foreground'
                      )}
                    >
                      {entry.action === 'Completed' && (
                        <CheckCircle className="h-3 w-3 text-success absolute top-0.5 left-0.5" />
                      )}
                    </div>

                    <div className="pb-4">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm">{entry.taskName}</p>
                        {entry.duration && (
                          <span className="text-xs text-muted-foreground">
                            {entry.duration}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {entry.action} by {entry.user}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      {entry.notes && (
                        <p className="text-xs text-foreground/70 mt-2 p-2 rounded bg-muted/50">
                          {entry.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Add Comment
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Users className="h-4 w-4" />
                  Reassign
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                >
                  <XCircle className="h-4 w-4" />
                  Cancel Work Item
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Route Selection Dialog */}
      <Dialog open={showRouteDialog} onOpenChange={setShowRouteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Route</DialogTitle>
            <DialogDescription>
              Choose how to route this work item to the next step.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Button
              variant="outline"
              className="w-full justify-between h-auto p-4"
              onClick={() => submitCompletion(pendingValues!, 'approve')}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Approve</p>
                  <p className="text-xs text-muted-foreground">
                    Send to next approval step
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between h-auto p-4"
              onClick={() => submitCompletion(pendingValues!, 'reject')}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Reject</p>
                  <p className="text-xs text-muted-foreground">
                    Return to requestor
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between h-auto p-4"
              onClick={() => submitCompletion(pendingValues!, 'request_info')}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-warning" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Request More Info</p>
                  <p className="text-xs text-muted-foreground">
                    Ask for additional details
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowRouteDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
