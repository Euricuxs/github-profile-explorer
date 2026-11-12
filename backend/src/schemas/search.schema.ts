import { z } from 'zod'

/**
 * The GitHub search query.
 *
 * GitHub's search grammar is richer than a plain username (it understands
 * qualifiers such as `location:` or `followers:>100`), so we deliberately do
 * not restrict the characters. We only make sure the query is present and
 * within a sensible length, and that it carries actual content.
 *
 * The maximum length is 256 characters; GitHub itself rejects very long
 * queries, and an unbounded query is an easy way to waste a rate-limited
 * request.
 */
export const searchQuerySchema = z
  .string()
  .trim()
  .min(1, 'Search query is required.')
  .max(256, 'Search query must be at most 256 characters.')

export type SearchQuery = z.infer<typeof searchQuerySchema>
