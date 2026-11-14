import { useQuery } from '@tanstack/react-query'
import { getUserProfile } from '../api/users'

/**
 * Server state for a single GitHub profile.
 *
 * The username is part of the query key, so every profile has its own cache
 * entry: opening another user's profile cannot show the previous one, and
 * returning to a profile within `staleTime` is served from the cache instead
 * of hitting the network again.
 *
 * `enabled` keeps an empty username from producing a request to a URL that
 * cannot exist.
 */
export function useUserProfile(username: string) {
  return useQuery({
    queryKey: ['users', 'profile', username],
    queryFn: () => getUserProfile(username),
    enabled: username.length > 0,
    staleTime: 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  })
}
