'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { useSession } from '@/lib/data/provider'

export function UserMenu() {
  const router = useRouter()
  const { user, signOut } = useSession()
  const [pending, setPending] = useState(false)

  if (!user) return null

  async function handleSignOut() {
    setPending(true)
    await signOut()
    setPending(false)
    router.push('/login')
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className="text-sm font-medium leading-tight">{user.display_name ?? '이름 없음'}</p>
        <p className="text-xs leading-tight text-zinc-500 dark:text-zinc-400">{user.email}</p>
      </div>
      <Button variant="secondary" size="sm" onClick={handleSignOut} loading={pending}>
        로그아웃
      </Button>
    </div>
  )
}
