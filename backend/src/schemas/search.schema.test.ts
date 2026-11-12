import { describe, expect, it } from 'vitest'
import { searchQuerySchema } from './search.schema.js'

describe('searchQuerySchema', () => {
  it('accepts a normal query', () => {
    expect(searchQuerySchema.safeParse('octocat').success).toBe(true)
  })

  it('trims surrounding whitespace', () => {
    const result = searchQuerySchema.safeParse('  octocat  ')

    expect(result.success).toBe(true)
    expect(result.success && result.data).toBe('octocat')
  })

  it('rejects an empty query', () => {
    expect(searchQuerySchema.safeParse('').success).toBe(false)
  })

  it('rejects a whitespace-only query', () => {
    expect(searchQuerySchema.safeParse('   ').success).toBe(false)
  })

  it('rejects a missing query', () => {
    expect(searchQuerySchema.safeParse(undefined).success).toBe(false)
  })

  it('accepts a query of exactly 256 characters', () => {
    expect(searchQuerySchema.safeParse('a'.repeat(256)).success).toBe(true)
  })

  it('rejects a query longer than 256 characters', () => {
    expect(searchQuerySchema.safeParse('a'.repeat(257)).success).toBe(false)
  })

  it('accepts GitHub search qualifiers', () => {
    const result = searchQuerySchema.safeParse('location:berlin followers:>100')

    expect(result.success).toBe(true)
  })
})
