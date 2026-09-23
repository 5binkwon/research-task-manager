import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
  /**
   * 'empty'    — 아직 아무것도 없는 상태
   * 'filtered' — 데이터는 있지만 현재 조건에 맞는 것이 없는 상태
   * 두 경우의 안내 문구가 달라야 사용자가 다음에 뭘 할지 안다.
   */
  variant?: 'empty' | 'filtered'
}

export function EmptyState({ title, description, action, variant = 'empty' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-zinc-300 px-6 py-12 text-center dark:border-zinc-700">
      <div className="text-zinc-400 dark:text-zinc-600" aria-hidden="true">
        {variant === 'filtered' ? <FilterIcon /> : <InboxIcon />}
      </div>
      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}

function InboxIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 13h4l2 3h6l2-3h4" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M5 5h14l2 8v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4l2-8Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function FilterIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 5h16l-6 7v6l-4 2v-8L4 5Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
