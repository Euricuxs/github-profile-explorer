import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { getUserProfile, getUserRepositories, searchUsers } from '../api/users'
import { makeRepositoryList } from './fixtures/repositories'

vi.mock('../api/users', () => ({
  searchUsers: vi.fn(),
  getUserProfile: vi.fn(),
  getUserRepositories: vi.fn(),
}))

const searchUsersMock = vi.mocked(searchUsers)
const getUserProfileMock = vi.mocked(getUserProfile)
const getUserRepositoriesMock = vi.mocked(getUserRepositories)

const profile = {
  login: 'octocat',
  name: 'The Octocat',
  avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4',
  profileUrl: 'https://github.com/octocat',
  bio: 'Mascot of GitHub',
  company: '@github',
  location: 'San Francisco',
  blog: 'https://octocat.github.io',
  followers: 15000,
  following: 9,
  publicRepos: 25,
  publicGists: 8,
  createdAt: '2011-01-25T18:44:36Z',
}

function setupApp(initialEntry = '/') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  const router = createMemoryRouter([{ path: '*', element: <App /> }], {
    initialEntries: [initialEntry],
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

/**
 * Every element the user can reach with the keyboard has to carry the class
 * that draws the focus indicator. The class is easy to lose when a component
 * is written, and the loss is invisible: the element still works, it only
 * stops telling the user where the keyboard is.
 */
function expectFocusRing(element: HTMLElement) {
  expect(element.className).toContain('focus-ring')
}

describe('accessibility', () => {
  beforeEach(() => {
    searchUsersMock.mockReset()
    getUserProfileMock.mockReset()
    getUserRepositoriesMock.mockReset()

    searchUsersMock.mockResolvedValue({
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
    })
    getUserProfileMock.mockResolvedValue(profile)
    getUserRepositoriesMock.mockResolvedValue(makeRepositoryList())
  })

  it('gives the search field and its button a focus indicator', () => {
    setupApp()

    expectFocusRing(screen.getByRole('searchbox'))
    expectFocusRing(screen.getByRole('button', { name: 'Search' }))
  })

  it('gives the link of a search result a focus indicator', async () => {
    setupApp('/?q=octocat')

    expectFocusRing(await screen.findByRole('link', { name: "View octocat's profile" }))
  })

  it('gives the controls of the repository list a focus indicator', async () => {
    setupApp('/users/octocat')

    expect(await screen.findByText('25 repositories shown')).toBeInTheDocument()

    expectFocusRing(screen.getByLabelText('Language'))
    expectFocusRing(screen.getByLabelText('Sort by'))
    expectFocusRing(screen.getByRole('button', { name: 'Next' }))
    expectFocusRing(screen.getByRole('button', { name: 'Previous' }))
    expectFocusRing(screen.getByRole('link', { name: /back to search/i }))
    expectFocusRing(screen.getByRole('link', { name: 'View octocat on GitHub' }))
  })

  it('gives the link of a repository a focus indicator', async () => {
    setupApp('/users/octocat')

    expect(await screen.findByText('25 repositories shown')).toBeInTheDocument()

    expectFocusRing(screen.getByRole('link', { name: 'repo-0' }))
  })

  it('gives the retry button of an error a focus indicator', async () => {
    searchUsersMock.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 429,
        data: { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Rate limit exceeded.' } },
      },
    })

    setupApp('/?q=octocat')

    expect(await screen.findByRole('button', { name: /try again/i })).toBeInTheDocument()

    expectFocusRing(screen.getByRole('button', { name: /try again/i }))
  })

  it('gives the link of the not-found page a focus indicator', () => {
    setupApp('/nowhere')

    expectFocusRing(screen.getByRole('link', { name: 'Back to search' }))
  })

  it('has exactly one first-level heading on the search page', () => {
    setupApp()

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('has exactly one first-level heading on the profile page', async () => {
    setupApp('/users/octocat')

    expect(await screen.findByRole('heading', { level: 1, name: 'The Octocat' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('has exactly one first-level heading when the profile fails', async () => {
    getUserProfileMock.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 404,
        data: { error: { code: 'USER_NOT_FOUND', message: 'GitHub user not found.' } },
      },
    })

    setupApp('/users/nobody')

    expect(
      await screen.findByRole('heading', { level: 1, name: /profile could not be loaded/i }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('labels the search field', () => {
    setupApp()

    expect(screen.getByLabelText('Search GitHub users')).toBeInTheDocument()
  })

  it('describes the chart for a screen reader', async () => {
    setupApp('/users/octocat')

    const chart = await screen.findByRole('img', { name: /language distribution/i })

    expect(chart.getAttribute('aria-label')).toContain('TypeScript')
  })
})
