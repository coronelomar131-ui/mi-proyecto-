import { Skeleton, CardSkeleton } from '@/components/ui/skeleton'

export default function ProveedoresLoading() {
  return (
    <div>
      <div className="page-header mb-4">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>
      <Skeleton className="h-10 w-full rounded-lg mb-6" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    </div>
  )
}
