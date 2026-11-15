interface RepositoryPaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

/**
 * The controls that move between the pages of the repository list.
 *
 * "Previous" is disabled on the first page and "Next" on the last one, so the
 * controls always show where the list can still go.
 */
export function RepositoryPagination({ page, totalPages, onPageChange }: RepositoryPaginationProps) {
  const isFirstPage = page <= 1
  const isLastPage = page >= totalPages

  return (
    <nav aria-label="Repository pages" className="mt-6 flex items-center justify-between gap-4">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={isFirstPage}
        className="focus-ring rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Previous
      </button>

      <p aria-live="polite" className="text-sm text-slate-600">
        Page {page} of {totalPages}
      </p>

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={isLastPage}
        className="focus-ring rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
      </button>
    </nav>
  )
}
