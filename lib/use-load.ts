'use client'

// 비동기 조회 공용 hook. mock 화면의 useAsync 와 Supabase 화면이 함께 쓴다.

import { useCallback, useEffect, useState } from 'react'

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

export interface LoadState<T> extends AsyncState<T> {
  /** 서버 응답을 기다리지 않고 현재 데이터를 로컬에서 고친다(변경 후 재조회 대신). */
  mutate: (updater: (data: T) => T) => void
}

interface Snapshot<T> {
  key: string
  resource: string
  data: T | null
  error: Error | null
}

/**
 * resource = "어떤 자원을 보는가", reload = "그 자원의 몇 번째 판본을 보는가".
 * 둘을 나눠 두면, 같은 자원을 다시 읽는 동안(또는 다시 읽다 실패해도) 직전 데이터를
 * 계속 보여 줄 수 있다. 다른 자원으로 바뀌면 남의 데이터를 잠깐 보여 주는 일이 없도록 비운다.
 *
 * 결과를 키와 함께 저장하므로 이펙트 안에서 setState 를 동기 호출하지 않아도
 * "아직 이 키의 결과 없음" = 로딩으로 파생할 수 있다(react-hooks/set-state-in-effect).
 */
export function useLoad<T>(fn: () => Promise<T>, resource: string, reload: number = 0): LoadState<T> {
  const key = `${resource}|${reload}`
  const [snapshot, setSnapshot] = useState<Snapshot<T> | null>(null)

  useEffect(() => {
    let cancelled = false

    fn().then(
      (data) => {
        if (!cancelled) setSnapshot({ key, resource, data, error: null })
      },
      (error: unknown) => {
        if (!cancelled) {
          setSnapshot((prev) => ({
            key,
            resource,
            data: prev?.resource === resource ? prev.data : null,
            error: error instanceof Error ? error : new Error(String(error)),
          }))
        }
      },
    )

    return () => {
      cancelled = true
    }
    // fn 은 매 렌더 새 함수라 의존성에 넣을 수 없다. 호출자가 resource 로 책임진다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const mutate = useCallback((updater: (data: T) => T) => {
    setSnapshot((prev) => (prev && prev.data !== null ? { ...prev, data: updater(prev.data) } : prev))
  }, [])

  const fresh = snapshot?.key === key
  const sameResource = snapshot?.resource === resource
  return {
    data: sameResource ? snapshot.data : null,
    loading: !fresh,
    error: fresh ? snapshot.error : null,
    mutate,
  }
}
