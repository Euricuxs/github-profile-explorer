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
