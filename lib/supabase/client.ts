// 브라우저용 Supabase 클라이언트.
//
// publishable key 는 공개 키다. 데이터 보호는 전적으로 todos 테이블의 RLS
// (auth.uid() = user_id) 가 맡는다.
//
// process.env.NEXT_PUBLIC_* 는 빌드 시 문자열로 인라인되므로 반드시 이렇게
// 직접 참조해야 한다. 변수로 꺼내 쓰면 인라인되지 않는다.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

/** 브라우저에서만 호출한다(이펙트·이벤트 핸들러 안). 세션은 localStorage 에 유지된다. */
export function getSupabase(): SupabaseClient {
  if (client) return client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) {
    throw new Error(
      'Supabase 환경 변수가 없습니다. .env.local 의 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY 를 확인하세요.',
    )
  }

  client = createClient(url, key)
  return client
}
