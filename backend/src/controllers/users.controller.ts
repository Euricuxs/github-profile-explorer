import type { Request, Response } from 'express'
import { ApiError } from '../errors/apiError.js'
import { usernameSchema } from '../schemas/user.schema.js'
import { getRepositories, getUserProfile } from '../services/github.service.js'

/**
 * Validates the `:username` route parameter.
 *
 * We reject clearly invalid usernames before spending a GitHub API call on
 * them, which also protects the rate limit. Express types route parameters as
 * `string | string[]`; the Zod schema only accepts a single string, so a
 * repeated parameter is rejected as invalid too.
 */
function parseUsername(raw: string | string[]): string {
  const result = usernameSchema.safeParse(raw)

  if (!result.success) {
    throw new ApiError(400, 'INVALID_USERNAME', 'The username is not a valid GitHub username.')
  }

  return result.data
}

/** GET /api/users/:username */
export async function getUserHandler(req: Request, res: Response): Promise<void> {
  const username = parseUsername(req.params.username)
  const user = await getUserProfile(username)

  res.json({ user })
}

/** GET /api/users/:username/repos */
export async function getRepositoriesHandler(req: Request, res: Response): Promise<void> {
  const username = parseUsername(req.params.username)
  const repositories = await getRepositories(username)

  res.json({ repositories })
}
