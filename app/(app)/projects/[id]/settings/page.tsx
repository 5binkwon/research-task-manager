import { ProjectSettingsView } from '@/components/project/ProjectSettingsView'

export default async function ProjectSettingsPage({
  params,
}: PageProps<'/projects/[id]/settings'>) {
  const { id } = await params
  return <ProjectSettingsView projectId={id} />
}
