import { PageHeader } from '@/components/layout/PageHeader'
import { TodoView } from '@/components/todo/TodoView'

// 헤더는 서버에서 렌더하고, 로그인·데이터가 필요한 부분만 클라이언트(TodoView)로 둔다.
// 데이터는 브라우저에서 불러오므로 이 세그먼트에는 loading.tsx 를 두지 않는다.
// 로딩 표시는 TodoView 가 직접 한다.
export default function TodosPage() {
  return (
    <>
      <PageHeader
        title="할 일"
        description="Supabase에 저장됩니다. 이 브라우저의 익명 계정으로 로그인되어 있습니다."
      />
      <TodoView />
    </>
  )
}
