'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Pencil,
  Save,
  X,
  FileType,
  Settings2,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FieldConfig {
  placeholder?: string
  defaultValue?: string | number | boolean
  options?: Array<{ value: string; label: string }>
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: string
}

interface FieldDefinition {
  id: string
  objectTypeId: string
  name: string
  label: string
  type: string
  required: boolean
  order: number
  config: FieldConfig
}

interface ObjectType {
  id: string
  processId: string
  name: string
  description: string | null
  fields: FieldDefinition[]
}

interface ObjectTypesManagerProps {
  processId: string
  processName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'textarea', label: 'Text Area' },
]

export function ObjectTypesManager({
  processId,
  processName,
  open,
  onOpenChange,
}: ObjectTypesManagerProps) {
  const { toast } = useToast()
  const [objectTypes, setObjectTypes] = useState<ObjectType[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set())

  // New object type form
  const [showNewTypeForm, setShowNewTypeForm] = useState(false)
  const [newTypeName, setNewTypeName] = useState('')
  const [newTypeDescription, setNewTypeDescription] = useState('')
  const [savingType, setSavingType] = useState(false)

  // Edit object type
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null)
  const [editTypeName, setEditTypeName] = useState('')
  const [editTypeDescription, setEditTypeDescription] = useState('')

  // New field form
  const [addingFieldToType, setAddingFieldToType] = useState<string | null>(null)
  const [newFieldName, setNewFieldName] = useState('')
  const [newFieldLabel, setNewFieldLabel] = useState('')
  const [newFieldType, setNewFieldType] = useState('text')
  const [newFieldRequired, setNewFieldRequired] = useState(false)
  const [newFieldOptions, setNewFieldOptions] = useState('')
  const [savingField, setSavingField] = useState(false)

  // Edit field
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)
  const [editFieldLabel, setEditFieldLabel] = useState('')
  const [editFieldRequired, setEditFieldRequired] = useState(false)
  const [editFieldOptions, setEditFieldOptions] = useState('')

  const loadObjectTypes = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/processes/${processId}/object-types`)
      if (res.ok) {
        const data = await res.json()
        setObjectTypes(data)
      }
    } catch (error) {
      console.error('Failed to load object types:', error)
      toast({
        title: 'Error',
        description: 'Failed to load object types',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [processId, toast])

  useEffect(() => {
    if (open) {
      loadObjectTypes()
    }
  }, [open, loadObjectTypes])

  const toggleExpanded = (typeId: string) => {
    const newExpanded = new Set(expandedTypes)
    if (newExpanded.has(typeId)) {
      newExpanded.delete(typeId)
    } else {
      newExpanded.add(typeId)
    }
    setExpandedTypes(newExpanded)
  }

  // Object Type CRUD
  const handleCreateObjectType = async () => {
    if (!newTypeName.trim()) {
      toast({ title: 'Error', description: 'Name is required', variant: 'destructive' })
      return
    }

    setSavingType(true)
    try {
      const res = await fetch(`/api/processes/${processId}/object-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTypeName.trim(),
          description: newTypeDescription.trim() || null,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create object type')
      }

      toast({ title: 'Success', description: 'Object type created' })
      setShowNewTypeForm(false)
      setNewTypeName('')
      setNewTypeDescription('')
      loadObjectTypes()
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      })
    } finally {
      setSavingType(false)
    }
  }

  const handleUpdateObjectType = async (typeId: string) => {
    if (!editTypeName.trim()) {
      toast({ title: 'Error', description: 'Name is required', variant: 'destructive' })
      return
    }

    try {
      const res = await fetch(`/api/processes/${processId}/object-types/${typeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editTypeName.trim(),
          description: editTypeDescription.trim() || null,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update object type')
      }

      toast({ title: 'Success', description: 'Object type updated' })
      setEditingTypeId(null)
      loadObjectTypes()
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      })
    }
  }

  const handleDeleteObjectType = async (typeId: string, typeName: string) => {
    if (!confirm(`Delete "${typeName}" and all its fields? This cannot be undone.`)) {
      return
    }

    try {
      const res = await fetch(`/api/processes/${processId}/object-types/${typeId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete object type')
      }

      toast({ title: 'Success', description: 'Object type deleted' })
      loadObjectTypes()
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      })
    }
  }

  // Field CRUD
  const handleCreateField = async (typeId: string) => {
    if (!newFieldName.trim() || !newFieldLabel.trim()) {
      toast({ title: 'Error', description: 'Name and label are required', variant: 'destructive' })
      return
    }

    setSavingField(true)
    try {
      const config: FieldConfig = {}
      if (newFieldType === 'select' && newFieldOptions.trim()) {
        config.options = newFieldOptions
          .split(',')
          .map((opt) => opt.trim())
          .filter(Boolean)
          .map((opt) => ({ value: opt.toLowerCase().replace(/\s+/g, '_'), label: opt }))
      }

      const res = await fetch(`/api/processes/${processId}/object-types/${typeId}/fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFieldName.trim().toLowerCase().replace(/\s+/g, '_'),
          label: newFieldLabel.trim(),
          type: newFieldType,
          required: newFieldRequired,
          config,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create field')
      }

      toast({ title: 'Success', description: 'Field created' })
      setAddingFieldToType(null)
      setNewFieldName('')
      setNewFieldLabel('')
      setNewFieldType('text')
      setNewFieldRequired(false)
      setNewFieldOptions('')
      loadObjectTypes()
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      })
    } finally {
      setSavingField(false)
    }
  }

  const handleUpdateField = async (typeId: string, fieldId: string) => {
    try {
      const config: FieldConfig = {}
      const field = objectTypes
        .find((t) => t.id === typeId)
        ?.fields.find((f) => f.id === fieldId)

      if (field?.type === 'select' && editFieldOptions.trim()) {
        config.options = editFieldOptions
          .split(',')
          .map((opt) => opt.trim())
          .filter(Boolean)
          .map((opt) => ({ value: opt.toLowerCase().replace(/\s+/g, '_'), label: opt }))
      }

      const res = await fetch(
        `/api/processes/${processId}/object-types/${typeId}/fields/${fieldId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            label: editFieldLabel.trim(),
            required: editFieldRequired,
            config: Object.keys(config).length > 0 ? config : undefined,
          }),
        }
      )

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update field')
      }

      toast({ title: 'Success', description: 'Field updated' })
      setEditingFieldId(null)
      loadObjectTypes()
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      })
    }
  }

  const handleDeleteField = async (typeId: string, fieldId: string, fieldLabel: string) => {
    if (!confirm(`Delete field "${fieldLabel}"? This cannot be undone.`)) {
      return
    }

    try {
      const res = await fetch(
        `/api/processes/${processId}/object-types/${typeId}/fields/${fieldId}`,
        { method: 'DELETE' }
      )

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete field')
      }

      toast({ title: 'Success', description: 'Field deleted' })
      loadObjectTypes()
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      })
    }
  }

  const startEditField = (field: FieldDefinition) => {
    setEditingFieldId(field.id)
    setEditFieldLabel(field.label)
    setEditFieldRequired(field.required)
    setEditFieldOptions(
      field.config.options?.map((o) => o.label).join(', ') || ''
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Object Types - {processName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Object Types List */}
              {objectTypes.length === 0 && !showNewTypeForm ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileType className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No object types defined yet.</p>
                  <p className="text-sm">Create one to define the fields for work items.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {objectTypes.map((objType) => (
                    <div key={objType.id} className="border rounded-lg">
                      {/* Object Type Header */}
                      <div
                        className="flex items-center gap-2 p-3 cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleExpanded(objType.id)}
                      >
                        {expandedTypes.has(objType.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}

                        {editingTypeId === objType.id ? (
                          <div className="flex-1 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <Input
                              type="text"
                              value={editTypeName}
                              onChange={(e) => setEditTypeName(e.target.value)}
                              className="flex-1 h-8"
                              placeholder="Name"
                            />
                            <Input
                              type="text"
                              value={editTypeDescription}
                              onChange={(e) => setEditTypeDescription(e.target.value)}
                              className="flex-1 h-8"
                              placeholder="Description"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleUpdateObjectType(objType.id)}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingTypeId(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="flex-1">
                              <span className="font-medium">{objType.name}</span>
                              {objType.description && (
                                <span className="text-sm text-muted-foreground ml-2">
                                  - {objType.description}
                                </span>
                              )}
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {objType.fields.length} fields
                            </Badge>
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingTypeId(objType.id)
                                  setEditTypeName(objType.name)
                                  setEditTypeDescription(objType.description || '')
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive"
                                onClick={() => handleDeleteObjectType(objType.id, objType.name)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Fields (Expanded) */}
                      {expandedTypes.has(objType.id) && (
                        <div className="border-t bg-muted/30 p-3 space-y-2">
                          {objType.fields.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-2">
                              No fields defined yet
                            </p>
                          ) : (
                            <div className="space-y-1">
                              {objType.fields
                                .sort((a, b) => a.order - b.order)
                                .map((field) => (
                                  <div
                                    key={field.id}
                                    className="flex items-center gap-2 p-2 bg-background rounded border"
                                  >
                                    <GripVertical className="h-4 w-4 text-muted-foreground" />

                                    {editingFieldId === field.id ? (
                                      <>
                                        <Input
                                          type="text"
                                          value={editFieldLabel}
                                          onChange={(e) => setEditFieldLabel(e.target.value)}
                                          className="flex-1 h-8"
                                          placeholder="Label"
                                        />
                                        {field.type === 'select' && (
                                          <Input
                                            type="text"
                                            value={editFieldOptions}
                                            onChange={(e) => setEditFieldOptions(e.target.value)}
                                            className="flex-1 h-8"
                                            placeholder="Options (comma-separated)"
                                          />
                                        )}
                                        <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                                          <Checkbox
                                            checked={editFieldRequired}
                                            onCheckedChange={(checked) => setEditFieldRequired(checked === true)}
                                          />
                                          Required
                                        </label>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleUpdateField(objType.id, field.id)}
                                        >
                                          <Save className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => setEditingFieldId(null)}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <span className="flex-1 text-sm">
                                          {field.label}
                                          <span className="text-muted-foreground ml-1">
                                            ({field.name})
                                          </span>
                                        </span>
                                        <Badge variant="outline" className="text-xs">
                                          {field.type}
                                        </Badge>
                                        {field.required && (
                                          <Badge variant="secondary" className="text-xs">
                                            Required
                                          </Badge>
                                        )}
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => startEditField(field)}
                                        >
                                          <Pencil className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="text-destructive"
                                          onClick={() => handleDeleteField(objType.id, field.id, field.label)}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                ))}
                            </div>
                          )}

                          {/* Add Field Form */}
                          {addingFieldToType === objType.id ? (
                            <div className="p-3 bg-background rounded border space-y-3">
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                  type="text"
                                  value={newFieldName}
                                  onChange={(e) => setNewFieldName(e.target.value)}
                                  className="h-9"
                                  placeholder="Field name (e.g., invoice_number)"
                                />
                                <Input
                                  type="text"
                                  value={newFieldLabel}
                                  onChange={(e) => setNewFieldLabel(e.target.value)}
                                  className="h-9"
                                  placeholder="Display label (e.g., Invoice Number)"
                                />
                              </div>
                              <div className="flex items-center gap-3">
                                <select
                                  value={newFieldType}
                                  onChange={(e) => setNewFieldType(e.target.value)}
                                  className="w-32 h-9 px-2 text-sm border rounded-md bg-background text-foreground"
                                >
                                  {FIELD_TYPES.map((type) => (
                                    <option key={type.value} value={type.value}>
                                      {type.label}
                                    </option>
                                  ))}
                                </select>
                                <label className="flex items-center gap-2 text-sm">
                                  <Checkbox
                                    checked={newFieldRequired}
                                    onCheckedChange={(checked) => setNewFieldRequired(checked === true)}
                                  />
                                  Required
                                </label>
                              </div>
                              {newFieldType === 'select' && (
                                <Input
                                  type="text"
                                  value={newFieldOptions}
                                  onChange={(e) => setNewFieldOptions(e.target.value)}
                                  className="w-full h-9"
                                  placeholder="Options (comma-separated, e.g., Low, Medium, High)"
                                />
                              )}
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setAddingFieldToType(null)
                                    setNewFieldName('')
                                    setNewFieldLabel('')
                                    setNewFieldType('text')
                                    setNewFieldRequired(false)
                                    setNewFieldOptions('')
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleCreateField(objType.id)}
                                  disabled={savingField}
                                >
                                  {savingField ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    'Add Field'
                                  )}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full gap-2"
                              onClick={() => setAddingFieldToType(objType.id)}
                            >
                              <Plus className="h-4 w-4" />
                              Add Field
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* New Object Type Form */}
              {showNewTypeForm ? (
                <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                  <h4 className="font-medium">New Object Type</h4>
                  <Input
                    type="text"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder="Name (e.g., Invoice, Purchase Order)"
                  />
                  <Input
                    type="text"
                    value={newTypeDescription}
                    onChange={(e) => setNewTypeDescription(e.target.value)}
                    placeholder="Description (optional)"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowNewTypeForm(false)
                        setNewTypeName('')
                        setNewTypeDescription('')
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreateObjectType} disabled={savingType}>
                      {savingType ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Create Object Type'
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  className="w-full gap-2"
                  variant="outline"
                  onClick={() => setShowNewTypeForm(true)}
                >
                  <Plus className="h-4 w-4" />
                  Add Object Type
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
