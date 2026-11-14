/**
 * The shapes the backend returns from `GET /api/search/users`.
 *
 * These mirror the backend contract exactly, so a change on either side
 * shows up as a TypeScript error instead of a runtime surprise.
 */

export type AccountType = 'User' | 'Organization'

export interface UserSearchResult {
  id: number
  login: string
  avatarUrl: string
  profileUrl: string
  type: AccountType
}

export interface UserSearchResponse {
  totalCount: number
  incompleteResults: boolean
  users: UserSearchResult[]
}

/**
 * The shape the backend returns from `GET /api/users/:username`.
 *
 * GitHub leaves most of these fields empty for many accounts, so the optional
 * ones are explicitly nullable instead of optional: the API always sends the
 * key, sometimes with `null` as the value.
 */
export interface UserProfile {
  login: string
  name: string | null
  avatarUrl: string
  profileUrl: string
  bio: string | null
  company: string | null
  location: string | null
  blog: string | null
  followers: number
  following: number
  publicRepos: number
  publicGists: number
  createdAt: string
}

/**
 * The shape the backend returns from `GET /api/users/:username/repos`.
 *
 * A repository without a description and without a detected language is
 * perfectly normal, which is why both are nullable.
 */
export interface Repository {
  id: number
  name: string
  fullName: string
  description: string | null
  url: string
  language: string | null
  stargazersCount: number
  forksCount: number
  isFork: boolean
  isArchived: boolean
  topics: string[]
  createdAt: string
  updatedAt: string
}
