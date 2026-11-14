import { render, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProfilePage } from '../../pages/ProfilePage'
import { getUserProfile, getUserRepositories } from '../../api/users'

vi.mock('../../api/users', () => ({
  getUserProfile: vi.fn(),
  getUserRepositories: vi.fn(),
}))

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
  publicRepos: 8,
  publicGists: 8,
  createdAt: '2011-01-25T18:44:36Z',
}

/** An organization account, which the same endpoints serve. */
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
  followers: 500000,
  following: 0,
  publicRepos: 500,
}

const repository = {
  id: 1296269,
  name: 'Hello-World',
  fullName: 'octocat/Hello-World',
  description: 'This your first repo!',
  url: 'https://github.com/octocat/Hello-World',
  language: 'TypeScript',
  stargazersCount: 1420,
  forksCount: 35,
  isFork: false,
  isArchived: false,
  topics: [],
  createdAt: '2011-01-26T19:01:12Z',
  updatedAt: '2024-11-14T10:00:00Z',
}

function renderProfilePage(initialEntry = '/users/octocat') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  // The page reads the username from the route, so it has to be rendered
  // inside a matching route.
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/users/:username" element={<ProfilePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ProfilePage', () => {
  beforeEach(() => {
    getUserProfileMock.mockReset()
    getUserRepositoriesMock.mockReset()
    getUserProfileMock.mockResolvedValue(profile)
    getUserRepositoriesMock.mockResolvedValue([repository])
  })

  describe('successful profile', () => {
    it('renders the avatar, name, login and bio', async () => {
      renderProfilePage()

      expect(await screen.findByRole('heading', { name: 'The Octocat' })).toBeInTheDocument()
      expect(screen.getByText('@octocat')).toBeInTheDocument()
      expect(screen.getByText('Mascot of GitHub')).toBeInTheDocument()
      expect(screen.getByAltText('octocat avatar')).toHaveAttribute('src', profile.avatarUrl)
    })

    it('renders the company, location and blog', async () => {
      renderProfilePage()

      expect(await screen.findByText('@github')).toBeInTheDocument()
      expect(screen.getByText('Company')).toBeInTheDocument()
      expect(screen.getByText('Location')).toBeInTheDocument()

      const blog = screen.getByRole('link', { name: 'https://octocat.github.io' })
      expect(blog).toHaveAttribute('href', 'https://octocat.github.io')
    })

    it('renders the follower, following and repository counts', async () => {
      renderProfilePage()

      expect(await screen.findByText('Followers')).toBeInTheDocument()
      expect(screen.getByText('15,000')).toBeInTheDocument()
      expect(screen.getByText('Following')).toBeInTheDocument()
      expect(screen.getByText('9')).toBeInTheDocument()
      expect(screen.getByText('Public repos')).toBeInTheDocument()
      expect(screen.getByText('8')).toBeInTheDocument()
    })

    it('links to the public GitHub profile', async () => {
      renderProfilePage()

      const link = await screen.findByRole('link', { name: 'View octocat on GitHub' })
      expect(link).toHaveAttribute('href', 'https://github.com/octocat')
    })

    it('renders an organization account', async () => {
      getUserProfileMock.mockResolvedValue(organization)
      getUserRepositoriesMock.mockResolvedValue([])

      renderProfilePage('/users/github')

      expect(await screen.findByRole('heading', { name: 'GitHub' })).toBeInTheDocument()
      expect(screen.getByText('@github')).toBeInTheDocument()
      expect(screen.getByAltText('github avatar')).toHaveAttribute('src', organization.avatarUrl)
      expect(screen.getByText('How people build software.')).toBeInTheDocument()
    })
  })

  describe('missing profile information', () => {
    it('falls back to the login and hides the empty fields', async () => {
      getUserProfileMock.mockResolvedValue({
        ...profile,
        name: null,
        bio: null,
        company: null,
        location: null,
        blog: null,
      })

      renderProfilePage()

      expect(await screen.findByRole('heading', { name: 'octocat' })).toBeInTheDocument()
      expect(screen.getByText('@octocat')).toBeInTheDocument()

      expect(screen.queryByText('Company')).not.toBeInTheDocument()
      expect(screen.queryByText('Location')).not.toBeInTheDocument()
      expect(screen.queryByText('Blog')).not.toBeInTheDocument()
      expect(screen.queryByText('Mascot of GitHub')).not.toBeInTheDocument()
    })
  })

  describe('profile states', () => {
    it('shows a loading state while the profile is in flight', () => {
      getUserProfileMock.mockReturnValue(new Promise(() => {}))

      renderProfilePage()

      expect(screen.getByText(/loading profile/i)).toBeInTheDocument()
    })

    it('shows an error state with a retry button when the profile fails', async () => {
      getUserProfileMock.mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 404,
          data: { error: { code: 'USER_NOT_FOUND', message: 'GitHub user not found.' } },
        },
      })

      renderProfilePage()

      expect(await screen.findByText(/profile could not be loaded/i)).toBeInTheDocument()
      expect(screen.getByText(/could not be found/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    })
  })

  describe('successful repositories', () => {
    it('renders each repository with its details', async () => {
      renderProfilePage()

      expect(await screen.findByRole('heading', { name: 'Hello-World' })).toBeInTheDocument()
      expect(screen.getByText('This your first repo!')).toBeInTheDocument()
      // The language name is shown on the card, in the statistics table and
      // in the chart legend.
      expect(screen.getAllByText('TypeScript').length).toBeGreaterThan(0)
      expect(screen.getByText('1,420')).toBeInTheDocument()
      expect(screen.getByText('35')).toBeInTheDocument()
      expect(screen.getByText(/updated .*2024/i)).toBeInTheDocument()

      const link = screen.getByRole('link', { name: 'Hello-World' })
      expect(link).toHaveAttribute('href', 'https://github.com/octocat/Hello-World')
    })

    it('shows how many repositories are displayed', async () => {
      renderProfilePage()

      expect(await screen.findByText('1 repository shown')).toBeInTheDocument()
    })
  })

  describe('repository states', () => {
    it('shows an empty state when the account has no public repositories', async () => {
      getUserRepositoriesMock.mockResolvedValue([])

      renderProfilePage()

      expect(await screen.findByText(/no public repositories/i)).toBeInTheDocument()
    })

    it('shows a loading state while the repositories are in flight', async () => {
      getUserRepositoriesMock.mockReturnValue(new Promise(() => {}))

      renderProfilePage()

      // The profile is independent of the repositories and stays visible.
      expect(await screen.findByRole('heading', { name: 'The Octocat' })).toBeInTheDocument()
      expect(screen.getByText(/loading repositories/i)).toBeInTheDocument()
    })

    it('shows an error state without hiding the profile', async () => {
      getUserRepositoriesMock.mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 429,
          data: { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Rate limit exceeded.' } },
        },
      })

      renderProfilePage()

      expect(await screen.findByText(/repositories could not be loaded/i)).toBeInTheDocument()
      expect(screen.getByText(/rate limit exceeded/i)).toBeInTheDocument()

      // The profile is still there: the two requests fail on their own.
      expect(screen.getByRole('heading', { name: 'The Octocat' })).toBeInTheDocument()
    })

    it('renders a repository without a description and without a language', async () => {
      getUserRepositoriesMock.mockResolvedValue([
        { ...repository, description: null, language: null },
      ])

      renderProfilePage()

      expect(await screen.findByRole('heading', { name: 'Hello-World' })).toBeInTheDocument()
      expect(screen.getByText('No description provided.')).toBeInTheDocument()
      expect(screen.queryByText('TypeScript')).not.toBeInTheDocument()
    })

    it('explains the limit when a hundred repositories are returned', async () => {
      const many = Array.from({ length: 100 }, (_, index) => ({
        ...repository,
        id: index,
        name: `repo-${index}`,
      }))
      getUserRepositoriesMock.mockResolvedValue(many)

      renderProfilePage()

      expect(await screen.findByText('100 repositories shown')).toBeInTheDocument()
      expect(screen.getByText(/at most 100 repositories per request/i)).toBeInTheDocument()
    })
  })

  describe('language statistics', () => {
    it('shows the language, the count and the percentage of every language', async () => {
      renderProfilePage()

      expect(await screen.findByRole('heading', { name: 'Language statistics' })).toBeInTheDocument()

      const row = screen.getByRole('row', { name: /TypeScript/ })

      expect(within(row).getByText('1')).toBeInTheDocument()
      expect(within(row).getByText('100%')).toBeInTheDocument()
    })

    it('shows the distribution of the languages', async () => {
      renderProfilePage()

      expect(await screen.findByRole('heading', { name: 'Language distribution' })).toBeInTheDocument()
      expect(screen.getByRole('img', { name: /language distribution/i })).toBeInTheDocument()
    })

    it('states that the figures cover the repositories of the backend', async () => {
      renderProfilePage()

      expect(await screen.findByText(/figures cover the/i)).toBeInTheDocument()
    })

    it('does not show the statistics when the account has no repositories', async () => {
      getUserRepositoriesMock.mockResolvedValue([])

      renderProfilePage()

      expect(await screen.findByText(/no public repositories/i)).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Language statistics' })).not.toBeInTheDocument()
    })
  })

  describe('navigation', () => {
    it('links back to the search with the previous term', async () => {
      renderProfilePage('/users/octocat?q=octocat')

      const back = await screen.findByRole('link', { name: /back to search/i })
      expect(back).toHaveAttribute('href', '/?q=octocat')
    })

    it('links back to the search without a term when there is none', async () => {
      renderProfilePage('/users/octocat')

      const back = await screen.findByRole('link', { name: /back to search/i })
      expect(back).toHaveAttribute('href', '/')
    })
  })
})
