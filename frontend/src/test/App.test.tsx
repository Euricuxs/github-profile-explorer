import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { getUserProfile, getUserRepositories, searchUsers } from '../api/users'

vi.mock('../api/users', () => ({
  searchUsers: vi.fn(),
  getUserProfile: vi.fn(),
  getUserRepositories: vi.fn(),
}))

const searchUsersMock = vi.mocked(searchUsers)
const getUserProfileMock = vi.mocked(getUserProfile)
const getUserRepositoriesMock = vi.mocked(getUserRepositories)

function renderApp(initialEntry = '/') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('App', () => {
  beforeEach(() => {
    searchUsersMock.mockReset()
    getUserProfileMock.mockReset()
    getUserRepositoriesMock.mockReset()

    searchUsersMock.mockResolvedValue({ totalCount: 0, incompleteResults: false, users: [] })
    getUserProfileMock.mockResolvedValue({
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
    })
    getUserRepositoriesMock.mockResolvedValue([])
  })

  it('renders the home page', () => {
    renderApp()

    expect(screen.getByRole('heading', { name: 'GitHub Profile Explorer' })).toBeInTheDocument()
  })

  it('renders the profile page for a username in the URL', async () => {
    renderApp('/users/octocat')

    expect(await screen.findByRole('heading', { name: 'The Octocat' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to search/i })).toBeInTheDocument()
  })

  it('renders the not-found page for an address it does not know', () => {
    renderApp('/this/does/not/exist')

    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to search' })).toBeInTheDocument()
  })

  it('does not send the not-found page to the search page', () => {
    renderApp('/users/octocat/extra')

    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument()
  })
})
