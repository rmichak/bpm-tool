'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { slaComplianceData } from '@/lib/mock-data'

const COLORS = [
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(var(--destructive))',
]

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; value: number } }> }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-xl">
        <p className="font-medium">{payload[0].payload.name}</p>
        <p className="text-sm text-muted-foreground">
          <span className="font-mono font-medium">{payload[0].payload.value}%</span> of items
        </p>
      </div>
    )
  }
  return null
}

function CustomLegend() {
  return (
    <div className="flex justify-center gap-6 pt-4">
      {slaComplianceData.map((entry, index) => (
        <div key={`legend-${index}`} className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: COLORS[index] }}
          />
          <span className="text-sm text-muted-foreground">{entry.name}</span>
        </div>
      ))}
    </div>
  )
}

export function SLAComplianceChart() {
  const onTimePercentage = slaComplianceData[0].value

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">SLA Compliance</h3>
        <p className="text-sm text-muted-foreground">Current period performance</p>
      </div>

      <div className="relative h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slaComplianceData}
              cx="50%"
              cy="45%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {slaComplianceData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index]}
                  className="transition-opacity hover:opacity-80"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 text-center">
          <p className="text-3xl font-bold">{onTimePercentage}%</p>
          <p className="text-xs text-muted-foreground">On Time</p>
        </div>
      </div>
    </div>
  )
}
