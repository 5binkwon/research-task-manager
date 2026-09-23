// public.todos CRUD.
//
// RLS 정책(authenticated, auth.uid() = user_id)과 맞추기 위한 규칙:
// - insert 에는 로그인한 사용자의 id 를 user_id 로 넣는다. 다른 값이면 with check 에 걸린다.
// - update 에서는 user_id 를 절대 보내지 않는다. 바꾸려 하면 with check 에 걸린다.
// - select/update/delete 는 RLS 가 남의 행을 이미 걸러 주지만, 의도를 드러내려고
//   user_id 조건을 함께 건다.
// - RLS 로 걸러진 update/delete 는 오류 없이 0행이 되므로 반환 행 수로 확인한다.

import type { PostgrestError } from '@supabase/supabase-js'

import { getSupabase } from './client'
import { describeDbError } from './errors'
import type { TaskPriority } from '../data/types'

export interface Todo {
  id: string
  user_id: string
  title: string
  category: string
  priority: TaskPriority
  due_date: string | null
  is_completed: boolean
  created_at: string
}

export interface TodoInput {
  title: string
  category: string
  priority: TaskPriority
  due_date: string | null
}

export type TodoPatch = Partial<TodoInput & { is_completed: boolean }>

const COLUMNS = 'id, user_id, title, category, priority, due_date, is_completed, created_at'

function toError(error: PostgrestError, action: string): Error {
  return new Error(describeDbError(error, action))
}

/**
 * listTodos 의 order by 와 같은 순서. 변경 후 재조회 없이 로컬 목록을 고칠 때 쓴다.
 * 미완료 먼저 → 마감일 빠른 순(없으면 뒤) → 최근 생성 순.
 */
export function sortTodos(todos: Todo[]): Todo[] {
  return [...todos].sort((a, b) => {
    if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1
    if (a.due_date !== b.due_date) {
      if (!a.due_date) return 1
      if (!b.due_date) return -1
      return a.due_date.localeCompare(b.due_date)
    }
    return b.created_at.localeCompare(a.created_at)
  })
}

export async function listTodos(userId: string): Promise<Todo[]> {
  const { data, error } = await getSupabase()
    .from('todos')
    .select(COLUMNS)
    .eq('user_id', userId)
    .order('is_completed', { ascending: true })
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
  if (error) throw toError(error, '할 일을 불러오')
  return data as Todo[]
}

export async function createTodo(userId: string, input: TodoInput): Promise<Todo> {
  const { data, error } = await getSupabase()
    .from('todos')
    .insert({ ...input, user_id: userId })
    .select(COLUMNS)
    .single()
  if (error) throw toError(error, '할 일을 추가')
  return data as Todo
}

export async function updateTodo(userId: string, id: string, patch: TodoPatch): Promise<Todo> {
  const { data, error } = await getSupabase()
    .from('todos')
    .update(patch)
    .eq('id', id)
    .eq('user_id', userId)
    .select(COLUMNS)
  if (error) throw toError(error, '할 일을 수정')
  if (!data.length) throw new Error('할 일을 찾을 수 없습니다. 이미 삭제되었을 수 있습니다.')
  return data[0] as Todo
}

export async function deleteTodo(userId: string, id: string): Promise<void> {
  const { data, error } = await getSupabase()
    .from('todos')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select('id')
  if (error) throw toError(error, '할 일을 삭제')
  if (!data.length) throw new Error('할 일을 찾을 수 없습니다. 이미 삭제되었을 수 있습니다.')
}
