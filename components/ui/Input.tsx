import type { InputHTMLAttributes } from 'react'

import { controlClass, errorId, Field, fieldId } from './Field'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'name'> {
  name: string
  label: string
  errors?: string[]
  hint?: string
}

export function Input({ name, label, errors, hint, className, ...props }: InputProps) {
  const invalid = Boolean(errors?.length)

  return (
    <Field name={name} label={label} errors={errors} hint={hint} required={props.required}>
      <input
        {...props}
        id={fieldId(name)}
        name={name}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? errorId(name) : undefined}
        className={controlClass(invalid, className)}
      />
    </Field>
  )
}
