'use client'

import { Button } from '@/components/ui/Button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-semibold">문제가 발생했습니다.</h1>
      <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
        {error.message || '알 수 없는 오류입니다.'}
      </p>
      <Button onClick={reset}>다시 시도</Button>
    </main>
  )
}
