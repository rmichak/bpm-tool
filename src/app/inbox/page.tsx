'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@/contexts/UserContext'
import { workItemApi, WorkItemListItem } from '@/lib/api/work-items'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import {
  Inbox,
  RefreshCw,
  Clock,
  Users,
  ArrowRight,
  AlertTriangle,
  FileText,
  DollarSign,
  User,
  Loader2,
  UserPlus,
  Plus,
} from 'lucide-react'
import { AssignDialog } from '@/components/inbox/AssignDialog'
import { StartWorkflowDialog } from '@/components/inbox/StartWorkflowDialog'
import { cn } from '@/lib/utils'

const priorityConfig = {
  low: {
    border: 'border-l-muted-foreground',
    badge: 'bg-muted text-muted-foreground',
    label: 'Low',
  },
  normal: {
    border: 'border-l-blue-500',
    badge: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    label: 'Normal',
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
}

export default function InbasketPage() {
  const { currentUser, isLoading: userLoading } = useUser()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<'my-work' | 'available' | 'to-assign'>('my-work')
  const [myWork, setMyWork] = useState<WorkItemListItem[]>([])
  const [available, setAvailable] = useState<WorkItemListItem[]>([])
  const [toAssign, setToAssign] = useState<WorkItemListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [showStartDialog, setShowStartDialog] = useState(false)
  const [selectedItemForAssign, setSelectedItemForAssign] = useState<WorkItemListItem | null>(null)

  const loadData = useCallback(async () => {
    if (!currentUser) return
    try {
      const [myItems, availableItems] = await Promise.all([
        workItemApi.list({ claimedById: currentUser.id }),
        workItemApi.list({ claimedById: null }),
      ])
      const activeMyItems = myItems.filter((item) => item.status === 'active')
      const activeAvailable = availableItems.filter((item) => item.status === 'active')

      // Separate manual distribution items for supervisors
      const manualDistItems = activeAvailable.filter(
        (item) => (item.currentTask.config as Record<string, unknown>)?.distributionMethod === 'manual'
      )
      const selfServiceItems = activeAvailable.filter(
        (item) => (item.currentTask.config as Record<string, unknown>)?.distributionMethod !== 'manual'
      )

      setMyWork(activeMyItems)
      setAvailable(selfServiceItems)
      setToAssign(manualDistItems)
    } catch (error) {
      console.error('Failed to load work items:', error)
      toast({
        title: 'Error',
        description: 'Failed to load work items',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [currentUser, toast])

  useEffect(() => {
    if (currentUser) {
      setIsLoading(true)
      loadData()
    }
  }, [currentUser, loadData])

  const handleRefresh = () => {
    setIsRefreshing(true)
    loadData()
  }

  const handleClaim = async (itemId: string) => {
    if (!currentUser) return
    try {
      await workItemApi.claim(itemId, currentUser.id)
      toast({
        title: 'Item Claimed',
        description: 'Work item is now in your queue',
      })
      loadData()
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      })
    }
  }

  const handleOpenAssignDialog = (item: WorkItemListItem) => {
    setSelectedItemForAssign(item)
    setShowAssignDialog(true)
  }

  const handleAssign = async (userId: string) => {
    if (!selectedItemForAssign || !currentUser) return
    try {
      await workItemApi.assign(selectedItemForAssign.id, userId, currentUser.id)
      toast({
        title: 'Item Assigned',
        description: 'Work item has been assigned successfully',
      })
      setSelectedItemForAssign(null)
      loadData()
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      })
    }
  }

  const handleStartWorkflow = async (
    workflowId: string,
    objectType: string,
    objectData: Record<string, unknown>,
    priority: string,
    objectTypeId?: string
  ) => {
    try {
      const result = await workItemApi.startWorkflow(
        workflowId,
        objectType,
        objectData,
        priority,
        objectTypeId
      )
      toast({
        title: 'Workflow Started',
        description: `Work item created at ${result.currentTaskName}`,
      })
      loadData()
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      })
      throw error
    }
  }

  if (userLoading || isLoading) {
    return (
      <div className="container py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="container py-16 text-center">
        <p className="text-muted-foreground">
          Please select a user to view your inbox.
        </p>
      </div>
    )
  }

  const renderWorkItem = (item: WorkItemListItem, showClaim = false) => {
    const priority =
      priorityConfig[item.priority as keyof typeof priorityConfig] ||
      priorityConfig.normal
    const objectData = item.objectData as Record<string, unknown>

    return (
      <div
        key={item.id}
        className={cn(
          'group relative rounded-xl border bg-card transition-all duration-200',
          'hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5',
          priority.border,
          'border-l-4'
        )}
      >
        <div className="flex items-start gap-4 p-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2 mb-2">
              <Badge
                variant="outline"
                className={cn('text-xs capitalize', priority.badge)}
              >
                {priority.label}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {item.currentTask.type}
              </Badge>
            </div>

            <div className="mb-3">
              <h3 className="font-semibold text-base mb-0.5 truncate group-hover:text-primary transition-colors">
                {item.workflow.process.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                <span className="text-foreground/70 font-medium">
                  {item.currentTask.name}
                </span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
              {objectData.invoiceNumber !== undefined && (
                <div className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  <span className="font-mono">
                    #{String(objectData.invoiceNumber)}
                  </span>
                </div>
              )}
              {objectData.amount !== undefined && (
                <div className="flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span className="font-semibold">
                    {Number(objectData.amount).toLocaleString()}
                  </span>
                </div>
              )}
              {item.claimedBy && (
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  <span>{item.claimedBy.name}</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-1 flex gap-2">
            {showClaim && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleClaim(item.id)}
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                Claim
              </Button>
            )}
            <Link href={`/inbox/${item.id}`}>
              <Button
                variant={showClaim ? 'ghost' : 'outline'}
                size="sm"
                className="gap-2 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all"
              >
                Open
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const renderWorkItemWithAssign = (item: WorkItemListItem) => {
    const priority =
      priorityConfig[item.priority as keyof typeof priorityConfig] ||
      priorityConfig.normal
    const objectData = item.objectData as Record<string, unknown>

    return (
      <div
        key={item.id}
        className={cn(
          'group relative rounded-xl border bg-card transition-all duration-200',
          'hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5',
          priority.border,
          'border-l-4'
        )}
      >
        <div className="flex items-start gap-4 p-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2 mb-2">
              <Badge
                variant="outline"
                className={cn('text-xs capitalize', priority.badge)}
              >
                {priority.label}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {item.currentTask.type}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Manual Assignment
              </Badge>
            </div>

            <div className="mb-3">
              <h3 className="font-semibold text-base mb-0.5 truncate group-hover:text-primary transition-colors">
                {item.workflow.process.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                <span className="text-foreground/70 font-medium">
                  {item.currentTask.name}
                </span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
              {objectData.invoiceNumber !== undefined && (
                <div className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  <span className="font-mono">
                    #{String(objectData.invoiceNumber)}
                  </span>
                </div>
              )}
              {objectData.amount !== undefined && (
                <div className="flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span className="font-semibold">
                    {Number(objectData.amount).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-1 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenAssignDialog(item)}
              className="gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Assign
            </Button>
            <Link href={`/inbox/${item.id}`}>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all"
              >
                Open
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const renderEmptyState = (type: 'my-work' | 'available' | 'to-assign') => {
    const config = {
      'my-work': {
        title: 'No Work Items',
        description: "You don't have any work items claimed. Check the Available tab for items to work on.",
      },
      'available': {
        title: 'No Available Items',
        description: 'There are no unclaimed items in the queue right now.',
      },
      'to-assign': {
        title: 'No Items to Assign',
        description: 'There are no manual-distribution items waiting for assignment.',
      },
    }
    const { title, description } = config[type]

    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <Inbox className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-muted-foreground max-w-sm mx-auto">{description}</p>
      </div>
    )
  }

  return (
    <div className="container py-8 px-4">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
            <Inbox className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inbasket</h1>
            <p className="text-muted-foreground mt-0.5">
              {myWork.length} in your queue, {available.length} available
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            className="gap-2"
            onClick={() => setShowStartDialog(true)}
          >
            <Plus className="h-4 w-4" />
            New Work Item
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{myWork.length}</p>
              <p className="text-sm text-muted-foreground">My Work</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{available.length}</p>
              <p className="text-sm text-muted-foreground">Available</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {
                  [...myWork, ...available].filter(
                    (i) => i.priority === 'high' || i.priority === 'urgent'
                  ).length
                }
              </p>
              <p className="text-sm text-muted-foreground">High Priority</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {myWork.length + available.length}
              </p>
              <p className="text-sm text-muted-foreground">Total Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'my-work' | 'available' | 'to-assign')}
      >
        <TabsList className="mb-6">
          <TabsTrigger value="my-work" className="gap-2">
            <User className="h-4 w-4" />
            My Work
            {myWork.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {myWork.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="available" className="gap-2">
            <Users className="h-4 w-4" />
            Available
            {available.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {available.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="to-assign" className="gap-2">
            <UserPlus className="h-4 w-4" />
            To Assign
            {toAssign.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {toAssign.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-work">
          <div className="space-y-3">
            {myWork.length === 0
              ? renderEmptyState('my-work')
              : myWork.map((item) => renderWorkItem(item))}
          </div>
        </TabsContent>

        <TabsContent value="available">
          <div className="space-y-3">
            {available.length === 0
              ? renderEmptyState('available')
              : available.map((item) => renderWorkItem(item, true))}
          </div>
        </TabsContent>

        <TabsContent value="to-assign">
          <div className="space-y-3">
            {toAssign.length === 0
              ? renderEmptyState('to-assign')
              : toAssign.map((item) => renderWorkItemWithAssign(item))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Assign Dialog */}
      <AssignDialog
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
        groupIds={
          selectedItemForAssign
            ? (() => {
                const config = selectedItemForAssign.currentTask.config as Record<string, unknown>;
                // Support both groupIds (array) and groupId (single string)
                if (config?.groupIds) return config.groupIds as string[];
                if (config?.groupId) return [config.groupId as string];
                return [];
              })()
            : []
        }
        onAssign={handleAssign}
      />

      {/* Start Workflow Dialog */}
      <StartWorkflowDialog
        open={showStartDialog}
        onOpenChange={setShowStartDialog}
        onStart={handleStartWorkflow}
      />
    </div>
  )
}
