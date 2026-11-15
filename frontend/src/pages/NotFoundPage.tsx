import { Link, useLocation } from 'react-router'
import { usePageMeta } from '../hooks/usePageMeta'

/**
 * The page that is shown for an address the application does not know.
 *
 * React Router renders nothing when no route matches, which leaves a blank
 * white page behind. That page looks exactly like a crash, so the catch-all
 * route shows this one instead: it says what happened, shows the address
 * that was asked for, and offers the way back to the search.
 */
export function NotFoundPage() {
  const location = useLocation()

  usePageMeta({
    title: 'Page not found · GitHub Profile Explorer',
    description: 'The page you were looking for does not exist.',
  })

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-900">Page not found</h1>

      <p className="mt-2 text-slate-600">
        There is nothing at <span className="font-mono text-slate-900">{location.pathname}</span>.
        The address may have a typo in it, or the page may have been moved.
      </p>

      <Link
        to="/"
        className="focus-ring mt-6 inline-block rounded-lg bg-slate-900 px-5 py-2.5 font-medium text-white shadow-sm transition hover:bg-slate-700"
      >
        Back to search
      </Link>
    </main>
  )
}
