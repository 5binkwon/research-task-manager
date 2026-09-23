'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { useRepoContext, useRepos } from '@/lib/data/provider'
import { PROJECT_STATUSES, PROJECT_STATUS_LABEL, type Project } from '@/lib/data/types'
import { EMPTY_FORM_STATE, hasErrors, validateProject, type FormState } from '@/lib/validation'

const STATUS_OPTIONS = PROJECT_STATUSES.map((value) => ({
  value,
  label: PROJECT_STATUS_LABEL[value],
}))

export function ProjectForm({ project }: { project?: Project }) {
  const router = useRouter()
  const repos = useRepos()
  const { refresh } = useRepoContext()

  const [state, setState] = useState<FormState>(EMPTY_FORM_STATE)
  const [pending, setPending] = useState(false)
  const [saved, setSaved] = useState(false)

  const isEdit = Boolean(project)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaved(false)

    const formData = new FormData(event.currentTarget)
    const fields = {
      title: String(formData.get('title') ?? ''),
      description: String(formData.get('description') ?? ''),
      startedOn: String(formData.get('startedOn') ?? ''),
      dueOn: String(formData.get('dueOn') ?? ''),
    }

    const validation = validateProject(fields)
    if (hasErrors(validation)) {
      setState(validation)
      return
    }
    setState(EMPTY_FORM_STATE)

    const input = {
      title: fields.title.trim(),
      description: fields.description.trim() || null,
      status: String(formData.get('status') ?? 'active') as Project['status'],
      started_on: fields.startedOn || null,
      due_on: fields.dueOn || null,
    }

    setPending(true)
    try {
      if (project) {
        await repos.projects.update(project.id, input)
        refresh()
        setSaved(true)
      } else {
        const created = await repos.projects.create(input)
        refresh()
        router.push(`/projects/${created.id}`)
      }
    } catch (error) {
      setState({ message: error instanceof Error ? error.message : '저장하지 못했습니다.' })
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex max-w-xl flex-col gap-4">
      <FormError message={state.message} />

      <Input
        name="title"
        label="과제 이름"
        defaultValue={project?.title ?? ''}
        placeholder="예: 광촉매 수소 생산 효율 측정"
        errors={state.errors?.title}
        required
      />

      <Textarea
        name="description"
        label="설명"
        defaultValue={project?.description ?? ''}
        placeholder="과제의 목표나 범위를 적어 두면 나중에 찾기 쉽습니다."
        errors={state.errors?.description}
      />

      <Select
        name="status"
        label="상태"
        options={STATUS_OPTIONS}
        defaultValue={project?.status ?? 'active'}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          name="startedOn"
          label="시작일"
          type="date"
          defaultValue={project?.started_on ?? ''}
          errors={state.errors?.startedOn}
        />
        <Input
          name="dueOn"
          label="마감일"
          type="date"
          defaultValue={project?.due_on ?? ''}
          errors={state.errors?.dueOn}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" loading={pending}>
          {isEdit ? '저장' : '과제 만들기'}
        </Button>
        {saved && !pending && (
          <span role="status" className="text-sm text-green-700 dark:text-green-400">
            저장했습니다.
          </span>
        )}
      </div>
    </form>
  )
}
