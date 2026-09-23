'use client'

import { notFound } from 'next/navigation'
import { useCallback } from 'react'

import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonDetail } from '@/components/ui/Skeleton'
import { useAsync, useRepos } from '@/lib/data/provider'
import { formatDate, formatDateTime, formatDue } from '@/lib/format'
import { DUE_TONE, PROJECT_STATUS_TONE, TASK_PRIORITY_TONE, TASK_STATUS_TONE } from '@/lib/tone'
import type { SharePayload } from '@/lib/data/repo'
import {
  PROJECT_STATUS_LABEL,
  TASK_PRIORITY_LABEL,
  TASK_STATUSES,
  TASK_STATUS_LABEL,
} from '@/lib/data/types'

export function ShareView({ token }: { token: string }) {
  const repos = useRepos()
  const load = useCallback(() => repos.share.resolve(token), [repos, token])
  const shared = useAsync<SharePayload | null>(load, [token])

  if (shared.loading && !shared.data) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-12">
        <SkeletonDetail />
      </div>
    )
  }

  // 존재하지 않음 / 만료됨 / 폐기됨을 구분해서 알려주지 않는다. 전부 404.
  if (!shared.data) notFound()

  const { project, tasks, notes, include_notes: includeNotes, label } = shared.data

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="mb-6 rounded-md border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        읽기 전용 공유 보기입니다{label ? ` — ${label}` : ''}. 내용을 바꿀 수는 없습니다.
      </div>

      <header className="mb-6">
        <h1 className="text-xl font-semibold">{project.title}</h1>
        {project.description && (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{project.description}</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <Badge tone={PROJECT_STATUS_TONE[project.status]}>
            {PROJECT_STATUS_LABEL[project.status]}
          </Badge>
          <span>시작 {formatDate(project.started_on)}</span>
          <span aria-hidden="true">·</span>
          <span>마감 {formatDate(project.due_on)}</span>
        </div>
      </header>

      <section className="mb-10">
        <h2 className="mb-3 text-base font-semibold">업무</h2>
        {tasks.length === 0 ? (
          <EmptyState title="등록된 업무가 없습니다." />
        ) : (
          <div className="flex flex-col gap-6">
            {TASK_STATUSES.map((status) => {
              const column = tasks.filter((task) => task.status === status)
              if (column.length === 0) return null

              return (
                <div key={status}>
                  <h3 className="mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    {TASK_STATUS_LABEL[status]} ({column.length})
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {column.map((task) => {
                      // 완료된 업무에는 마감 경고를 띄우지 않는다.
                      const due =
                        task.status === 'done' ? null : formatDue(task.due_at)
                      return (
                        <li
                          key={task.id}
                          className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p
                              className={`text-sm ${
                                task.status === 'done'
                                  ? 'text-zinc-400 line-through dark:text-zinc-600'
                                  : ''
                              }`}
                            >
                              {task.title}
                            </p>
                            {due && <Badge tone={DUE_TONE[due.tone]}>{due.text}</Badge>}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <Badge tone={TASK_STATUS_TONE[task.status]}>
                              {TASK_STATUS_LABEL[task.status]}
                            </Badge>
                            <Badge tone={TASK_PRIORITY_TONE[task.priority]}>
                              {TASK_PRIORITY_LABEL[task.priority]}
                            </Badge>
                          </div>
                          {task.status === 'blocked' && task.blocked_reason && (
                            <p className="mt-2 rounded bg-red-50 px-2 py-1 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
                              {task.blocked_reason}
                            </p>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {includeNotes && (
        <section>
          <h2 className="mb-3 text-base font-semibold">진행 로그</h2>
          {notes.length === 0 ? (
            <EmptyState title="기록된 진행 로그가 없습니다." />
          ) : (
            <ol className="flex flex-col gap-2">
              {notes.map((note) => {
                const task = tasks.find((t) => t.id === note.task_id)
                return (
                  <li
                    key={note.id}
                    className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {task?.title ?? '삭제된 업무'}
                      {' · '}
                      <time dateTime={note.created_at}>{formatDateTime(note.created_at)}</time>
                    </p>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm">{note.body}</p>
                  </li>
                )
              })}
            </ol>
          )}
        </section>
      )}
    </div>
  )
}
