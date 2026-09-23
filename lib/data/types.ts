// Mock 단계 타입. Supabase 연결 시 `types/database.ts`(supabase gen types)로 대체되며,
// 컬럼명은 계획의 스키마와 1:1로 맞춰 두었다.

export type ProjectStatus = 'active' | 'on_hold' | 'completed' | 'archived'
export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type NoteKind = 'note' | 'status_change' | 'result'

export interface User {
  id: string
  email: string
  display_name: string | null
}

export interface Project {
  id: string
  owner_id: string
  title: string
  description: string | null
  status: ProjectStatus
  started_on: string | null
  due_on: string | null
  archived_at: string | null
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  owner_id: string
  project_id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_at: string | null
  blocked_reason: string | null
  completed_at: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface TaskNote {
  id: string
  owner_id: string
  task_id: string
  body: string
  kind: NoteKind
  created_at: string
}

export interface Tag {
  id: string
  owner_id: string
  name: string
  color: string | null
}

export interface TaskTag {
  task_id: string
  tag_id: string
  owner_id: string
}

export interface ShareLink {
  id: string
  owner_id: string
  token: string // mock에서만 평문 보관. 실제로는 token_hash(sha256)만 저장한다.
  token_prefix: string
  project_id: string | null
  task_id: string | null
  include_notes: boolean
  label: string | null
  expires_at: string | null
  revoked_at: string | null
  view_count: number
  last_viewed_at: string | null
  created_at: string
}

export const PROJECT_STATUSES: ProjectStatus[] = ['active', 'on_hold', 'completed', 'archived']
export const TASK_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'blocked', 'done']
export const TASK_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent']

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  active: '진행 중',
  on_hold: '보류',
  completed: '완료',
  archived: '보관됨',
}

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  todo: '할 일',
  in_progress: '진행 중',
  blocked: '막힘',
  done: '완료',
}

export const TASK_PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: '낮음',
  medium: '보통',
  high: '높음',
  urgent: '긴급',
}
