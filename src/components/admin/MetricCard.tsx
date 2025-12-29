'use client'

import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  unit?: string
  trend: number
  isPositive: boolean
  icon: LucideIcon
  description?: string
  className?: string
}

export function MetricCard({
  title,
  value,
  unit,
  trend,
  isPositive,
  icon: Icon,
  description,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5',
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-2xl" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div
            className={cn(
              'flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
              isPositive
                ? 'bg-success/10 text-success'
                : 'bg-destructive/10 text-destructive'
            )}
          >
            {trend > 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span>{Math.abs(trend)}%</span>
          </div>
        </div>

        {/* Value */}
        <div className="mt-4">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold tracking-tight">{value}</span>
            {unit && (
              <span className="text-sm text-muted-foreground">{unit}</span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{title}</p>
        </div>

        {/* Description */}
        {description && (
          <p className="mt-3 text-xs text-muted-foreground/70 border-t border-border pt-3">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}
