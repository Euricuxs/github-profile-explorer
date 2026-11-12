import type { Request, Response } from 'express'
import { ApiError } from '../errors/apiError.js'
import { searchQuerySchema } from '../schemas/search.schema.js'
import { searchUsers } from '../services/github.service.js'

/**
 * Validates the `q` query parameter.
 *
 * Express types a query parameter as `string | string[] | undefined`, while
 * the Zod schema only accepts a single string. A missing `q` and a repeated
 * `?q=a&q=b` are therefore both rejected by the same schema, and we answer
 * with one consistent error code for every invalid input.
 */
function parseSearchQuery(raw: unknown): string {
  const result = searchQuerySchema.safeParse(raw)

  if (!result.success) {
    throw new ApiError(400, 'INVALID_SEARCH_QUERY', 'The search query is not valid.')
  }

  return result.data
}

/** GET /api/search/users */
export async function searchUsersHandler(req: Request, res: Response): Promise<void> {
  const query = parseSearchQuery(req.query.q)
  const results = await searchUsers(query)

  res.json(results)
}
