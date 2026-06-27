import { Skeleton, TableSkeleton } from '@/components/ui/skeleton'

export default function VentasLoading() {
  return (
    <div>
      <div className="page-header mb-4">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      <Skeleton className="h-10 w-full rounded-lg mb-4" />
      <div className="table-container">
        <table className="table">
          <thead><tr>{['Folio','Cliente','Total','Pago','Estado','Fecha',''].map(h => <th key={h}>{h}</th>)}</tr></thead>
          <tbody><TableSkeleton rows={8} cols={7} /></tbody>
        </table>
      </div>
    </div>
  )
}
