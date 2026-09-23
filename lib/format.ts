// 날짜 표시 유틸.
//
// 전부 ISO 문자열을 직접 파싱해서 UTC 기준으로만 계산한다.
// toLocaleDateString 이나 로컬 타임존 기반 계산을 쓰면 서버 렌더와 브라우저 렌더가
// 어긋나 hydration mismatch가 난다.

/**
 * mock 전용 "오늘". B단계에서 이 상수는 제거하고 실제 현재 시각을 쓴다.
 * 시드 데이터가 고정 날짜라 기준점도 고정돼야 상대 표기가 안정적이다.
 */
export const TODAY = '2026-09-23'

interface IsoParts {
  y: number
  m: number
  d: number
  hh: number
  mm: number
}

function parseIso(iso: string): IsoParts {
  return {
    y: Number(iso.slice(0, 4)),
    m: Number(iso.slice(5, 7)),
    d: Number(iso.slice(8, 10)),
    hh: Number(iso.slice(11, 13) || '0'),
    mm: Number(iso.slice(14, 16) || '0'),
  }
}

/** 로컬 타임존을 타지 않는 일(day) 단위 번호. */
function dayNumber(iso: string): number {
  const { y, m, d } = parseIso(iso)
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000)
}

/**
 * 브라우저 로컬 타임존 기준 오늘 날짜("YYYY-MM-DD").
 * 서버 렌더에서 부르면 hydration mismatch가 나므로 클라이언트에서만 렌더되는 곳에서 쓴다.
 */
export function localToday(): string {
  const now = new Date()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${m}-${d}`
}

/** today 기준 남은 일수. 음수면 지났다는 뜻. */
export function daysFromToday(iso: string, today: string = TODAY): number {
  return dayNumber(iso) - dayNumber(today)
}

/** "2026년 9월 23일" */
export function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const { y, m, d } = parseIso(iso)
  return `${y}년 ${m}월 ${d}일`
}

/** "9월 23일" */
export function formatDateShort(iso: string | null): string {
  if (!iso) return '—'
  const { m, d } = parseIso(iso)
  return `${m}월 ${d}일`
}

/** "9월 21일 14:12" — 진행 로그처럼 시각까지 필요한 곳에서 쓴다. */
export function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  const { m, d, hh, mm } = parseIso(iso)
  return `${m}월 ${d}일 ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

export type DueTone = 'overdue' | 'soon' | 'normal'

export interface DueLabel {
  text: string
  tone: DueTone
}

/** 마감일을 "3일 지남" / "오늘" / "2일 남음" 같은 상대 표기로. */
export function formatDue(iso: string | null, today: string = TODAY): DueLabel | null {
  if (!iso) return null
  const diff = daysFromToday(iso, today)
  if (diff < 0) {
    return { text: `${Math.abs(diff)}일 지남`, tone: 'overdue' }
  }
  if (diff === 0) return { text: '오늘', tone: 'soon' }
  if (diff === 1) return { text: '내일', tone: 'soon' }
  if (diff <= 7) return { text: `${diff}일 남음`, tone: 'soon' }
  return { text: formatDateShort(iso), tone: 'normal' }
}

/** 공유 링크가 지금 살아 있는지. */
export function isShareLinkLive(link: {
  expires_at: string | null
  revoked_at: string | null
}): boolean {
  if (link.revoked_at) return false
  if (link.expires_at && daysFromToday(link.expires_at) < 0) return false
  return true
}
