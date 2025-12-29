'use client'

import { activityFeed } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import {
  CheckCircle2,
  UserPlus,
  Plus,
  AlertTriangle,
  Rocket,
} from 'lucide-react'

const activityIcons: Record<string, { icon: typeof CheckCircle2; color: string }> = {
  completed: { icon: CheckCircle2, color: 'text-success' },
  assigned: { icon: UserPlus, color: 'text-primary' },
  created: { icon: Plus, color: 'text-muted-foreground' },
  escalated: { icon: AlertTriangle, color: 'text-warning' },
  published: { icon: Rocket, color: 'text-primary' },
}

export function ActivityFeed() {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-6">
        <div>
          <h3 className="text-lg font-semibold">Recent Activity</h3>
          <p className="text-sm text-muted-foreground">Live system updates</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success"></span>
          </span>
          <span className="text-xs text-muted-foreground">Live</span>
        </div>
      </div>

      <div className="max-h-[360px] overflow-y-auto">
        <div className="divide-y divide-border">
          {activityFeed.map((activity, index) => {
            const iconConfig = activityIcons[activity.type] || activityIcons.created
            const Icon = iconConfig.icon

            return (
              <div
                key={activity.id}
                className="flex items-start gap-4 p-4 transition-colors hover:bg-muted/30 stagger-item"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted',
                    iconConfig.color
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user}</span>{' '}
                    <span className="text-muted-foreground">
                      {activity.action}
                    </span>{' '}
                    <span className="font-mono text-primary">{activity.item}</span>
                    {activity.target && (
                      <>
                        <span className="text-muted-foreground"> to </span>
                        <span className="font-medium">{activity.target}</span>
                      </>
                    )}
                    {activity.reason && (
                      <span className="text-muted-foreground">
                        {' '}
                        ({activity.reason})
                      </span>
                    )}
                  </p>
                </div>

                <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                  {activity.time}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
