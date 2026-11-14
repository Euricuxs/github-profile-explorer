import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HomePage } from '../pages/HomePage'
import { ProfilePage } from '../pages/ProfilePage'
import { getUserProfile, getUserRepositories, searchUsers } from '../api/users'

vi.mock('../api/users', () => ({
  searchUsers: vi.fn(),
  getUserProfile: vi.fn(),
  getUserRepositories: vi.fn(),
}))

const searchUsersMock = vi.mocked(searchUsers)
const getUserProfileMock = vi.mocked(getUserProfile)
const getUserRepositoriesMock = vi.mocked(getUserRepositories)

const octocat = {
  id: 583231,
  login: 'octocat',
  avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4',
  profileUrl: 'https://github.com/octocat',
  type: 'User' as const,
}

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
  publicRepos: 8,
  publicGists: 8,
  createdAt: '2011-01-25T18:44:36Z',
}

/** An organization account, served by the same endpoints. */
const organization = {
  ...profile,
  login: 'github',
  name: 'GitHub',
  avatarUrl: 'https://avatars.githubusercontent.com/u/9919?v=4',
  profileUrl: 'https://github.com/github',
  bio: 'How people build software.',
  company: null,
  location: 'San Francisco, CA',
  blog: 'https://github.com/about',
}

/** Shows the current location, so the tests can assert on the URL. */
function LocationProbe() {
  const location = useLocation()

  return <span data-testid="location">{`${location.pathname}${location.search}`}</span>
}

function setupRouter(initialEntry = '/') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: (
          <>
            <HomePage />
            <LocationProbe />
          </>
        ),
      },
      {
        path: '/users/:username',
        element: (
          <>
            <ProfilePage />
            <LocationProbe />
          </>
        ),
      },
    ],
    { initialEntries: [initialEntry] },
  )

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )

  return router
}

describe('navigation', () => {
  beforeEach(() => {
    searchUsersMock.mockReset()
    getUserProfileMock.mockReset()
    getUserRepositoriesMock.mockReset()

    searchUsersMock.mockResolvedValue({
      totalCount: 1,
      incompleteResults: false,
      users: [octocat],
    })
    getUserProfileMock.mockResolvedValue(profile)
    getUserRepositoriesMock.mockResolvedValue([])
  })

  it('opens the profile of the clicked search result', async () => {
    const user = userEvent.setup()
    setupRouter('/')

    await user.type(screen.getByRole('searchbox'), 'octocat{Enter}')

    await user.click(await screen.findByRole('link', { name: "View octocat's profile" }))

    expect(screen.getByTestId('location')).toHaveTextContent('/users/octocat?q=octocat')
    expect(await screen.findByRole('heading', { name: 'The Octocat' })).toBeInTheDocument()
  })

  it('opens the profile of an organization search result', async () => {
    const user = userEvent.setup()

    searchUsersMock.mockResolvedValue({
      totalCount: 1,
      incompleteResults: false,
      users: [{ ...octocat, login: 'github', type: 'Organization' as const }],
    })
    getUserProfileMock.mockResolvedValue(organization)

    setupRouter('/')

    await user.type(screen.getByRole('searchbox'), 'github{Enter}')

    await user.click(await screen.findByRole('link', { name: "View github's profile" }))

    expect(screen.getByTestId('location')).toHaveTextContent('/users/github?q=github')
    expect(await screen.findByRole('heading', { name: 'GitHub' })).toBeInTheDocument()
  })

  it('returns to the previous search when going back to the search', async () => {
    const user = userEvent.setup()
    setupRouter('/')

    await user.type(screen.getByRole('searchbox'), 'octocat{Enter}')
    await user.click(await screen.findByRole('link', { name: "View octocat's profile" }))

    await user.click(await screen.findByRole('link', { name: /back to search/i }))

    expect(screen.getByTestId('location')).toHaveTextContent('/?q=octocat')
    expect(await screen.findByText('octocat')).toBeInTheDocument()
    expect(screen.getByRole('searchbox')).toHaveValue('octocat')
  })

  it('reuses the cached results instead of searching again', async () => {
    const user = userEvent.setup()
    setupRouter('/')

    await user.type(screen.getByRole('searchbox'), 'octocat{Enter}')
    await user.click(await screen.findByRole('link', { name: "View octocat's profile" }))
    await user.click(await screen.findByRole('link', { name: /back to search/i }))

    expect(await screen.findByText('octocat')).toBeInTheDocument()
    expect(searchUsersMock).toHaveBeenCalledTimes(1)
  })

  it('opens a profile directly from its URL', async () => {
    setupRouter('/users/octocat')

    expect(await screen.findByRole('heading', { name: 'The Octocat' })).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/users/octocat')
  })

  it('follows the browser Back and Forward buttons', async () => {
    const user = userEvent.setup()
    const router = setupRouter('/?q=octocat')

    expect(await screen.findByText('octocat')).toBeInTheDocument()

    await user.click(await screen.findByRole('link', { name: "View octocat's profile" }))

    expect(screen.getByTestId('location')).toHaveTextContent('/users/octocat?q=octocat')

    await act(async () => {
      await router.navigate(-1)
    })

    expect(screen.getByTestId('location')).toHaveTextContent('/?q=octocat')
    expect(screen.getByRole('searchbox')).toHaveValue('octocat')
    expect(await screen.findByText('octocat')).toBeInTheDocument()

    await act(async () => {
      await router.navigate(1)
    })

    expect(screen.getByTestId('location')).toHaveTextContent('/users/octocat?q=octocat')
    expect(await screen.findByRole('heading', { name: 'The Octocat' })).toBeInTheDocument()
  })
})
