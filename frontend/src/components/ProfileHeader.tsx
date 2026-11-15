import { Avatar } from './Avatar'
import { ProfileStats } from './ProfileStats'
import type { UserProfile } from '../types/user'

/**
 * The header of the profile page: who this account is.
 *
 * GitHub leaves the name, the bio, the company, the location and the blog
 * empty for many accounts. Those fields are rendered only when they hold a
 * value, so the page never shows an empty label.
 */
export function ProfileHeader({ profile }: { profile: UserProfile }) {
  return (
    <section
      aria-labelledby="profile-heading"
      className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <Avatar
          src={profile.avatarUrl}
          alt={`${profile.login} avatar`}
          width={96}
          height={96}
          className="h-24 w-24 shrink-0 rounded-full bg-slate-100"
        />

        <div className="min-w-0">
          <h1 id="profile-heading" className="text-2xl font-bold text-slate-900">
            {profile.name ?? profile.login}
          </h1>
          <p className="text-sm text-slate-500">@{profile.login}</p>

          {profile.bio ? <p className="mt-3 text-slate-700">{profile.bio}</p> : null}

          <dl className="mt-3 flex flex-col gap-1 text-sm text-slate-600">
            {profile.company ? (
              <div className="flex gap-2">
                <dt className="font-medium text-slate-500">Company</dt>
                <dd>{profile.company}</dd>
              </div>
            ) : null}

            {profile.location ? (
              <div className="flex gap-2">
                <dt className="font-medium text-slate-500">Location</dt>
                <dd>{profile.location}</dd>
              </div>
            ) : null}

            {profile.blog ? (
              <div className="flex gap-2">
                <dt className="font-medium text-slate-500">Blog</dt>
                <dd>
                  <a
                    href={profile.blog}
                    target="_blank"
                    rel="noreferrer"
                    className="focus-ring rounded-sm text-slate-900 underline underline-offset-4 hover:text-slate-600"
                  >
                    {profile.blog}
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>

      <ProfileStats
        followers={profile.followers}
        following={profile.following}
        publicRepos={profile.publicRepos}
      />

      <a
        href={profile.profileUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={`View ${profile.login} on GitHub`}
        className="focus-ring mt-6 inline-block rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 transition hover:border-slate-900"
      >
        View on GitHub
      </a>
    </section>
  )
}
