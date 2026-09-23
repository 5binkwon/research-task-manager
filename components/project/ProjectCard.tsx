import Link from 'next/link'

import { Badge } from '@/components/ui/Badge'
import { formatDue } from '@/lib/format'
import { DUE_TONE, PROJECT_STATUS_TONE } from '@/lib/tone'
import { PROJECT_STATUS_LABEL, type Project } from '@/lib/data/types'

interface ProjectCardProps {
  project: Project
  taskCount: number
  doneCount: number
}

export function ProjectCard({ project, taskCount, doneCount }: ProjectCardProps) {
  const due = formatDue(project.due_on)
  const progress = taskCount === 0 ? 0 : Math.round((doneCount / taskCount) * 100)

  return (
    <Link
      href={`/projects/${project.id}`}
      className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium">{project.title}</p>
        {due && <Badge tone={DUE_TONE[due.tone]}>{due.text}</Badge>}
      </div>

      {project.description && (
        <p className="line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
          {project.description}
        </p>
      )}

      <div className="flex items-center gap-2">
        <Badge tone={PROJECT_STATUS_TONE[project.status]}>
          {PROJECT_STATUS_LABEL[project.status]}
        </Badge>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {taskCount === 0 ? '업무 없음' : `업무 ${taskCount}개 중 ${doneCount}개 완료`}
        </span>
      </div>

      {taskCount > 0 && (
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="진행률"
        >
          <div className="h-full bg-zinc-800 dark:bg-zinc-300" style={{ width: `${progress}%` }} />
        </div>
      )}
    </Link>
  )
}
