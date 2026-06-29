import { Skeleton, CardSkeleton } from '@/components/ui/skeleton'

export default function EntregasLoading() {
  return (
    <div>
      <div className="page-header mb-4">
        <Skeleton className="h-7 w-24" />
      </div>
      <div className="flex gap-2 mb-5">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-24 rounded-lg" />)}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    </div>
  )
}
