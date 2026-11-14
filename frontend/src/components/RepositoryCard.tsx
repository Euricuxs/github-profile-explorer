import type { Repository } from '../types/user'

const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' })

interface RepositoryCardProps {
  repository: Repository
}

/**
 * One repository: its name, what it is for, and how popular it is.
 *
 * A repository without a description and without a detected language is
 * normal, so both fall back to something readable instead of leaving a hole
 * in the card.
 */
export function RepositoryCard({ repository }: RepositoryCardProps) {
  return (
    <li className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-base font-semibold text-slate-900">
          <a
            href={repository.url}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 hover:text-slate-600"
          >
            {repository.name}
          </a>
        </h3>

        {repository.language ? (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
            {repository.language}
          </span>
        ) : null}
      </div>

      <p className="mt-2 text-sm text-slate-600">
        {repository.description ?? 'No description provided.'}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <span aria-hidden="true">★</span>
          <span className="sr-only">Stars:</span>
          {repository.stargazersCount.toLocaleString('en-US')}
        </span>

        <span className="inline-flex items-center gap-1">
          <span aria-hidden="true">⑂</span>
          <span className="sr-only">Forks:</span>
          {repository.forksCount.toLocaleString('en-US')}
        </span>

        <span>Updated {dateFormatter.format(new Date(repository.updatedAt))}</span>
      </div>
    </li>
  )
}
