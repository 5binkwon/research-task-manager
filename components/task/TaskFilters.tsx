'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { Button } from '@/components/ui/Button'
import {
  TASK_PRIORITIES,
  TASK_PRIORITY_LABEL,
  TASK_STATUSES,
  TASK_STATUS_LABEL,
} from '@/lib/data/types'

/** 필터 상태는 URL에 둔다. 새로고침·뒤로가기·링크 공유가 그대로 동작한다. */
export function TaskFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const selectedStatuses = searchParams.getAll('status')
  const selectedPriority = searchParams.get('priority') ?? ''
  const query = searchParams.get('q') ?? ''
  const active = selectedStatuses.length > 0 || selectedPriority !== '' || query !== ''

  function push(next: URLSearchParams) {
    const qs = next.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  function toggleStatus(status: string) {
    const next = new URLSearchParams(searchParams)
    const current = next.getAll('status')
    next.delete('status')
    const updated = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status]
    updated.forEach((s) => next.append('status', s))
    push(next)
  }

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    push(next)
  }

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">상태</span>
        {TASK_STATUSES.map((status) => {
          const on = selectedStatuses.includes(status)
          return (
            <button
              key={status}
              type="button"
              aria-pressed={on}
              onClick={() => toggleStatus(status)}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                on
                  ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                  : 'border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800'
              }`}
            >
              {TASK_STATUS_LABEL[status]}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          우선순위
          <select
            value={selectedPriority}
            onChange={(event) => setParam('priority', event.target.value)}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          >
            <option value="">전체</option>
            {TASK_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {TASK_PRIORITY_LABEL[priority]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-1 items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          검색
          <input
            type="search"
            defaultValue={query}
            placeholder="업무 이름"
            onChange={(event) => setParam('q', event.target.value)}
            className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </label>

        {active && (
          <Button size="sm" variant="ghost" onClick={() => router.replace(pathname)}>
            필터 초기화
          </Button>
        )}
      </div>
    </div>
  )
}
