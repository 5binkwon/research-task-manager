'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'

import { Sidebar } from './Sidebar'
import { UserMenu } from './UserMenu'
import { useSession } from '@/lib/data/provider'

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { user } = useSession()

  // 주의: 이것은 보안 장치가 아니라 화면 전환일 뿐이다.
  // 실제 접근 통제는 B단계의 proxy.ts + DAL이 서버에서 담당한다.
  useEffect(() => {
    if (!user) router.replace('/login')
  }, [user, router])

  if (!user) return null

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-zinc-200 bg-white/80 px-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <Link href="/dashboard" className="text-sm font-semibold">
          연구 업무 관리
        </Link>
        <UserMenu />
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col md:flex-row">
        <aside className="shrink-0 border-b border-zinc-200 md:w-52 md:border-b-0 md:border-r dark:border-zinc-800">
          <Sidebar />
        </aside>
        <main className="min-w-0 flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  )
}
