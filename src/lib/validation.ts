import type { FieldDefinition, FieldValue, FieldConfig } from '@/components/forms/DynamicFieldInput'

export interface ValidationResult {
  valid: boolean
  error?: string
}

export interface ValidationResults {
  valid: boolean
  errors: Record<string, string>
}

/**
 * Validates a single field value against its definition
 */
export function validateField(
  value: FieldValue,
  field: FieldDefinition
): ValidationResult {
  const { type, label, required, config } = field

  // Check required
  if (required) {
    if (value === null || value === undefined) {
      return { valid: false, error: `${label} is required` }
    }
    if (type !== 'checkbox' && type !== 'number' && value === '') {
      return { valid: false, error: `${label} is required` }
    }
  }

  // If value is empty and not required, skip further validation
  if (value === null || value === undefined || value === '') {
    return { valid: true }
  }

  // Type-specific validation
  switch (type) {
    case 'text':
    case 'textarea':
      return validateText(value as string, label, config)

    case 'number':
      return validateNumber(value as number, label, config)

    case 'date':
      return validateDate(value as string, label, config)

    case 'select':
      return validateSelect(value as string, label, config)

    case 'checkbox':
      // Checkboxes don't need additional validation
      return { valid: true }

    default:
      return { valid: true }
  }
}

/**
 * Validates text field value
 */
function validateText(
  value: string,
  label: string,
  config: FieldConfig
): ValidationResult {
  if (config.minLength !== undefined && value.length < config.minLength) {
    return {
      valid: false,
      error: `${label} must be at least ${config.minLength} characters`,
    }
  }

  if (config.maxLength !== undefined && value.length > config.maxLength) {
    return {
      valid: false,
      error: `${label} must be no more than ${config.maxLength} characters`,
    }
  }

  if (config.pattern) {
    try {
      const regex = new RegExp(config.pattern)
      if (!regex.test(value)) {
        return {
          valid: false,
          error: `${label} format is invalid`,
        }
      }
    } catch {
      // Invalid regex pattern, skip validation
    }
  }

  return { valid: true }
}

/**
 * Validates number field value
 */
function validateNumber(
  value: number,
  label: string,
  config: FieldConfig
): ValidationResult {
  if (isNaN(value)) {
    return {
      valid: false,
      error: `${label} must be a valid number`,
    }
  }

  if (config.min !== undefined && value < config.min) {
    return {
      valid: false,
      error: `${label} must be at least ${config.min}`,
    }
  }

  if (config.max !== undefined && value > config.max) {
    return {
      valid: false,
      error: `${label} must be no more than ${config.max}`,
    }
  }

  return { valid: true }
}

/**
 * Validates date field value
 */
function validateDate(
  value: string,
  label: string,
  _config: FieldConfig
): ValidationResult {
  const date = new Date(value)
  if (isNaN(date.getTime())) {
    return {
      valid: false,
      error: `${label} must be a valid date`,
    }
  }

  return { valid: true }
}

/**
 * Validates select field value
 */
function validateSelect(
  value: string,
  label: string,
  config: FieldConfig
): ValidationResult {
  if (config.options && config.options.length > 0) {
    const validValues = config.options.map((opt) => opt.value)
    if (!validValues.includes(value)) {
      return {
        valid: false,
        error: `${label} has an invalid selection`,
      }
    }
  }

  return { valid: true }
}

/**
 * Validates all fields and returns a map of errors
 */
export function validateAllFields(
  values: Record<string, FieldValue>,
  fields: FieldDefinition[]
): ValidationResults {
  const errors: Record<string, string> = {}
  let valid = true

  for (const field of fields) {
    const value = values[field.name]
    const result = validateField(value, field)

    if (!result.valid && result.error) {
      errors[field.name] = result.error
      valid = false
    }
  }

  return { valid, errors }
}

/**
 * Converts form values to object data (for API submission)
 * Filters out empty values and converts types appropriately
 */
export function formValuesToObjectData(
  values: Record<string, FieldValue>,
  fields: FieldDefinition[]
): Record<string, unknown> {
  const data: Record<string, unknown> = {}

  for (const field of fields) {
    const value = values[field.name]

    // Skip null/undefined values
    if (value === null || value === undefined) {
      continue
    }

    // Skip empty strings for non-required fields
    if (value === '' && !field.required) {
      continue
    }

    data[field.name] = value
  }

  return data
}
