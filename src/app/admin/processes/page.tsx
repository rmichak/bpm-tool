'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Copy,
  Archive,
  GitBranch,
  ExternalLink,
  Loader2,
  Play,
  Pause,
  Eye,
  FileType,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { ObjectTypesManager } from '@/components/admin/ObjectTypesManager'

interface Workflow {
  id: string
  name: string
  isSubflow: boolean
  version: number
}

interface Process {
  id: string
  name: string
  description: string | null
  status: string
  createdAt: string
  updatedAt: string
  workflows: Workflow[]
}

const statusColors: Record<string, string> = {
  running: 'bg-success/10 text-success border-success/20',
  paused: 'bg-warning/10 text-warning border-warning/20',
  archived: 'bg-muted text-muted-foreground',
}

export default function ProcessesPage() {
  const { toast } = useToast()
  const [processes, setProcesses] = useState<Process[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [objectTypesProcess, setObjectTypesProcess] = useState<Process | null>(null)

  const loadProcesses = useCallback(async () => {
    try {
      const res = await fetch('/api/processes')
      if (res.ok) {
        const data = await res.json()
        setProcesses(data)
      }
    } catch (error) {
      console.error('Failed to load processes:', error)
      toast({
        title: 'Error',
        description: 'Failed to load processes',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadProcesses()
  }, [loadProcesses])

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  const filteredProcesses = processes.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAction = (action: string, name: string) => {
    toast({
      title: `${action} Process`,
      description: `"${name}" has been ${action.toLowerCase()}d. (Mockup)`,
    })
  }

  const handleStatusChange = async (processId: string, newStatus: string, name: string) => {
    try {
      const res = await fetch(`/api/processes/${processId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        toast({
          title: 'Status Updated',
          description: `"${name}" is now ${newStatus}.`,
        })
        loadProcesses()
      } else {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update status')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="container py-8 px-4">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Processes</h1>
          <p className="text-muted-foreground mt-1">
            Manage your workflow processes and configurations
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Process
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search processes..."
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Status: All
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>All</DropdownMenuItem>
            <DropdownMenuItem>Active</DropdownMenuItem>
            <DropdownMenuItem>Draft</DropdownMenuItem>
            <DropdownMenuItem>Archived</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Processes Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>Process Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Workflows</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProcesses.map((process, index) => {
              const workflows = process.workflows || []
              const isExpanded = expandedRows.has(process.id)

              return (
                <React.Fragment key={process.id}>
                  <TableRow
                    className="stagger-item cursor-pointer"
                    style={{ animationDelay: `${index * 0.05}s` }}
                    onClick={() => toggleRow(process.id)}
                  >
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{process.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {process.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn('capitalize', statusColors[process.status])}
                        >
                          {process.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        {workflows.length}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(process.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {process.status === 'paused' && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(process.id, 'running', process.name)}
                                className="text-success"
                              >
                                <Play className="h-4 w-4 mr-2" />
                                Start
                              </DropdownMenuItem>
                            )}
                            {process.status === 'running' && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(process.id, 'paused', process.name)}
                              >
                                <Pause className="h-4 w-4 mr-2" />
                                Pause
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => setObjectTypesProcess(process)}
                            >
                              <FileType className="h-4 w-4 mr-2" />
                              Object Types
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleAction('Edit', process.name)}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleAction('Clone', process.name)}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Clone
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleAction('Archive', process.name)}
                              className="text-destructive"
                            >
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Workflows */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} className="p-0">
                          <div className="bg-muted/30 border-t border-border px-8 py-4">
                            <div className="flex items-center gap-2 mb-3">
                              <GitBranch className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">
                                Workflows ({workflows.length})
                              </span>
                            </div>
                            <div className="space-y-2">
                              {workflows.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                  No workflows defined
                                </p>
                              ) : (
                                workflows.map((workflow) => (
                                  <div
                                    key={workflow.id}
                                    className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <GitBranch className="h-4 w-4 text-primary" />
                                      </div>
                                      <div>
                                        <p className="font-medium text-sm">
                                          {workflow.name}
                                        </p>
                                        <div className="flex items-center gap-2">
                                          <Badge
                                            variant="secondary"
                                            className="text-[10px] h-5"
                                          >
                                            v{workflow.version}
                                          </Badge>
                                          {!workflow.isSubflow && (
                                            <Badge
                                              variant="outline"
                                              className="text-[10px] h-5"
                                            >
                                              Main Flow
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <Link href={`/builder/${workflow.id}`}>
                                      <Button variant="ghost" size="sm" className="gap-2">
                                        {process.status === 'running' ? (
                                          <>
                                            <Eye className="h-4 w-4" />
                                            View
                                          </>
                                        ) : (
                                          <>
                                            <ExternalLink className="h-4 w-4" />
                                            Edit
                                          </>
                                        )}
                                      </Button>
                                    </Link>
                                  </div>
                                ))
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2 gap-2"
                              >
                                <Plus className="h-4 w-4" />
                                Add Workflow
                              </Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                </React.Fragment>
              )
            })}
          </TableBody>
        </Table>
        )}
      </div>

      {/* Object Types Manager Dialog */}
      {objectTypesProcess && (
        <ObjectTypesManager
          processId={objectTypesProcess.id}
          processName={objectTypesProcess.name}
          open={!!objectTypesProcess}
          onOpenChange={(open) => {
            if (!open) setObjectTypesProcess(null)
          }}
        />
      )}
    </div>
  )
}
