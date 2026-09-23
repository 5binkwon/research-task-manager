import { TaskCard } from './TaskCard'
import { TASK_STATUSES, TASK_STATUS_LABEL, type Task } from '@/lib/data/types'

export function TaskBoard({ tasks }: { tasks: Task[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {TASK_STATUSES.map((status) => {
        const column = tasks.filter((task) => task.status === status)

        return (
          <section key={status} className="flex flex-col gap-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              {TASK_STATUS_LABEL[status]}
              <span className="rounded bg-zinc-100 px-1.5 text-xs font-normal text-zinc-500 tabular-nums dark:bg-zinc-800 dark:text-zinc-400">
                {column.length}
              </span>
            </h3>

            {column.length === 0 ? (
              <p className="rounded-lg border border-dashed border-zinc-300 px-3 py-6 text-center text-xs text-zinc-400 dark:border-zinc-700 dark:text-zinc-600">
                비어 있음
              </p>
            ) : (
              column.map((task) => <TaskCard key={task.id} task={task} />)
            )}
          </section>
        )
      })}
    </div>
  )
}
