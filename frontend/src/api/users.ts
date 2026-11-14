import { http } from './http'
import type { Repository, UserProfile, UserSearchResponse } from '../types/user'

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

/**
 * Fetches the public profile of a single GitHub user.
 *
 * The backend wraps the profile in a `user` key, so the envelope is unwrapped
 * here and the caller only deals with the profile itself.
 */
export async function getUserProfile(username: string): Promise<UserProfile> {
  const response = await http.get<{ user: UserProfile }>(
    `/users/${encodeURIComponent(username)}`,
  )

  return response.data.user
}

/**
 * Fetches the public repositories of a single GitHub user.
 *
 * The backend returns at most one page of 100 repositories, most recently
 * updated first.
 */
export async function getUserRepositories(username: string): Promise<Repository[]> {
  const response = await http.get<{ repositories: Repository[] }>(
    `/users/${encodeURIComponent(username)}/repos`,
  )

  return response.data.repositories
}
