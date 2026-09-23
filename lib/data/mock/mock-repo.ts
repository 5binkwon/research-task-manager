// lib/data/repo.ts 인터페이스의 메모리 구현.
//
// 상태는 이 모듈 인스턴스 안에만 있다. 새로고침하면 시드로 되돌아간다.
// B단계에서는 이 파일 대신 Supabase 구현체를 RepoProvider에 주입한다.

import { isShareLinkLive } from '../../format'
import type {
  AuthRepo,
  NoteRepo,
  ProjectInput,
  ProjectRepo,
  Repos,
  ShareLinkInput,
  ShareRepo,
  SharePayload,
  TaskFilter,
  TaskInput,
  TaskRepo,
} from '../repo'
import { TASK_STATUS_LABEL } from '../types'
import type { Project, ShareLink, Task, TaskNote, User } from '../types'
import {
  SEED_NOTES,
  SEED_PASSWORD,
  SEED_PROJECTS,
  SEED_SHARE_LINKS,
  SEED_TASKS,
  SEED_USER,
} from './seed'

/** 로딩 상태가 실제로 화면에 보이도록 하는 인위적 지연. */
const DELAY = {
  list: 500,
  detail: 400,
  mutate: 300,
} as const

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

let idCounter = 0
function nextId(prefix: string): string {
  idCounter += 1
  return `${prefix}-new-${idCounter}`
}

/** 사용자 조작 시점(클라이언트)에만 호출되므로 hydration에 영향이 없다. */
function nowIso(): string {
  return new Date().toISOString()
}

function randomToken(): string {
  const bytes = new Uint8Array(32)
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256)
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

function addDaysIso(days: number): string {
  const ms = Date.now() + days * 86400000
  return new Date(ms).toISOString()
}

function stripOwner<T extends { owner_id: string }>(row: T): Omit<T, 'owner_id'> {
  const { owner_id, ...rest } = row
  void owner_id // 공유 페이로드에서 의도적으로 떨어뜨리는 컬럼
  return rest
}

