import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getRepositories, getUserProfile } from './github.service.js'

/**
 * The service talks to GitHub through an Axios instance it creates itself.
 * Instead of exporting that instance just for testing, we replace the whole
 * `axios` module with a mock: `axios.create()` returns a fake client whose
 * `get` method we control per test.
 */
const { mockGet, MockAxiosError } = vi.hoisted(() => {
  class AxiosErrorMock extends Error {
    isAxiosError = true
    code?: string
    response?: unknown

    constructor(message: string, options?: { code?: string; response?: unknown }) {
      super(message)
      this.name = 'AxiosError'
      this.code = options?.code
      this.response = options?.response
    }
  }

  return { mockGet: vi.fn(), MockAxiosError: AxiosErrorMock }
})

vi.mock('axios', () => {
  const isAxiosError = (value: unknown): boolean => value instanceof MockAxiosError

  return {
    default: {
      create: vi.fn(() => ({ get: mockGet })),
      isAxiosError,
    },
    isAxiosError,
  }
})

const githubUser = {
  login: 'octocat',
  name: 'The Octocat',
  avatar_url: 'https://avatars.githubusercontent.com/u/583231?v=4',
  html_url: 'https://github.com/octocat',
  bio: 'A GitHub user',
  company: 'GitHub',
  location: 'San Francisco',
  blog: 'github.blog',
  followers: 20000,
  following: 9,
  public_repos: 8,
  public_gists: 8,
  created_at: '2011-01-25T18:44:36Z',
}

const githubRepo = {
  id: 1296269,
  name: 'Hello-World',
  full_name: 'octocat/Hello-World',
  description: 'This your first repo!',
  html_url: 'https://github.com/octocat/Hello-World',
  language: 'TypeScript',
  stargazers_count: 80,
  forks_count: 9,
  fork: false,
  archived: false,
  topics: ['octocat'],
  created_at: '2011-01-26T19:01:12Z',
  updated_at: '2011-01-26T19:14:43Z',
}

/** Builds an error that looks like the ones Axios produces. */
function axiosError(options: { code?: string; response?: unknown }): Error {
  return new MockAxiosError('Request failed', options)
}

describe('github.service', () => {
  beforeEach(() => {
    mockGet.mockReset()
    vi.unstubAllEnvs()
  })

  describe('getUserProfile', () => {
    it('requests the user endpoint and normalizes the response', async () => {
      mockGet.mockResolvedValue({ data: githubUser })

      const profile = await getUserProfile('octocat')

      expect(mockGet).toHaveBeenCalledWith(
        '/users/octocat',
        expect.objectContaining({
          headers: expect.objectContaining({ Accept: 'application/vnd.github+json' }),
        }),
      )
      expect(profile.login).toBe('octocat')
      expect(profile.avatarUrl).toBe('https://avatars.githubusercontent.com/u/583231?v=4')
      expect(profile.publicRepos).toBe(8)
      expect(profile.blog).toBe('https://github.blog')
    })

    it('sends an Authorization header when a token is configured', async () => {
      vi.stubEnv('GITHUB_TOKEN', 'test-token')
      mockGet.mockResolvedValue({ data: githubUser })

      await getUserProfile('octocat')

      const [, config] = mockGet.mock.calls[0]
      expect(config.headers.Authorization).toBe('Bearer test-token')
    })

    it('maps a 404 response to a USER_NOT_FOUND error', async () => {
      mockGet.mockRejectedValue(
        axiosError({ response: { status: 404, headers: {}, data: { message: 'Not Found' } } }),
      )

      await expect(getUserProfile('missing')).rejects.toMatchObject({
        status: 404,
        code: 'USER_NOT_FOUND',
      })
    })

    it('maps a rate-limited 403 response to RATE_LIMIT_EXCEEDED', async () => {
      mockGet.mockRejectedValue(
        axiosError({
          response: {
            status: 403,
            headers: { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1700000000' },
            data: { message: "API rate limit exceeded for 203.0.113.1." },
          },
        }),
      )

      await expect(getUserProfile('octocat')).rejects.toMatchObject({
        status: 429,
        code: 'RATE_LIMIT_EXCEEDED',
      })
    })

    it('keeps a plain 403 response distinct from a rate limit', async () => {
      mockGet.mockRejectedValue(
        axiosError({
          response: {
            status: 403,
            headers: { 'x-ratelimit-remaining': '42' },
            data: { message: 'Forbidden' },
          },
        }),
      )

      await expect(getUserProfile('octocat')).rejects.toMatchObject({
        status: 403,
        code: 'GITHUB_FORBIDDEN',
      })
    })

    it('maps a 429 response to RATE_LIMIT_EXCEEDED', async () => {
      mockGet.mockRejectedValue(
        axiosError({ response: { status: 429, headers: {}, data: { message: 'Too many requests' } } }),
      )

      await expect(getUserProfile('octocat')).rejects.toMatchObject({
        status: 429,
        code: 'RATE_LIMIT_EXCEEDED',
      })
    })

    it('maps a GitHub 5xx response to GITHUB_UNAVAILABLE', async () => {
      mockGet.mockRejectedValue(
        axiosError({ response: { status: 503, headers: {}, data: { message: 'Service unavailable' } } }),
      )

      await expect(getUserProfile('octocat')).rejects.toMatchObject({
        status: 502,
        code: 'GITHUB_UNAVAILABLE',
      })
    })

    it('maps a timeout to GITHUB_TIMEOUT', async () => {
      mockGet.mockRejectedValue(axiosError({ code: 'ECONNABORTED' }))

      await expect(getUserProfile('octocat')).rejects.toMatchObject({
        status: 504,
        code: 'GITHUB_TIMEOUT',
      })
    })

    it('maps a connection failure to GITHUB_UNAVAILABLE', async () => {
      mockGet.mockRejectedValue(axiosError({ code: 'ERR_NETWORK' }))

      await expect(getUserProfile('octocat')).rejects.toMatchObject({
        status: 502,
        code: 'GITHUB_UNAVAILABLE',
      })
    })
  })

  describe('getRepositories', () => {
    it('requests a single page of at most 100 repositories and normalizes them', async () => {
      mockGet.mockResolvedValue({ data: [githubRepo] })

      const repositories = await getRepositories('octocat')

      expect(mockGet).toHaveBeenCalledWith(
        '/users/octocat/repos',
        expect.objectContaining({
          params: { per_page: 100, sort: 'updated' },
        }),
      )
      expect(repositories).toHaveLength(1)
      expect(repositories[0].fullName).toBe('octocat/Hello-World')
      expect(repositories[0].stargazersCount).toBe(80)
      expect(repositories[0].language).toBe('TypeScript')
    })

    it('returns an empty list when the user has no public repositories', async () => {
      mockGet.mockResolvedValue({ data: [] })

      await expect(getRepositories('octocat')).resolves.toEqual([])
    })
  })
})
