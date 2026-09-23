import type { TextareaHTMLAttributes } from 'react'

import { controlClass, errorId, Field, fieldId } from './Field'

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'name'> {
  name: string
  label: string
  errors?: string[]
  hint?: string
}

export function Textarea({ name, label, errors, hint, className, ...props }: TextareaProps) {
  const invalid = Boolean(errors?.length)

  return (
    <Field name={name} label={label} errors={errors} hint={hint} required={props.required}>
      <textarea
        rows={4}
        {...props}
        id={fieldId(name)}
        name={name}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? errorId(name) : undefined}
        className={controlClass(invalid, `resize-y ${className ?? ''}`)}
      />
    </Field>
  )
}
