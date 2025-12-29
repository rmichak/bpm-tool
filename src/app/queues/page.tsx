'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { queueData } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import {
  Users,
  ChevronDown,
  ChevronRight,
  Clock,
  AlertCircle,
  Hand,
} from 'lucide-react'

const priorityColors: Record<string, string> = {
  low: 'border-l-muted-foreground',
  medium: 'border-l-primary',
  high: 'border-l-warning',
  urgent: 'border-l-destructive',
}

export default function QueuesPage() {
  const { toast } = useToast()
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(queueData.map((q) => q.groupId))
  )

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    setExpandedGroups(newExpanded)
  }

  const handleClaim = (itemId: string) => {
    toast({
      title: 'Item Claimed',
      description: `${itemId} has been claimed and added to your inbox. (Mockup)`,
      variant: 'success',
    })
  }

  const getTimeAgo = (date: string) => {
    const now = new Date()
    const then = new Date(date)
    const diffHours = Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60))
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    return `${Math.floor(diffHours / 24)}d ago`
  }

  return (
    <div className="container py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Queue Browser</h1>
        <p className="text-muted-foreground mt-1">
          View and claim work items from your group queues
        </p>
      </div>

      {/* Queue Groups */}
      <div className="space-y-4">
        {queueData.map((queue, index) => {
          const isExpanded = expandedGroups.has(queue.groupId)

          return (
            <Collapsible
              key={queue.groupId}
              open={isExpanded}
              onOpenChange={() => toggleGroup(queue.groupId)}
            >
              <div
                className="rounded-xl border border-border bg-card overflow-hidden stagger-item"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Group Header */}
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-lg">{queue.groupName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {queue.queueDepth} items available
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge
                        variant={queue.queueDepth > 5 ? 'destructive' : 'secondary'}
                        className="text-sm px-3 py-1"
                      >
                        {queue.queueDepth} in queue
                      </Badge>
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </button>
                </CollapsibleTrigger>

                {/* Queue Items */}
                <CollapsibleContent>
                  <div className="border-t border-border">
                    {queue.items.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                          <AlertCircle className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">
                          No items available in this queue
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {queue.items.map((item) => (
                          <div
                            key={item.id}
                            className={cn(
                              'flex items-center justify-between p-4 pl-5 border-l-4 transition-colors hover:bg-muted/20',
                              priorityColors[item.priority]
                            )}
                          >
                            <div className="flex items-center gap-4">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-medium text-primary">
                                    {item.itemId}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      'capitalize text-xs',
                                      item.priority === 'high' &&
                                        'bg-warning/10 text-warning border-warning/20',
                                      item.priority === 'urgent' &&
                                        'bg-destructive/10 text-destructive border-destructive/20'
                                    )}
                                  >
                                    {item.priority}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {item.processName}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {getTimeAgo(item.createdAt)}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                className="gap-2"
                                onClick={() => handleClaim(item.itemId)}
                              >
                                <Hand className="h-4 w-4" />
                                Claim
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          )
        })}
      </div>

      {/* Empty State */}
      {queueData.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2">No Queue Access</h3>
          <p className="text-muted-foreground">
            You are not a member of any groups with queue access.
          </p>
        </div>
      )}
    </div>
  )
}
