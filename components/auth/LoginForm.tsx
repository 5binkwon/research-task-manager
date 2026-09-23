'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'
import { Input } from '@/components/ui/Input'
import { useSession } from '@/lib/data/provider'
import { SEED_PASSWORD, SEED_USER } from '@/lib/data/mock/seed'
import { EMPTY_FORM_STATE, hasErrors, validateLogin, type FormState } from '@/lib/validation'

export function LoginForm() {
  const router = useRouter()
  const { signIn } = useSession()
  const [state, setState] = useState<FormState>(EMPTY_FORM_STATE)
  const [pending, setPending] = useState(false)

  // B단계에서는 이 핸들러가 useActionState(signInAction, EMPTY_FORM_STATE) 로 바뀐다.
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '')
    const password = String(formData.get('password') ?? '')

    const validation = validateLogin({ email, password })
    if (hasErrors(validation)) {
      setState(validation)
      return
    }

    setPending(true)
    const result = await signIn(email, password)
    setPending(false)

    if (!result.ok) {
      setState({ message: result.message })
      return
    }

    setState(EMPTY_FORM_STATE)
    router.push('/dashboard')
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">로그인</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          계정으로 연구 업무를 관리하세요.
        </p>
      </div>

      <FormError message={state.message} />

      <Input
        name="email"
        label="이메일"
        type="email"
        autoComplete="email"
        placeholder="you@lab.ac.kr"
        defaultValue={SEED_USER.email}
        errors={state.errors?.email}
        required
      />

      <Input
        name="password"
        label="비밀번호"
        type="password"
        autoComplete="current-password"
        errors={state.errors?.password}
        required
      />

      <Button type="submit" loading={pending}>
        {pending ? '로그인 중' : '로그인'}
      </Button>

      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        계정이 없으신가요?{' '}
        <Link href="/signup" className="font-medium text-zinc-900 underline dark:text-zinc-100">
          가입하기
        </Link>
      </p>

      {/* A단계 전용 안내. Supabase 연결 시 이 블록은 삭제한다. */}
      <p className="rounded-md bg-zinc-100 px-3 py-2 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
        mock 계정: <code className="font-mono">{SEED_USER.email}</code> /{' '}
        <code className="font-mono">{SEED_PASSWORD}</code>
        <br />
        다른 비밀번호를 넣으면 폼 상단에 오류 배너가 나타납니다.
      </p>
    </form>
  )
}
