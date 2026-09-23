'use client'

import Link from 'next/link'
import { useCallback } from 'react'

import { ProjectCard } from './ProjectCard'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonList } from '@/components/ui/Skeleton'
import { useAsync, useRepos } from '@/lib/data/provider'
import type { Project, Task } from '@/lib/data/types'

export function ProjectList() {
  const repos = useRepos()

  const loadProjects = useCallback(() => repos.projects.list(), [repos])
  const loadTasks = useCallback(() => repos.tasks.list(), [repos])

  const projects = useAsync<Project[]>(loadProjects, [])
  const tasks = useAsync<Task[]>(loadTasks, [])

  const loading = (projects.loading && !projects.data) || (tasks.loading && !tasks.data)
  const rows = projects.data ?? []
  const allTasks = tasks.data ?? []

  return (
    <>
      <PageHeader
        title="연구 과제"
        description="진행 중인 과제와 진척도를 확인합니다."
        actions={
          <Link href="/projects/new">
            <Button size="sm">새 과제</Button>
          </Link>
        }
      />

      {loading ? (
        <SkeletonList rows={3} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="아직 연구 과제가 없습니다."
          description="과제를 만들고 그 아래에 업무를 추가해 보세요."
          action={
            <Link href="/projects/new">
              <Button>과제 만들기</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((project) => {
            const projectTasks = allTasks.filter((t) => t.project_id === project.id)
            return (
              <ProjectCard
                key={project.id}
                project={project}
                taskCount={projectTasks.length}
                doneCount={projectTasks.filter((t) => t.status === 'done').length}
              />
            )
          })}
        </div>
      )}
    </>
  )
}
