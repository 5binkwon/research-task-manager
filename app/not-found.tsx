import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">404</p>
      <h1 className="text-xl font-semibold">페이지를 찾을 수 없습니다.</h1>
      <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
        주소가 잘못되었거나 더 이상 유효하지 않은 링크입니다.
      </p>
      <Link
        href="/dashboard"
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        대시보드로 가기
      </Link>
    </main>
  )
}
