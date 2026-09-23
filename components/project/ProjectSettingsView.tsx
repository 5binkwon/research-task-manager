'use client'

import { notFound, useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'

import { ProjectForm } from './ProjectForm'
import { ShareLinkPanel } from './ShareLinkPanel'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { SkeletonDetail } from '@/components/ui/Skeleton'
import { useAsync, useRepos } from '@/lib/data/provider'
import type { Project } from '@/lib/data/types'

export function ProjectSettingsView({ projectId }: { projectId: string }) {
  const repos = useRepos()
  const router = useRouter()

  const loadProject = useCallback(() => repos.projects.get(projectId), [repos, projectId])
  const project = useAsync<Project | null>(loadProject, [projectId])

  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  if (project.loading && !project.data) return <SkeletonDetail />
  if (!project.data) notFound()

  async function handleDelete() {
    setDeleting(true)
    await repos.projects.remove(projectId)
    // 여기서 refresh()를 부르면 이 화면이 삭제된 과제를 다시 읽어 notFound()가 먼저 터진다.
    // 목적지 화면은 새로 마운트되며 스스로 조회하므로 이동만 하면 된다.
    router.push('/projects')
  }

  return (
    <>
      <PageHeader title="과제 설정" description={project.data.title} />

      <div className="flex flex-col gap-10">
        <section>
          <h2 className="mb-4 text-base font-semibold">기본 정보</h2>
          <ProjectForm project={project.data} />
        </section>

        <ShareLinkPanel projectId={projectId} />

        <section className="max-w-xl rounded-lg border border-red-200 p-4 dark:border-red-900">
          <h2 className="text-base font-semibold text-red-700 dark:text-red-400">과제 삭제</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            이 과제와 하위 업무, 진행 로그, 공유 링크가 모두 사라집니다. 되돌릴 수 없습니다.
          </p>

          <div className="mt-3 flex items-center gap-2">
            {confirming ? (
              <>
                <Button variant="danger" onClick={handleDelete} loading={deleting}>
                  정말 삭제합니다
                </Button>
                <Button variant="ghost" onClick={() => setConfirming(false)} disabled={deleting}>
                  취소
                </Button>
              </>
            ) : (
              <Button variant="danger" onClick={() => setConfirming(true)}>
                과제 삭제
              </Button>
            )}
          </div>
        </section>
      </div>
    </>
  )
}
