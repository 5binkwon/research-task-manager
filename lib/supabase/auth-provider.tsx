'use client'

// 앱((app) 그룹) 진입 시 Supabase 세션을 보장한다.
//
// 저장된 세션이 있으면 그대로 쓰고, 없으면 익명 로그인(signInAnonymously)을 한다.
// 익명 사용자도 auth.users 에 행이 생기고 role 은 authenticated 이므로
// todos 의 RLS 정책(to authenticated, auth.uid() = user_id)이 그대로 적용된다.
//
// 공개 페이지(/share, /login, /signup)는 이 프로바이더 밖이라 익명 사용자를 만들지 않는다.
//
// 기존 mock 로그인(RepoProvider)과는 별개다. mock 에서 로그아웃해도 Supabase 익명
// 세션은 이 브라우저에 남는다. 실제 인증으로 옮길 때 두 흐름을 하나로 합쳐야 한다.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { getSupabase } from './client'
import { describeAuthError } from './errors'

export type SupabaseAuthState =
  | { status: 'loading' }
  | { status: 'ready'; userId: string }
  | { status: 'error'; message: string }

interface SupabaseAuthContextValue {
  auth: SupabaseAuthState
  /** 세션 확보를 다시 시도한다. */
  retry: () => void
}

const SupabaseAuthContext = createContext<SupabaseAuthContextValue | null>(null)

async function ensureSessionOnce(): Promise<SupabaseAuthState> {
  const supabase = getSupabase()

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) return { status: 'error', message: describeAuthError(sessionError) }
  if (sessionData.session) return { status: 'ready', userId: sessionData.session.user.id }

  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) return { status: 'error', message: describeAuthError(error) }
  if (!data.user) return { status: 'error', message: '로그인 응답에 사용자 정보가 없습니다.' }
  return { status: 'ready', userId: data.user.id }
}

// 진행 중인 세션 확보 요청을 모듈 단위로 공유한다.
// Strict Mode 가 이펙트를 두 번 실행하거나 여러 곳에서 동시에 불러도
// signInAnonymously 요청은 한 번만 나가서 익명 사용자가 중복으로 생기지 않는다.
let inflight: Promise<SupabaseAuthState> | null = null

function ensureSession(): Promise<SupabaseAuthState> {
  if (!inflight) {
    inflight = ensureSessionOnce()
      .catch((error: unknown): SupabaseAuthState => ({
        status: 'error',
        message: error instanceof Error ? error.message : '로그인하지 못했습니다.',
      }))
      .finally(() => {
        // 끝난 뒤에는 비워서 retry 가 새 요청을 보낼 수 있게 한다.
        inflight = null
      })
  }
  return inflight
}

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<SupabaseAuthState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    ensureSession().then((next) => {
      if (!cancelled) setAuth(next)
    })
    return () => {
      cancelled = true
    }
  }, [attempt])

  useEffect(() => {
    let supabase
    try {
      supabase = getSupabase()
    } catch {
      // 환경 변수 누락 등. 위 이펙트가 같은 오류를 화면에 보여 준다.
      return
    }

    // 콜백 안에서 다른 supabase.auth 메서드를 await 하면 교착이 생길 수 있어 상태만 바꾼다.
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        const userId = session.user.id
        // 토큰 갱신마다 새 객체를 만들면 모든 소비자가 다시 렌더된다. 사용자가 같으면 그대로 둔다.
        setAuth((prev) => (prev.status === 'ready' && prev.userId === userId ? prev : { status: 'ready', userId }))
      } else if (event === 'SIGNED_OUT') {
        setAuth({
          status: 'error',
          message:
            '로그인 세션이 끊어졌습니다. 다시 시도하면 새 익명 계정으로 로그인되며, 이전 계정의 할 일은 더 이상 볼 수 없습니다.',
        })
      }
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const retry = useCallback(() => {
    setAuth({ status: 'loading' })
    setAttempt((n) => n + 1)
  }, [])

  const value = useMemo(() => ({ auth, retry }), [auth, retry])

  return <SupabaseAuthContext.Provider value={value}>{children}</SupabaseAuthContext.Provider>
}

export function useSupabaseAuth(): SupabaseAuthContextValue {
  const ctx = useContext(SupabaseAuthContext)
  if (!ctx) throw new Error('SupabaseAuthProvider 안에서만 쓸 수 있습니다.')
  return ctx
}
