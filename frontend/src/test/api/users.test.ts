import { describe, expect, it, vi, beforeEach } from 'vitest'
import { http } from '../../api/http'
import { getUserProfile, getUserRepositories, searchUsers } from '../../api/users'

vi.mock('../../api/http', () => ({
  http: {
    get: vi.fn(),
  },
}))

const getMock = vi.mocked(http.get)

describe('searchUsers', () => {
  beforeEach(() => {
    getMock.mockReset()
  })

  it('requests the search endpoint with the query as the "q" parameter', async () => {
    const payload = {
      totalCount: 1,
      incompleteResults: false,
      users: [
        {
          id: 583231,
          login: 'octocat',
          avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4',
          profileUrl: 'https://github.com/octocat',
          type: 'User' as const,
        },
      ],
    }
    getMock.mockResolvedValue({ data: payload })

    await expect(searchUsers('octocat')).resolves.toEqual(payload)

    expect(getMock).toHaveBeenCalledTimes(1)
    expect(getMock).toHaveBeenCalledWith('/search/users', {
      params: { q: 'octocat' },
    })
  })

  it('passes the query through unchanged so the caller controls the trimming', async () => {
    getMock.mockResolvedValue({ data: { totalCount: 0, incompleteResults: false, users: [] } })

    await searchUsers('octo cat')

    expect(getMock).toHaveBeenCalledWith('/search/users', {
      params: { q: 'octo cat' },
    })
  })
})

describe('getUserProfile', () => {
  beforeEach(() => {
    getMock.mockReset()
  })

  it('requests the profile endpoint and unwraps the user', async () => {
    const profile = {
      login: 'octocat',
      name: 'The Octocat',
      avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4',
      profileUrl: 'https://github.com/octocat',
      bio: null,
      company: null,
      location: null,
      blog: null,
      followers: 1,
      following: 2,
      publicRepos: 3,
      publicGists: 4,
      createdAt: '2011-01-25T18:44:36Z',
    }
    getMock.mockResolvedValue({ data: { user: profile } })

    await expect(getUserProfile('octocat')).resolves.toEqual(profile)

    expect(getMock).toHaveBeenCalledWith('/users/octocat')
  })

  it('escapes the username so it cannot break out of the path', async () => {
    getMock.mockResolvedValue({ data: { user: {} } })

    await getUserProfile('octo cat')

    expect(getMock).toHaveBeenCalledWith('/users/octo%20cat')
  })
})

describe('getUserRepositories', () => {
  beforeEach(() => {
    getMock.mockReset()
  })

  it('requests the repositories endpoint and unwraps the list', async () => {
    const repositories = [
      {
        id: 1,
        name: 'Hello-World',
        fullName: 'octocat/Hello-World',
        description: null,
        url: 'https://github.com/octocat/Hello-World',
        language: null,
        stargazersCount: 0,
        forksCount: 0,
        isFork: false,
        isArchived: false,
        topics: [],
        createdAt: '2011-01-26T19:01:12Z',
        updatedAt: '2011-01-26T19:01:12Z',
      },
    ]
    getMock.mockResolvedValue({ data: { repositories } })

    await expect(getUserRepositories('octocat')).resolves.toEqual(repositories)

    expect(getMock).toHaveBeenCalledWith('/users/octocat/repos')
  })
})
