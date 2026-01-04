'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Trash2, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Process {
  id: string
  name: string
  description: string | null
  status: string
  workflows: Array<{
    id: string
    name: string
    isSubflow: boolean
  }>
}

interface StartWorkflowDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onStart: (
    workflowId: string,
    objectType: string,
    objectData: Record<string, string>,
    priority: string
  ) => Promise<void>
}

const priorityOptions = ['low', 'normal', 'high', 'urgent']

export function StartWorkflowDialog({
  open,
  onOpenChange,
  onStart,
}: StartWorkflowDialogProps) {
  const [processes, setProcesses] = useState<Process[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isStarting, setIsStarting] = useState(false)

  // Form state
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null)
  const [objectType, setObjectType] = useState('document')
  const [priority, setPriority] = useState('normal')
  const [fields, setFields] = useState<Array<{ key: string; value: string }>>([
    { key: '', value: '' },
  ])

  useEffect(() => {
    if (open) {
      loadProcesses()
    }
  }, [open])

  const loadProcesses = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/processes')
      if (res.ok) {
        const data = await res.json()
        // Filter to only active processes with non-subflow workflows
        setProcesses(
          data.filter(
            (p: Process) =>
              p.status === 'active' && p.workflows.some((w) => !w.isSubflow)
          )
        )
      }
    } catch (error) {
      console.error('Failed to load processes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddField = () => {
    setFields([...fields, { key: '', value: '' }])
  }

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index))
  }

  const handleFieldChange = (
    index: number,
    field: 'key' | 'value',
    value: string
  ) => {
    const newFields = [...fields]
    newFields[index][field] = value
    setFields(newFields)
  }

  const handleStart = async () => {
    if (!selectedWorkflowId) return

    const objectData: Record<string, string> = {}
    fields.forEach(({ key, value }) => {
      if (key.trim()) {
        objectData[key.trim()] = value
      }
    })

    setIsStarting(true)
    try {
      await onStart(selectedWorkflowId, objectType, objectData, priority)
      // Reset form
      setSelectedWorkflowId(null)
      setObjectType('document')
      setPriority('normal')
      setFields([{ key: '', value: '' }])
      onOpenChange(false)
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Start New Workflow</DialogTitle>
          <DialogDescription>
            Select a workflow and provide the initial object data.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Workflow Selection */}
            <div className="space-y-3">
              <Label>Select Workflow</Label>
              <div className="grid gap-2 max-h-40 overflow-y-auto">
                {processes.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No active workflows available
                  </p>
                ) : (
                  processes.map((process) => {
                    const mainWorkflow = process.workflows.find((w) => !w.isSubflow)
                    if (!mainWorkflow) return null

                    return (
                      <button
                        key={process.id}
                        type="button"
                        onClick={() => setSelectedWorkflowId(mainWorkflow.id)}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-lg border text-left transition-colors',
                          selectedWorkflowId === mainWorkflow.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        <div>
                          <p className="font-medium text-sm">{process.name}</p>
                          {process.description && (
                            <p className="text-xs text-muted-foreground">
                              {process.description}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {process.status}
                        </Badge>
                      </button>
                    )
                  })
                )}
              </div>
            </div>

            {/* Object Type & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="objectType">Object Type</Label>
                <Input
                  id="objectType"
                  value={objectType}
                  onChange={(e) => setObjectType(e.target.value)}
                  placeholder="invoice, order, request..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {priorityOptions.map((p) => (
                    <option key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Object Data Fields */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Object Data</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAddField}
                  className="gap-1 h-7"
                >
                  <Plus className="h-3 w-3" />
                  Add Field
                </Button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {fields.map((field, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      placeholder="Key"
                      value={field.key}
                      onChange={(e) => handleFieldChange(index, 'key', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Value"
                      value={field.value}
                      onChange={(e) => handleFieldChange(index, 'value', e.target.value)}
                      className="flex-1"
                    />
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveField(index)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleStart}
            disabled={!selectedWorkflowId || isStarting}
            className="gap-2"
          >
            {isStarting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Start Workflow
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
