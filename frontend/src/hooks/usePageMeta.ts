import { useEffect } from 'react'

interface PageMeta {
  /** The text of the browser tab. */
  title: string
  /** The description that search engines and link previews show. */
  description: string
}

const DESCRIPTION_SELECTOR = 'meta[name="description"]'

/**
 * Sets the title and the description of the page.
 *
 * This is a single-page application: the HTML file is loaded once, and
 * every page after that is drawn by React. The title and the description
 * belong to the document and not to the markup, so they are set here.
 *
 * React 19 is able to hoist a `<title>` element into the head, but the
 * static `<title>` of `index.html` would stay there as well, and the
 * document would end up with two of them. Assigning `document.title`
 * changes the title that is already there, so the document keeps exactly
 * one, and the page keeps one title per route.
 */
export function usePageMeta({ title, description }: PageMeta): void {
  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    document.title = title

    const existing = document.head.querySelector<HTMLMetaElement>(DESCRIPTION_SELECTOR)

    if (existing) {
      existing.setAttribute('content', description)
      return
    }

    const created = document.createElement('meta')
    created.setAttribute('name', 'description')
    created.setAttribute('content', description)
    document.head.appendChild(created)
  }, [title, description])
}
