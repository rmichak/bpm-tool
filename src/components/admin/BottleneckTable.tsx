'use client'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { bottleneckTasks } from '@/lib/mock-data'
import { AlertTriangle, ExternalLink } from 'lucide-react'

export function BottleneckTable() {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Bottleneck Tasks
          </h3>
          <p className="text-sm text-muted-foreground">
            Tasks with longest wait times
          </p>
        </div>
        <Button variant="outline" size="sm">
          View All
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task</TableHead>
            <TableHead>Process</TableHead>
            <TableHead className="text-right">Avg Wait</TableHead>
            <TableHead className="text-right">Items</TableHead>
            <TableHead className="w-[60px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bottleneckTasks.map((task, index) => (
            <TableRow key={task.id} className="stagger-item" style={{ animationDelay: `${index * 0.05}s` }}>
              <TableCell className="font-medium">{task.taskName}</TableCell>
              <TableCell className="text-muted-foreground">
                {task.process}
              </TableCell>
              <TableCell className="text-right">
                <Badge
                  variant={
                    parseFloat(task.avgWaitTime) > 10
                      ? 'destructive'
                      : parseFloat(task.avgWaitTime) > 5
                      ? 'warning'
                      : 'secondary'
                  }
                  className="font-mono"
                >
                  {task.avgWaitTime}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-mono">
                {task.itemsStuck}
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
