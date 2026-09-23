// 폼 검증.
//
// A단계에서는 zod를 설치하지 않고 순수 함수로 직접 쓴다.
// 반환 모양(FormState)을 useActionState 규약에 맞춰 뒀으므로,
// B단계에서 zod + 서버 액션으로 바꿀 때 함수 본문만 교체하면 된다.

export interface FormState {
  errors?: Record<string, string[]>
  message?: string
}

export const EMPTY_FORM_STATE: FormState = {}

function collect(errors: Record<string, string[]>): FormState {
  return Object.keys(errors).length > 0 ? { errors } : {}
}

export function hasErrors(state: FormState): boolean {
  return Boolean(state.message) || Object.keys(state.errors ?? {}).length > 0
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateEmail(value: string): string[] {
  const out: string[] = []
  if (!value.trim()) out.push('이메일을 입력하세요.')
  else if (!EMAIL_RE.test(value.trim())) out.push('이메일 형식이 올바르지 않습니다.')
  return out
}

function validatePassword(value: string): string[] {
  const out: string[] = []
  if (!value) {
    out.push('비밀번호를 입력하세요.')
    return out
  }
  if (value.length < 8) out.push('8자 이상이어야 합니다.')
  if (!/[a-zA-Z]/.test(value)) out.push('영문을 최소 한 자 포함해야 합니다.')
  if (!/[0-9]/.test(value)) out.push('숫자를 최소 한 자 포함해야 합니다.')
  if (!/[^a-zA-Z0-9]/.test(value)) out.push('특수문자를 최소 한 자 포함해야 합니다.')
  return out
}

export interface LoginFields {
  email: string
  password: string
}

export function validateLogin(fields: LoginFields): FormState {
  const errors: Record<string, string[]> = {}
  const email = validateEmail(fields.email)
  if (email.length) errors.email = email
  // 로그인에서는 비밀번호 복잡도를 따지지 않는다. 비었는지만 본다.
  if (!fields.password) errors.password = ['비밀번호를 입력하세요.']
  return collect(errors)
}

export interface SignupFields {
  displayName: string
  email: string
  password: string
  passwordConfirm: string
}

export function validateSignup(fields: SignupFields): FormState {
  const errors: Record<string, string[]> = {}

  if (!fields.displayName.trim()) errors.displayName = ['이름을 입력하세요.']
  else if (fields.displayName.trim().length > 50) errors.displayName = ['50자 이내로 입력하세요.']

  const email = validateEmail(fields.email)
  if (email.length) errors.email = email

  const password = validatePassword(fields.password)
  if (password.length) errors.password = password

  if (!fields.passwordConfirm) errors.passwordConfirm = ['비밀번호를 한 번 더 입력하세요.']
  else if (fields.password !== fields.passwordConfirm)
    errors.passwordConfirm = ['비밀번호가 일치하지 않습니다.']

  return collect(errors)
}

export interface ProjectFields {
  title: string
  description: string
  startedOn: string
  dueOn: string
}

export function validateProject(fields: ProjectFields): FormState {
  const errors: Record<string, string[]> = {}

  const title = fields.title.trim()
  if (!title) errors.title = ['과제 이름을 입력하세요.']
  else if (title.length > 200) errors.title = ['200자 이내로 입력하세요.']

  // 스키마의 check (due_on >= started_on) 과 같은 규칙.
  if (fields.startedOn && fields.dueOn && fields.dueOn < fields.startedOn) {
    errors.dueOn = ['마감일은 시작일보다 빠를 수 없습니다.']
  }

  return collect(errors)
}

export interface TaskFields {
  title: string
  description: string
  status: string
  blockedReason: string
  dueAt: string
}

export function validateTask(fields: TaskFields): FormState {
  const errors: Record<string, string[]> = {}

  const title = fields.title.trim()
  if (!title) errors.title = ['업무 이름을 입력하세요.']
  else if (title.length > 300) errors.title = ['300자 이내로 입력하세요.']

  // 스키마의 check (status <> 'blocked' or blocked_reason is not null) 과 같은 규칙.
  if (fields.status === 'blocked' && !fields.blockedReason.trim()) {
    errors.blockedReason = ['막힘 상태에서는 사유를 적어야 합니다.']
  }

  return collect(errors)
}

export interface TodoFields {
  title: string
  category: string
}

export function validateTodo(fields: TodoFields): FormState {
  const errors: Record<string, string[]> = {}

  const title = fields.title.trim()
  if (!title) errors.title = ['할 일을 입력하세요.']
  else if (title.length > 300) errors.title = ['300자 이내로 입력하세요.']

  // todos.category 는 not null 이다. 빈 문자열도 막는다.
  const category = fields.category.trim()
  if (!category) errors.category = ['분류를 입력하세요.']
  else if (category.length > 50) errors.category = ['50자 이내로 입력하세요.']

  return collect(errors)
}

export function validateNote(body: string): FormState {
  const errors: Record<string, string[]> = {}
  if (!body.trim()) errors.body = ['내용을 입력하세요.']
  else if (body.trim().length > 2000) errors.body = ['2000자 이내로 입력하세요.']
  return collect(errors)
}

export function validateShareLink(label: string, expiresInDays: string): FormState {
  const errors: Record<string, string[]> = {}
  if (label.trim().length > 50) errors.label = ['50자 이내로 입력하세요.']
  if (expiresInDays !== 'never') {
    const n = Number(expiresInDays)
    if (!Number.isInteger(n) || n < 1 || n > 365) {
      errors.expiresInDays = ['1~365 사이의 일수를 선택하세요.']
    }
  }
  return collect(errors)
}
