'use client'

import { useCallback, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { FormError } from '@/components/ui/FormError'
import { Skeleton } from '@/components/ui/Skeleton'
import { Textarea } from '@/components/ui/Textarea'
import { useAsync, useRepoContext, useRepos } from '@/lib/data/provider'
import { formatDateTime } from '@/lib/format'
import type { NoteKind, TaskNote } from '@/lib/data/types'
import { EMPTY_FORM_STATE, hasErrors, validateNote, type FormState } from '@/lib/validation'

const KIND_LABEL: Record<NoteKind, string> = {
  note: '메모',
  status_change: '상태 변경',
  result: '결과',
}

export function TaskNotes({ taskId }: { taskId: string }) {
  const repos = useRepos()
  const { refresh } = useRepoContext()

  const loadNotes = useCallback(() => repos.notes.listByTask(taskId), [repos, taskId])
  const notes = useAsync<TaskNote[]>(loadNotes, [taskId])

  const [state, setState] = useState<FormState>(EMPTY_FORM_STATE)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const body = String(new FormData(form).get('body') ?? '')

    const validation = validateNote(body)
    if (hasErrors(validation)) {
      setState(validation)
      return
    }
    setState(EMPTY_FORM_STATE)

    setPending(true)
    try {
      await repos.notes.create(taskId, body)
      form.reset()
      refresh()
    } catch (error) {
      setState({ message: error instanceof Error ? error.message : '기록하지 못했습니다.' })
    } finally {
      setPending(false)
    }
  }

  const rows = notes.data ?? []

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-base font-semibold">진행 로그</h2>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
        <FormError message={state.message} />
        <Textarea
          name="body"
          label="새 기록"
          rows={3}
          placeholder="오늘 무엇을 했고 무엇이 남았는지 적어 두세요."
          errors={state.errors?.body}
        />
        <div>
          <Button type="submit" size="sm" loading={pending}>
            기록 추가
          </Button>
        </div>
      </form>

      {notes.loading && !notes.data ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          title="아직 기록이 없습니다."
          description="상태를 바꾸면 변경 이력이 자동으로 남고, 직접 쓴 메모도 여기에 쌓입니다."
        />
      ) : (
        <ol className="flex flex-col gap-3">
          {rows.map((note) => (
            <li
              key={note.id}
              className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <span
                  className={
                    note.kind === 'result' ? 'font-medium text-green-700 dark:text-green-400' : ''
                  }
                >
                  {KIND_LABEL[note.kind]}
                </span>
                <span aria-hidden="true">·</span>
                <time dateTime={note.created_at}>{formatDateTime(note.created_at)}</time>
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-sm">{note.body}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
