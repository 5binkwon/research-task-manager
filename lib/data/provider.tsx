'use client'

// 데이터 계층 주입 지점.
//
// 루트 레이아웃에 둔다. /share/[token] 이 (app) 그룹 바깥에 있어서
// 같은 저장소 인스턴스를 봐야 하기 때문이다.
//
// 변이가 일어나면 version 을 올리고, useAsync 가 그걸 보고 재조회한다.
// B단계의 "서버 액션 → refresh()" 흐름과 같은 모양이라 옮기기 쉽다.

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { useLoad, type AsyncState } from '../use-load'
import { createMockRepos } from './mock/mock-repo'
import { SEED_USER } from './mock/seed'
import type { Repos, Result } from './repo'
import type { User } from './types'

interface RepoContextValue {
  repos: Repos
  user: User | null
  version: number
  /** 변이 후 화면을 다시 읽게 한다. */
  refresh: () => void
  signIn: (email: string, password: string) => Promise<Result<User>>
  signUp: (input: {
    email: string
    password: string
    displayName: string
  }) => Promise<Result<User>>
  signOut: () => Promise<void>
}

const RepoContext = createContext<RepoContextValue | null>(null)

export function RepoProvider({ children }: { children: ReactNode }) {
  // 인스턴스를 한 번만 만든다. 리렌더마다 새로 만들면 상태가 날아간다.
  // useRef + 렌더 중 초기화는 react-hooks/refs 위반이라 lazy initializer를 쓴다.
  const [repos] = useState<Repos>(() => createMockRepos())

  // mock은 로그인된 상태로 시작한다. 서버 렌더와 첫 클라이언트 렌더가
  // 같은 값이어야 하므로 비동기 부트스트랩 없이 시드 사용자로 초기화한다.
  const [user, setUser] = useState<User | null>(SEED_USER)
  const [version, setVersion] = useState(0)

  const refresh = useCallback(() => setVersion((v) => v + 1), [])

  const signIn = useCallback(
    async (email: string, password: string) => {
      const result = await repos.auth.signIn(email, password)
      if (result.ok) {
        setUser(result.data)
        refresh()
      }
      return result
    },
    [repos, refresh],
  )

  const signUp = useCallback(
    async (input: { email: string; password: string; displayName: string }) => {
      const result = await repos.auth.signUp(input)
      if (result.ok) {
        setUser(result.data)
        refresh()
      }
      return result
    },
    [repos, refresh],
  )

  const signOut = useCallback(async () => {
    await repos.auth.signOut()
    setUser(null)
    refresh()
  }, [repos, refresh])

  const value = useMemo<RepoContextValue>(
    () => ({ repos, user, version, refresh, signIn, signUp, signOut }),
    [repos, user, version, refresh, signIn, signUp, signOut],
  )

  return <RepoContext.Provider value={value}>{children}</RepoContext.Provider>
}

export function useRepoContext(): RepoContextValue {
  const ctx = useContext(RepoContext)
  if (!ctx) throw new Error('RepoProvider 안에서만 쓸 수 있습니다.')
  return ctx
}

export function useRepos(): Repos {
  return useRepoContext().repos
}

export function useSession() {
  const { user, signIn, signUp, signOut } = useRepoContext()
  return { user, signIn, signUp, signOut }
}

export type { AsyncState } from '../use-load'

/**
 * 조회 훅. version 이 바뀌면 자동으로 다시 읽는다.
 * B단계에서는 대부분 서버 컴포넌트의 await 로 대체된다.
 */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const { version } = useRepoContext()
  const { data, loading, error } = useLoad(fn, JSON.stringify(deps), version)
  return { data, loading, error }
}