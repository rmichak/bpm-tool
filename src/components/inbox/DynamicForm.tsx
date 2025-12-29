'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { FieldDefinition, FieldValue } from '@/types';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, Save } from 'lucide-react';

interface DynamicFormProps {
  fields: FieldDefinition[];
  values: Record<string, FieldValue>;
  onSubmit: (values: Record<string, FieldValue>) => void;
  onComplete: (values: Record<string, FieldValue>) => void;
  onCancel?: () => void;
  isReadOnly?: boolean;
}

export function DynamicForm({
  fields,
  values,
  onSubmit,
  onComplete,
  onCancel,
  isReadOnly = false,
}: DynamicFormProps) {
  // Build Zod schema dynamically
  const schemaShape: Record<string, z.ZodTypeAny> = {};
  fields.forEach((field) => {
    let fieldSchema: z.ZodTypeAny;

    switch (field.type) {
      case 'number':
        fieldSchema = z.coerce.number();
        if (field.config.min !== undefined) {
          fieldSchema = (fieldSchema as z.ZodNumber).min(field.config.min);
        }
        if (field.config.max !== undefined) {
          fieldSchema = (fieldSchema as z.ZodNumber).max(field.config.max);
        }
        break;
      case 'checkbox':
        fieldSchema = z.boolean();
        break;
      case 'date':
        fieldSchema = z.string();
        break;
      default:
        fieldSchema = z.string();
        if (field.config.minLength) {
          fieldSchema = (fieldSchema as z.ZodString).min(field.config.minLength);
        }
        if (field.config.maxLength) {
          fieldSchema = (fieldSchema as z.ZodString).max(field.config.maxLength);
        }
    }

    if (!field.required) {
      fieldSchema = fieldSchema.optional().or(z.literal(''));
    }

    schemaShape[field.name] = fieldSchema;
  });

  const schema = z.object(schemaShape);
  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: values as FormValues,
  });

  const onFormSubmit = (data: FormValues) => {
    onSubmit(data as Record<string, FieldValue>);
  };

  const onFormComplete = (data: FormValues) => {
    onComplete(data as Record<string, FieldValue>);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {fields.map((field) => (
        <div key={field.id} className="space-y-2">
          <Label
            htmlFor={field.name}
            className={cn(field.required && "after:content-['*'] after:ml-0.5 after:text-red-500")}
          >
            {field.label}
          </Label>

          {field.type === 'text' && (
            <Input
              id={field.name}
              type="text"
              placeholder={field.config.placeholder}
              disabled={isReadOnly}
              {...register(field.name)}
              className={errors[field.name] ? 'border-red-500' : ''}
            />
          )}

          {field.type === 'number' && (
            <Input
              id={field.name}
              type="number"
              min={field.config.min}
              max={field.config.max}
              disabled={isReadOnly}
              {...register(field.name)}
              className={errors[field.name] ? 'border-red-500' : ''}
            />
          )}

          {field.type === 'date' && (
            <Input
              id={field.name}
              type="date"
              disabled={isReadOnly}
              {...register(field.name)}
              className={errors[field.name] ? 'border-red-500' : ''}
            />
          )}

          {field.type === 'textarea' && (
            <textarea
              id={field.name}
              rows={4}
              placeholder={field.config.placeholder}
              disabled={isReadOnly}
              {...register(field.name)}
              className={cn(
                'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                errors[field.name] && 'border-red-500'
              )}
            />
          )}

          {field.type === 'select' && field.config.options && (
            <select
              id={field.name}
              disabled={isReadOnly}
              {...register(field.name)}
              className={cn(
                'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                errors[field.name] && 'border-red-500'
              )}
            >
              <option value="">Select...</option>
              {field.config.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}

          {field.type === 'checkbox' && (
            <div className="flex items-center gap-2">
              <input
                id={field.name}
                type="checkbox"
                disabled={isReadOnly}
                {...register(field.name)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-muted-foreground">
                {field.config.placeholder || 'Yes'}
              </span>
            </div>
          )}

          {errors[field.name] && (
            <p className="text-sm text-red-500">
              {errors[field.name]?.message as string || 'This field is invalid'}
            </p>
          )}
        </div>
      ))}

      {!isReadOnly && (
        <div className="flex items-center gap-3 pt-4 border-t">
          <Button type="submit" variant="outline" disabled={!isDirty}>
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button
            type="button"
            onClick={handleSubmit(onFormComplete)}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Complete Task
          </Button>
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              <XCircle className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
        </div>
      )}
    </form>
  );
}
