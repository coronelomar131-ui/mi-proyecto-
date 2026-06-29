import { Skeleton } from '@/components/ui/skeleton'

export default function ReportesLoading() {
  return (
    <div>
      <div className="page-header mb-6">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-8 w-48" />
      </div>
      {/* Summary KPI row skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-4">
            <Skeleton className="h-8 w-8 rounded-lg mb-3" />
            <Skeleton className="h-7 w-24 mb-1" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
      {/* Charts skeleton */}
      <div className="space-y-6">
        <div className="card p-5">
          <Skeleton className="h-5 w-48 mb-5" />
          <Skeleton className="h-60 w-full rounded-lg" />
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="card p-5">
              <Skeleton className="h-5 w-40 mb-5" />
              <Skeleton className="h-56 w-full rounded-lg" />
            </div>
          ))}
        </div>
        <div className="card p-5">
          <Skeleton className="h-5 w-48 mb-5" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}
