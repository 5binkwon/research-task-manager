// Supabase 오류를 사용자에게 보여 줄 한국어 문장으로 바꾼다.
// PostgREST(todos 쿼리)와 Auth(익명 로그인) 오류를 한곳에서 다룬다.

interface SupabaseLikeError {
  message: string
  code?: string
  name?: string
}

const NETWORK_RE = /failed to fetch|networkerror|fetch failed|load failed/i

function isNetworkError(error: SupabaseLikeError): boolean {
  return error.name === 'AuthRetryableFetchError' || NETWORK_RE.test(error.message)
}

/** todos 쿼리 오류. action 은 "할 일을 추가" 처럼 동사 어간까지. */
export function describeDbError(error: SupabaseLikeError, action: string): string {
  if (isNetworkError(error)) return `${action}하지 못했습니다. 네트워크 연결을 확인하세요.`
  // PGRST301/PGRST303: JWT 가 만료됐거나 유효하지 않음
  if (error.code === 'PGRST301' || error.code === 'PGRST303') {
    return '로그인 세션이 만료되었습니다. 페이지를 새로고침하세요.'
  }
  // 42501: RLS with check 위반 / 권한 없음
  if (error.code === '42501') return `${action} 권한이 없습니다. 페이지를 새로고침한 뒤 다시 시도하세요.`
  return `${action}하지 못했습니다: ${error.message}`
}

/** 익명 로그인 오류. */
export function describeAuthError(error: SupabaseLikeError): string {
  if (error.code === 'anonymous_provider_disabled' || /anonymous sign-ins are disabled/i.test(error.message)) {
    return 'Supabase 프로젝트에서 익명 로그인이 꺼져 있습니다. 대시보드 Authentication → Sign In / Providers 에서 "Allow anonymous sign-ins" 를 켜 주세요.'
  }
  if (isNetworkError(error)) return '로그인하지 못했습니다. 네트워크 연결을 확인하세요.'
  return `로그인하지 못했습니다: ${error.message}`
}
