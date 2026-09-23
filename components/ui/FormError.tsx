/**
 * 폼 레벨 오류 배너. 개별 필드에 귀속되지 않는 실패
 * (로그인 실패, 이미 가입된 이메일 등)를 보여준다.
 *
 * role="alert" 라 제출 직후 스크린리더가 읽는다.
 */
export function FormError({ message }: { message?: string }) {
  if (!message) return null

  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="mt-0.5 shrink-0"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16h.01" strokeLinecap="round" />
      </svg>
      {message}
    </p>
  )
}
