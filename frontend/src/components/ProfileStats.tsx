interface ProfileStatsProps {
  followers: number
  following: number
  publicRepos: number
}

/**
 * The three numbers that summarise an account.
 *
 * They come from the profile endpoint, which reports the totals of the
 * account. The repository list below is a different, capped source, so the
 * two must not be mixed up.
 */
export function ProfileStats({ followers, following, publicRepos }: ProfileStatsProps) {
  const stats = [
    { label: 'Followers', value: followers },
    { label: 'Following', value: following },
    { label: 'Public repos', value: publicRepos },
  ]

  return (
    <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-slate-100 pt-4">
      {stats.map((stat) => (
        <div key={stat.label}>
          <dt className="text-xs text-slate-500 sm:text-sm">{stat.label}</dt>
          <dd className="text-lg font-semibold text-slate-900">
            {stat.value.toLocaleString('en-US')}
          </dd>
        </div>
      ))}
    </dl>
  )
}
