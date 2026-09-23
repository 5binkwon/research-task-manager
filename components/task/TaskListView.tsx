'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

import { TaskCard } from './TaskCard'
import { TaskFilters } from './TaskFilters'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonList } from '@/components/ui/Skeleton'
import { useAsync, useRepos } from '@/lib/data/provider'
import type { TaskFilter } from '@/lib/data/repo'
import type { Project, Task, TaskPriority, TaskStatus } from '@/lib/data/types'

export function TaskListView() {
  const repos = useRepos()
  const searchParams = useSearchParams()

  const statuses = searchParams.getAll('status') as TaskStatus[]
  const priority = searchParams.get('priority') as TaskPriority | null
  const q = searchParams.get('q') ?? ''

  const filter: TaskFilter = {
    status: statuses,
    priority: priority ? [priority] : [],
    q,
  }
  // useAsync 의 deps 로 쓰기 위해 원시값으로 직렬화한다.
  const filterKey = JSON.stringify(filter)

  const loadTasks = useCallback(() => repos.tasks.list(filter), [repos, filterKey]) // eslint-disable-line react-hooks/exhaustive-deps
  const loadProjects = useCallback(() => repos.projects.list(), [repos])

  const tasks = useAsync<Task[]>(loadTasks, [filterKey])
  const projects = useAsync<Project[]>(loadProjects, [])

  const loading = (tasks.loading && !tasks.data) || (projects.loading && !projects.data)
  const rows = tasks.data ?? []
  const hasFilter = statuses.length > 0 || Boolean(priority) || q !== ''

  const projectTitle = (id: string) => projects.data?.find((p) => p.id === id)?.title

  return (
    <>
      <PageHeader
        title="업무"
        description="모든 과제의 업무를 한 화면에서 봅니다."
        actions={
          <Link href="/projects">
            <Button size="sm" variant="secondary">
              과제 목록
            </Button>
          </Link>
        }
      />

      <TaskFilters />

      {loading ? (
        <SkeletonList rows={5} />
      ) : rows.length === 0 ? (
        hasFilter ? (
          <EmptyState
            variant="filtered"
            title="조건에 맞는 업무가 없습니다."
            description="상태나 우선순위 조건을 바꾸거나 검색어를 지워 보세요."
          />
        ) : (
          <EmptyState
            title="등록된 업무가 없습니다."
            description="과제를 열어 첫 업무를 추가해 보세요."
            action={
              <Link href="/projects">
                <Button>과제 목록으로</Button>
              </Link>
            }
          />
        )
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((task) => (
            <TaskCard key={task.id} task={task} projectTitle={projectTitle(task.project_id)} />
          ))}
        </div>
      )}
    </>
  )
}
