import {
  CHART_VIEWBOX_HEIGHT,
  CHART_VIEWBOX_WIDTH,
  buildLanguageSegments,
  calculateSegmentGeometry,
} from '../utils/languageChart'
import type { LanguageStat } from '../types/user'

interface LanguageChartProps {
  stats: LanguageStat[]
}

/**
 * How the languages of the account are spread over the repository list.
 *
 * The bar is one SVG rectangle per language. The width of a rectangle is the
 * share of that language, and the rectangles are placed one after the other,
 * so the whole bar is the whole list.
 *
 * The widths come from the raw repository counts, and the gaps between the
 * rectangles are taken out of the available width first, so the bar fills the
 * drawing area exactly and never spills out of it.
 */
export function LanguageChart({ stats }: LanguageChartProps) {
  if (stats.length === 0) {
    return (
      <p className="text-sm text-slate-600">There is no language data to show for this account.</p>
    )
  }

  const segments = buildLanguageSegments(stats)
  const geometry = calculateSegmentGeometry(segments)
  const total = stats.reduce((sum, stat) => sum + stat.count, 0)

  const summary = segments
    .map((segment) => `${segment.label}: ${segment.count} (${segment.percentage}%)`)
    .join(', ')

  return (
    <div>
      <svg
        viewBox={`0 0 ${CHART_VIEWBOX_WIDTH} ${CHART_VIEWBOX_HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Language distribution of the ${total} repositories returned by the backend. ${summary}`}
        className="h-4 w-full"
      >
        {geometry.map(({ segment, x, width }) => (
          <rect
            key={segment.label}
            x={x}
            y={0}
            width={width}
            height={CHART_VIEWBOX_HEIGHT}
            fill={segment.color}
            rx={3}
          >
            <title>
              {`${segment.label} — ${segment.count} ${segment.count === 1 ? 'repository' : 'repositories'}, ${segment.percentage}%`}
            </title>
          </rect>
        ))}
      </svg>

      <ul className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center gap-2 text-sm">
            <span
              aria-hidden="true"
              className="h-3 w-3 shrink-0 rounded-sm"
              style={{ backgroundColor: segment.color }}
            />

            <span className="text-slate-700">{segment.label}</span>

            <span className="ml-auto tabular-nums text-slate-500">
              {segment.count.toLocaleString('en-US')}
            </span>

            <span className="w-14 text-right tabular-nums text-slate-500">
              {segment.percentage}%
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs text-slate-500">
        Based on the {total.toLocaleString()} repositories returned by the backend, which are at most
        the 100 most recently updated ones. Languages after the first seven are grouped as “Other”.
      </p>
    </div>
  )
}
