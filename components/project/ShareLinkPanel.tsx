'use client'

import { useCallback, useState } from 'react'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field } from '@/components/ui/Field'
import { FormError } from '@/components/ui/FormError'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAsync, useRepoContext, useRepos } from '@/lib/data/provider'
import { formatDate, isShareLinkLive } from '@/lib/format'
import type { ShareLink } from '@/lib/data/types'
import { EMPTY_FORM_STATE, hasErrors, validateShareLink, type FormState } from '@/lib/validation'

const EXPIRY_OPTIONS = [
  { value: '7', label: '7일' },
  { value: '30', label: '30일' },
  { value: '90', label: '90일' },
  { value: 'never', label: '만료 없음' },
]

export function ShareLinkPanel({ projectId }: { projectId: string }) {
  const repos = useRepos()
  const { refresh } = useRepoContext()

  const loadLinks = useCallback(() => repos.share.listByProject(projectId), [repos, projectId])
  const links = useAsync<ShareLink[]>(loadLinks, [projectId])

  const [state, setState] = useState<FormState>(EMPTY_FORM_STATE)
  const [pending, setPending] = useState(false)
  const [issuedToken, setIssuedToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const label = String(formData.get('label') ?? '')
    const expires = String(formData.get('expiresInDays') ?? '30')

    const validation = validateShareLink(label, expires)
    if (hasErrors(validation)) {
      setState(validation)
      return
    }
    setState(EMPTY_FORM_STATE)

    setPending(true)
    try {
      const { token } = await repos.share.create({
        project_id: projectId,
        label: label.trim() || null,
        include_notes: formData.get('includeNotes') === 'on',
        expires_in_days: expires === 'never' ? null : Number(expires),
      })
      setIssuedToken(token)
      setCopied(false)
      refresh()
    } catch (error) {
      setState({ message: error instanceof Error ? error.message : '링크를 만들지 못했습니다.' })
    } finally {
      setPending(false)
    }
  }

  async function handleRevoke(id: string) {
    await repos.share.revoke(id)
    refresh()
  }

  async function copyIssued() {
    if (!issuedToken) return
    // 절대 주소는 클릭 시점에 만든다. 렌더 중에 window를 읽으면 서버 렌더와 어긋난다.
    await navigator.clipboard.writeText(`${window.location.origin}/share/${issuedToken}`)
    setCopied(true)
  }

  const rows = links.data ?? []

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold">공유 링크</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          링크를 가진 사람은 로그인 없이 이 과제를 <strong>읽기만</strong> 할 수 있습니다.
        </p>
      </div>

      {issuedToken && (
        <div className="flex flex-col gap-2 rounded-md border border-green-300 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950">
          <p className="text-sm font-medium text-green-900 dark:text-green-300">
            링크를 만들었습니다. 이 주소는 지금만 표시됩니다.
          </p>
          <code className="block overflow-x-auto rounded bg-white px-2 py-1.5 font-mono text-xs dark:bg-zinc-900">
            /share/{issuedToken}
          </code>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={copyIssued}>
              {copied ? '복사됨' : '복사'}
            </Button>
            <a
              href={`/share/${issuedToken}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-green-900 underline dark:text-green-300"
            >
              새 탭에서 열기
            </a>
          </div>
        </div>
      )}

      <form
        onSubmit={handleCreate}
        noValidate
        className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <FormError message={state.message} />

        <Input
          name="label"
          label="메모"
          placeholder="예: 지도교수 공유"
          hint="어떤 링크인지 나중에 구분하기 위한 메모입니다."
          errors={state.errors?.label}
        />

        <Select
          name="expiresInDays"
          label="만료"
          options={EXPIRY_OPTIONS}
          defaultValue="30"
          errors={state.errors?.expiresInDays}
        />

        <Field name="includeNotes" label="진행 로그 포함">
          <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <input
              id="field-includeNotes"
              name="includeNotes"
              type="checkbox"
              className="size-4 rounded border-zinc-300 dark:border-zinc-700"
            />
            업무별 진행 로그까지 보여줍니다.
          </label>
        </Field>

        <div>
          <Button type="submit" loading={pending}>
            링크 만들기
          </Button>
        </div>
      </form>

      {links.loading && !links.data ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          title="만든 공유 링크가 없습니다."
          description="위에서 링크를 만들면 여기에 목록이 쌓입니다."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((link) => (
            <ShareLinkRow key={link.id} link={link} onRevoke={() => handleRevoke(link.id)} />
          ))}
        </ul>
      )}
    </section>
  )
}

function ShareLinkRow({ link, onRevoke }: { link: ShareLink; onRevoke: () => Promise<void> }) {
  const [pending, setPending] = useState(false)
  const live = isShareLinkLive(link)

  const status = link.revoked_at
    ? { label: '폐기됨', tone: 'neutral' as const }
    : live
      ? { label: '사용 중', tone: 'green' as const }
      : { label: '만료됨', tone: 'amber' as const }

  async function handleClick() {
    setPending(true)
    await onRevoke()
    setPending(false)
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Badge tone={status.tone}>{status.label}</Badge>
          <span className="text-sm font-medium">{link.label ?? '메모 없음'}</span>
        </div>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          <code className="font-mono">{link.token_prefix}…</code>
          {' · '}
          {link.expires_at ? `${formatDate(link.expires_at)} 만료` : '만료 없음'}
          {' · '}조회 {link.view_count}회
          {link.include_notes && ' · 진행 로그 포함'}
        </p>
      </div>

      {live && (
        <Button size="sm" variant="danger" onClick={handleClick} loading={pending}>
          폐기
        </Button>
      )}
    </li>
  )
}
