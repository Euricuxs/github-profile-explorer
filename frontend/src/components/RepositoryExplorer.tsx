import { useState } from 'react'
import { RepositoriesEmptyState, RepositoriesFilteredEmptyState } from './ProfileStates'
import { RepositoryFilters } from './RepositoryFilters'
import { RepositoryList } from './RepositoryList'
import { RepositoryPagination } from './RepositoryPagination'
import {
  ALL_LANGUAGES,
  REPOSITORIES_PER_PAGE,
  filterRepositoriesByLanguage,
  getLanguageOptions,
  getPageCount,
  paginateRepositories,
  sortRepositories,
} from '../utils/repositories'
import type { Repository, RepositorySort } from '../types/user'

/**
 * GitHub serves at most 100 repositories per request, and the backend asks
 * for exactly that many. Reaching the limit means the list may be incomplete;
 * it does not mean the account has exactly 100 repositories.
 */
const REPOSITORY_LIMIT = 100

interface RepositoryExplorerProps {
  repositories: Repository[]
}

/**
 * The repository list with its filter, its order and its pages.
 *
 * The three controls are three pieces of state, and everything that is shown
 * is derived from them on every render:
 *
 * filter -> sort -> page -> the ten repositories on screen
 *
 * The order matters. Filtering first keeps the list small, sorting then puts
 * the wanted repositories at the top, and the page is taken last so that the
 * first page shows the best match of the chosen filter and order.
 *
 * The page is reset whenever the filter or the order changes, because a
 * filter that leaves fewer repositories would otherwise keep the old page
 * number and show nothing.
 */
export function RepositoryExplorer({ repositories }: RepositoryExplorerProps) {
  const [language, setLanguage] = useState<string>(ALL_LANGUAGES)
  const [sort, setSort] = useState<RepositorySort>('updated')
  const [page, setPage] = useState(1)

  if (repositories.length === 0) {
    return <RepositoriesEmptyState />
  }

  const languageOptions = getLanguageOptions(repositories)
  const filtered = filterRepositoriesByLanguage(repositories, language)
  const sorted = sortRepositories(filtered, sort)
  const totalPages = getPageCount(sorted.length, REPOSITORIES_PER_PAGE)

  // The page can be beyond the end of the list when the data itself changed
  // (a new fetch with fewer repositories). Clamping keeps the list visible.
  const currentPage = Math.min(page, totalPages)
  const visible = paginateRepositories(sorted, currentPage, REPOSITORIES_PER_PAGE)

  function handleLanguageChange(value: string) {
    setLanguage(value)
    setPage(1)
  }

  function handleSortChange(value: string) {
    setSort(value === 'stars' ? 'stars' : 'updated')
    setPage(1)
  }

  const reachedLimit = repositories.length >= REPOSITORY_LIMIT

  return (
    <>
      <RepositoryFilters
        options={languageOptions}
        language={language}
        sort={sort}
        onLanguageChange={handleLanguageChange}
        onSortChange={handleSortChange}
      />

      <p className="mt-4 text-sm text-slate-600">
        {sorted.length.toLocaleString()}{' '}
        {sorted.length === 1 ? 'repository' : 'repositories'} shown
      </p>

      {reachedLimit ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          The GitHub API returns at most {REPOSITORY_LIMIT} repositories per request, so this list
          covers only the {REPOSITORY_LIMIT} most recently updated repositories of this account.
          Other repositories of this account are not included here.
        </p>
      ) : null}

      {sorted.length === 0 ? (
        <RepositoriesFilteredEmptyState />
      ) : (
        <RepositoryList repositories={visible} />
      )}

      {totalPages > 1 ? (
        <RepositoryPagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
      ) : null}
    </>
  )
}
