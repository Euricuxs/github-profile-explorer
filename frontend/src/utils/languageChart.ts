import type { LanguageStat } from '../types/user'

/**
 * How many languages get their own slice in the chart.
 *
 * A categorical palette has a hard limit: past eight hues the colours stop
 * being tellable apart, especially for readers with a colour vision
 * deficiency. The languages beyond this number are folded into a single
 * neutral "Other" slice instead of inventing more colours.
 *
 * The statistics table still lists every language on its own, so nothing is
 * hidden by the chart.
 */
export const CHART_TOP_LANGUAGES = 7

/**
 * The categorical palette, in the order it was validated.
 *
 * The order is part of the safety: neighbouring slices are the ones that sit
 * next to each other in the bar, and this order keeps those pairs apart for
 * readers with a colour vision deficiency.
 */
export const CHART_COLORS: readonly string[] = [
  '#2a78d6', // blue
  '#eb6834', // orange
  '#1baf7a', // aqua
  '#eda100', // yellow
  '#e87ba4', // magenta
  '#008300', // green
  '#6250d6', // violet
]

/**
 * The colour of the "Other" slice.
 *
 * It is a neutral grey on purpose: "Other" is not a language, it is the
 * remainder of the list, and it must not look like one of the real ones.
 */
export const CHART_OTHER_COLOR = '#c3c2b7'

/** The width of the drawing area of the chart, in SVG units. */
export const CHART_VIEWBOX_WIDTH = 1000

/**
 * The height of the bar, in SVG units.
 *
 * The number is a design choice, not a free parameter: together with the
 * width it decides the shape of the bar. The drawing area is scaled to the
 * width of the page and never stretched in one direction only, so this ratio
 * is the ratio of the bar on the screen as well. A bar that is 22 units
 * high in a drawing area of 1000 units is about 16 pixels high on a wide
 * screen and about 7 pixels high on a narrow one.
 */
export const CHART_VIEWBOX_HEIGHT = 22

/**
 * The radius of the rounded corners of a slice, in SVG units.
 *
 * Because the whole drawing area is scaled in the same way in both
 * directions, the corners stay round at every width.
 */
export const CHART_CORNER_RADIUS = 4

/**
 * The empty space between two slices, in SVG units.
 *
 * The gap is taken out of the width that is available for the slices, so the
 * bar still ends exactly at the right edge of the drawing area.
 */
export const CHART_SEGMENT_GAP = 3

/** One slice of the chart. */
export interface LanguageSegment {
  /** The language name, or a label describing the folded remainder. */
  label: string
  /** How many repositories the slice stands for. */
  count: number
  /** The share of the list, rounded for display. */
  percentage: number
  /** The fill colour of the slice. */
  color: string
  /** Whether this slice is the folded remainder instead of a real language. */
  isOther: boolean
}

/** One slice with the place it takes in the bar. */
export interface SegmentGeometry {
  segment: LanguageSegment
  /** The left edge of the slice, in SVG units. */
  x: number
  /** The width of the slice, in SVG units. */
  width: number
}

/**
 * Turns the statistics into the slices of the chart.
 *
 * The first languages keep their own slice; everything after them is folded
 * into a single "Other" slice that carries their combined count.
 */
export function buildLanguageSegments(
  stats: LanguageStat[],
  maxLanguages: number = CHART_TOP_LANGUAGES,
): LanguageSegment[] {
  if (stats.length === 0) {
    return []
  }

  const total = stats.reduce((sum, stat) => sum + stat.count, 0)
  const shown = stats.slice(0, maxLanguages)
  const rest = stats.slice(maxLanguages)

  const segments: LanguageSegment[] = shown.map((stat, index) => ({
    label: stat.language,
    count: stat.count,
    percentage: stat.percentage,
    color: CHART_COLORS.at(index) ?? CHART_OTHER_COLOR,
    isOther: false,
  }))

  if (rest.length > 0) {
    const count = rest.reduce((sum, stat) => sum + stat.count, 0)

    segments.push({
      label: `Other (${rest.length} ${rest.length === 1 ? 'language' : 'languages'})`,
      count,
      percentage: Math.round((count / total) * 1000) / 10,
      color: CHART_OTHER_COLOR,
      isOther: true,
    })
  }

  return segments
}

/**
 * Places the slices next to each other in the bar.
 *
 * The widths come from the raw repository counts, never from the rounded
 * percentages: rounding would make the slices add up to slightly more or
 * slightly less than the full width, and the bar would overflow the drawing
 * area or leave a hole in it.
 *
 * The gaps come out of the available width first, so the slices fill the
 * whole area exactly: the last slice ends at the right edge.
 */
export function calculateSegmentGeometry(
  segments: LanguageSegment[],
  viewBoxWidth: number = CHART_VIEWBOX_WIDTH,
  gap: number = CHART_SEGMENT_GAP,
): SegmentGeometry[] {
  const total = segments.reduce((sum, segment) => sum + segment.count, 0)

  if (total === 0 || segments.length === 0) {
    return []
  }

  const availableWidth = viewBoxWidth - gap * (segments.length - 1)
  let x = 0

  return segments.map((segment) => {
    const width = (segment.count / total) * availableWidth
    const geometry = { segment, x, width }

    x += width + gap

    return geometry
  })
}
