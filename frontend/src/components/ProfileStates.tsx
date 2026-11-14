/**
 * The states of the profile page that are not content.
 *
 * They mirror the search page states, but the profile and the repository list
 * fail independently, so each one needs its own message.
 */

/** Shown while the profile request is in flight. */
export function ProfileLoadingState() {
  return (
    <div role="status" className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center">
      <p className="text-base font-medium text-slate-900">Loading profile&hellip;</p>
      <p className="mt-1 text-sm text-slate-600">Contacting the GitHub API through our backend.</p>
    </div>
  )
}

/** Shown while the repository request is in flight. */
export function RepositoriesLoadingState() {
  return (
    <div role="status" className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center">
      <p className="text-base font-medium text-slate-900">Loading repositories&hellip;</p>
      <p className="mt-1 text-sm text-slate-600">
        Fetching the public repositories of this account.
      </p>
    </div>
  )
}

/** Shown when the user has no public repositories. */
export function RepositoriesEmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
      <p className="text-base font-medium text-slate-900">No public repositories</p>
      <p className="mt-1 text-sm text-slate-600">
        This account does not have any public repository to show.
      </p>
    </div>
  )
}

/** Shown when the account has repositories, but none in the chosen language. */
export function RepositoriesFilteredEmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
      <p className="text-base font-medium text-slate-900">No matching repositories</p>
      <p className="mt-1 text-sm text-slate-600">
        None of the repositories of this account use the selected language. Choose another
        language to see the rest.
      </p>
    </div>
  )
}

/**
 * The shared shape of the two error boxes. The title says which part of the
 * page failed, so the user knows whether the profile or the list is missing.
 */
function ErrorBox({
  title,
  message,
  onRetry,
}: {
  title: string
  message: string
  onRetry: () => void
}) {
  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-6 py-8 text-center">
      <p className="text-base font-medium text-red-900">{title}</p>
      <p className="mt-1 text-sm text-red-800">{message}</p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-lg bg-red-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-900/30 focus:ring-offset-2"
      >
        Try again
      </button>
    </div>
  )
}

/** Shown when the profile request failed. */
export function ProfileErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <ErrorBox title="Profile could not be loaded" message={message} onRetry={onRetry} />
}

/** Shown when the repository request failed. */
export function RepositoriesErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <ErrorBox title="Repositories could not be loaded" message={message} onRetry={onRetry} />
  )
}
