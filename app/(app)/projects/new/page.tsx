import { PageHeader } from '@/components/layout/PageHeader'
import { ProjectForm } from '@/components/project/ProjectForm'

export default function NewProjectPage() {
  return (
    <>
      <PageHeader title="새 연구 과제" description="과제를 만들고 그 아래에 업무를 추가합니다." />
      <ProjectForm />
    </>
  )
}
