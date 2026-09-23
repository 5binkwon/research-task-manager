'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'
import { Input } from '@/components/ui/Input'
import { useSession } from '@/lib/data/provider'
import { EMPTY_FORM_STATE, hasErrors, validateSignup, type FormState } from '@/lib/validation'

export function SignupForm() {
  const router = useRouter()
  const { signUp } = useSession()
  const [state, setState] = useState<FormState>(EMPTY_FORM_STATE)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const fields = {
      displayName: String(formData.get('displayName') ?? ''),
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? ''),
      passwordConfirm: String(formData.get('passwordConfirm') ?? ''),
    }

    const validation = validateSignup(fields)
    if (hasErrors(validation)) {
      setState(validation)
      return
    }

    setPending(true)
    const result = await signUp({
      email: fields.email,
      password: fields.password,
      displayName: fields.displayName,
    })
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
        <h1 className="text-lg font-semibold">가입하기</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          이메일과 비밀번호로 계정을 만듭니다.
        </p>
      </div>

      <FormError message={state.message} />

      <Input
        name="displayName"
        label="이름"
        autoComplete="name"
        placeholder="홍길동"
        errors={state.errors?.displayName}
        required
      />

      <Input
        name="email"
        label="이메일"
        type="email"
        autoComplete="email"
        placeholder="you@lab.ac.kr"
        errors={state.errors?.email}
        required
      />

      <Input
        name="password"
        label="비밀번호"
        type="password"
        autoComplete="new-password"
        hint="8자 이상, 영문·숫자·특수문자를 각각 하나 이상 포함"
        errors={state.errors?.password}
        required
      />

      <Input
        name="passwordConfirm"
        label="비밀번호 확인"
        type="password"
        autoComplete="new-password"
        errors={state.errors?.passwordConfirm}
        required
      />

      <Button type="submit" loading={pending}>
        {pending ? '가입 중' : '가입하기'}
      </Button>

      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="font-medium text-zinc-900 underline dark:text-zinc-100">
          로그인
        </Link>
      </p>
    </form>
  )
}
