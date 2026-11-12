import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import app from '../app.js'
import { ApiError } from '../errors/apiError.js'

/**
 * These tests exercise the HTTP layer (routing, validation, status codes and
 * response shape). The GitHub service is replaced with a mock so the tests
 * never touch the network and stay deterministic.
 */
const { mockSearchUsers } = vi.hoisted(() => ({
  mockSearchUsers: vi.fn(),
}))

vi.mock('../services/github.service.js', () => ({
  searchUsers: mockSearchUsers,
}))

const searchResponse = {
  totalCount: 2,
  incompleteResults: false,
  users: [
    {
      id: 583231,
      login: 'octocat',
      avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4',
      profileUrl: 'https://github.com/octocat',
      type: 'User' as const,
    },
    {
      id: 9919,
      login: 'github',
      avatarUrl: 'https://avatars.githubusercontent.com/u/9919?v=4',
      profileUrl: 'https://github.com/github',
      type: 'Organization' as const,
    },
  ],
}

describe('search routes', () => {
  beforeEach(() => {
    mockSearchUsers.mockReset()
  })

  describe('GET /api/search/users', () => {
    it('returns the matching users', async () => {
      mockSearchUsers.mockResolvedValue(searchResponse)

      const response = await request(app).get('/api/search/users').query({ q: 'octocat' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual(searchResponse)
      expect(mockSearchUsers).toHaveBeenCalledWith('octocat')
    })

    it('trims the query before searching', async () => {
      mockSearchUsers.mockResolvedValue(searchResponse)

      const response = await request(app).get('/api/search/users').query({ q: '  octocat  ' })

      expect(response.status).toBe(200)
      expect(mockSearchUsers).toHaveBeenCalledWith('octocat')
    })

    it('returns an empty result set when nothing matches', async () => {
      mockSearchUsers.mockResolvedValue({ totalCount: 0, incompleteResults: false, users: [] })

      const response = await request(app).get('/api/search/users').query({ q: 'nobody' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ totalCount: 0, incompleteResults: false, users: [] })
    })

    it('rejects a missing query with 400', async () => {
      const response = await request(app).get('/api/search/users')

      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe('INVALID_SEARCH_QUERY')
      expect(mockSearchUsers).not.toHaveBeenCalled()
    })

    it('rejects an empty query with 400', async () => {
      const response = await request(app).get('/api/search/users').query({ q: '' })

      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe('INVALID_SEARCH_QUERY')
      expect(mockSearchUsers).not.toHaveBeenCalled()
    })

    it('rejects a whitespace-only query with 400', async () => {
      const response = await request(app).get('/api/search/users').query({ q: '   ' })

      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe('INVALID_SEARCH_QUERY')
      expect(mockSearchUsers).not.toHaveBeenCalled()
    })

    it('rejects a query longer than 256 characters with 400', async () => {
      const response = await request(app).get('/api/search/users').query({ q: 'a'.repeat(257) })

      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe('INVALID_SEARCH_QUERY')
      expect(mockSearchUsers).not.toHaveBeenCalled()
    })

    it('rejects a repeated query parameter with 400', async () => {
      const response = await request(app).get('/api/search/users?q=octocat&q=torvalds')

      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe('INVALID_SEARCH_QUERY')
      expect(mockSearchUsers).not.toHaveBeenCalled()
    })

    it('returns 429 when the GitHub rate limit is exceeded', async () => {
      mockSearchUsers.mockRejectedValue(
        new ApiError(429, 'RATE_LIMIT_EXCEEDED', 'GitHub API rate limit exceeded.'),
      )

      const response = await request(app).get('/api/search/users').query({ q: 'octocat' })

      expect(response.status).toBe(429)
      expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED')
    })

    it('returns 502 when the GitHub API is unavailable', async () => {
      mockSearchUsers.mockRejectedValue(
        new ApiError(502, 'GITHUB_UNAVAILABLE', 'The GitHub API is currently unavailable.'),
      )

      const response = await request(app).get('/api/search/users').query({ q: 'octocat' })

      expect(response.status).toBe(502)
      expect(response.body.error.code).toBe('GITHUB_UNAVAILABLE')
    })

    it('returns 504 when the GitHub request times out', async () => {
      mockSearchUsers.mockRejectedValue(
        new ApiError(504, 'GITHUB_TIMEOUT', 'The GitHub API did not respond in time.'),
      )

      const response = await request(app).get('/api/search/users').query({ q: 'octocat' })

      expect(response.status).toBe(504)
      expect(response.body.error.code).toBe('GITHUB_TIMEOUT')
    })

    it('returns a generic 500 for unexpected errors', async () => {
      mockSearchUsers.mockRejectedValue(new Error('boom'))

      const response = await request(app).get('/api/search/users').query({ q: 'octocat' })

      expect(response.status).toBe(500)
      expect(response.body).toEqual({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred.',
        },
      })
    })
  })
})
