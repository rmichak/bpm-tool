'use client'

import { use, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/UserContext'
import { workItemApi, WorkItemDetail, OutboundRoute, HistoryEntry } from '@/lib/api/work-items'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  ArrowLeft,
  Clock,
  User,
  GitBranch,
  CheckCircle,
  AlertCircle,
  Users,
  History,
  FileText,
  ArrowRight,
  Loader2,
  Play,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageProps {
  params: Promise<{ itemId: string }>
}

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

const actionIcons: Record<string, React.ReactNode> = {
  created: <Play className="h-3 w-3" />,
  arrived: <ArrowRight className="h-3 w-3" />,
  claimed: <User className="h-3 w-3" />,
  unclaimed: <Users className="h-3 w-3" />,
  released: <CheckCircle className="h-3 w-3" />,
  completed: <CheckCircle className="h-3 w-3" />,
}

export default function WorkItemDetailPage({ params }: PageProps) {
  const { itemId } = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const { currentUser } = useUser()
  const [workItem, setWorkItem] = useState<WorkItemDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isReleasing, setIsReleasing] = useState<string | null>(null)

  const loadWorkItem = useCallback(async () => {
    try {
      const data = await workItemApi.get(itemId)
      setWorkItem(data)
    } catch (error) {
      console.error('Failed to load work item:', error)
      toast({
        title: 'Error',
        description: 'Failed to load work item',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [itemId, toast])

  useEffect(() => {
    loadWorkItem()
  }, [loadWorkItem])

  const handleClaim = async () => {
    if (!currentUser || !workItem) return
    try {
      await workItemApi.claim(workItem.id, currentUser.id)
      toast({
        title: 'Item Claimed',
        description: 'Work item is now in your queue',
      })
      loadWorkItem()
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      })
    }
  }

  const handleUnclaim = async () => {
    if (!workItem) return
    try {
      await workItemApi.unclaim(workItem.id)
      toast({
        title: 'Item Released',
        description: 'Work item returned to queue',
      })
      loadWorkItem()
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      })
    }
  }

  const handleRelease = async (route: OutboundRoute) => {
    if (!currentUser || !workItem) return
    const routeLabel = route.label || 'default'
    setIsReleasing(route.id)
    try {
      const result = await workItemApi.release(workItem.id, routeLabel, currentUser.id)

      // Check if item is now completed
      if (result.status === 'completed' || result.currentTask.type === 'end') {
        toast({
          title: 'Workflow Completed',
          description: 'Work item has been completed',
        })
        router.push('/inbox')
      } else {
        toast({
          title: 'Item Routed',
          description: `Moved to: ${result.currentTask.name}`,
        })
        loadWorkItem()
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      })
    } finally {
      setIsReleasing(null)
    }
  }

  if (isLoading) {
    return (
      <div className="container py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

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
    )
  }

  const priority =
    priorityConfig[workItem.priority as keyof typeof priorityConfig] ||
    priorityConfig.normal
  const objectData = workItem.objectData as Record<string, unknown>
  const isClaimedByMe = workItem.claimedById === currentUser?.id
  const isClaimedByOther = workItem.claimedById && !isClaimedByMe
  const outboundRoutes = workItem.currentTask.outboundRoutes || []

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
                    workItem.status === 'active'
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'bg-muted text-muted-foreground'
                  }
                >
                  {workItem.status}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!workItem.claimedById && (
                <Button onClick={handleClaim} className="gap-2">
                  <User className="h-4 w-4" />
                  Claim Item
                </Button>
              )}
              {isClaimedByMe && (
                <Button variant="outline" onClick={handleUnclaim} className="gap-2">
                  <Users className="h-4 w-4" />
                  Release to Queue
                </Button>
              )}
              {isClaimedByOther && (
                <Badge variant="outline" className="text-muted-foreground">
                  Claimed by {workItem.claimedBy?.name}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Panel - Object Data */}
          <div className="lg:col-span-3 space-y-6">
            {/* Process Info Card */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-bold truncate">
                    {workItem.workflow.process.name}
                  </h1>
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
                    {workItem.currentTask.name}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Task Type</p>
                  <p className="font-medium text-sm capitalize">
                    {workItem.currentTask.type}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Created</p>
                  <p className="font-medium text-sm flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {new Date(workItem.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Object Type</p>
                  <p className="font-medium text-sm capitalize">{workItem.objectType}</p>
                </div>
              </div>
            </div>

            {/* Object Data Card */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-semibold text-lg mb-4">Object Data</h2>
              <div className="space-y-4">
                {Object.entries(objectData).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between items-start py-2 border-b border-border last:border-0"
                  >
                    <span className="text-sm text-muted-foreground capitalize">
                      {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm font-medium text-right max-w-[60%]">
                      {typeof value === 'number' && key.toLowerCase().includes('amount')
                        ? `$${value.toLocaleString()}`
                        : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Route Actions */}
            {isClaimedByMe && outboundRoutes.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="font-semibold text-lg mb-4">Route Actions</h2>
                <div className="flex flex-wrap gap-3">
                  {outboundRoutes.map((route) => {
                    const label = route.label || 'Continue'
                    const isEnd = route.targetTask.type === 'end'
                    return (
                      <Button
                        key={route.id}
                        variant={isEnd ? 'default' : 'outline'}
                        className="gap-2"
                        onClick={() => handleRelease(route)}
                        disabled={isReleasing !== null}
                      >
                        {isReleasing === route.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isEnd ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <ArrowRight className="h-4 w-4" />
                        )}
                        {label}
                        {!isEnd && (
                          <span className="text-xs text-muted-foreground">
                            {' '}
                            -&gt; {route.targetTask.name}
                          </span>
                        )}
                      </Button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Not claimed prompt */}
            {!workItem.claimedById && (
              <div className="rounded-xl border border-border bg-card p-6 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Claim Required</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                  This work item is unclaimed. Claim it to start working on it.
                </p>
                <Button onClick={handleClaim} className="gap-2">
                  <User className="h-4 w-4" />
                  Claim This Item
                </Button>
              </div>
            )}
          </div>

          {/* Right Panel - History */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <History className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">History</h3>
              </div>

              {workItem.history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No history yet
                </p>
              ) : (
                <div className="space-y-4">
                  {workItem.history.map((entry, index) => (
                    <div key={entry.id} className="relative pl-6">
                      {index < workItem.history.length - 1 && (
                        <div className="absolute left-[9px] top-6 bottom-0 w-px bg-border" />
                      )}

                      <div
                        className={cn(
                          'absolute left-0 top-1.5 h-[18px] w-[18px] rounded-full border-2 bg-card flex items-center justify-center',
                          entry.action === 'completed' || entry.action === 'released'
                            ? 'border-success'
                            : entry.action === 'claimed'
                              ? 'border-primary'
                              : 'border-muted-foreground'
                        )}
                      >
                        {actionIcons[entry.action] || <Clock className="h-3 w-3" />}
                      </div>

                      <div className="pb-4">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm">{entry.taskName}</p>
                          {entry.routeLabel && (
                            <Badge variant="outline" className="text-xs">
                              {entry.routeLabel}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground capitalize">
                          {entry.action}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.timestamp).toLocaleString()}
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
              )}
            </div>

            {/* Quick Actions */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link href="/inbox">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Inbox
                  </Button>
                </Link>
                {isClaimedByMe && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                    onClick={handleUnclaim}
                  >
                    <XCircle className="h-4 w-4" />
                    Release to Queue
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
