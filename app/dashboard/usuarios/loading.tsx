import { Skeleton, TableSkeleton } from '@/components/ui/skeleton'

export default function UsuariosLoading() {
  return (
    <div>
      <div className="page-header mb-4">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card p-4">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-6 w-12" />
          </div>
        ))}
      </div>
      <div className="table-container">
        <table className="table">
          <thead><tr>{['Usuario','Email','Rol','Estado','Acción'].map(h => <th key={h}>{h}</th>)}</tr></thead>
          <tbody><TableSkeleton rows={5} cols={5} /></tbody>
        </table>
      </div>
    </div>
  )
}
