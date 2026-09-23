import { Skeleton, SkeletonList } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-7 w-24" />
      <Skeleton className="h-24 w-full" />
      <SkeletonList rows={4} />
    </div>
  )
}
