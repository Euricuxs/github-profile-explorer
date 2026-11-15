import { Link } from 'react-router'
import { Avatar } from './Avatar'
import type { UserSearchResult } from '../types/user'

interface UserResultCardProps {
  user: UserSearchResult
  query: string
}

/**
 * One row of the result list: avatar, username, account type and a link to
 * the public GitHub profile.
 *
 * The username leads to the profile page of this application. The search term
 * travels in the URL as well, so the user can come back to the same results
 * from there.
 */
export function UserResultCard({ user, query }: UserResultCardProps) {
  return (
    <li className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm">
      <Link
        to={`/users/${encodeURIComponent(user.login)}?q=${encodeURIComponent(query)}`}
        aria-label={`View ${user.login}'s profile`}
        className="focus-ring flex min-w-0 items-center gap-4 rounded-sm"
      >
        <Avatar
          src={user.avatarUrl}
          alt={`${user.login} avatar`}
          width={48}
          height={48}
          loading="lazy"
          className="h-12 w-12 shrink-0 rounded-full bg-slate-100"
        />

        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">{user.login}</p>
          <p className="text-sm text-slate-500">{user.type}</p>
        </div>
      </Link>

      {/* The aria-label names the link after the person it points to, which
          a screen reader needs to tell two identical "View profile" links
          apart. */}
      <a
        href={user.profileUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={`View profile of ${user.login} on GitHub`}
        className="focus-ring ml-auto shrink-0 rounded-sm text-sm font-medium text-slate-900 underline underline-offset-4 hover:text-slate-600"
      >
        View profile
      </a>
    </li>
  )
}
