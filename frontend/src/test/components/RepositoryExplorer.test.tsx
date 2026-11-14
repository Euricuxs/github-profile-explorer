import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { RepositoryExplorer } from '../../components/RepositoryExplorer'
import { makeRepositoryList } from '../fixtures/repositories'

const repositories = makeRepositoryList()

function renderExplorer() {
  const user = userEvent.setup()

  render(<RepositoryExplorer repositories={repositories} />)

  return { user }
}

/** The names of the repositories that are on screen, in order. */
function visibleRepositoryNames() {
  return screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)
}

describe('RepositoryExplorer', () => {
  describe('filtering', () => {
    it('offers every language of the list plus the "All Languages" option', () => {
      renderExplorer()

      const filter = screen.getByLabelText('Language')

      expect(filter).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'All Languages' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'TypeScript (12)' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Python (6)' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Not specified (4)' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Rust (2)' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Go (1)' })).toBeInTheDocument()
    })

    it('shows every repository when no language is chosen', () => {
      renderExplorer()

      expect(screen.getByText('25 repositories shown')).toBeInTheDocument()
    })

    it('keeps only the repositories of the chosen language', async () => {
      const { user } = renderExplorer()

      await user.selectOptions(screen.getByLabelText('Language'), 'TypeScript')

      expect(screen.getByText('12 repositories shown')).toBeInTheDocument()
      expect(visibleRepositoryNames()).toHaveLength(10)
    })

    it('shows the repositories without a language under "Not specified"', async () => {
      const { user } = renderExplorer()

      await user.selectOptions(screen.getByLabelText('Language'), 'Not specified')

      expect(screen.getByText('4 repositories shown')).toBeInTheDocument()
    })

    it('shows an empty state when the chosen language has no repository', () => {
      renderExplorer()

      // A language that is not in the list, as it happens when the list is
      // refreshed and the repositories of that language are gone.
      fireEvent.change(screen.getByLabelText('Language'), { target: { value: 'Ruby' } })

      expect(screen.getByText(/no matching repositories/i)).toBeInTheDocument()
      expect(screen.queryAllByRole('heading', { level: 3 })).toHaveLength(0)
    })
  })

  describe('sorting', () => {
    it('shows the most recently updated repository first by default', () => {
      renderExplorer()

      expect(visibleRepositoryNames()[0]).toBe('repo-0')
    })

    it('shows the repository with the most stars first when that order is chosen', async () => {
      const { user } = renderExplorer()

      await user.selectOptions(screen.getByLabelText('Sort by'), 'stars')

      expect(visibleRepositoryNames()[0]).toBe('repo-24')
    })

    it('offers both orders', () => {
      renderExplorer()

      expect(screen.getByRole('option', { name: 'Recently Updated' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Most Stars' })).toBeInTheDocument()
    })
  })

  describe('pagination', () => {
    it('shows ten repositories per page', () => {
      renderExplorer()

      expect(visibleRepositoryNames()).toHaveLength(10)
    })

    it('shows the current page and the number of pages', () => {
      renderExplorer()

      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
    })

    it('disables "Previous" on the first page', () => {
      renderExplorer()

      expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled()
    })

    it('shows the next repositories on the next page', async () => {
      const { user } = renderExplorer()

      await user.click(screen.getByRole('button', { name: 'Next' }))

      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()
      expect(visibleRepositoryNames()[0]).toBe('repo-10')
    })

    it('goes back to the previous page', async () => {
      const { user } = renderExplorer()

      await user.click(screen.getByRole('button', { name: 'Next' }))
      await user.click(screen.getByRole('button', { name: 'Previous' }))

      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
      expect(visibleRepositoryNames()[0]).toBe('repo-0')
    })

    it('disables "Next" on the last page', async () => {
      const { user } = renderExplorer()

      await user.click(screen.getByRole('button', { name: 'Next' }))
      await user.click(screen.getByRole('button', { name: 'Next' }))

      expect(screen.getByText('Page 3 of 3')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Previous' })).toBeEnabled()
      expect(visibleRepositoryNames()).toHaveLength(5)
    })

    it('goes back to the first page when the language filter changes', async () => {
      const { user } = renderExplorer()

      await user.click(screen.getByRole('button', { name: 'Next' }))
      await user.click(screen.getByRole('button', { name: 'Next' }))
      expect(screen.getByText('Page 3 of 3')).toBeInTheDocument()

      await user.selectOptions(screen.getByLabelText('Language'), 'TypeScript')

      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument()
    })

    it('goes back to the first page when the sorting option changes', async () => {
      const { user } = renderExplorer()

      await user.click(screen.getByRole('button', { name: 'Next' }))
      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()

      await user.selectOptions(screen.getByLabelText('Sort by'), 'stars')

      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
    })
  })

  describe('empty list', () => {
    it('explains that the account has no repositories', () => {
      render(<RepositoryExplorer repositories={[]} />)

      expect(screen.getByText(/no public repositories/i)).toBeInTheDocument()
      expect(screen.queryByLabelText('Language')).not.toBeInTheDocument()
    })
  })
})
