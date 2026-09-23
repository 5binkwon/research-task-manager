import { Skeleton, SkeletonList } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>
      <SkeletonList rows={3} />
    </div>
  )
}
