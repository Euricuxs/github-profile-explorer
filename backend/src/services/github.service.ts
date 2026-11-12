import axios, { type AxiosRequestConfig } from 'axios'
import { ApiError } from '../errors/apiError.js'
import type {
  GitHubRepo,
  GitHubSearchUser,
  GitHubSearchUsersResponse,
  GitHubUser,
  Repository,
  UserProfile,
  UserSearchResponse,
  UserSearchResult,
} from '../types/github.js'

const DEFAULT_BASE_URL = 'https://api.github.com'
const REQUEST_TIMEOUT_MS = 10_000

/**
 * GitHub paginates at 100 items per page and does not allow more than that.
 * We deliberately request a single page of 100 repositories. Users with more
 * than 100 public repositories will be truncated; frontend pagination is out
 * of scope for this phase.
 */
const MAX_REPOS_PER_PAGE = 100

/**
 * How many search results we ask GitHub for. 30 is GitHub's default page
 * size for search and keeps the response small enough for a result list.
 */
const SEARCH_RESULTS_PER_PAGE = 30

const githubClient = axios.create({
  baseURL: process.env.GITHUB_API_BASE_URL ?? DEFAULT_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
})

/**
 * Headers sent with every GitHub request.
 *
 * The token is optional: without it we use the public API unauthenticated
 * (60 requests/hour per IP). It never leaves the server.
 */
function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'github-profile-explorer',
  }

  const token = process.env.GITHUB_TOKEN
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

/**
 * Reads a single response header without assuming a concrete header type.
 * Axios may hand us a plain object or its own `AxiosHeaders` class.
 */
function readHeader(headers: unknown, name: string): string | undefined {
  if (!headers || typeof headers !== 'object') {
    return undefined
  }

  const container = headers as Record<string, unknown>
  const direct = container[name]
  if (typeof direct === 'string') {
    return direct
  }

  const getter = (container as { get?: (key: string) => unknown }).get
  if (typeof getter === 'function') {
    const value = getter.call(container, name)
    return typeof value === 'string' ? value : undefined
  }

  return undefined
}

/** Pulls the `message` field out of a GitHub error body, when there is one. */
function extractMessage(data: unknown): string {
  if (typeof data === 'string') {
    return data
  }

  if (data && typeof data === 'object') {
    const message = (data as { message?: unknown }).message
    if (typeof message === 'string') {
      return message
    }
  }

  return ''
}

/**
 * GitHub answers 403 for several different reasons, so a 403 alone does not
 * mean "rate limited". We treat it as a rate limit when the response says so,
 * either through the rate-limit headers (`x-ratelimit-remaining: 0`) or
 * through a message mentioning the rate limit (secondary rate limits).
 */
function isRateLimited(headers: unknown, data: unknown): boolean {
  if (readHeader(headers, 'x-ratelimit-remaining') === '0') {
    return true
  }

  return extractMessage(data).toLowerCase().includes('rate limit')
}

/**
 * Converts any failure of a GitHub call into an `ApiError` with a status and
 * code that the client can act on. Unexpected, non-Axios errors become a
 * generic 500 so the centralized handler keeps its current behaviour.
 */
function toApiError(error: unknown): ApiError {
  if (!axios.isAxiosError(error)) {
    return new ApiError(500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred.', { cause: error })
  }

  const response = error.response

  if (!response) {
    // No response at all: the request timed out or the connection failed.
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new ApiError(504, 'GITHUB_TIMEOUT', 'The GitHub API did not respond in time.', { cause: error })
    }

    return new ApiError(502, 'GITHUB_UNAVAILABLE', 'The GitHub API could not be reached.', { cause: error })
  }

  const { status, headers, data } = response

  if (status === 404) {
    return new ApiError(404, 'USER_NOT_FOUND', 'GitHub user not found.', { cause: error })
  }

  if (status === 429) {
    return new ApiError(429, 'RATE_LIMIT_EXCEEDED', 'GitHub API rate limit exceeded.', { cause: error })
  }

  if (status === 403) {
    if (isRateLimited(headers, data)) {
      return new ApiError(429, 'RATE_LIMIT_EXCEEDED', 'GitHub API rate limit exceeded.', { cause: error })
    }

    return new ApiError(403, 'GITHUB_FORBIDDEN', 'The GitHub API rejected this request.', { cause: error })
  }

  if (status >= 500) {
    return new ApiError(502, 'GITHUB_UNAVAILABLE', 'The GitHub API is currently unavailable.', { cause: error })
  }

  return new ApiError(502, 'GITHUB_ERROR', 'The GitHub API returned an unexpected response.', { cause: error })
}

/** Performs a GET request against the GitHub API and returns its data. */
async function requestGitHub<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
  try {
    const response = await githubClient.get<T>(path, {
      ...config,
      headers: buildHeaders(),
    })

    return response.data
  } catch (error) {
    throw toApiError(error)
  }
}

/** GitHub omits the scheme on user-supplied blog URLs; add it back. */
function normalizeBlogUrl(blog: string | null): string | null {
  if (!blog) {
    return null
  }

  if (/^https?:\/\//i.test(blog)) {
    return blog
  }

  return `https://${blog}`
}

function toUserProfile(user: GitHubUser): UserProfile {
  return {
    login: user.login,
    name: user.name,
    avatarUrl: user.avatar_url,
    profileUrl: user.html_url,
    bio: user.bio,
    company: user.company,
    location: user.location,
    blog: normalizeBlogUrl(user.blog),
    followers: user.followers,
    following: user.following,
    publicRepos: user.public_repos,
    publicGists: user.public_gists,
    createdAt: user.created_at,
  }
}

function toRepository(repo: GitHubRepo): Repository {
  return {
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description,
    url: repo.html_url,
    language: repo.language,
    stargazersCount: repo.stargazers_count,
    forksCount: repo.forks_count,
    isFork: repo.fork,
    isArchived: repo.archived,
    topics: repo.topics ?? [],
    createdAt: repo.created_at,
    updatedAt: repo.updated_at,
  }
}

/** Converts a raw search entry into the shape the frontend consumes. */
function toSearchResult(user: GitHubSearchUser): UserSearchResult {
  return {
    id: user.id,
    login: user.login,
    avatarUrl: user.avatar_url,
    profileUrl: user.html_url,
    type: user.type,
  }
}

/** Fetches the public profile of a GitHub user. */
export async function getUserProfile(username: string): Promise<UserProfile> {
  const user = await requestGitHub<GitHubUser>(`/users/${encodeURIComponent(username)}`)

  return toUserProfile(user)
}

/**
 * Fetches a single page (max 100) of the user's public repositories, most
 * recently updated first.
 */
export async function getRepositories(username: string): Promise<Repository[]> {
  const repos = await requestGitHub<GitHubRepo[]>(`/users/${encodeURIComponent(username)}/repos`, {
    params: {
      per_page: MAX_REPOS_PER_PAGE,
      sort: 'updated',
    },
  })

  return repos.map(toRepository)
}

/**
 * Searches GitHub for users and organizations matching the given query.
 *
 * GitHub answers a search that matches nothing with `200` and an empty item
 * list, so an empty result is a normal outcome and not an error.
 */
export async function searchUsers(query: string): Promise<UserSearchResponse> {
  const response = await requestGitHub<GitHubSearchUsersResponse>('/search/users', {
    params: {
      q: query,
      per_page: SEARCH_RESULTS_PER_PAGE,
    },
  })

  return {
    totalCount: response.total_count,
    incompleteResults: response.incomplete_results,
    users: response.items.map(toSearchResult),
  }
}
