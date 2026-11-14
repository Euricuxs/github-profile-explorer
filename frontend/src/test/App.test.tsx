import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import App from '../App'

vi.mock('../api/users', () => ({
  searchUsers: vi.fn(),
  getUserProfile: vi.fn(),
  getUserRepositories: vi.fn(),
}))

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
  it('renders the home page', () => {
    renderApp()

    expect(screen.getByRole('heading', { name: 'GitHub Profile Explorer' })).toBeInTheDocument()
  })

  it('renders the profile page for a username in the URL', () => {
    renderApp('/users/octocat')

    expect(screen.getByRole('heading', { name: 'Repositories' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to search/i })).toBeInTheDocument()
  })
})
