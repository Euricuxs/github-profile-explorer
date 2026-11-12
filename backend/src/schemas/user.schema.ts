import { z } from 'zod'

/**
 * GitHub usernames are 1-39 characters long and may contain letters, digits
 * and single hyphens. A username may not start or end with a hyphen, and may
 * not contain two hyphens in a row.
 *
 * The regex below encodes exactly that: it must start with an alphanumeric
 * character, and every hyphen must be followed by an alphanumeric character.
 */
const USERNAME_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9]))*$/

export const usernameSchema = z
  .string()
  .min(1, 'Username is required.')
  .max(39, 'Username must be at most 39 characters.')
  .regex(USERNAME_PATTERN, 'Username contains invalid characters.')

export type Username = z.infer<typeof usernameSchema>
