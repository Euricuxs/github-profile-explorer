import { useEffect, useRef, useState } from 'react'
import type { SubmitEvent as ReactSubmitEvent } from 'react'

const SEARCH_DEBOUNCE_MS = 500

interface SearchBarProps {
  onSearch: (term: string) => void
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
 *   waiting for the debounce;
 * - clearing the input resets the search, which takes the page back to its
 *   initial state.
 *
 * The `submitted` ref remembers the term we last handed to the parent. It
 * keeps the reset from firing on the very first render, when the input is
 * empty anyway, and it tells us that emptying the input is a meaningful
 * action rather than a no-op.
 */
export function SearchBar({ onSearch }: SearchBarProps) {
  const [term, setTerm] = useState('')
  const submitted = useRef<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const trimmed = term.trim()

    if (trimmed.length === 0) {
      if (submitted.current !== null) {
        submitted.current = null
        onSearch('')
      }
      return
    }

    timer.current = setTimeout(() => {
      timer.current = null
      submitted.current = trimmed
      onSearch(trimmed)
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      if (timer.current !== null) {
        clearTimeout(timer.current)
        timer.current = null
      }
    }
  }, [term, onSearch])

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
    onSearch(trimmed)
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
        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
      />

      <button
        type="submit"
        className="shrink-0 rounded-lg bg-slate-900 px-5 py-2.5 font-medium text-white shadow-sm transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/30 focus:ring-offset-2"
      >
        Search
      </button>
    </form>
  )
}
