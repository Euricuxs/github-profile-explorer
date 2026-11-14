import { UserResultCard } from './UserResultCard'
import type { UserSearchResponse } from '../types/user'

interface SearchResultsProps {
  result: UserSearchResponse
  query: string
  isFetching: boolean
}

/**
 * The result list, plus the two pieces of context that belong to it: how many
 * results GitHub found in total, and whether GitHub had to cut the search
 * short.
 *
 * While a new search is in flight, `result` still holds the previous result
 * set (TanStack Query keeps it as placeholder data). The count and the
 * incomplete-results notice are hidden in that moment, because they describe
 * the previous search rather than the one being loaded.
 */
export function SearchResults({ result, query, isFetching }: SearchResultsProps) {
  const resultLabel = result.totalCount === 1 ? 'result' : 'results'

  return (
    <section aria-labelledby="search-results-heading">
      <h2 id="search-results-heading" className="text-sm font-medium text-slate-700">
        {isFetching ? (
          'Results'
        ) : (
          <>
            {result.totalCount.toLocaleString('en-US')} {resultLabel} for &ldquo;{query}&rdquo;
          </>
        )}
      </h2>

      {result.incompleteResults && !isFetching ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          GitHub returned incomplete results for this search. Some matches may be missing and the
          total count may be an underestimate.
        </p>
      ) : null}

      <ul className="mt-4 flex flex-col gap-3">
        {result.users.map((user) => (
          <UserResultCard key={user.id} user={user} query={query} />
        ))}
      </ul>
    </section>
  )
}
