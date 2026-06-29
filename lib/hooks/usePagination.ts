import { useState, useCallback } from 'react'

export function usePagination(pageSize: number = 25) {
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const getRange = useCallback(() => {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    return { from, to }
  }, [page, pageSize])

  const totalPages = Math.ceil(total / pageSize)
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  const goNext = () => page < totalPages && setPage((p) => p + 1)
  const goPrev = () => page > 1 && setPage((p) => p - 1)
  const goToPage = (p: number) => {
    if (p >= 1 && p <= totalPages) setPage(p)
  }
  const reset = () => setPage(1)

  return {
    page,
    pageSize,
    total,
    setTotal,
    totalPages,
    hasNextPage,
    hasPrevPage,
    goNext,
    goPrev,
    goToPage,
    reset,
    getRange,
  }
}
