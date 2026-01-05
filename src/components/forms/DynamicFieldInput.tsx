'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

export type FieldType = 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea'

export interface FieldConfig {
  placeholder?: string
  defaultValue?: string | number | boolean
  options?: Array<{ value: string; label: string }>
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: string
}

export interface FieldDefinition {
  id: string
  objectTypeId: string
  name: string
  label: string
  type: FieldType
  required: boolean
  order: number
  config: FieldConfig
}

export type FieldValue = string | number | boolean | null

interface DynamicFieldInputProps {
  field: FieldDefinition
  value: FieldValue
  onChange: (value: FieldValue) => void
  error?: string
  disabled?: boolean
}

export function DynamicFieldInput({
  field,
  value,
  onChange,
  error,
  disabled = false,
}: DynamicFieldInputProps) {
  const { type, label, required, config } = field

  const inputClasses = cn(
    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
    'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
    'disabled:cursor-not-allowed disabled:opacity-50',
    error && 'border-destructive focus:ring-destructive'
  )

  const renderInput = () => {
    switch (type) {
      case 'text':
        return (
          <Input
            type="text"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={config.placeholder}
            minLength={config.minLength}
            maxLength={config.maxLength}
            pattern={config.pattern}
            disabled={disabled}
            className={error ? 'border-destructive' : ''}
          />
        )

      case 'number':
        return (
          <Input
            type="number"
            value={value === null ? '' : (value as number)}
            onChange={(e) => {
              const val = e.target.value
              onChange(val === '' ? null : parseFloat(val))
            }}
            placeholder={config.placeholder}
            min={config.min}
            max={config.max}
            disabled={disabled}
            className={error ? 'border-destructive' : ''}
          />
        )

      case 'date':
        return (
          <Input
            type="date"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={error ? 'border-destructive' : ''}
          />
        )

      case 'select':
        return (
          <select
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={inputClasses}
          >
            <option value="">
              {config.placeholder || 'Select an option...'}
            </option>
            {config.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={(value as boolean) ?? false}
              onCheckedChange={(checked) => onChange(checked as boolean)}
              disabled={disabled}
            />
            <label
              htmlFor={field.id}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {config.placeholder || label}
            </label>
          </div>
        )

      case 'textarea':
        return (
          <textarea
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={config.placeholder}
            minLength={config.minLength}
            maxLength={config.maxLength}
            disabled={disabled}
            rows={4}
            className={cn(inputClasses, 'min-h-[80px] resize-y')}
          />
        )

      default:
        return (
          <Input
            type="text"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={config.placeholder}
            disabled={disabled}
          />
        )
    }
  }

  // Checkbox has its own label rendering
  if (type === 'checkbox') {
    return (
      <div className="space-y-2">
        {renderInput()}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={field.id}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {renderInput()}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

// Helper to get default value for a field
export function getDefaultValue(field: FieldDefinition): FieldValue {
  if (field.config.defaultValue !== undefined) {
    return field.config.defaultValue as FieldValue
  }

  switch (field.type) {
    case 'checkbox':
      return false
    case 'number':
      return null
    default:
      return ''
  }
}
