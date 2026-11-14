import type { LanguageStat } from '../types/user'

interface LanguageStatsProps {
  stats: LanguageStat[]
}

/**
 * The languages of the account and how much of the list each one covers.
 *
 * The table lists every language, including the ones that are too many for
 * the chart. The percentages are shares of the repositories that the backend
 * returned, which is at most 100 repositories per request.
 */
export function LanguageStats({ stats }: LanguageStatsProps) {
  if (stats.length === 0) {
    return (
      <p className="text-sm text-slate-600">There is no language data to show for this account.</p>
    )
  }

  const total = stats.reduce((sum, stat) => sum + stat.count, 0)

  return (
    <>
      <p className="text-sm text-slate-600">
        These figures cover the {total.toLocaleString()} repositories returned by the backend. The
        GitHub API returns a maximum of 100 repositories per request, so they describe the
        repositories shown above and not necessarily every public repository of this account.
      </p>

      <table className="mt-4 w-full text-left text-sm">
        <caption className="sr-only">
          Repository count and share per programming language
        </caption>

        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <th scope="col" className="py-2 pr-4 font-medium">
              Language
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              Repositories
            </th>
            <th scope="col" className="py-2 font-medium">
              Share
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {stats.map((stat) => (
            <tr key={stat.language}>
              <th scope="row" className="py-2 pr-4 font-medium text-slate-900">
                {stat.language}
              </th>
              <td className="py-2 pr-4 tabular-nums text-slate-700">
                {stat.count.toLocaleString('en-US')}
              </td>
              <td className="py-2 tabular-nums text-slate-700">{stat.percentage}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
