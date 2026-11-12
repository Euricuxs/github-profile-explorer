/**
 * Types for the GitHub REST API payloads we consume, and for the normalized
 * shapes this backend returns to the frontend.
 *
 * The two sets are kept separate on purpose: GitHub uses snake_case and
 * exposes far more fields than we need. Mapping once in the service means a
 * change in GitHub's response only ever touches the mapping code.
 */

/** Raw `GET /users/{username}` response. Only the fields we use are declared. */
export interface GitHubUser {
  login: string
  name: string | null
  avatar_url: string
  html_url: string
  bio: string | null
  company: string | null
  location: string | null
  blog: string | null
  followers: number
  following: number
  public_repos: number
  public_gists: number
  created_at: string
}

/** Raw `GET /users/{username}/repos` response. Only the fields we use are declared. */
export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  language: string | null
  stargazers_count: number
  forks_count: number
  fork: boolean
  archived: boolean
  topics?: string[]
  created_at: string
  updated_at: string
}

/** Public profile returned by `GET /api/users/:username`. */
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
 * Account kind of a search result. GitHub returns organizations in the same
 * list as users, and they are worth showing in a search result list.
 */
export type GitHubAccountType = 'User' | 'Organization'

/**
 * Raw `GET /search/users` response. The `items` array holds *reduced* user
 * objects: they carry an id, a login, an avatar, a profile URL and an account
 * type, but no bio, follower count and so on.
 */
export interface GitHubSearchUsersResponse {
  total_count: number
  incomplete_results: boolean
  items: GitHubSearchUser[]
}

/** A single raw entry of `GET /search/users`. */
export interface GitHubSearchUser {
  id: number
  login: string
  avatar_url: string
  html_url: string
  type: GitHubAccountType
}

/** Repository returned by `GET /api/users/:username/repos`. */
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

/** A single user entry returned by `GET /api/search/users`. */
export interface UserSearchResult {
  id: number
  login: string
  avatarUrl: string
  profileUrl: string
  type: GitHubAccountType
}

/** Response body of `GET /api/search/users`. */
export interface UserSearchResponse {
  totalCount: number
  incompleteResults: boolean
  users: UserSearchResult[]
}
