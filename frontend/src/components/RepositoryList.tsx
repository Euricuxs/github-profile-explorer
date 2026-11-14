import { RepositoryCard } from './RepositoryCard'
import type { Repository } from '../types/user'

interface RepositoryListProps {
  repositories: Repository[]
}

/**
 * The list of repository cards.
 *
 * The component only draws what it is given. Filtering, sorting and paging
 * happen before, in the component that owns the state, so this one stays a
 * plain list.
 */
export function RepositoryList({ repositories }: RepositoryListProps) {
  return (
    <ul className="mt-4 flex flex-col gap-3">
      {repositories.map((repository) => (
        <RepositoryCard key={repository.id} repository={repository} />
      ))}
    </ul>
  )
}
