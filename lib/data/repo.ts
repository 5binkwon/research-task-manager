// 데이터 접근 경계.
//
// 컴포넌트는 이 인터페이스만 본다. A단계에서는 lib/data/mock/mock-repo.ts 가 구현하고,
// B단계에서 Supabase 구현체로 교체하면 컴포넌트는 손대지 않는다.
//
// 모든 메서드가 async인 이유: 지금은 setTimeout으로 지연을 흉내낼 뿐이지만
// 시그니처가 Supabase 호출과 같아야 교체가 기계적인 작업이 된다.

import type {
  Project,
  ProjectStatus,
  ShareLink,
  Task,
  TaskNote,
  TaskPriority,
  TaskStatus,
  User,
} from './types'

/** 예상 가능한 실패(로그인 실패 등)는 throw하지 않고 이 union으로 돌려준다. */
export type Result<T> = { ok: true; data: T } | { ok: false; message: string }

export interface ProjectInput {
  title: string
  description: string | null
  status: ProjectStatus
  started_on: string | null
  due_on: string | null
}

export interface TaskInput {
  project_id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_at: string | null
  blocked_reason: string | null
}

export interface TaskFilter {
  status?: TaskStatus[]
  priority?: TaskPriority[]
  projectId?: string
  q?: string
}

export interface ShareLinkInput {
  project_id: string
  label: string | null
  include_notes: boolean
  /** null이면 만료 없음 */
  expires_in_days: number | null
}

/** 공유 페이지가 받는 페이로드. owner_id 같은 내부 컬럼은 여기에 담기지 않는다. */
export interface SharePayload {
  label: string | null
  include_notes: boolean
  project: Omit<Project, 'owner_id'>
  tasks: Omit<Task, 'owner_id'>[]
  notes: Omit<TaskNote, 'owner_id'>[]
}

export interface AuthRepo {
  getCurrentUser(): Promise<User | null>
  signIn(email: string, password: string): Promise<Result<User>>
  signUp(input: { email: string; password: string; displayName: string }): Promise<Result<User>>
  signOut(): Promise<void>
}

export interface ProjectRepo {
  list(): Promise<Project[]>
  get(id: string): Promise<Project | null>
  create(input: ProjectInput): Promise<Project>
  update(id: string, input: Partial<ProjectInput>): Promise<Project>
  remove(id: string): Promise<void>
}

export interface TaskRepo {
  listByProject(projectId: string): Promise<Task[]>
  list(filter?: TaskFilter): Promise<Task[]>
  get(id: string): Promise<Task | null>
  create(input: TaskInput): Promise<Task>
  update(id: string, input: Partial<TaskInput>): Promise<Task>
  remove(id: string): Promise<void>
}

export interface NoteRepo {
  listByTask(taskId: string): Promise<TaskNote[]>
  create(taskId: string, body: string): Promise<TaskNote>
}

export interface ShareRepo {
  listByProject(projectId: string): Promise<ShareLink[]>
  /** 평문 토큰은 생성 시 한 번만 반환된다. 실제 구현에서는 해시만 저장한다. */
  create(input: ShareLinkInput): Promise<{ link: ShareLink; token: string }>
  revoke(id: string): Promise<void>
  /** 만료·폐기·존재하지 않음을 구분하지 않고 전부 null. */
  resolve(token: string): Promise<SharePayload | null>
}

export interface Repos {
  auth: AuthRepo
  projects: ProjectRepo
  tasks: TaskRepo
  notes: NoteRepo
  share: ShareRepo
}
