import { RepositoriesEmptyState } from './ProfileStates'
import { RepositoryCard } from './RepositoryCard'
import type { Repository } from '../types/user'

/**
 * GitHub serves at most 100 repositories per request, and the backend asks
 * for exactly that many. Reaching the limit means the list may be incomplete;
 * it does not mean the account has exactly 100 repositories.
 */
const REPOSITORY_LIMIT = 100

interface RepositoryListProps {
  repositories: Repository[]
}

/**
 * The list of repositories of one account.
 */
export function RepositoryList({ repositories }: RepositoryListProps) {
  if (repositories.length === 0) {
    return <RepositoriesEmptyState />
  }

  const reachedLimit = repositories.length >= REPOSITORY_LIMIT

  return (
    <>
      <p className="text-sm text-slate-600">
        {repositories.length.toLocaleString()}{' '}
        {repositories.length === 1 ? 'repository' : 'repositories'} shown
      </p>

      {reachedLimit ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          The GitHub API returns at most {REPOSITORY_LIMIT} repositories per request, so this list
          shows only the {REPOSITORY_LIMIT} most recently updated ones. Other repositories of this
          account are not included here.
        </p>
      ) : null}

      <ul className="mt-4 flex flex-col gap-3">
        {repositories.map((repository) => (
          <RepositoryCard key={repository.id} repository={repository} />
        ))}
      </ul>
    </>
  )
}
