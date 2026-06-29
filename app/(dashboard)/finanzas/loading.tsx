import { Skeleton, TableSkeleton } from '@/components/ui/skeleton'

export default function FinanzasLoading() {
  return (
    <div>
      <div className="page-header mb-4">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-9 w-40 rounded-lg" />
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card p-5">
            <Skeleton className="h-4 w-20 mb-3" />
            <Skeleton className="h-8 w-32" />
          </div>
        ))}
      </div>
      <div className="flex gap-2 mb-4">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-20 rounded-lg" />)}
      </div>
      <div className="table-container">
        <table className="table">
          <thead><tr>{['Fecha','Tipo','Categoría','Descripción','Referencia','Monto'].map(h => <th key={h}>{h}</th>)}</tr></thead>
          <tbody><TableSkeleton rows={8} cols={6} /></tbody>
        </table>
      </div>
    </div>
  )
}
