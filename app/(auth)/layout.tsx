import Link from 'next/link'
import type { ReactNode } from 'react'

// 라우트 그룹 레이아웃은 자체 경로를 만들지 않아 Next가 생성하는 LayoutRoutes에
// 포함되지 않는다(LayoutProps는 '/'에만 쓸 수 있다). 그래서 props를 직접 선언한다.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 block text-center text-base font-semibold">
          연구 업무 관리
        </Link>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {children}
        </div>
      </div>
    </div>
  )
}
