'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts'
import { throughputData } from '@/lib/mock-data'

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-xl">
        <p className="font-medium mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.dataKey === 'completed' ? 'Completed' : 'Submitted'}:{' '}
            <span className="font-mono font-medium">{entry.value}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function ThroughputChart() {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Process Throughput</h3>
        <p className="text-sm text-muted-foreground">Items completed vs submitted (7 days)</p>
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={throughputData}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: 20 }}
              formatter={(value) => (
                <span className="text-sm text-muted-foreground capitalize">{value}</span>
              )}
            />
            <Line
              type="monotone"
              dataKey="completed"
              stroke="hsl(var(--success))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--success))', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
            />
            <Line
              type="monotone"
              dataKey="submitted"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
