'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Plus, Trash2, X, Loader2 } from 'lucide-react'
import type { ComparisonOperator } from '@/types'

export interface RouteCondition {
  id: string
  fieldId: string
  operator: ComparisonOperator
  value: string | number | boolean
}

interface RouteConditionEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  routeId: string
  routeLabel: string | null
  conditions: RouteCondition[]
  onSave: (routeId: string, label: string, conditions: RouteCondition[]) => Promise<void>
  readOnly?: boolean
}

const operators: { value: ComparisonOperator; label: string }[] = [
  { value: 'eq', label: '=' },
  { value: 'neq', label: '≠' },
  { value: 'gt', label: '>' },
  { value: 'gte', label: '≥' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '≤' },
  { value: 'contains', label: 'contains' },
  { value: 'startsWith', label: 'starts with' },
]

export function RouteConditionEditor({
  open,
  onOpenChange,
  routeId,
  routeLabel,
  conditions: initialConditions,
  onSave,
  readOnly = false,
}: RouteConditionEditorProps) {
  const [label, setLabel] = useState(routeLabel || '')
  const [conditions, setConditions] = useState<RouteCondition[]>(initialConditions)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLabel(routeLabel || '')
    setConditions(initialConditions)
  }, [routeLabel, initialConditions])

  const handleAddCondition = () => {
    setConditions([
      ...conditions,
      {
        id: `cond-${Date.now()}`,
        fieldId: '',
        operator: 'eq',
        value: '',
      },
    ])
  }

  const handleRemoveCondition = (id: string) => {
    setConditions(conditions.filter((c) => c.id !== id))
  }

  const handleConditionChange = (
    id: string,
    field: keyof RouteCondition,
    value: string | ComparisonOperator
  ) => {
    setConditions(
      conditions.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(routeId, label, conditions)
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  const formatCondition = (c: RouteCondition) => {
    const op = operators.find((o) => o.value === c.operator)?.label || c.operator
    return `${c.fieldId} ${op} ${c.value}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {readOnly ? 'Route Conditions' : 'Edit Route Conditions'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Route Label */}
          <div className="space-y-2">
            <Label htmlFor="route-label">Route Label</Label>
            {readOnly ? (
              <div className="px-3 py-2 bg-muted rounded-md text-sm">
                {label || '(no label)'}
              </div>
            ) : (
              <Input
                id="route-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., Approved, Rejected, High Value"
              />
            )}
          </div>

          {/* Conditions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Conditions</Label>
              {conditions.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {conditions.length} condition{conditions.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>

            {conditions.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center border rounded-lg bg-muted/30">
                No conditions defined
                {!readOnly && ' - route will always be available'}
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {conditions.map((condition) => (
                  <div
                    key={condition.id}
                    className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30"
                  >
                    {readOnly ? (
                      <div className="flex-1 text-sm font-mono">
                        {formatCondition(condition)}
                      </div>
                    ) : (
                      <>
                        <Input
                          className="h-8 flex-1"
                          placeholder="Field name"
                          value={condition.fieldId}
                          onChange={(e) =>
                            handleConditionChange(condition.id, 'fieldId', e.target.value)
                          }
                        />
                        <select
                          className="h-8 px-2 border rounded-md bg-background text-sm"
                          value={condition.operator}
                          onChange={(e) =>
                            handleConditionChange(
                              condition.id,
                              'operator',
                              e.target.value as ComparisonOperator
                            )
                          }
                        >
                          {operators.map((op) => (
                            <option key={op.value} value={op.value}>
                              {op.label}
                            </option>
                          ))}
                        </select>
                        <Input
                          className="h-8 flex-1"
                          placeholder="Value"
                          value={String(condition.value)}
                          onChange={(e) =>
                            handleConditionChange(condition.id, 'value', e.target.value)
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleRemoveCondition(condition.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!readOnly && (
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={handleAddCondition}
              >
                <Plus className="h-4 w-4" />
                Add Condition
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
          {readOnly ? (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Save'
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Helper to format conditions for display on edges
export function formatConditionsBadge(conditions: RouteCondition[]): string {
  if (conditions.length === 0) return ''
  if (conditions.length === 1) {
    const c = conditions[0]
    const op = operators.find((o) => o.value === c.operator)?.label || c.operator
    return `${c.fieldId} ${op} ${c.value}`
  }
  return `${conditions.length} conditions`
}
