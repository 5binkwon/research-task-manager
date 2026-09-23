import { Skeleton, SkeletonList } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-7 w-40" />
      <SkeletonList rows={3} />
    </div>
  )
}
