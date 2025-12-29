'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { completedWorkItems } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import {
  Search,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Filter,
} from 'lucide-react'

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredItems = completedWorkItems.filter(
    (item) =>
      item.itemId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.processName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="container py-8 px-4">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">History</h1>
          <p className="text-muted-foreground mt-1">
            View your completed work items
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          {completedWorkItems.length} completed items
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by ID or process..."
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Calendar className="h-4 w-4" />
          Date Range
        </Button>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          All Status
        </Button>
      </div>

      {/* History Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Item ID</TableHead>
              <TableHead>Process</TableHead>
              <TableHead>Completed By</TableHead>
              <TableHead>Completed At</TableHead>
              <TableHead className="text-center">Duration</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item, index) => (
              <TableRow
                key={item.id}
                className="stagger-item cursor-pointer hover:bg-muted/50"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <TableCell>
                  <span className="font-mono font-medium text-primary">
                    {item.itemId}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.processName}
                </TableCell>
                <TableCell>{item.completedBy}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDate(item.completedAt)}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1 text-sm">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="font-mono">{item.duration}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      'capitalize',
                      item.finalStatus === 'approved'
                        ? 'bg-success/10 text-success border-success/20'
                        : 'bg-destructive/10 text-destructive border-destructive/20'
                    )}
                  >
                    {item.finalStatus === 'approved' ? (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    {item.finalStatus}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredItems.length === 0 && (
          <div className="p-12 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">No Results Found</h3>
            <p className="text-sm text-muted-foreground">
              No completed items match your search criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
