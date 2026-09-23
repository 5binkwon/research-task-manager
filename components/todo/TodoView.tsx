'use client'

import { useState } from 'react'

import { TodoForm } from './TodoForm'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { FormError } from '@/components/ui/FormError'
import { SkeletonList } from '@/components/ui/Skeleton'
import { Spinner } from '@/components/ui/Spinner'
import { TASK_PRIORITY_LABEL } from '@/lib/data/types'
import { formatDue, localToday } from '@/lib/format'
import { useSupabaseAuth } from '@/lib/supabase/auth-provider'
import {
  createTodo,
  deleteTodo,
  listTodos,
  sortTodos,
  updateTodo,
  type Todo,
  type TodoInput,
  type TodoPatch,
} from '@/lib/supabase/todos'
import { DUE_TONE, TASK_PRIORITY_TONE } from '@/lib/tone'
import { useLoad } from '@/lib/use-load'

export function TodoView() {
  const { auth, retry } = useSupabaseAuth()

  if (auth.status === 'loading') {
    return (
      <div className="flex flex-col gap-3">
        <p role="status" className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <Spinner /> 로그인하는 중…
        </p>
        <SkeletonList rows={3} />
      </div>
    )
  }

  if (auth.status === 'error') {
    return (
      <div className="flex flex-col items-start gap-3">
        <FormError message={auth.message} />
        <Button variant="secondary" size="sm" onClick={retry}>
          다시 시도
        </Button>
      </div>
    )
  }

  // userId 가 바뀌면 다시 마운트해서 이전 사용자의 목록·편집 상태가 남지 않게 한다.
  return <TodoBoard key={auth.userId} userId={auth.userId} />
}

function TodoBoard({ userId }: { userId: string }) {
  const [reload, setReload] = useState(0)
  const todos = useLoad(() => listTodos(userId), userId, reload)

  // 이 컴포넌트는 로그인(클라이언트 이펙트) 이후에만 렌더되므로 브라우저 날짜를 써도
  // hydration mismatch가 없다. mock 화면처럼 고정된 TODAY 를 쓰면 실데이터의 마감 표기가 틀린다.
  const [today] = useState(localToday)

  const rows = todos.data
  const categories = Array.from(new Set((rows ?? []).map((t) => t.category))).sort()

  // 변경 후에는 목록을 다시 조회하지 않고 서버가 돌려준 행으로 로컬 목록을 고친다.
  async function handleCreate(input: TodoInput) {
    const created = await createTodo(userId, input)
    todos.mutate((list) => sortTodos([created, ...list]))
  }

  async function handleUpdate(id: string, patch: TodoPatch) {
    const updated = await updateTodo(userId, id, patch)
    todos.mutate((list) => sortTodos(list.map((t) => (t.id === id ? updated : t))))
  }

  async function handleDelete(id: string) {
    await deleteTodo(userId, id)
    todos.mutate((list) => list.filter((t) => t.id !== id))
  }

  return (
    <div className="flex flex-col gap-6">
      <TodoForm categories={categories} onSubmit={handleCreate} />

      {/* 재조회가 실패해도 이미 받은 목록은 그대로 두고 오류만 위에 띄운다. */}
      {todos.error && (
        <div className="flex flex-col items-start gap-3">
          <FormError message={todos.error.message} />
          <Button variant="secondary" size="sm" onClick={() => setReload((n) => n + 1)}>
            다시 불러오기
          </Button>
        </div>
      )}

      {rows === null ? (
        !todos.error && <SkeletonList rows={4} />
      ) : rows.length === 0 ? (
        <EmptyState title="할 일이 없습니다." description="위 입력란에서 첫 할 일을 추가해 보세요." />
      ) : (
        <ul className="flex flex-col gap-3" aria-busy={todos.loading || undefined}>
          {rows.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              today={today}
              categories={categories}
              onUpdate={(patch) => handleUpdate(todo.id, patch)}
              onDelete={() => handleDelete(todo.id)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

interface TodoItemProps {
  todo: Todo
  today: string
  categories: string[]
  onUpdate: (patch: TodoPatch) => Promise<void>
  onDelete: () => Promise<void>
}

function TodoItem({ todo, today, categories, onUpdate, onDelete }: TodoItemProps) {
  const [editing, setEditing] = useState(false)
  const [pending, setPending] = useState<'toggle' | 'delete' | null>(null)
  const [error, setError] = useState<string | undefined>()

  // 완료된 할 일에는 마감 경고를 띄우지 않는다.
  const due = todo.is_completed ? null : formatDue(todo.due_date, today)

  async function run(kind: 'toggle' | 'delete', action: () => Promise<void>) {
    setPending(kind)
    setError(undefined)
    try {
      await action()
    } catch (e) {
      setError(e instanceof Error ? e.message : '처리하지 못했습니다.')
    } finally {
      // 삭제에 성공하면 이 항목은 이미 목록에서 빠져 언마운트된다. 이때의 setState 는 무시된다.
      setPending(null)
    }
  }

  async function handleEdit(input: TodoInput) {
    await onUpdate(input)
    setEditing(false)
  }

  if (editing) {
    return (
      <li>
        <TodoForm
          todo={todo}
          categories={categories}
          onSubmit={handleEdit}
          onCancel={() => setEditing(false)}
        />
      </li>
    )
  }

  const checkboxId = `todo-done-${todo.id}`

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start gap-3">
        <input
          id={checkboxId}
          type="checkbox"
          checked={todo.is_completed}
          disabled={pending !== null}
          onChange={(event) => {
            const next = event.target.checked
            run('toggle', () => onUpdate({ is_completed: next }))
          }}
          className="mt-0.5 h-4 w-4 shrink-0 accent-zinc-900 dark:accent-zinc-100"
        />
        <label
          htmlFor={checkboxId}
          className={`min-w-0 flex-1 text-sm font-medium ${
            todo.is_completed ? 'text-zinc-400 line-through dark:text-zinc-600' : ''
          }`}
        >
          {todo.title}
        </label>
        {pending === 'toggle' && <Spinner className="text-zinc-400" />}
        {due && <Badge tone={DUE_TONE[due.tone]}>{due.text}</Badge>}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pl-7">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge>{todo.category}</Badge>
          <Badge tone={TASK_PRIORITY_TONE[todo.priority] ?? 'neutral'}>
            {TASK_PRIORITY_LABEL[todo.priority] ?? todo.priority}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditing(true)}
            disabled={pending !== null}
          >
            수정
          </Button>
          <Button
            size="sm"
            variant="danger"
            loading={pending === 'delete'}
            disabled={pending === 'toggle'}
            onClick={() => run('delete', onDelete)}
          >
            삭제
          </Button>
        </div>
      </div>

      {error && <FormError message={error} />}
    </li>
  )
}
