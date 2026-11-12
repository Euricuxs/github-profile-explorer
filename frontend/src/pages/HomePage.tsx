import { useState } from 'react'
import { SearchBar } from '../components/SearchBar'
import { SearchResults } from '../components/SearchResults'
import { EmptyState, ErrorState, InitialState, LoadingState } from '../components/SearchStates'
import { getErrorMessage } from '../api/errors'
import { useUserSearch } from '../hooks/useUserSearch'

export function HomePage() {
  const [query, setQuery] = useState('')
  const { data, error, isError, isPending, isFetching, refetch } = useUserSearch(query)

  const hasSearched = query.length > 0
  // The first load has no previous results to keep on screen, so it gets the
  // full loading state. Every later load keeps the old results visible and
  // only adds the small "Searching…" indicator.
  const isRefetching = isFetching && !isPending

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">GitHub Profile Explorer</h1>
        <p className="mt-2 text-slate-600">
          Search GitHub developers and explore their profiles, repositories, and language
          statistics.
        </p>
      </header>

      <div className="mt-8">
        {/* `setQuery` is stable for the whole lifetime of the component, which
            keeps the debounce effect inside SearchBar from restarting on
            every render. */}
        <SearchBar onSearch={setQuery} />
      </div>

      <div aria-live="polite" className="mt-4 min-h-6">
        {hasSearched && isRefetching ? (
          <p role="status" className="text-sm text-slate-500">
            Searching&hellip;
          </p>
        ) : null}
      </div>

      <div className="mt-4">
        {!hasSearched ? <InitialState /> : null}

        {hasSearched && isError ? (
          <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />
        ) : null}

        {hasSearched && !isError && isPending ? <LoadingState /> : null}

        {hasSearched && !isError && !isPending && data && data.users.length > 0 ? (
          <SearchResults result={data} query={query} isFetching={isRefetching} />
        ) : null}

        {hasSearched && !isError && !isPending && data?.users.length === 0 && !isRefetching ? (
          <EmptyState query={query} />
        ) : null}
      </div>
    </main>
  )
}
