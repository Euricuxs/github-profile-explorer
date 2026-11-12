import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HomePage } from '../../pages/HomePage'
import { searchUsers } from '../../api/users'

vi.mock('../../api/users', () => ({
  searchUsers: vi.fn(),
}))

const searchUsersMock = vi.mocked(searchUsers)

const octocat = {
  id: 583231,
  login: 'octocat',
  avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4',
  profileUrl: 'https://github.com/octocat',
  type: 'User' as const,
}

const github = {
  id: 9919,
  login: 'github',
  avatarUrl: 'https://avatars.githubusercontent.com/u/9919?v=4',
  profileUrl: 'https://github.com/github',
  type: 'Organization' as const,
}

function renderHomePage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <HomePage />
    </QueryClientProvider>,
  )
}

describe('HomePage', () => {
  beforeEach(() => {
    searchUsersMock.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('prompts the user to search and does not call the API', () => {
      renderHomePage()

      expect(screen.getByText(/search for a github developer/i)).toBeInTheDocument()
      expect(searchUsersMock).not.toHaveBeenCalled()
    })
  })

  describe('loading state', () => {
    it('shows a loading message while the request is in flight', async () => {
      searchUsersMock.mockReturnValue(new Promise(() => {}))

      const user = userEvent.setup()
      renderHomePage()

      await user.type(screen.getByRole('searchbox'), 'octocat{Enter}')

      expect(await screen.findByText(/loading results/i)).toBeInTheDocument()
    })
  })

  describe('successful results', () => {
    it('renders each result with avatar, username, type and profile link', async () => {
      searchUsersMock.mockResolvedValue({
        totalCount: 2,
        incompleteResults: false,
        users: [octocat, github],
      })

      const user = userEvent.setup()
      renderHomePage()

      await user.type(screen.getByRole('searchbox'), 'octocat{Enter}')

      expect(await screen.findByText('octocat')).toBeInTheDocument()
      expect(screen.getByText('github')).toBeInTheDocument()

      expect(screen.getByAltText('octocat avatar')).toHaveAttribute('src', octocat.avatarUrl)
      expect(screen.getByAltText('github avatar')).toHaveAttribute('src', github.avatarUrl)

      expect(screen.getByText('User')).toBeInTheDocument()
      expect(screen.getByText('Organization')).toBeInTheDocument()

      const link = screen.getByRole('link', { name: /view profile of octocat on github/i })
      expect(link).toHaveAttribute('href', 'https://github.com/octocat')
    })

    it('shows the total result count', async () => {
      searchUsersMock.mockResolvedValue({
        totalCount: 42,
        incompleteResults: false,
        users: [octocat],
      })

      const user = userEvent.setup()
      renderHomePage()

      await user.type(screen.getByRole('searchbox'), 'octocat{Enter}')

      expect(await screen.findByText(/42 results for/i)).toBeInTheDocument()
    })

    it('warns when GitHub returned incomplete results', async () => {
      searchUsersMock.mockResolvedValue({
        totalCount: 1,
        incompleteResults: true,
        users: [octocat],
      })

      const user = userEvent.setup()
      renderHomePage()

      await user.type(screen.getByRole('searchbox'), 'octocat{Enter}')

      expect(await screen.findByText(/incomplete results/i)).toBeInTheDocument()
    })
  })

  describe('empty results', () => {
    it('shows an empty state when nothing matched', async () => {
      searchUsersMock.mockResolvedValue({
        totalCount: 0,
        incompleteResults: false,
        users: [],
      })

      const user = userEvent.setup()
      renderHomePage()

      await user.type(screen.getByRole('searchbox'), 'nobody{Enter}')

      expect(await screen.findByText(/no users found/i)).toBeInTheDocument()
      expect(screen.queryByText('octocat')).not.toBeInTheDocument()
    })
  })

  describe('error state', () => {
    it('maps a backend error code to a friendly message', async () => {
      searchUsersMock.mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 429,
          data: {
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'GitHub API rate limit exceeded.',
            },
          },
        },
      })

      const user = userEvent.setup()
      renderHomePage()

      await user.type(screen.getByRole('searchbox'), 'octocat{Enter}')

      expect(await screen.findByText(/search failed/i)).toBeInTheDocument()
      expect(screen.getByText(/rate limit exceeded/i)).toBeInTheDocument()
    })

    it('shows an offline message when the request never reached the server', async () => {
      searchUsersMock.mockRejectedValue({
        isAxiosError: true,
        request: {},
        response: undefined,
      })

      const user = userEvent.setup()
      renderHomePage()

      await user.type(screen.getByRole('searchbox'), 'octocat{Enter}')

      expect(await screen.findByText(/could not reach the server/i)).toBeInTheDocument()
    })
  })

  describe('query behaviour', () => {
    it('does not request anything for a whitespace-only query', async () => {
      const user = userEvent.setup()
      renderHomePage()

      await user.type(screen.getByRole('searchbox'), '   {Enter}')

      expect(searchUsersMock).not.toHaveBeenCalled()
    })

    it('waits for the debounce before requesting results', async () => {
      vi.useFakeTimers()
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      searchUsersMock.mockResolvedValue({
        totalCount: 1,
        incompleteResults: false,
        users: [octocat],
      })

      renderHomePage()

      await user.type(screen.getByRole('searchbox'), 'octocat')

      expect(searchUsersMock).not.toHaveBeenCalled()

      await act(async () => {
        await vi.advanceTimersByTimeAsync(500)
      })

      expect(searchUsersMock).toHaveBeenCalledWith('octocat')
    })

    it('keeps the previous results visible while the next search loads', async () => {
      searchUsersMock.mockResolvedValueOnce({
        totalCount: 1,
        incompleteResults: false,
        users: [octocat],
      })

      const user = userEvent.setup()
      renderHomePage()

      await user.type(screen.getByRole('searchbox'), 'octocat{Enter}')

      expect(await screen.findByText('octocat')).toBeInTheDocument()

      searchUsersMock.mockReturnValueOnce(new Promise(() => {}))

      // Editing the query (rather than clearing it) is the case where the
      // previous results can stay on screen while the new ones load.
      await user.type(screen.getByRole('searchbox'), 's{Enter}')

      expect(await screen.findByText(/searching/i)).toBeInTheDocument()
      expect(screen.getByText('octocat')).toBeInTheDocument()
    })

    it('returns to the initial state when the input is cleared', async () => {
      searchUsersMock.mockResolvedValue({
        totalCount: 1,
        incompleteResults: false,
        users: [octocat],
      })

      const user = userEvent.setup()
      renderHomePage()

      await user.type(screen.getByRole('searchbox'), 'octocat{Enter}')

      expect(await screen.findByText('octocat')).toBeInTheDocument()

      await user.clear(screen.getByRole('searchbox'))

      expect(await screen.findByText(/search for a github developer/i)).toBeInTheDocument()
      expect(screen.queryByText('octocat')).not.toBeInTheDocument()
    })
  })
})
