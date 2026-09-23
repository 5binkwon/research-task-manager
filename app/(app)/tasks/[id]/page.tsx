import { TaskDetailView } from '@/components/task/TaskDetailView'

export default async function TaskDetailPage({ params }: PageProps<'/tasks/[id]'>) {
  const { id } = await params
  return <TaskDetailView taskId={id} />
}
