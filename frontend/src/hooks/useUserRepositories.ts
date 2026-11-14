import { useQuery } from '@tanstack/react-query'
import { getUserRepositories } from '../api/users'

/**
 * Server state for the repositories of a single GitHub user.
 *
 * This is a separate query from the profile on purpose: the two requests run
 * in parallel, and each one has its own loading and error state. A failing
 * repository request must not hide the profile, and the other way around.
 */
export function useUserRepositories(username: string) {
  return useQuery({
    queryKey: ['users', 'repositories', username],
    queryFn: () => getUserRepositories(username),
    enabled: username.length > 0,
    staleTime: 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  })
}
