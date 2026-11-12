import { http } from './http'
import type { UserSearchResponse } from '../types/user'

/**
 * Searches GitHub users through our own backend.
 *
 * The browser never talks to api.github.com directly: the backend owns the
 * GitHub integration, and forwarding the request from here keeps the API
 * credentials and the rate-limit handling on the server.
 */
export async function searchUsers(query: string): Promise<UserSearchResponse> {
  const response = await http.get<UserSearchResponse>('/search/users', {
    params: { q: query },
  })

  return response.data
}
