import type { SelectHTMLAttributes } from 'react'

import { controlClass, errorId, Field, fieldId } from './Field'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'name'> {
  name: string
  label: string
  options: SelectOption[]
  errors?: string[]
  hint?: string
}

export function Select({
  name,
  label,
  options,
  errors,
  hint,
  className,
  ...props
}: SelectProps) {
  const invalid = Boolean(errors?.length)

  return (
    <Field name={name} label={label} errors={errors} hint={hint} required={props.required}>
      <select
        {...props}
        id={fieldId(name)}
        name={name}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? errorId(name) : undefined}
        className={controlClass(invalid, className)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  )
}
