import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { usePageMeta } from '../../hooks/usePageMeta'

/** The description of the document, or null when there is none. */
function description() {
  return document.head.querySelector('meta[name="description"]')?.getAttribute('content') ?? null
}

afterEach(() => {
  document.title = ''
  document.head.querySelector('meta[name="description"]')?.remove()
})

describe('usePageMeta', () => {
  it('sets the title of the document', () => {
    renderHook(() => usePageMeta({ title: 'A title', description: 'A description' }))

    expect(document.title).toBe('A title')
  })

  it('sets the description of the document', () => {
    renderHook(() => usePageMeta({ title: 'A title', description: 'A description' }))

    expect(description()).toBe('A description')
  })

  it('reuses the description element that is already there', () => {
    const existing = document.createElement('meta')
    existing.setAttribute('name', 'description')
    existing.setAttribute('content', 'The old description')
    document.head.appendChild(existing)

    renderHook(() => usePageMeta({ title: 'A title', description: 'A new description' }))

    expect(description()).toBe('A new description')
    expect(document.head.querySelectorAll('meta[name="description"]')).toHaveLength(1)
  })

  it('follows a title that changes', () => {
    const { rerender } = renderHook(
      ({ title }) => usePageMeta({ title, description: 'A description' }),
      { initialProps: { title: 'The first title' } },
    )

    rerender({ title: 'The second title' })

    expect(document.title).toBe('The second title')
  })

  it('keeps one title in the document', () => {
    renderHook(() => usePageMeta({ title: 'A title', description: 'A description' }))

    expect(document.querySelectorAll('title')).toHaveLength(1)
  })
})
