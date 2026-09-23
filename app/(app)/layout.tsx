import type { ReactNode } from 'react'

import { AppShell } from '@/components/layout/AppShell'
import { SupabaseAuthProvider } from '@/lib/supabase/auth-provider'

// 라우트 그룹 레이아웃이라 LayoutProps를 쓸 수 없다((auth)/layout.tsx 주석 참고).
// 앱 진입 시 Supabase 익명 로그인을 시작한다. 공개 페이지(/share, /login)에는 영향이 없다.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SupabaseAuthProvider>
      <AppShell>{children}</AppShell>
    </SupabaseAuthProvider>
  )
}
