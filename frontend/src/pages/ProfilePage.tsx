import { Link, useParams, useSearchParams } from 'react-router'
import { ProfileHeader } from '../components/ProfileHeader'
import { RepositoryList } from '../components/RepositoryList'
import {
  ProfileErrorState,
  ProfileLoadingState,
  RepositoriesErrorState,
  RepositoriesLoadingState,
} from '../components/ProfileStates'
import { getErrorMessage } from '../api/errors'
import { useUserProfile } from '../hooks/useUserProfile'
import { useUserRepositories } from '../hooks/useUserRepositories'

/**
 * The profile page of one GitHub account.
 *
 * The username comes from the URL (`/users/:username`), which makes the page
 * linkable and refreshable. The search term that led here travels in the
 * `q` parameter, so "Back to Search" can restore the previous results.
 */
export function ProfilePage() {
  const { username = '' } = useParams()
  const [searchParams] = useSearchParams()

  const profile = useUserProfile(username)
  const repositories = useUserRepositories(username)

  const query = searchParams.get('q') ?? ''
  const backToSearch = query.length > 0 ? `/?q=${encodeURIComponent(query)}` : '/'

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        to={backToSearch}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 underline underline-offset-4 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
      >
        <span aria-hidden="true">←</span> Back to Search
      </Link>

      <div className="mt-6">
        {profile.isPending ? <ProfileLoadingState /> : null}

        {profile.isError ? (
          <ProfileErrorState
            message={getErrorMessage(profile.error)}
            onRetry={() => void profile.refetch()}
          />
        ) : null}

        {profile.data ? <ProfileHeader profile={profile.data} /> : null}
      </div>

      <section aria-labelledby="repositories-heading" className="mt-10">
        <h2 id="repositories-heading" className="text-lg font-bold text-slate-900">
          Repositories
        </h2>

        <div className="mt-4">
          {repositories.isPending ? <RepositoriesLoadingState /> : null}

          {repositories.isError ? (
            <RepositoriesErrorState
              message={getErrorMessage(repositories.error)}
              onRetry={() => void repositories.refetch()}
            />
          ) : null}

          {repositories.data ? <RepositoryList repositories={repositories.data} /> : null}
        </div>
      </section>
    </main>
  )
}
