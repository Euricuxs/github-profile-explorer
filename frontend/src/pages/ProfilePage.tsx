import { Link, useParams, useSearchParams } from 'react-router'
import { ProfileHeader } from '../components/ProfileHeader'
import { RepositoryExplorer } from '../components/RepositoryExplorer'
import { LanguageStats } from '../components/LanguageStats'
import { LanguageChart } from '../components/LanguageChart'
import {
  ProfileErrorState,
  ProfileLoadingState,
  RepositoriesErrorState,
  RepositoriesLoadingState,
} from '../components/ProfileStates'
import { getErrorMessage } from '../api/errors'
import { usePageMeta } from '../hooks/usePageMeta'
import { useUserProfile } from '../hooks/useUserProfile'
import { useUserRepositories } from '../hooks/useUserRepositories'
import { calculateLanguageStats } from '../utils/repositories'

/**
 * The profile page of one GitHub account.
 *
 * The username comes from the URL (`/users/:username`), which makes the page
 * linkable and refreshable. The search term that led here travels in the
 * `q` parameter, so "Back to Search" can restore the previous results.
 *
 * The language statistics are built from the same repositories the list
 * shows, so the two always describe the same data.
 */
export function ProfilePage() {
  const { username = '' } = useParams()
  const [searchParams] = useSearchParams()

  const profile = useUserProfile(username)
  const repositoriesQuery = useUserRepositories(username)

  const query = searchParams.get('q') ?? ''
  const backToSearch = query.length > 0 ? `/?q=${encodeURIComponent(query)}` : '/'

  const repositories = repositoriesQuery.data
  const languageStats = repositories ? calculateLanguageStats(repositories) : []

  // When the profile itself cannot be loaded, the account most likely does
  // not exist. The repository request fails for the same reason, so showing
  // its error as well would repeat the same message twice.
  const profileFailed = profile.isError

  usePageMeta({
    title: profile.data
      ? `${profile.data.name ?? profile.data.login} · GitHub Profile Explorer`
      : 'GitHub Profile Explorer',
    description:
      profile.data?.bio ??
      `Public profile, repositories and language statistics of ${username} on GitHub.`,
  })

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        to={backToSearch}
        className="focus-ring inline-flex items-center gap-2 text-sm font-medium text-slate-600 underline underline-offset-4 hover:text-slate-900"
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

      {profileFailed ? null : (
        <section aria-labelledby="repositories-heading" className="mt-10">
          <h2 id="repositories-heading" className="text-lg font-bold text-slate-900">
            Repositories
          </h2>

          <div className="mt-4">
            {repositoriesQuery.isPending ? <RepositoriesLoadingState /> : null}

            {repositoriesQuery.isError ? (
              <RepositoriesErrorState
                message={getErrorMessage(repositoriesQuery.error)}
                onRetry={() => void repositoriesQuery.refetch()}
              />
            ) : null}

            {repositories ? <RepositoryExplorer repositories={repositories} /> : null}
          </div>
        </section>
      )}

      {repositories && repositories.length > 0 ? (
        <section aria-labelledby="languages-heading" className="mt-10">
          <h2 id="languages-heading" className="text-lg font-bold text-slate-900">
            Language statistics
          </h2>

          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <LanguageStats stats={languageStats} />

            <h3 className="mt-8 border-t border-slate-100 pt-6 text-sm font-bold text-slate-900">
              Language distribution
            </h3>

            <div className="mt-4">
              <LanguageChart stats={languageStats} />
            </div>
          </div>
        </section>
      ) : null}
    </main>
  )
}
