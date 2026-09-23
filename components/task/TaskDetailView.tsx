'use client'

import Link from 'next/link'
import { notFound, useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'

import { TaskForm } from './TaskForm'
import { TaskNotes } from './TaskNotes'
import { TaskStatusSelect } from './TaskStatusSelect'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SkeletonDetail } from '@/components/ui/Skeleton'
import { useAsync, useRepos } from '@/lib/data/provider'
import { formatDate, formatDue } from '@/lib/format'
import { DUE_TONE, TASK_PRIORITY_TONE } from '@/lib/tone'
import { TASK_PRIORITY_LABEL, type Project, type Task } from '@/lib/data/types'

export function TaskDetailView({ taskId }: { taskId: string }) {
  const repos = useRepos()
  const router = useRouter()

  const loadTask = useCallback(() => repos.tasks.get(taskId), [repos, taskId])
  const task = useAsync<Task | null>(loadTask, [taskId])

  const projectId = task.data?.project_id
  const loadProject = useCallback(
    () => (projectId ? repos.projects.get(projectId) : Promise.resolve(null)),
    [repos, projectId],
  )
  const project = useAsync<Project | null>(loadProject, [projectId])

  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirming, setConfirming] = useState(false)

  if (task.loading && !task.data) return <SkeletonDetail />
  if (!task.data) notFound()

  const current = task.data
  // 완료된 업무에는 마감 경고를 띄우지 않는다(완료일을 대신 보여준다).
  const due = current.status === 'done' ? null : formatDue(current.due_at)

  async function handleDelete() {
    setDeleting(true)
    await repos.tasks.remove(taskId)
    // refresh()를 부르지 않는다. 이 화면이 삭제된 업무를 다시 읽어 notFound()가 먼저 터진다.
    router.push(projectId ? `/projects/${projectId}` : '/tasks')
  }

  return (
    <>
      <PageHeader
        title={current.title}
        description={current.description ?? undefined}
        actions={
          <>
            <Button size="sm" variant="secondary" onClick={() => setEditing((v) => !v)}>
              {editing ? '닫기' : '수정'}
            </Button>
            {projectId && (
              <Link href={`/projects/${projectId}`}>
                <Button size="sm" variant="ghost">
                  과제로
                </Button>
              </Link>
            )}
          </>
        }
      />

      {project.data && (
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">{project.data.title}</p>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <TaskStatusSelect task={current} />
        <Badge tone={TASK_PRIORITY_TONE[current.priority]}>
          {TASK_PRIORITY_LABEL[current.priority]}
        </Badge>
        {due && <Badge tone={DUE_TONE[due.tone]}>{due.text}</Badge>}
        {current.completed_at && (
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {formatDate(current.completed_at)} 완료
          </span>
        )}
      </div>

      {current.status === 'blocked' && current.blocked_reason && (
        <p className="mb-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {current.blocked_reason}
        </p>
      )}

      {editing && projectId && (
        <div className="mb-8">
          <TaskForm
            projectId={projectId}
            task={current}
            onDone={() => setEditing(false)}
            onCancel={() => setEditing(false)}
          />
        </div>
      )}

      <TaskNotes taskId={taskId} />

      <section className="mt-10 max-w-xl rounded-lg border border-red-200 p-4 dark:border-red-900">
        <h2 className="text-base font-semibold text-red-700 dark:text-red-400">업무 삭제</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          이 업무와 진행 로그가 사라집니다. 되돌릴 수 없습니다.
        </p>
        <div className="mt-3 flex items-center gap-2">
          {confirming ? (
            <>
              <Button variant="danger" onClick={handleDelete} loading={deleting}>
                정말 삭제합니다
              </Button>
              <Button variant="ghost" onClick={() => setConfirming(false)} disabled={deleting}>
                취소
              </Button>
            </>
          ) : (
            <Button variant="danger" onClick={() => setConfirming(true)}>
              업무 삭제
            </Button>
          )}
        </div>
      </section>
    </>
  )
}
