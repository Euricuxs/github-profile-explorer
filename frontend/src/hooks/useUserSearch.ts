import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { searchUsers } from '../api/users'

/**
 * Server state for the user search.
 *
 * The query key contains the search term, so every term is its own cache
 * entry: typing "octocat", then "torvalds", then "octocat" again serves the
 * first result straight from the cache instead of hitting the network.
 *
 * `enabled` is what stops empty searches. A disabled query is never sent, so
 * an empty or whitespace-only term costs no request at all.
 *
 * `placeholderData: keepPreviousData` keeps the previous list on screen while
 * the next term loads, which avoids the flash of an empty page between two
 * searches.
 */
export function useUserSearch(query: string) {
  const term = query.trim()

  return useQuery({
    queryKey: ['users', 'search', term],
    queryFn: () => searchUsers(term),
    enabled: term.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    retry: false,
    refetchOnWindowFocus: false,
  })
}
