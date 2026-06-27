import { Skeleton } from '@/components/ui/skeleton'

export default function ReportesLoading() {
  return (
    <div>
      <div className="page-header mb-6">
        <Skeleton className="h-7 w-24" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-5">
            <Skeleton className="h-5 w-40 mb-4" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}
