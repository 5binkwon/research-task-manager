'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { useRepoContext, useRepos } from '@/lib/data/provider'
import {
  TASK_PRIORITIES,
  TASK_PRIORITY_LABEL,
  TASK_STATUSES,
  TASK_STATUS_LABEL,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from '@/lib/data/types'
import { EMPTY_FORM_STATE, hasErrors, validateTask, type FormState } from '@/lib/validation'

const STATUS_OPTIONS = TASK_STATUSES.map((value) => ({ value, label: TASK_STATUS_LABEL[value] }))
const PRIORITY_OPTIONS = TASK_PRIORITIES.map((value) => ({
  value,
  label: TASK_PRIORITY_LABEL[value],
}))

/** due_at 은 timestamptz 지만 입력은 날짜만 받고 09:00 UTC로 고정한다. */
function toDueAt(dateValue: string): string | null {
  return dateValue ? `${dateValue}T09:00:00.000Z` : null
}

interface TaskFormProps {
  projectId: string
  task?: Task
  onDone?: () => void
  onCancel?: () => void
}

export function TaskForm({ projectId, task, onDone, onCancel }: TaskFormProps) {
  const repos = useRepos()
  const { refresh } = useRepoContext()

  const [state, setState] = useState<FormState>(EMPTY_FORM_STATE)
  const [pending, setPending] = useState(false)
  // 막힘 사유 필드를 조건부로 보여주려면 상태를 제어해야 한다.
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'todo')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)

    const fields = {
      title: String(formData.get('title') ?? ''),
      description: String(formData.get('description') ?? ''),
      status: String(formData.get('status') ?? 'todo'),
      blockedReason: String(formData.get('blockedReason') ?? ''),
      dueAt: String(formData.get('dueAt') ?? ''),
    }

    const validation = validateTask(fields)
    if (hasErrors(validation)) {
      setState(validation)
      return
    }
    setState(EMPTY_FORM_STATE)

    const input = {
      project_id: projectId,
      title: fields.title.trim(),
      description: fields.description.trim() || null,
      status: fields.status as TaskStatus,
      priority: String(formData.get('priority') ?? 'medium') as TaskPriority,
      due_at: toDueAt(fields.dueAt),
      blocked_reason: fields.status === 'blocked' ? fields.blockedReason.trim() : null,
    }

    setPending(true)
    try {
      if (task) {
        await repos.tasks.update(task.id, input)
      } else {
        await repos.tasks.create(input)
        form.reset()
        setStatus('todo')
      }
      refresh()
      onDone?.()
    } catch (error) {
      setState({ message: error instanceof Error ? error.message : '저장하지 못했습니다.' })
    } finally {
      setPending(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <FormError message={state.message} />

      <Input
        name="title"
        label="업무 이름"
        defaultValue={task?.title ?? ''}
        placeholder="예: GC 검량선 재작성"
        errors={state.errors?.title}
        required
      />

      <Textarea
        name="description"
        label="설명"
        rows={3}
        defaultValue={task?.description ?? ''}
        errors={state.errors?.description}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Select
          name="status"
          label="상태"
          options={STATUS_OPTIONS}
          value={status}
          onChange={(event) => setStatus(event.target.value as TaskStatus)}
        />
        <Select
          name="priority"
          label="우선순위"
          options={PRIORITY_OPTIONS}
          defaultValue={task?.priority ?? 'medium'}
        />
        <Input
          name="dueAt"
          label="마감일"
          type="date"
          defaultValue={task?.due_at?.slice(0, 10) ?? ''}
          errors={state.errors?.dueAt}
        />
      </div>

      {status === 'blocked' && (
        <Textarea
          name="blockedReason"
          label="막힌 이유"
          rows={2}
          defaultValue={task?.blocked_reason ?? ''}
          hint="무엇 때문에 진행할 수 없는지 적어 두면 나중에 맥락을 되살리기 쉽습니다."
          errors={state.errors?.blockedReason}
          required
        />
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" loading={pending}>
          {task ? '저장' : '업무 추가'}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
            취소
          </Button>
        )}
      </div>
    </form>
  )
}
