import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LanguageStats } from '../../components/LanguageStats'
import { NOT_SPECIFIED_LANGUAGE, calculateLanguageStats } from '../../utils/repositories'
import { makeManyLanguageRepositoryList } from '../fixtures/repositories'

const stats = calculateLanguageStats(makeManyLanguageRepositoryList())

describe('LanguageStats', () => {
  it('shows a row for every language', () => {
    render(<LanguageStats stats={stats} />)

    const languages = screen.getAllByRole('rowheader').map((header) => header.textContent)

    expect(languages).toHaveLength(10)
    expect(languages).toContain('TypeScript')
    expect(languages).toContain('Ruby')
    expect(languages).toContain('Shell')
  })

  it('shows the count and the percentage of every language', () => {
    render(<LanguageStats stats={stats} />)

    const row = screen.getByRole('row', { name: /TypeScript/ })

    expect(within(row).getByText('20')).toBeInTheDocument()
    expect(within(row).getByText('22.2%')).toBeInTheDocument()
  })

  it('names the repositories without a language "Not specified"', () => {
    const notSpecified = [{ language: NOT_SPECIFIED_LANGUAGE, count: 1, percentage: 100 }]

    render(<LanguageStats stats={notSpecified} />)

    expect(screen.getByRole('rowheader', { name: 'Not specified' })).toBeInTheDocument()
  })

  it('states that the figures cover the repositories returned by the backend', () => {
    render(<LanguageStats stats={stats} />)

    expect(screen.getByText(/returned by the backend/i)).toBeInTheDocument()
    expect(screen.getByText(/maximum of 100 repositories per request/i)).toBeInTheDocument()
  })

  it('says so when there is no data', () => {
    render(<LanguageStats stats={[]} />)

    expect(screen.getByText(/no language data to show/i)).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
