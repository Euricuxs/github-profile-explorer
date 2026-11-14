import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LanguageChart } from '../../components/LanguageChart'
import { LanguageStats } from '../../components/LanguageStats'
import {
  CHART_OTHER_COLOR,
  CHART_SEGMENT_GAP,
  CHART_VIEWBOX_WIDTH,
} from '../../utils/languageChart'
import { calculateLanguageStats } from '../../utils/repositories'
import { makeManyLanguageRepositoryList } from '../fixtures/repositories'

const stats = calculateLanguageStats(makeManyLanguageRepositoryList())

/** The rectangles of the bar, with the numbers the SVG was given. */
function rectangles(container: HTMLElement) {
  return [...container.querySelectorAll('rect')].map((rect) => ({
    x: Number(rect.getAttribute('x')),
    width: Number(rect.getAttribute('width')),
    fill: rect.getAttribute('fill'),
  }))
}

describe('LanguageChart', () => {
  it('draws one rectangle per slice', () => {
    const { container } = render(<LanguageChart stats={stats} />)

    // Seven languages with their own slice, plus the folded remainder.
    expect(rectangles(container)).toHaveLength(8)
  })

  it('gives every rectangle a width that matches its share of the count', () => {
    const { container } = render(<LanguageChart stats={stats} />)

    const rects = rectangles(container)

    // TypeScript has 20 of the 90 repositories, Python has 15.
    expect(rects[0].width / rects[1].width).toBeCloseTo(20 / 15, 5)
  })

  it('keeps every rectangle inside the drawing area', () => {
    const { container } = render(<LanguageChart stats={stats} />)

    const rects = rectangles(container)
    const last = rects.at(-1)

    for (const rect of rects) {
      expect(rect.x).toBeGreaterThanOrEqual(0)
      expect(rect.x + rect.width).toBeLessThanOrEqual(CHART_VIEWBOX_WIDTH + 0.000001)
    }

    expect((last?.x ?? 0) + (last?.width ?? 0)).toBeCloseTo(CHART_VIEWBOX_WIDTH, 6)
  })

  it('fills the drawing area exactly, gaps included', () => {
    const { container } = render(<LanguageChart stats={stats} />)

    const rects = rectangles(container)
    const widths = rects.reduce((sum, rect) => sum + rect.width, 0)

    expect(widths + CHART_SEGMENT_GAP * (rects.length - 1)).toBeCloseTo(CHART_VIEWBOX_WIDTH, 6)
  })

  it('shows the first seven languages as their own slice', () => {
    render(<LanguageChart stats={stats} />)

    for (const language of ['TypeScript', 'Python', 'JavaScript', 'Java', 'Go', 'Rust', 'C#']) {
      expect(screen.getByText(language)).toBeInTheDocument()
    }
  })

  it('groups the remaining languages into "Other"', () => {
    const { container } = render(<LanguageChart stats={stats} />)

    expect(screen.getByText('Other (3 languages)')).toBeInTheDocument()
    expect(screen.queryByText('Ruby')).not.toBeInTheDocument()

    const rects = rectangles(container)

    expect(rects.at(-1)?.fill).toBe(CHART_OTHER_COLOR)
  })

  it('shows the count and the percentage of every slice in the legend', () => {
    render(<LanguageChart stats={stats} />)

    expect(screen.getByText('22.2%')).toBeInTheDocument()
    expect(screen.getByText('20')).toBeInTheDocument()
    // JavaScript and the "Other" slice both cover 12 of the 90 repositories.
    expect(screen.getAllByText('13.3%')).toHaveLength(2)
  })

  it('describes the distribution for screen readers', () => {
    render(<LanguageChart stats={stats} />)

    const chart = screen.getByRole('img', { name: /language distribution/i })

    expect(chart.getAttribute('aria-label')).toContain('TypeScript')
    expect(chart.getAttribute('aria-label')).toContain('Other (3 languages)')
  })

  it('says that the chart is based on the repositories of the backend', () => {
    render(<LanguageChart stats={stats} />)

    expect(screen.getByText(/repositories returned by the backend/i)).toBeInTheDocument()
    expect(screen.getByText(/at most the 100 most recently updated ones/i)).toBeInTheDocument()
  })

  it('says so when there is no data', () => {
    render(<LanguageChart stats={[]} />)

    expect(screen.getByText(/no language data to show/i)).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})

describe('LanguageChart and LanguageStats together', () => {
  it('shows the first seven languages in the chart and every language in the table', () => {
    const { container } = render(
      <>
        <LanguageChart stats={stats} />
        <LanguageStats stats={stats} />
      </>,
    )

    expect(rectangles(container)).toHaveLength(8)
    expect(screen.getByText('Other (3 languages)')).toBeInTheDocument()

    const languages = screen.getAllByRole('rowheader').map((header) => header.textContent)

    expect(languages).toHaveLength(10)
    expect(languages).toContain('Ruby')
    expect(languages).toContain('PHP')
    expect(languages).toContain('Shell')
  })
})
