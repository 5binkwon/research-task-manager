import type { ReactNode } from 'react'

export interface FieldProps {
  name: string
  label: string
  errors?: string[]
  hint?: string
  required?: boolean
  children: ReactNode
}

export function fieldId(name: string): string {
  return `field-${name}`
}

export function errorId(name: string): string {
  return `field-${name}-error`
}

/**
 * 라벨 + 컨트롤 + 필드별 오류 메시지.
 * 오류가 있을 때 aria-describedby 로 연결되도록 id 규칙을 여기서 정한다.
 */
export function Field({ name, label, errors, hint, required, children }: FieldProps) {
  const invalid = Boolean(errors?.length)

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId(name)} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
        {required && <span className="ml-1 text-red-600 dark:text-red-400">*</span>}
      </label>

      {children}

      {hint && !invalid && <p className="text-xs text-zinc-500 dark:text-zinc-500">{hint}</p>}

      {invalid && (
        <ul id={errorId(name)} className="flex flex-col gap-0.5">
          {errors?.map((message) => (
            <li key={message} className="text-xs text-red-600 dark:text-red-400">
              {message}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export const CONTROL_BASE =
  'w-full rounded-md border bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-2 focus-visible:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-600'

export function controlClass(invalid: boolean, className = ''): string {
  const border = invalid
    ? 'border-red-400 focus-visible:outline-red-500 dark:border-red-800'
    : 'border-zinc-300 focus-visible:outline-zinc-900 dark:border-zinc-700 dark:focus-visible:outline-zinc-100'
  return `${CONTROL_BASE} ${border} ${className}`
}
