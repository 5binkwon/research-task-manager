'use client'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { useCallback, useState } from 'react'

import { PageHeader } from '@/components/layout/PageHeader'
import { TaskBoard } from '@/components/task/TaskBoard'
import { TaskForm } from '@/components/task/TaskForm'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonDetail } from '@/components/ui/Skeleton'
import { useAsync, useRepos } from '@/lib/data/provider'
import { formatDate } from '@/lib/format'
import { PROJECT_STATUS_TONE } from '@/lib/tone'
import { PROJECT_STATUS_LABEL, type Project, type Task } from '@/lib/data/types'

export function ProjectDetailView({ projectId }: { projectId: string }) {
  const repos = useRepos()
  const [adding, setAdding] = useState(false)

  const loadProject = useCallback(() => repos.projects.get(projectId), [repos, projectId])
  const loadTasks = useCallback(() => repos.tasks.listByProject(projectId), [repos, projectId])

  const project = useAsync<Project | null>(loadProject, [projectId])
  const tasks = useAsync<Task[]>(loadTasks, [projectId])

  if ((project.loading && !project.data) || (tasks.loading && !tasks.data))
    return <SkeletonDetail />

  // 조회가 끝났는데 없으면 404. B단계에서는 RLS가 남의 과제를 애초에 안 돌려준다.
  if (!project.data) notFound()

  const rows = tasks.data ?? []

  return (
    <>
      <PageHeader
        title={project.data.title}
        description={project.data.description ?? undefined}
        actions={
          <>
            <Button size="sm" onClick={() => setAdding((v) => !v)}>
              {adding ? '닫기' : '업무 추가'}
            </Button>
            <Link href={`/projects/${projectId}/settings`}>
              <Button size="sm" variant="secondary">
                설정
              </Button>
            </Link>
          </>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
        <Badge tone={PROJECT_STATUS_TONE[project.data.status]}>
          {PROJECT_STATUS_LABEL[project.data.status]}
        </Badge>
        <span>시작 {formatDate(project.data.started_on)}</span>
        <span aria-hidden="true">·</span>
        <span>마감 {formatDate(project.data.due_on)}</span>
      </div>

      {adding && (
        <div className="mb-6">
          <TaskForm
            projectId={projectId}
            onDone={() => setAdding(false)}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState
          title="이 과제에는 아직 업무가 없습니다."
          description="할 일을 하나씩 추가하면 상태별로 정리됩니다."
          action={<Button onClick={() => setAdding(true)}>업무 추가</Button>}
        />
      ) : (
        <TaskBoard tasks={rows} />
      )}
    </>
  )
}
