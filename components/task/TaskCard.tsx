import Link from 'next/link'

import { Badge } from '@/components/ui/Badge'
import { formatDue } from '@/lib/format'
import { DUE_TONE, TASK_PRIORITY_TONE, TASK_STATUS_TONE } from '@/lib/tone'
import { TASK_PRIORITY_LABEL, TASK_STATUS_LABEL, type Task } from '@/lib/data/types'

interface TaskCardProps {
  task: Task
  /** 여러 과제가 섞여 보이는 목록에서만 넘긴다. */
  projectTitle?: string
}

export function TaskCard({ task, projectTitle }: TaskCardProps) {
  // 완료된 업무에는 마감 경고를 띄우지 않는다. 이미 끝난 일이 "N일 지남"으로 보이면 오해를 준다.
  const due = task.status === 'done' ? null : formatDue(task.due_at)

  return (
    <Link
      href={`/tasks/${task.id}`}
      className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
    >
      <div className="flex items-start justify-between gap-3">
        <p
          className={`text-sm font-medium ${
            task.status === 'done' ? 'text-zinc-400 line-through dark:text-zinc-600' : ''
          }`}
        >
          {task.title}
        </p>
        {due && <Badge tone={DUE_TONE[due.tone]}>{due.text}</Badge>}
      </div>

      {projectTitle && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{projectTitle}</p>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone={TASK_STATUS_TONE[task.status]}>{TASK_STATUS_LABEL[task.status]}</Badge>
        <Badge tone={TASK_PRIORITY_TONE[task.priority]}>
          {TASK_PRIORITY_LABEL[task.priority]}
        </Badge>
      </div>

      {task.status === 'blocked' && task.blocked_reason && (
        <p className="rounded bg-red-50 px-2 py-1 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
          {task.blocked_reason}
        </p>
      )}
    </Link>
  )
}
