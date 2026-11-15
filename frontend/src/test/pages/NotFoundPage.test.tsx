import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { NotFoundPage } from '../../pages/NotFoundPage'

function renderNotFoundPage(initialEntry = '/this/does/not/exist') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <NotFoundPage />
    </MemoryRouter>,
  )
}

describe('NotFoundPage', () => {
  it('says that the page was not found', () => {
    renderNotFoundPage()

    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument()
  })

  it('shows the address that was asked for', () => {
    renderNotFoundPage('/users/somebody/extra')

    expect(screen.getByText('/users/somebody/extra')).toBeInTheDocument()
  })

  it('offers a way back to the search', () => {
    renderNotFoundPage()

    expect(screen.getByRole('link', { name: 'Back to search' })).toHaveAttribute('href', '/')
  })

  it('has a title of its own', () => {
    renderNotFoundPage()

    expect(document.title).toBe('Page not found · GitHub Profile Explorer')
  })
})
