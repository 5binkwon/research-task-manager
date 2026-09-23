'use client'

import Link from 'next/link'
import { useCallback } from 'react'

import { TaskCard } from '@/components/task/TaskCard'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonList } from '@/components/ui/Skeleton'
import { useAsync, useRepos, useSession } from '@/lib/data/provider'
import { daysFromToday } from '@/lib/format'
import type { Project, Task } from '@/lib/data/types'

export function DashboardView() {
  const repos = useRepos()
  const { user } = useSession()

  const loadProjects = useCallback(() => repos.projects.list(), [repos])
  const loadTasks = useCallback(() => repos.tasks.list(), [repos])

  const projects = useAsync<Project[]>(loadProjects, [])
  const tasks = useAsync<Task[]>(loadTasks, [])

  // 첫 조회에만 스켈레톤을 띄운다. 변이 후 재조회 중에는 직전 화면을 유지한다.
  const loading = (projects.loading && !projects.data) || (tasks.loading && !tasks.data)

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">
          안녕하세요, {user?.display_name ?? '연구자'}님
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          오늘 챙겨야 할 업무를 모았습니다.
        </p>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <DashboardContent projects={projects.data ?? []} tasks={tasks.data ?? []} />
      )}
    </>
  )
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
          />
        ))}
      </div>
      <SkeletonList rows={3} />
    </div>
  )
}

function DashboardContent({ projects, tasks }: { projects: Project[]; tasks: Task[] }) {
  const open = tasks.filter((t) => t.status !== 'done')
  const overdue = open.filter((t) => t.due_at && daysFromToday(t.due_at) < 0)
  const thisWeek = open.filter((t) => {
    if (!t.due_at) return false
    const d = daysFromToday(t.due_at)
    return d >= 0 && d <= 7
  })
  const blocked = open.filter((t) => t.status === 'blocked')

  const projectTitle = (id: string) => projects.find((p) => p.id === id)?.title

  // 기한 지난 것 먼저, 그다음 이번 주.
  const attention = [...overdue, ...thisWeek]

  if (projects.length === 0) {
    return (
      <EmptyState
        title="아직 연구 과제가 없습니다."
        description="첫 과제를 만들면 여기에 기한이 임박한 업무가 모입니다."
        action={
          <Link href="/projects/new">
            <Button>과제 만들기</Button>
          </Link>
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="sr-only">요약</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="진행 중 과제" value={projects.filter((p) => p.status === 'active').length} />
          <StatTile label="남은 업무" value={open.length} />
          <StatTile label="기한 지남" value={overdue.length} tone={overdue.length > 0 ? 'red' : undefined} />
          <StatTile label="막힘" value={blocked.length} tone={blocked.length > 0 ? 'amber' : undefined} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          기한이 임박한 업무
        </h2>
        {attention.length === 0 ? (
          <EmptyState
            title="이번 주에 마감인 업무가 없습니다."
            description="기한이 지났거나 7일 안에 마감인 업무가 여기에 표시됩니다."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {attention.map((task) => (
              <TaskCard key={task.id} task={task} projectTitle={projectTitle(task.project_id)} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">연구 과제</h2>
          <Link href="/projects" className="text-sm text-zinc-500 underline dark:text-zinc-400">
            전체 보기
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {projects.slice(0, 4).map((project) => {
            const projectTasks = tasks.filter((t) => t.project_id === project.id)
            const done = projectTasks.filter((t) => t.status === 'done').length
            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              >
                <p className="text-sm font-medium">{project.title}</p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {projectTasks.length === 0
                    ? '업무 없음'
                    : `업무 ${projectTasks.length}개 중 ${done}개 완료`}
                </p>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function StatTile({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: 'red' | 'amber'
}) {
  const valueClass =
    tone === 'red'
      ? 'text-red-600 dark:text-red-400'
      : tone === 'amber'
        ? 'text-amber-600 dark:text-amber-400'
        : ''

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${valueClass}`}>{value}</p>
    </div>
  )
}
