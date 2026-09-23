import { TaskListView } from '@/components/task/TaskListView'

// TaskListView 는 useSearchParams 를 쓰므로 Suspense 경계가 필요한데,
// 같은 세그먼트의 loading.tsx 가 이미 그 경계를 만들어 준다.
// 여기에 <Suspense>를 한 겹 더 두면 클라이언트에서 fallback이 풀리지 않아
// 목록이 영원히 스켈레톤에 갇힌다. 중복으로 감싸지 말 것.
export default function TasksPage() {
  return <TaskListView />
}
