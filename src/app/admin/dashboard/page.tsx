'use client'

import { MetricCard } from '@/components/admin/MetricCard'
import { WorkloadChart } from '@/components/admin/charts/WorkloadChart'
import { ThroughputChart } from '@/components/admin/charts/ThroughputChart'
import { SLAComplianceChart } from '@/components/admin/charts/SLAComplianceChart'
import { BottleneckTable } from '@/components/admin/BottleneckTable'
import { ActivityFeed } from '@/components/admin/ActivityFeed'
import { dashboardMetrics } from '@/lib/mock-data'
import {
  FileStack,
  Clock,
  Timer,
  Users,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AdminDashboard() {
  return (
    <div className="container py-8 px-4">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor your workflow performance and team activity
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <div className="text-xs text-muted-foreground">
            Last updated: Just now
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <MetricCard
          title="Active Items"
          value={dashboardMetrics.activeItems.value}
          trend={dashboardMetrics.activeItems.trend}
          isPositive={dashboardMetrics.activeItems.isPositive}
          icon={FileStack}
          description="Currently in workflow"
        />
        <MetricCard
          title="Pending SLA"
          value={dashboardMetrics.pendingSLA.value}
          trend={dashboardMetrics.pendingSLA.trend}
          isPositive={dashboardMetrics.pendingSLA.isPositive}
          icon={Clock}
          description="Items approaching deadline"
        />
        <MetricCard
          title="Avg Completion"
          value={dashboardMetrics.avgCompletionTime.value}
          unit={dashboardMetrics.avgCompletionTime.unit}
          trend={dashboardMetrics.avgCompletionTime.trend}
          isPositive={dashboardMetrics.avgCompletionTime.isPositive}
          icon={Timer}
          description="Average time to complete"
        />
        <MetricCard
          title="Active Users"
          value={dashboardMetrics.activeUsers.value}
          trend={dashboardMetrics.activeUsers.trend}
          isPositive={dashboardMetrics.activeUsers.isPositive}
          icon={Users}
          description="Users online today"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        <WorkloadChart />
        <ThroughputChart />
        <SLAComplianceChart />
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <BottleneckTable />
        <ActivityFeed />
      </div>
    </div>
  )
}
