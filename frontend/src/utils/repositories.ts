import type { LanguageStat, Repository, RepositorySort } from '../types/user'

/**
 * The value of the language filter that means "show every language".
 *
 * It is a value of its own instead of an empty string so that the filter
 * always has a selection, and so that a language can never be confused with
 * "no filter chosen".
 */
export const ALL_LANGUAGES = 'all'

/**
 * How repositories without a detected language are named everywhere.
 *
 * GitHub leaves `language` as `null` for repositories it cannot classify, so
 * the application needs one name for that case. Using the same name in the
 * filter, in the statistics and in the chart keeps the three in sync.
 */
export const NOT_SPECIFIED_LANGUAGE = 'Not specified'

/** How many repositories one page of the list shows. */
export const REPOSITORIES_PER_PAGE = 10

/** One choice of the language filter. */
export interface LanguageOption {
  /** The value the filter works with. */
  value: string
  /** The text shown in the dropdown, including how many repositories it has. */
  label: string
  /** How many repositories have this language. */
  count: number
}

/**
 * The languages that occur in the given repositories.
 *
 * The options come from the data instead of from a hard-coded list, so the
 * dropdown only ever offers languages that actually exist for this account.
 * Repositories without a language are offered as "Not specified".
 */
export function getLanguageOptions(repositories: Repository[]): LanguageOption[] {
  const counts = new Map<string, number>()

  for (const repository of repositories) {
    const language = repository.language ?? NOT_SPECIFIED_LANGUAGE
    counts.set(language, (counts.get(language) ?? 0) + 1)
  }

  return [...counts.entries()]
    .map(([value, count]) => ({ value, label: `${value} (${count})`, count }))
    .toSorted((a, b) => a.value.localeCompare(b.value))
}

/**
 * Keeps only the repositories of one language.
 *
 * The array that comes from the query is never changed: `filter` returns a new
 * array, and the "all languages" case returns the input untouched, which is
 * safe because nothing downstream writes to it either.
 */
export function filterRepositoriesByLanguage(
  repositories: Repository[],
  language: string,
): Repository[] {
  if (language === ALL_LANGUAGES) {
    return repositories
  }

  return repositories.filter(
    (repository) => (repository.language ?? NOT_SPECIFIED_LANGUAGE) === language,
  )
}

/**
 * Orders the repositories.
 *
 * `toSorted` returns a new array and leaves the input alone. That matters
 * here: the array belongs to the query cache, and a cached array that is
 * sorted in place would be reordered for every other consumer as well.
 *
 * Repositories that compare equal keep a stable order, so the list never
 * shuffles between two renders of the same data.
 */
export function sortRepositories(
  repositories: Repository[],
  sort: RepositorySort,
): Repository[] {
  return repositories.toSorted((a, b) => {
    if (sort === 'stars') {
      return (
        b.stargazersCount - a.stargazersCount ||
        Date.parse(b.updatedAt) - Date.parse(a.updatedAt) ||
        a.name.localeCompare(b.name)
      )
    }

    return (
      Date.parse(b.updatedAt) - Date.parse(a.updatedAt) ||
      b.stargazersCount - a.stargazersCount ||
      a.name.localeCompare(b.name)
    )
  })
}

/**
 * The slice of repositories that belongs to one page.
 *
 * `slice` stops at the end of the array, so the last page is shorter when
 * the list does not divide evenly.
 */
export function paginateRepositories(
  repositories: Repository[],
  page: number,
  pageSize: number,
): Repository[] {
  const start = (page - 1) * pageSize
  return repositories.slice(start, start + pageSize)
}

/**
 * How many pages a list of this length needs.
 *
 * An empty list still has one (empty) page, so the controls never show
 * "page 1 of 0".
 */
export function getPageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize))
}

/**
 * Groups the repositories by language and counts them.
 *
 * The percentage is the share of the given repositories, rounded to one
 * decimal for display. Because the values are rounded, they can add up to
 * 99.9 % or 100.1 %; that is expected. The chart uses the raw counts instead,
 * so its geometry is exact.
 */
export function calculateLanguageStats(repositories: Repository[]): LanguageStat[] {
  if (repositories.length === 0) {
    return []
  }

  const counts = new Map<string, number>()

  for (const repository of repositories) {
    const language = repository.language ?? NOT_SPECIFIED_LANGUAGE
    counts.set(language, (counts.get(language) ?? 0) + 1)
  }

  const total = repositories.length

  return [...counts.entries()]
    .map(([language, count]) => ({
      language,
      count,
      percentage: Math.round((count / total) * 1000) / 10,
    }))
    .toSorted((a, b) => b.count - a.count || a.language.localeCompare(b.language))
}
