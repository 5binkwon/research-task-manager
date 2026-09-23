'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { TASK_PRIORITIES, TASK_PRIORITY_LABEL, type TaskPriority } from '@/lib/data/types'
import type { Todo, TodoInput } from '@/lib/supabase/todos'
import { EMPTY_FORM_STATE, hasErrors, validateTodo, type FormState } from '@/lib/validation'

const PRIORITY_OPTIONS = TASK_PRIORITIES.map((value) => ({
  value,
  label: TASK_PRIORITY_LABEL[value],
}))

interface TodoFormProps {
  todo?: Todo
  /** 분류 입력 자동완성에 쓸 기존 분류 목록. */
  categories: string[]
  onSubmit: (input: TodoInput) => Promise<void>
  onCancel?: () => void
}

export function TodoForm({ todo, categories, onSubmit, onCancel }: TodoFormProps) {
  const [state, setState] = useState<FormState>(EMPTY_FORM_STATE)
  const [pending, setPending] = useState(false)
  // 추가 폼과 수정 폼이 한 화면에 같이 뜰 수 있어 필드 id 가 겹치지 않게 한다.
  const prefix = todo ? `todo-${todo.id}` : 'todo-new'

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)

    const fields = {
      title: String(formData.get(`${prefix}-title`) ?? ''),
      category: String(formData.get(`${prefix}-category`) ?? ''),
    }

    const validation = validateTodo(fields)
    if (hasErrors(validation)) {
      setState(validation)
      return
    }
    setState(EMPTY_FORM_STATE)

    const dueDate = String(formData.get(`${prefix}-dueDate`) ?? '')
    const input: TodoInput = {
      title: fields.title.trim(),
      category: fields.category.trim(),
      priority: String(formData.get(`${prefix}-priority`) ?? 'medium') as TaskPriority,
      due_date: dueDate || null,
    }

    setPending(true)
    try {
      await onSubmit(input)
      if (!todo) form.reset()
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
        name={`${prefix}-title`}
        label="할 일"
        defaultValue={todo?.title ?? ''}
        placeholder="예: 시약 주문하기"
        errors={state.errors?.title}
        required
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          name={`${prefix}-category`}
          label="분류"
          defaultValue={todo?.category ?? ''}
          placeholder="예: 실험"
          list={`${prefix}-categories`}
          errors={state.errors?.category}
          required
        />
        <Select
          name={`${prefix}-priority`}
          label="우선순위"
          options={PRIORITY_OPTIONS}
          defaultValue={todo?.priority ?? 'medium'}
        />
        <Input
          name={`${prefix}-dueDate`}
          label="마감일"
          type="date"
          defaultValue={todo?.due_date ?? ''}
        />
      </div>

      <datalist id={`${prefix}-categories`}>
        {categories.map((category) => (
          <option key={category} value={category} />
        ))}
      </datalist>

      <div className="flex items-center gap-2">
        <Button type="submit" loading={pending}>
          {todo ? '저장' : '추가'}
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
