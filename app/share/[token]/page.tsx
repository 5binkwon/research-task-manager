import { ShareView } from '@/components/share/ShareView'

// 인증이 필요 없는 공개 경로. (app) 그룹 바깥에 있어 셸이 씌워지지 않는다.
export default async function SharePage({ params }: PageProps<'/share/[token]'>) {
  const { token } = await params
  return <ShareView token={token} />
}
