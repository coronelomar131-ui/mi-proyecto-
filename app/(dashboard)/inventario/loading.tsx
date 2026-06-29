import { Skeleton, TableSkeleton } from '@/components/ui/skeleton'

export default function InventarioLoading() {
  return (
    <div>
      <div className="page-header mb-4">
        <Skeleton className="h-7 w-28" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>
      </div>
      <Skeleton className="h-10 w-full rounded-lg mb-4" />
      <div className="table-container">
        <table className="table">
          <thead><tr>{['SKU','Producto','Unidad','Costo','Precio','Stock','Mínimo','Estado'].map(h => <th key={h}>{h}</th>)}</tr></thead>
          <tbody><TableSkeleton rows={8} cols={8} /></tbody>
        </table>
      </div>
    </div>
  )
}
