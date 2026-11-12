/**
 * The four states that are not the result list.
 *
 * They live together because they are three lines each and they are all
 * "the page is telling the user what happened" messages.
 */

/** Shown before the first search. */
export function InitialState() {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
      <p className="text-base font-medium text-slate-900">Search for a GitHub developer</p>
      <p className="mt-1 text-sm text-slate-600">
        Type a username or keyword above to find people and organizations on GitHub.
      </p>
    </div>
  )
}

/** Shown while the first result set is loading. */
export function LoadingState() {
  return (
    <div role="status" className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center">
      <p className="text-base font-medium text-slate-900">Loading results&hellip;</p>
      <p className="mt-1 text-sm text-slate-600">Contacting the GitHub API through our backend.</p>
    </div>
  )
}

/** Shown when the search succeeded but nothing matched. */
export function EmptyState({ query }: { query: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
      <p className="text-base font-medium text-slate-900">No users found</p>
      <p className="mt-1 text-sm text-slate-600">
        Nothing on GitHub matched &ldquo;{query}&rdquo;. Try a different username or keyword.
      </p>
    </div>
  )
}

/** Shown when the request failed. */
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 px-6 py-8 text-center"
    >
      <p className="text-base font-medium text-red-900">Search failed</p>
      <p className="mt-1 text-sm text-red-800">{message}</p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-lg bg-red-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-900/30 focus:ring-offset-2"
      >
        Try again
      </button>
    </div>
  )
}
