import { Skeleton, TableSkeleton } from '@/components/ui/skeleton'

export default function CotizacionesLoading() {
  return (
    <div>
      <div className="page-header mb-4">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-9 w-40 rounded-lg" />
      </div>
      <Skeleton className="h-10 w-full rounded-lg mb-4" />
      <div className="table-container">
        <table className="table">
          <thead><tr>{['Folio','Cliente','Total','Vigencia','Estado','Acciones'].map(h => <th key={h}>{h}</th>)}</tr></thead>
          <tbody><TableSkeleton rows={8} cols={6} /></tbody>
        </table>
      </div>
    </div>
  )
}
