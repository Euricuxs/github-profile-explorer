import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../../App'
import { getUserProfile, getUserRepositories, searchUsers } from '../../api/users'
import { makeRepositoryList } from '../fixtures/repositories'

vi.mock('../../api/users', () => ({
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
  publicRepos: 25,
  publicGists: 8,
  createdAt: '2011-01-25T18:44:36Z',
}

/** Shows the current location, so the test can assert on the URL. */
function LocationProbe() {
  const location = useLocation()

  return <span data-testid="location">{`${location.pathname}${location.search}`}</span>
}

function setupApp(initialEntry = '/') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  const router = createMemoryRouter(
    [{ path: '*', element: (<><App /><LocationProbe /></>) }],
    { initialEntries: [initialEntry] },
  )

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )

  return router
}

/**
 * The names of the repositories that are on screen.
 *
 * The query is limited to the section of the repositories, because the
 * heading of the chart is a heading of the same level.
 */
function repositoryNames() {
  const section = screen.getByRole('region', { name: 'Repositories' })

  return within(section)
    .getAllByRole('heading', { level: 3 })
    .map((heading) => heading.textContent)
}

describe('the whole flow of the application', () => {
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
    getUserRepositoriesMock.mockResolvedValue(makeRepositoryList())
  })

  it('goes from the search to the profile, through the list, and back', async () => {
    const user = userEvent.setup()
    setupApp()

    // 1. The search finds the account and reports how many results there are.
    await user.type(screen.getByRole('searchbox'), 'octocat{Enter}')

    expect(await screen.findByText(/1 result for/i)).toBeInTheDocument()
    expect(screen.getByText('octocat')).toBeInTheDocument()
    expect(document.title).toBe('octocat · GitHub Profile Explorer')

    // 2. The result leads to the profile of the account.
    await user.click(screen.getByRole('link', { name: "View octocat's profile" }))

    expect(await screen.findByRole('heading', { name: 'The Octocat' })).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/users/octocat?q=octocat')
    expect(screen.getByText('15,000')).toBeInTheDocument()
    expect(document.title).toBe('The Octocat · GitHub Profile Explorer')

    // 3. The repositories of the account are listed, ten on a page.
    expect(await screen.findByText('25 repositories shown')).toBeInTheDocument()
    expect(repositoryNames()).toHaveLength(10)
    expect(repositoryNames()[0]).toBe('repo-0')

    // 4. The list can be moved through its pages.
    await user.click(screen.getByRole('button', { name: 'Next' }))

    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()
    expect(repositoryNames()[0]).toBe('repo-10')

    await user.click(screen.getByRole('button', { name: 'Previous' }))

    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()

    // 5. The list can be narrowed down to one language.
    await user.selectOptions(screen.getByLabelText('Language'), 'TypeScript')

    expect(screen.getByText('12 repositories shown')).toBeInTheDocument()
    expect(repositoryNames()).toHaveLength(10)
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument()

    // 6. The list can be ordered by the number of stars.
    await user.selectOptions(screen.getByLabelText('Sort by'), 'stars')

    expect(repositoryNames()[0]).toBe('repo-11')

    // 7. The statistics and the chart describe the same repositories.
    expect(screen.getByRole('heading', { name: 'Language statistics' })).toBeInTheDocument()

    const typescriptRow = screen.getByRole('row', { name: /TypeScript/ })

    expect(within(typescriptRow).getByText('12')).toBeInTheDocument()
    expect(within(typescriptRow).getByText('48%')).toBeInTheDocument()

    expect(screen.getByRole('img', { name: /language distribution/i })).toBeInTheDocument()

    // 8. Going back returns to the results, and they come from the cache.
    await user.click(screen.getByRole('link', { name: /back to search/i }))

    expect(screen.getByTestId('location')).toHaveTextContent('/?q=octocat')
    expect(await screen.findByText('octocat')).toBeInTheDocument()
    expect(screen.getByRole('searchbox')).toHaveValue('octocat')
    expect(searchUsersMock).toHaveBeenCalledTimes(1)
  })

  it('shows the not-found page for an address that does not exist', async () => {
    setupApp('/users/octocat/extra')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Page not found' }),
    ).toBeInTheDocument()
    expect(within(screen.getByRole('main')).getByText('/users/octocat/extra')).toBeInTheDocument()
  })

  it('shows one error box and not two when the account does not exist', async () => {
    const user = userEvent.setup()
    const notFound = {
      isAxiosError: true,
      response: {
        status: 404,
        data: { error: { code: 'USER_NOT_FOUND', message: 'GitHub user not found.' } },
      },
    }

    getUserProfileMock.mockRejectedValue(notFound)
    getUserRepositoriesMock.mockRejectedValue(notFound)

    setupApp('/users/nobody')

    expect(await screen.findByText(/profile could not be loaded/i)).toBeInTheDocument()
    expect(screen.queryByText(/repositories could not be loaded/i)).not.toBeInTheDocument()
    expect(screen.getAllByRole('alert')).toHaveLength(1)

    // The way back is still there.
    await user.click(screen.getByRole('link', { name: /back to search/i }))

    expect(screen.getByRole('heading', { name: 'GitHub Profile Explorer' })).toBeInTheDocument()
  })
})
