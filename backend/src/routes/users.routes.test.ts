import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import app from '../app.js'
import { ApiError } from '../errors/apiError.js'

/**
 * These tests exercise the HTTP layer (routing, validation, status codes and
 * response shape). The GitHub service is replaced with a mock so the tests
 * never touch the network and stay deterministic.
 */
const { mockGetUserProfile, mockGetRepositories } = vi.hoisted(() => ({
  mockGetUserProfile: vi.fn(),
  mockGetRepositories: vi.fn(),
}))

vi.mock('../services/github.service.js', () => ({
  getUserProfile: mockGetUserProfile,
  getRepositories: mockGetRepositories,
}))

const userProfile = {
  login: 'octocat',
  name: 'The Octocat',
  avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4',
  profileUrl: 'https://github.com/octocat',
  bio: 'A GitHub user',
  company: 'GitHub',
  location: 'San Francisco',
  blog: 'https://github.blog',
  followers: 20000,
  following: 9,
  publicRepos: 8,
  publicGists: 8,
  createdAt: '2011-01-25T18:44:36Z',
}

const repository = {
  id: 1296269,
  name: 'Hello-World',
  fullName: 'octocat/Hello-World',
  description: 'This your first repo!',
  url: 'https://github.com/octocat/Hello-World',
  language: 'TypeScript',
  stargazersCount: 80,
  forksCount: 9,
  isFork: false,
  isArchived: false,
  topics: ['octocat'],
  createdAt: '2011-01-26T19:01:12Z',
  updatedAt: '2011-01-26T19:14:43Z',
}

describe('users routes', () => {
  beforeEach(() => {
    mockGetUserProfile.mockReset()
    mockGetRepositories.mockReset()
  })

  describe('GET /api/users/:username', () => {
    it('returns the public profile of a user', async () => {
      mockGetUserProfile.mockResolvedValue(userProfile)

      const response = await request(app).get('/api/users/octocat')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ user: userProfile })
      expect(mockGetUserProfile).toHaveBeenCalledWith('octocat')
    })

    it('rejects an invalid username with 400', async () => {
      const response = await request(app).get('/api/users/not--valid')

      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe('INVALID_USERNAME')
      expect(mockGetUserProfile).not.toHaveBeenCalled()
    })

    it('returns 404 when the GitHub user does not exist', async () => {
      mockGetUserProfile.mockRejectedValue(new ApiError(404, 'USER_NOT_FOUND', 'GitHub user not found.'))

      const response = await request(app).get('/api/users/missing')

      expect(response.status).toBe(404)
      expect(response.body.error.code).toBe('USER_NOT_FOUND')
    })

    it('returns 429 when the GitHub rate limit is exceeded', async () => {
      mockGetUserProfile.mockRejectedValue(
        new ApiError(429, 'RATE_LIMIT_EXCEEDED', 'GitHub API rate limit exceeded.'),
      )

      const response = await request(app).get('/api/users/octocat')

      expect(response.status).toBe(429)
      expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED')
    })

    it('returns 502 when the GitHub API is unavailable', async () => {
      mockGetUserProfile.mockRejectedValue(
        new ApiError(502, 'GITHUB_UNAVAILABLE', 'The GitHub API is currently unavailable.'),
      )

      const response = await request(app).get('/api/users/octocat')

      expect(response.status).toBe(502)
      expect(response.body.error.code).toBe('GITHUB_UNAVAILABLE')
    })

    it('returns 504 when the GitHub request times out', async () => {
      mockGetUserProfile.mockRejectedValue(
        new ApiError(504, 'GITHUB_TIMEOUT', 'The GitHub API did not respond in time.'),
      )

      const response = await request(app).get('/api/users/octocat')

      expect(response.status).toBe(504)
      expect(response.body.error.code).toBe('GITHUB_TIMEOUT')
    })

    it('returns a generic 500 for unexpected errors', async () => {
      mockGetUserProfile.mockRejectedValue(new Error('boom'))

      const response = await request(app).get('/api/users/octocat')

      expect(response.status).toBe(500)
      expect(response.body).toEqual({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred.',
        },
      })
    })
  })

  describe('GET /api/users/:username/repos', () => {
    it('returns the public repositories of a user', async () => {
      mockGetRepositories.mockResolvedValue([repository])

      const response = await request(app).get('/api/users/octocat/repos')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ repositories: [repository] })
      expect(mockGetRepositories).toHaveBeenCalledWith('octocat')
    })

    it('returns an empty list when the user has no public repositories', async () => {
      mockGetRepositories.mockResolvedValue([])

      const response = await request(app).get('/api/users/octocat/repos')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ repositories: [] })
    })

    it('rejects an invalid username with 400', async () => {
      const response = await request(app).get('/api/users/-invalid/repos')

      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe('INVALID_USERNAME')
      expect(mockGetRepositories).not.toHaveBeenCalled()
    })
  })
})
