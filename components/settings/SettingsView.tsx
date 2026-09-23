'use client'

import { useState } from 'react'

import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'
import { Input } from '@/components/ui/Input'
import { useSession } from '@/lib/data/provider'
import { EMPTY_FORM_STATE, hasErrors, validateSignup, type FormState } from '@/lib/validation'

export function SettingsView() {
  const { user } = useSession()
  const [state, setState] = useState<FormState>(EMPTY_FORM_STATE)
  const [pending, setPending] = useState(false)
  const [done, setDone] = useState(false)

  async function handlePasswordChange(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setDone(false)

    const formData = new FormData(event.currentTarget)
    const password = String(formData.get('password') ?? '')
    const passwordConfirm = String(formData.get('passwordConfirm') ?? '')

    // 비밀번호 규칙은 가입과 같다. 이름·이메일은 여기서 검사하지 않으므로 통과값을 넣는다.
    const validation = validateSignup({
      displayName: user?.display_name ?? '이름',
      email: user?.email ?? 'a@b.co',
      password,
      passwordConfirm,
    })

    const passwordErrors = {
      ...(validation.errors?.password ? { password: validation.errors.password } : {}),
      ...(validation.errors?.passwordConfirm
        ? { passwordConfirm: validation.errors.passwordConfirm }
        : {}),
    }

    if (hasErrors({ errors: passwordErrors })) {
      setState({ errors: passwordErrors })
      return
    }

    setState(EMPTY_FORM_STATE)
    setPending(true)
    // A단계에서는 실제로 바꾸지 않는다. B단계에서 supabase.auth.updateUser 로 연결된다.
    await new Promise((resolve) => setTimeout(resolve, 300))
    setPending(false)
    setDone(true)
  }

  return (
    <>
      <PageHeader title="설정" description="계정 정보를 확인하고 비밀번호를 바꿉니다." />

      <div className="flex max-w-xl flex-col gap-10">
        <section className="flex flex-col gap-4">
          <h2 className="text-base font-semibold">프로필</h2>
          <Input name="displayName" label="이름" defaultValue={user?.display_name ?? ''} />
          <Input
            name="email"
            label="이메일"
            defaultValue={user?.email ?? ''}
            disabled
            hint="이메일은 변경할 수 없습니다."
          />
        </section>

        <section>
          <h2 className="mb-4 text-base font-semibold">비밀번호 변경</h2>
          <form onSubmit={handlePasswordChange} noValidate className="flex flex-col gap-4">
            <FormError message={state.message} />

            <Input
              name="password"
              label="새 비밀번호"
              type="password"
              autoComplete="new-password"
              hint="8자 이상, 영문·숫자·특수문자를 각각 하나 이상 포함"
              errors={state.errors?.password}
              required
            />
            <Input
              name="passwordConfirm"
              label="새 비밀번호 확인"
              type="password"
              autoComplete="new-password"
              errors={state.errors?.passwordConfirm}
              required
            />

            <div className="flex items-center gap-3">
              <Button type="submit" loading={pending}>
                비밀번호 변경
              </Button>
              {done && !pending && (
                <span role="status" className="text-sm text-green-700 dark:text-green-400">
                  검증을 통과했습니다. (A단계에서는 실제로 변경되지 않습니다.)
                </span>
              )}
            </div>
          </form>
        </section>
      </div>
    </>
  )
}
