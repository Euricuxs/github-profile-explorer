import { describe, expect, it, vi, beforeEach } from 'vitest'
import { http } from '../../api/http'
import { searchUsers } from '../../api/users'

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
