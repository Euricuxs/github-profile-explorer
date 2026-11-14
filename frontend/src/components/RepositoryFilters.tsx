import { ALL_LANGUAGES } from '../utils/repositories'
import type { LanguageOption } from '../utils/repositories'
import type { RepositorySort } from '../types/user'

interface RepositoryFiltersProps {
  options: LanguageOption[]
  language: string
  sort: RepositorySort
  onLanguageChange: (value: string) => void
  onSortChange: (value: string) => void
}

/**
 * The two controls that change what the repository list shows.
 *
 * The component only reports what the user picked; deciding what that means
 * is the job of the component that owns the state.
 */
export function RepositoryFilters({
  options,
  language,
  sort,
  onLanguageChange,
  onSortChange,
}: RepositoryFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="flex flex-col gap-1">
        <label htmlFor="language-filter" className="text-xs font-medium text-slate-500">
          Language
        </label>

        <select
          id="language-filter"
          value={language}
          onChange={(event) => onLanguageChange(event.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
        >
          <option value={ALL_LANGUAGES}>All Languages</option>

          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="sort-order" className="text-xs font-medium text-slate-500">
          Sort by
        </label>

        <select
          id="sort-order"
          value={sort}
          onChange={(event) => onSortChange(event.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
        >
          <option value="updated">Recently Updated</option>
          <option value="stars">Most Stars</option>
        </select>
      </div>
    </div>
  )
}
