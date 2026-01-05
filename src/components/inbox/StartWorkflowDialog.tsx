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
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Loader2, Play, ChevronRight, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DynamicFieldInput,
  getDefaultValue,
  type FieldDefinition,
  type FieldValue,
} from '@/components/forms/DynamicFieldInput'
import { validateAllFields, formValuesToObjectData } from '@/lib/validation'

interface ObjectType {
  id: string
  processId: string
  name: string
  description: string | null
  fields: FieldDefinition[]
}

interface Process {
  id: string
  name: string
  description: string | null
  status: string
  objectTypes: ObjectType[]
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
    objectData: Record<string, unknown>,
    priority: string,
    objectTypeId?: string
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

  // Step state
  const [step, setStep] = useState<'process' | 'objectType' | 'fields'>('process')

  // Selection state
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null)
  const [selectedObjectType, setSelectedObjectType] = useState<ObjectType | null>(null)
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null)

  // Form state
  const [priority, setPriority] = useState('normal')
  const [fieldValues, setFieldValues] = useState<Record<string, FieldValue>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      loadProcesses()
      resetForm()
    }
  }, [open])

  const resetForm = () => {
    setStep('process')
    setSelectedProcess(null)
    setSelectedObjectType(null)
    setSelectedWorkflowId(null)
    setPriority('normal')
    setFieldValues({})
    setFieldErrors({})
  }

  const loadProcesses = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/processes')
      if (res.ok) {
        const data = await res.json()
        // Load object types for each active process
        const processesWithTypes = await Promise.all(
          data
            .filter((p: Process) => p.status === 'running' && p.workflows.some((w) => !w.isSubflow))
            .map(async (p: Process) => {
              const typesRes = await fetch(`/api/processes/${p.id}/object-types`)
              const objectTypes = typesRes.ok ? await typesRes.json() : []
              return { ...p, objectTypes }
            })
        )
        setProcesses(processesWithTypes)
      }
    } catch (error) {
      console.error('Failed to load processes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProcessSelect = (process: Process) => {
    setSelectedProcess(process)
    const mainWorkflow = process.workflows.find((w) => !w.isSubflow)
    setSelectedWorkflowId(mainWorkflow?.id || null)

    // If process has object types, go to object type selection
    // Otherwise, go directly to fields (fallback to manual entry)
    if (process.objectTypes.length > 0) {
      if (process.objectTypes.length === 1) {
        // Auto-select if only one object type
        handleObjectTypeSelect(process.objectTypes[0])
      } else {
        setStep('objectType')
      }
    } else {
      // No object types defined - use legacy mode (manual fields)
      setSelectedObjectType(null)
      setStep('fields')
    }
  }

  const handleObjectTypeSelect = (objectType: ObjectType) => {
    setSelectedObjectType(objectType)
    // Initialize field values with defaults
    const defaults: Record<string, FieldValue> = {}
    for (const field of objectType.fields) {
      defaults[field.name] = getDefaultValue(field)
    }
    setFieldValues(defaults)
    setFieldErrors({})
    setStep('fields')
  }

  const handleFieldChange = (fieldName: string, value: FieldValue) => {
    setFieldValues((prev) => ({ ...prev, [fieldName]: value }))
    // Clear error when field is modified
    if (fieldErrors[fieldName]) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[fieldName]
        return next
      })
    }
  }

  const handleBack = () => {
    if (step === 'fields' && selectedProcess?.objectTypes.length) {
      if (selectedProcess.objectTypes.length > 1) {
        setStep('objectType')
      } else {
        setStep('process')
      }
    } else if (step === 'objectType') {
      setStep('process')
    }
  }

  const handleStart = async () => {
    if (!selectedWorkflowId || !selectedProcess) return

    // Validate fields if object type is selected
    if (selectedObjectType && selectedObjectType.fields.length > 0) {
      const validation = validateAllFields(fieldValues, selectedObjectType.fields)
      if (!validation.valid) {
        setFieldErrors(validation.errors)
        return
      }
    }

    setIsStarting(true)
    try {
      const objectData = selectedObjectType
        ? formValuesToObjectData(fieldValues, selectedObjectType.fields)
        : fieldValues

      await onStart(
        selectedWorkflowId,
        selectedObjectType?.name || 'document',
        objectData,
        priority,
        selectedObjectType?.id
      )

      onOpenChange(false)
      resetForm()
    } finally {
      setIsStarting(false)
    }
  }

  const renderStepIndicator = () => {
    const steps = ['Select Process', 'Select Type', 'Enter Details']
    const currentIndex = step === 'process' ? 0 : step === 'objectType' ? 1 : 2

    return (
      <div className="flex items-center gap-2 mb-4 text-sm">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-xs',
                i === currentIndex
                  ? 'bg-primary text-primary-foreground'
                  : i < currentIndex
                  ? 'bg-muted text-muted-foreground'
                  : 'text-muted-foreground'
              )}
            >
              {i + 1}. {s}
            </span>
            {i < steps.length - 1 && (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>
    )
  }

  const renderProcessSelection = () => (
    <div className="space-y-3">
      <Label>Select Process</Label>
      <div className="grid gap-2 max-h-60 overflow-y-auto">
        {processes.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No active processes available
          </p>
        ) : (
          processes.map((process) => (
            <button
              key={process.id}
              type="button"
              onClick={() => handleProcessSelect(process)}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border text-left transition-colors',
                'border-border hover:border-primary/50 hover:bg-accent/50'
              )}
            >
              <div>
                <p className="font-medium text-sm">{process.name}</p>
                {process.description && (
                  <p className="text-xs text-muted-foreground">{process.description}</p>
                )}
                {process.objectTypes.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {process.objectTypes.length} object type{process.objectTypes.length > 1 ? 's' : ''}
                  </p>
                )}
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))
        )}
      </div>
    </div>
  )

  const renderObjectTypeSelection = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Select Object Type</Label>
        <Badge variant="outline" className="text-xs">
          {selectedProcess?.name}
        </Badge>
      </div>
      <div className="grid gap-2 max-h-60 overflow-y-auto">
        {selectedProcess?.objectTypes.map((ot) => (
          <button
            key={ot.id}
            type="button"
            onClick={() => handleObjectTypeSelect(ot)}
            className={cn(
              'flex items-center justify-between p-3 rounded-lg border text-left transition-colors',
              'border-border hover:border-primary/50 hover:bg-accent/50'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{ot.name}</p>
                {ot.description && (
                  <p className="text-xs text-muted-foreground">{ot.description}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {ot.fields.length} field{ot.fields.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  )

  const renderFieldsForm = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Enter Details</Label>
        <div className="flex items-center gap-2">
          {selectedObjectType && (
            <Badge variant="outline" className="text-xs">
              {selectedObjectType.name}
            </Badge>
          )}
          <Badge variant="secondary" className="text-xs">
            {selectedProcess?.name}
          </Badge>
        </div>
      </div>

      {/* Priority Selection */}
      <div className="space-y-2">
        <Label htmlFor="priority">Priority</Label>
        <select
          id="priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {priorityOptions.map((p) => (
            <option key={p} value={p}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Dynamic Fields */}
      {selectedObjectType && selectedObjectType.fields.length > 0 ? (
        <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
          {selectedObjectType.fields
            .sort((a, b) => a.order - b.order)
            .map((field) => (
              <DynamicFieldInput
                key={field.id}
                field={field}
                value={fieldValues[field.name]}
                onChange={(value) => handleFieldChange(field.name, value)}
                error={fieldErrors[field.name]}
              />
            ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No fields defined for this object type. The workflow will start with default data.
        </p>
      )}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Start New Workflow</DialogTitle>
          <DialogDescription>
            {step === 'process' && 'Select a process to start a new work item.'}
            {step === 'objectType' && 'Choose the type of object you want to create.'}
            {step === 'fields' && 'Fill in the required information.'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {renderStepIndicator()}

            {step === 'process' && renderProcessSelection()}
            {step === 'objectType' && renderObjectTypeSelection()}
            {step === 'fields' && renderFieldsForm()}
          </div>
        )}

        <DialogFooter className="flex justify-between">
          <div>
            {step !== 'process' && (
              <Button variant="ghost" onClick={handleBack}>
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {step === 'fields' && (
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
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
