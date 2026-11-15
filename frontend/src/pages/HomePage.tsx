import { useNavigate, useSearchParams } from 'react-router'
import { SearchBar } from '../components/SearchBar'
import { SearchResults } from '../components/SearchResults'
import { EmptyState, ErrorState, InitialState, LoadingState } from '../components/SearchStates'
import { getErrorMessage } from '../api/errors'
import { usePageMeta } from '../hooks/usePageMeta'
import { useUserSearch } from '../hooks/useUserSearch'

const PAGE_DESCRIPTION =
  'Search GitHub developers and explore their public profiles, repositories, and language statistics.'

/**
 * The search page.
 *
 * The search term lives in the URL (`/?q=octocat`) instead of in component
 * state. That is what lets a search be linkable, survive a reload, and be
 * restored when the user comes back from a profile page.
 */
export function HomePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const query = searchParams.get('q') ?? ''

  // The trimmed term is the one and only definition of "a search happened".
  // The page and the hook have to agree on it: when they disagree, a term
  // that is only whitespace leaves the page waiting for a request that is
  // never sent.
  const term = query.trim()

  const { data, error, isError, isPending, isFetching, refetch } = useUserSearch(term)

  const hasSearched = term.length > 0
  // The first load has no previous results to keep on screen, so it gets the
  // full loading state. Every later load keeps the old results visible and
  // only adds the small "Searching…" indicator.
  const isRefetching = isFetching && !isPending

  usePageMeta({
    title: hasSearched ? `${term} · GitHub Profile Explorer` : 'GitHub Profile Explorer',
    description: PAGE_DESCRIPTION,
  })

  /**
   * The number of results, as it is announced to a screen reader.
   *
   * The count is also written in the heading of the result list, but a
   * heading is only read when the user reaches it. This text changes on its
   * own when the results arrive, so the user is told that something
   * happened.
   */
  const resultAnnouncement =
    hasSearched && !isError && !isPending && !isRefetching && data
      ? `${data.totalCount.toLocaleString('en-US')} ${
          data.totalCount === 1 ? 'result' : 'results'
        } found for ${term}`
      : ''

  /**
   * Puts a term in the URL.
   *
   * The term that is already in the URL is ignored, so the round trip
   * through the URL cannot start a second search for the same term. The
   * replacement keeps the browser history clean: typing does not add an
   * entry per keystroke.
   */
  function handleSearch(value: string) {
    const current = searchParams.get('q') ?? ''

    if (value === current) {
      return
    }

    navigate(value.length > 0 ? `/?q=${encodeURIComponent(value)}` : '/', { replace: true })
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">GitHub Profile Explorer</h1>
        <p className="mt-2 text-slate-600">{PAGE_DESCRIPTION}</p>
      </header>

      <div className="mt-8">
        <SearchBar initialTerm={term} onSearch={handleSearch} />
      </div>

      {/* The two status regions are always rendered, so a screen reader is
          already watching them when their text changes. The first one
          follows the request, the second one announces the result count. */}
      <p role="status" className="mt-4 min-h-6 text-sm text-slate-500">
        {isRefetching ? 'Searching…' : ''}
      </p>

      <p role="status" className="sr-only">
        {resultAnnouncement}
      </p>

      <div className="mt-4">
        {!hasSearched ? <InitialState /> : null}

        {hasSearched && isError ? (
          <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />
        ) : null}

        {hasSearched && !isError && isPending ? <LoadingState /> : null}

        {hasSearched && !isError && !isPending && data && data.users.length > 0 ? (
          <SearchResults result={data} query={term} isFetching={isRefetching} />
        ) : null}

        {hasSearched && !isError && !isPending && data?.users.length === 0 && !isRefetching ? (
          <EmptyState query={term} />
        ) : null}
      </div>
    </main>
  )
}
