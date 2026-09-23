'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Textarea } from '@/components/ui/Textarea'
import { useRepoContext, useRepos } from '@/lib/data/provider'
import { TASK_STATUSES, TASK_STATUS_LABEL, type Task, type TaskStatus } from '@/lib/data/types'

/**
 * 상태만 바로 바꾸는 컨트롤.
 * '막힘'으로 옮길 때는 사유가 필수라 인라인 입력을 띄운다
 * (스키마의 check (status <> 'blocked' or blocked_reason is not null) 과 같은 규칙).
 */
export function TaskStatusSelect({ task }: { task: Task }) {
  const repos = useRepos()
  const { refresh } = useRepoContext()

  const [pending, setPending] = useState(false)
  const [askingReason, setAskingReason] = useState(false)
  const [reasonError, setReasonError] = useState<string[] | undefined>(undefined)

  async function apply(status: TaskStatus, blockedReason: string | null = null) {
    setPending(true)
    await repos.tasks.update(task.id, { status, blocked_reason: blockedReason })
    refresh()
    setPending(false)
  }

  async function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value as TaskStatus
    if (next === task.status) return

    if (next === 'blocked') {
      setAskingReason(true)
      setReasonError(undefined)
      return
    }
    await apply(next)
  }

  async function confirmBlocked(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const reason = String(formData.get('blockedReason') ?? '').trim()

    if (!reason) {
      setReasonError(['막힘 상태에서는 사유를 적어야 합니다.'])
      return
    }

    setReasonError(undefined)
    await apply('blocked', reason)
    setAskingReason(false)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <label htmlFor="task-status" className="text-sm text-zinc-500 dark:text-zinc-400">
          상태
        </label>
        <select
          id="task-status"
          value={askingReason ? 'blocked' : task.status}
          onChange={handleChange}
          disabled={pending}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        >
          {TASK_STATUSES.map((status) => (
            <option key={status} value={status}>
              {TASK_STATUS_LABEL[status]}
            </option>
          ))}
        </select>
        {pending && <Spinner className="text-zinc-400" />}
      </div>

      {askingReason && (
        <form
          onSubmit={confirmBlocked}
          noValidate
          className="flex flex-col gap-2 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950"
        >
          <Textarea
            name="blockedReason"
            label="막힌 이유"
            rows={2}
            defaultValue={task.blocked_reason ?? ''}
            errors={reasonError}
            required
          />
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" loading={pending}>
              막힘으로 변경
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setAskingReason(false)
                setReasonError(undefined)
              }}
              disabled={pending}
            >
              취소
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
