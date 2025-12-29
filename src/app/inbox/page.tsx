'use client';

import { useState, useMemo } from 'react';
import { WorkItemCard } from '@/components/inbox/WorkItemCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  mockWorkItems,
  getProcessById,
  getTaskById,
  getCurrentUser,
} from '@/lib/mock-data';
import {
  Inbox,
  Filter,
  RefreshCw,
  ArrowUpDown,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Trash2,
  UserPlus,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type SortOption = 'date-desc' | 'date-asc' | 'priority' | 'sla';
type FilterPriority = 'all' | 'low' | 'medium' | 'high' | 'urgent';
type FilterStatus = 'all' | 'pending' | 'in_progress';

export default function InboxPage() {
  const { toast } = useToast();
  const currentUser = getCurrentUser();
  const [sortBy, setSortBy] = useState<SortOption>('priority');
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Get work items assigned to current user or their groups
  const allWorkItems = mockWorkItems.filter(
    (item) =>
      item.status !== 'completed' &&
      item.status !== 'cancelled' &&
      (item.assignedTo.userId === currentUser.id ||
        item.assignedTo.type === 'group')
  );

  // Apply filters and sorting
  const workItems = useMemo(() => {
    let items = [...allWorkItems];

    // Filter by priority
    if (filterPriority !== 'all') {
      items = items.filter((item) => item.priority === filterPriority);
    }

    // Filter by status
    if (filterStatus !== 'all') {
      items = items.filter((item) => item.status === filterStatus);
    }

    // Sort
    items.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'priority': {
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        case 'sla': {
          const aDue = (a as any).dueAt ? new Date((a as any).dueAt).getTime() : Infinity;
          const bDue = (b as any).dueAt ? new Date((b as any).dueAt).getTime() : Infinity;
          return aDue - bDue;
        }
        default:
          return 0;
      }
    });

    return items;
  }, [allWorkItems, filterPriority, filterStatus, sortBy]);

  const pendingCount = allWorkItems.filter((w) => w.status === 'pending').length;
  const inProgressCount = allWorkItems.filter((w) => w.status === 'in_progress').length;
  const urgentCount = allWorkItems.filter((w) => w.priority === 'urgent' || w.priority === 'high').length;

  const handleSelectItem = (id: string, selected: boolean) => {
    const newSelected = new Set(selectedItems);
    if (selected) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === workItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(workItems.map((w) => w.id)));
    }
  };

  const handleBulkAction = (action: string) => {
    toast({
      title: `${action}`,
      description: `Action performed on ${selectedItems.size} item(s). (Mockup)`,
    });
    setSelectedItems(new Set());
  };

  const handleRefresh = () => {
    toast({
      title: 'Inbox Refreshed',
      description: 'Your inbox has been updated with the latest items.',
    });
  };

  return (
    <div className="container py-8 px-4">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
            <Inbox className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Inbox</h1>
            <p className="text-muted-foreground mt-0.5">
              {allWorkItems.length} work item{allWorkItems.length !== 1 ? 's' : ''}{' '}
              assigned to you
            </p>
          </div>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <ArrowUpDown className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{inProgressCount}</p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{urgentCount}</p>
              <p className="text-sm text-muted-foreground">High Priority</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{allWorkItems.length}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Actions Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6 p-4 rounded-xl border border-border bg-card/50">
        {/* Select all */}
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedItems.size === workItems.length && workItems.length > 0}
            onCheckedChange={handleSelectAll}
            className="border-muted-foreground/30"
          />
          <span className="text-sm text-muted-foreground">
            {selectedItems.size > 0
              ? `${selectedItems.size} selected`
              : 'Select all'}
          </span>
        </div>

        {/* Bulk actions */}
        {selectedItems.size > 0 && (
          <>
            <div className="w-px h-6 bg-border" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('Approved')}
              className="gap-2"
            >
              <CheckCircle2 className="h-4 w-4 text-success" />
              Approve
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('Rejected')}
              className="gap-2"
            >
              <XCircle className="h-4 w-4 text-destructive" />
              Reject
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('Reassigned')}
              className="gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Reassign
            </Button>
          </>
        )}

        <div className="flex-1" />

        {/* Filters */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Priority
              {filterPriority !== 'all' && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {filterPriority}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setFilterPriority('all')}>
              All Priorities
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterPriority('urgent')}>
              Urgent
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterPriority('high')}>
              High
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterPriority('medium')}>
              Medium
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterPriority('low')}>
              Low
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Status
              {filterStatus !== 'all' && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {filterStatus.replace('_', ' ')}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setFilterStatus('all')}>
              All Statuses
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus('pending')}>
              Pending
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus('in_progress')}>
              In Progress
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowUpDown className="h-4 w-4" />
              Sort
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setSortBy('priority')}>
              Priority (High First)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('sla')}>
              SLA (Urgent First)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('date-desc')}>
              Date (Newest First)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('date-asc')}>
              Date (Oldest First)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Results info */}
      {(filterPriority !== 'all' || filterStatus !== 'all') && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            Showing {workItems.length} of {allWorkItems.length} items
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterPriority('all');
              setFilterStatus('all');
            }}
          >
            Clear filters
          </Button>
        </div>
      )}

      {/* Work Items List */}
      <div className="space-y-3">
        {workItems.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Inbox className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No Work Items</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              {filterPriority !== 'all' || filterStatus !== 'all'
                ? 'No items match your current filters. Try adjusting your filter criteria.'
                : "You don't have any work items assigned to you at the moment."}
            </p>
          </div>
        ) : (
          workItems.map((item, index) => {
            const process = getProcessById(item.processId);
            const currentTask = getTaskById(item.currentTaskId);

            if (!process || !currentTask) return null;

            return (
              <div
                key={item.id}
                className="stagger-item"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <WorkItemCard
                  workItem={item}
                  process={process}
                  currentTask={currentTask}
                  selected={selectedItems.has(item.id)}
                  onSelect={handleSelectItem}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
