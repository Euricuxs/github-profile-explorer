import { describe, expect, it } from 'vitest'
import {
  CHART_OTHER_COLOR,
  CHART_SEGMENT_GAP,
  CHART_TOP_LANGUAGES,
  CHART_VIEWBOX_WIDTH,
  buildLanguageSegments,
  calculateSegmentGeometry,
} from '../../utils/languageChart'
import { calculateLanguageStats } from '../../utils/repositories'
import { makeManyLanguageRepositoryList } from '../fixtures/repositories'

const stats = calculateLanguageStats(makeManyLanguageRepositoryList())

describe('buildLanguageSegments', () => {
  it('keeps the first languages as their own slice', () => {
    const segments = buildLanguageSegments(stats)

    expect(segments).toHaveLength(CHART_TOP_LANGUAGES + 1)
    expect(segments.slice(0, CHART_TOP_LANGUAGES).map((segment) => segment.label)).toEqual([
      'TypeScript',
      'Python',
      'JavaScript',
      'Java',
      'Go',
      'Rust',
      'C#',
    ])
  })

  it('folds the remaining languages into one "Other" slice', () => {
    const other = buildLanguageSegments(stats).at(-1)

    expect(other?.label).toBe('Other (3 languages)')
    expect(other?.isOther).toBe(true)
    expect(other?.count).toBe(12)
    expect(other?.color).toBe(CHART_OTHER_COLOR)
  })

  it('does not create an "Other" slice when every language fits', () => {
    const segments = buildLanguageSegments(stats.slice(0, 3))

    expect(segments).toHaveLength(3)
    expect(segments.some((segment) => segment.isOther)).toBe(false)
  })

  it('names the folded remainder in the singular when it holds one language', () => {
    const segments = buildLanguageSegments(stats.slice(0, 8))

    expect(segments.at(-1)?.label).toBe('Other (1 language)')
  })

  it('returns nothing for an empty list', () => {
    expect(buildLanguageSegments([])).toEqual([])
  })
})

describe('calculateSegmentGeometry', () => {
  const segments = buildLanguageSegments(stats)
  const geometry = calculateSegmentGeometry(segments)

  it('gives every segment a width that matches its share of the count', () => {
    const typeScript = geometry[0]
    const python = geometry[1]

    expect(typeScript.width / python.width).toBeCloseTo(20 / 15, 5)
  })

  it('takes the gaps out of the available width, so the bar fills the area', () => {
    const widths = geometry.reduce((sum, item) => sum + item.width, 0)
    const gaps = CHART_SEGMENT_GAP * (geometry.length - 1)

    expect(widths + gaps).toBeCloseTo(CHART_VIEWBOX_WIDTH, 6)
  })

  it('keeps every segment inside the drawing area', () => {
    for (const item of geometry) {
      expect(item.x).toBeGreaterThanOrEqual(0)
      expect(item.x + item.width).toBeLessThanOrEqual(CHART_VIEWBOX_WIDTH + 0.000001)
    }
  })

  it('ends the last segment at the right edge', () => {
    const last = geometry.at(-1)

    expect(last).toBeDefined()
    expect((last?.x ?? 0) + (last?.width ?? 0)).toBeCloseTo(CHART_VIEWBOX_WIDTH, 6)
  })

  it('uses the raw counts instead of the rounded percentages', () => {
    // Three languages with one repository each: 33.3 % each would add up to
    // 99.9 % and leave a hole in the bar.
    const equalSegments = buildLanguageSegments([
      { language: 'A', count: 1, percentage: 33.3 },
      { language: 'B', count: 1, percentage: 33.3 },
      { language: 'C', count: 1, percentage: 33.3 },
    ])

    const equalGeometry = calculateSegmentGeometry(equalSegments)
    const widths = equalGeometry.reduce((sum, item) => sum + item.width, 0)

    expect(widths + CHART_SEGMENT_GAP * (equalGeometry.length - 1)).toBeCloseTo(
      CHART_VIEWBOX_WIDTH,
      6,
    )
    expect(equalGeometry[0].width).toBeCloseTo(equalGeometry[2].width, 6)
  })

  it('returns nothing when there is no data', () => {
    expect(calculateSegmentGeometry([])).toEqual([])
  })
})
