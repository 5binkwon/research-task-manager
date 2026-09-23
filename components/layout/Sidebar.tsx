'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/dashboard', label: '대시보드' },
  { href: '/projects', label: '연구 과제' },
  { href: '/tasks', label: '업무' },
  { href: '/todos', label: '할 일' },
  { href: '/settings', label: '설정' },
] as const

export function Sidebar() {
  const pathname = usePathname()

  return (
    <nav aria-label="주요 메뉴" className="flex flex-col gap-1 p-3">
      {NAV.map((item) => {
        const active =
          pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`))

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? 'bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
