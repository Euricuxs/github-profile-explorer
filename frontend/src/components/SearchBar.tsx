import { useEffect, useRef, useState } from 'react'
import type { SubmitEvent as ReactSubmitEvent } from 'react'

const SEARCH_DEBOUNCE_MS = 500

interface SearchBarProps {
  onSearch: (term: string) => void
  /**
   * The term the page wants to show in the input.
   *
   * It changes when the query in the URL changes, for example after the
   * browser Back or Forward button was used, or after the user came back
   * from a profile page.
   */
  initialTerm?: string
}

/**
 * The search input.
 *
 * It owns the raw text the user is typing and decides *when* a search should
 * happen:
 *
 * - while typing, a 500 ms debounce triggers the search, so a long query
 *   does not fire one request per keystroke;
 * - pressing Enter or clicking "Search" searches immediately, without
 *   waiting for the debounce, and cancels the pending debounce so the same
 *   term is not searched twice;
 * - clearing the input resets the search, which takes the page back to its
 *   initial state;
 * - when `initialTerm` changes from the outside (browser Back/Forward), the
 *   input follows it.
 *
 * The `submitted` ref remembers the term we last handed to the parent. It
 * keeps the reset from firing on the very first render, when the input is
 * empty anyway, and it tells us that emptying the input is a meaningful
 * action rather than a no-op.
 *
 * The `reported` ref remembers the term we last reported as well. It tells
 * our own echo of that term (the URL catching up with what we just sent)
 * apart from a genuine change coming from the outside, so typing is never
 * interrupted by the round trip through the URL.
 */
export function SearchBar({ onSearch, initialTerm = '' }: SearchBarProps) {
  const [term, setTerm] = useState(initialTerm)
  const submitted = useRef<string | null>(null)
  const reported = useRef<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onSearchRef = useRef(onSearch)

  // The callback is kept in a ref so the debounce below is only re-armed
  // when the typed text changes, and not every time the page re-renders.
  useEffect(() => {
    onSearchRef.current = onSearch
  }, [onSearch])

  // Follow a query that changed outside of this input.
  useEffect(() => {
    if (initialTerm !== reported.current) {
      setTerm(initialTerm)
    }
  }, [initialTerm])

  /** Hands a term to the parent and remembers it as the last reported one. */
  function report(value: string) {
    reported.current = value
    onSearchRef.current(value)
  }

  useEffect(() => {
    const trimmed = term.trim()

    if (trimmed.length === 0) {
      if (submitted.current !== null) {
        submitted.current = null
        report('')
      }
      return
    }

    timer.current = setTimeout(() => {
      timer.current = null
      submitted.current = trimmed
      report(trimmed)
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      if (timer.current !== null) {
        clearTimeout(timer.current)
        timer.current = null
      }
    }
  }, [term])

  function handleSubmit(event: ReactSubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmed = term.trim()

    if (trimmed.length === 0) {
      return
    }

    // An explicit submit wins over the pending debounce: the timer is
    // cancelled so the same term is not searched a second time.
    if (timer.current !== null) {
      clearTimeout(timer.current)
      timer.current = null
    }

    submitted.current = trimmed
    report(trimmed)
  }

  return (
    <form role="search" onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
      <label htmlFor="github-search" className="sr-only">
        Search GitHub users
      </label>

      <input
        id="github-search"
        name="q"
        type="search"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder="Search GitHub users, e.g. octocat"
        autoComplete="off"
        className="focus-ring w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition placeholder:text-slate-500 focus:border-slate-900"
      />

      <button
        type="submit"
        className="focus-ring shrink-0 rounded-lg bg-slate-900 px-5 py-2.5 font-medium text-white shadow-sm transition hover:bg-slate-700"
      >
        Search
      </button>
    </form>
  )
}
