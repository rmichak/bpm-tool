'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { workloadData } from '@/lib/mock-data'

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; items: number } }> }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-xl">
        <p className="font-medium">{payload[0].payload.name}</p>
        <p className="text-sm text-muted-foreground">
          <span className="font-mono text-primary">{payload[0].payload.items}</span> items
        </p>
      </div>
    )
  }
  return null
}

export function WorkloadChart() {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Workload by User</h3>
        <p className="text-sm text-muted-foreground">Current item assignments</p>
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={workloadData}
            layout="vertical"
            margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
          >
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <YAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              width={100}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.5)' }} />
            <Bar
              dataKey="items"
              radius={[0, 4, 4, 0]}
              maxBarSize={24}
            >
              {workloadData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`hsl(var(--chart-${(index % 5) + 1}))`}
                  className="transition-opacity hover:opacity-80"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