export function createMockRepos(): Repos {
  // 시드를 복사해서 쓴다. 원본 배열을 변형하면 모듈이 재사용될 때 오염된다.
  let currentUser: User | null = { ...SEED_USER }
  const projects: Project[] = SEED_PROJECTS.map((p) => ({ ...p }))
  const tasks: Task[] = SEED_TASKS.map((t) => ({ ...t }))
  const notes: TaskNote[] = SEED_NOTES.map((n) => ({ ...n }))
  const shareLinks: ShareLink[] = SEED_SHARE_LINKS.map((s) => ({ ...s }))

  function ownerId(): string {
    if (!currentUser) throw new Error('로그인이 필요합니다.')
    return currentUser.id
  }

  const auth: AuthRepo = {
    async getCurrentUser() {
      await sleep(50)
      return currentUser ? { ...currentUser } : null
    },

    async signIn(email, password) {
      await sleep(DELAY.mutate)
      // mock: 시드 계정 하나만 통과한다. 폼 레벨 오류를 실제로 만들어 보기 위한 장치.
      if (email.trim().toLowerCase() !== SEED_USER.email || password !== SEED_PASSWORD) {
        return { ok: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' }
      }
      currentUser = { ...SEED_USER }
      return { ok: true, data: { ...currentUser } }
    },

    async signUp({ email, displayName }) {
      await sleep(DELAY.mutate)
      if (email.trim().toLowerCase() === SEED_USER.email) {
        return { ok: false, message: '이미 가입된 이메일입니다.' }
      }
      // mock 단계에서는 가입 즉시 로그인된 것으로 처리한다.
      currentUser = { id: SEED_USER.id, email: email.trim(), display_name: displayName.trim() }
      return { ok: true, data: { ...currentUser } }
    },

    async signOut() {
      await sleep(150)
      currentUser = null
    },
  }

  const projectRepo: ProjectRepo = {
    async list() {
      await sleep(DELAY.list)
      const uid = ownerId()
      return projects
        .filter((p) => p.owner_id === uid)
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
        .map((p) => ({ ...p }))
    },

    async get(id) {
      await sleep(DELAY.detail)
      const uid = ownerId()
      const found = projects.find((p) => p.id === id && p.owner_id === uid)
      return found ? { ...found } : null
    },

    async create(input: ProjectInput) {
      await sleep(DELAY.mutate)
      const ts = nowIso()
      const project: Project = {
        id: nextId('p'),
        owner_id: ownerId(),
        title: input.title,
        description: input.description,
        status: input.status,
        started_on: input.started_on,
        due_on: input.due_on,
        archived_at: null,
        created_at: ts,
        updated_at: ts,
      }
      projects.push(project)
      return { ...project }
    },

    async update(id, input) {
      await sleep(DELAY.mutate)
      const uid = ownerId()
      const project = projects.find((p) => p.id === id && p.owner_id === uid)
      if (!project) throw new Error('과제를 찾을 수 없습니다.')
      Object.assign(project, input, { updated_at: nowIso() })
      return { ...project }
    },

    async remove(id) {
      await sleep(DELAY.mutate)
      const uid = ownerId()
      const index = projects.findIndex((p) => p.id === id && p.owner_id === uid)
      if (index === -1) throw new Error('과제를 찾을 수 없습니다.')
      projects.splice(index, 1)

      // 실제 스키마에서는 on delete cascade 가 해 주는 일을 손으로 흉내낸다.
      const removedTaskIds = tasks.filter((t) => t.project_id === id).map((t) => t.id)
      for (let i = tasks.length - 1; i >= 0; i -= 1) {
        if (tasks[i].project_id === id) tasks.splice(i, 1)
      }
      for (let i = notes.length - 1; i >= 0; i -= 1) {
        if (removedTaskIds.includes(notes[i].task_id)) notes.splice(i, 1)
      }
      for (let i = shareLinks.length - 1; i >= 0; i -= 1) {
        if (shareLinks[i].project_id === id) shareLinks.splice(i, 1)
      }
    },
  }

  const taskRepo: TaskRepo = {
    async listByProject(projectId) {
      await sleep(DELAY.list)
      const uid = ownerId()
      return tasks
        .filter((t) => t.owner_id === uid && t.project_id === projectId)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((t) => ({ ...t }))
    },

    async list(filter: TaskFilter = {}) {
      await sleep(DELAY.list)
      const uid = ownerId()
      const q = filter.q?.trim().toLowerCase()
      return tasks
        .filter((t) => t.owner_id === uid)
        .filter((t) => !filter.projectId || t.project_id === filter.projectId)
        .filter((t) => !filter.status?.length || filter.status.includes(t.status))
        .filter((t) => !filter.priority?.length || filter.priority.includes(t.priority))
        .filter((t) => !q || t.title.toLowerCase().includes(q))
        .sort((a, b) => {
          // 마감일 있는 것 먼저, 그 안에서 빠른 순.
          if (a.due_at && b.due_at) return a.due_at.localeCompare(b.due_at)
          if (a.due_at) return -1
          if (b.due_at) return 1
          return a.sort_order - b.sort_order
        })
        .map((t) => ({ ...t }))
    },

    async get(id) {
      await sleep(DELAY.detail)
      const uid = ownerId()
      const found = tasks.find((t) => t.id === id && t.owner_id === uid)
      return found ? { ...found } : null
    },

    async create(input: TaskInput) {
      await sleep(DELAY.mutate)
      const uid = ownerId()
      const siblings = tasks.filter((t) => t.project_id === input.project_id)
      const maxOrder = siblings.reduce((max, t) => Math.max(max, t.sort_order), 0)
      const ts = nowIso()
      const task: Task = {
        id: nextId('t'),
        owner_id: uid,
        project_id: input.project_id,
        title: input.title,
        description: input.description,
        status: input.status,
        priority: input.priority,
        due_at: input.due_at,
        blocked_reason: input.blocked_reason,
        completed_at: input.status === 'done' ? ts : null,
        sort_order: maxOrder + 1000,
        created_at: ts,
        updated_at: ts,
      }
      tasks.push(task)
      return { ...task }
    },

    async update(id, input) {
      await sleep(DELAY.mutate)
      const uid = ownerId()
      const task = tasks.find((t) => t.id === id && t.owner_id === uid)
      if (!task) throw new Error('업무를 찾을 수 없습니다.')

      const previousStatus = task.status
      Object.assign(task, input, { updated_at: nowIso() })

      // 스키마의 completed_at 트리거가 하는 일.
      if (task.status === 'done' && previousStatus !== 'done') task.completed_at = nowIso()
      if (task.status !== 'done') task.completed_at = null
      if (task.status !== 'blocked') task.blocked_reason = null

      // 상태 변경은 진행 로그에 자동으로 남긴다 (kind: 'status_change').
      if (input.status && input.status !== previousStatus) {
        notes.push({
          id: nextId('n'),
          owner_id: uid,
          task_id: task.id,
          body: `상태를 '${TASK_STATUS_LABEL[previousStatus]}'에서 '${TASK_STATUS_LABEL[task.status]}'(으)로 변경했습니다.`,
          kind: 'status_change',
          created_at: nowIso(),
        })
      }

      return { ...task }
    },

    async remove(id) {
      await sleep(DELAY.mutate)
      const uid = ownerId()
      const index = tasks.findIndex((t) => t.id === id && t.owner_id === uid)
      if (index === -1) throw new Error('업무를 찾을 수 없습니다.')
      tasks.splice(index, 1)
      for (let i = notes.length - 1; i >= 0; i -= 1) {
        if (notes[i].task_id === id) notes.splice(i, 1)
      }
    },
  }

  const noteRepo: NoteRepo = {
    async listByTask(taskId) {
      await sleep(DELAY.detail)
      const uid = ownerId()
      return notes
        .filter((n) => n.owner_id === uid && n.task_id === taskId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((n) => ({ ...n }))
    },

    async create(taskId, body) {
      await sleep(DELAY.mutate)
      const note: TaskNote = {
        id: nextId('n'),
        owner_id: ownerId(),
        task_id: taskId,
        body: body.trim(),
        kind: 'note',
        created_at: nowIso(),
      }
      notes.push(note)
      return { ...note }
    },
  }

  const shareRepo: ShareRepo = {
    async listByProject(projectId) {
      await sleep(DELAY.list)
      const uid = ownerId()
      return shareLinks
        .filter((s) => s.owner_id === uid && s.project_id === projectId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((s) => ({ ...s }))
    },

    async create(input: ShareLinkInput) {
      await sleep(DELAY.mutate)
      const token = randomToken()
      const link: ShareLink = {
        id: nextId('s'),
        owner_id: ownerId(),
        token, // 실제 구현에서는 sha256 해시만 저장한다.
        token_prefix: token.slice(0, 8),
        project_id: input.project_id,
        task_id: null,
        include_notes: input.include_notes,
        label: input.label,
        expires_at: input.expires_in_days === null ? null : addDaysIso(input.expires_in_days),
        revoked_at: null,
        view_count: 0,
        last_viewed_at: null,
        created_at: nowIso(),
      }
      shareLinks.push(link)
      return { link: { ...link }, token }
    },

    async revoke(id) {
      await sleep(DELAY.mutate)
      const uid = ownerId()
      const link = shareLinks.find((s) => s.id === id && s.owner_id === uid)
      if (!link) throw new Error('공유 링크를 찾을 수 없습니다.')
      link.revoked_at = nowIso()
    },

    async resolve(token): Promise<SharePayload | null> {
      await sleep(DELAY.detail)
      // 이 경로에는 ownerId() 검사가 없다. 로그인하지 않은 사람이 보는 화면이다.
      const link = shareLinks.find((s) => s.token === token)

      // 존재하지 않음 / 만료됨 / 폐기됨을 구분해서 알려주지 않는다.
      if (!link || !isShareLinkLive(link) || !link.project_id) return null

      const project = projects.find((p) => p.id === link.project_id)
      if (!project) return null

      const projectTasks = tasks
        .filter((t) => t.project_id === project.id)
        .sort((a, b) => a.sort_order - b.sort_order)

      link.view_count += 1
      link.last_viewed_at = nowIso()

      return {
        label: link.label,
        include_notes: link.include_notes,
        project: stripOwner(project),
        tasks: projectTasks.map(stripOwner),
        notes: link.include_notes
          ? notes
              .filter((n) => projectTasks.some((t) => t.id === n.task_id))
              .sort((a, b) => b.created_at.localeCompare(a.created_at))
              .map(stripOwner)
          : [],
      }
    },
  }

  return {
    auth,
    projects: projectRepo,
    tasks: taskRepo,
    notes: noteRepo,
    share: shareRepo,
  }
}
