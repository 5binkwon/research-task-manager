import { ProjectDetailView } from '@/components/project/ProjectDetailView'

// 페이지는 얇은 서버 컴포넌트로 두고 params만 await한다(Next 16: params는 Promise).
export default async function ProjectDetailPage({ params }: PageProps<'/projects/[id]'>) {
  const { id } = await params
  return <ProjectDetailView projectId={id} />
}
