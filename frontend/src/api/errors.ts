import axios from 'axios'

/**
 * The backend answers every failure with the same envelope:
 *
 *   { "error": { "code": "RATE_LIMIT_EXCEEDED", "message": "..." } }
 *
 * We show a friendly message per code, so the user learns what went wrong
 * (a rate limit is very different from a timeout) instead of staring at a
 * generic "something failed".
 */
const MESSAGES_BY_CODE: Record<string, string> = {
  INVALID_SEARCH_QUERY: 'That search query is not valid. Please try a different term.',
  INVALID_USERNAME: 'That is not a valid GitHub username.',
  USER_NOT_FOUND: 'That GitHub user could not be found. Please check the username.',
  RATE_LIMIT_EXCEEDED: 'GitHub API rate limit exceeded. Please wait a moment and try again.',
  GITHUB_UNAVAILABLE: 'The GitHub API is currently unavailable. Please try again shortly.',
  GITHUB_TIMEOUT: 'The GitHub API did not respond in time. Please try again.',
  GITHUB_FORBIDDEN: 'The GitHub API rejected this request. Please try again later.',
  GITHUB_ERROR: 'The GitHub API returned an unexpected response. Please try again.',
  INTERNAL_SERVER_ERROR: 'Something went wrong on the server. Please try again.',
  NOT_FOUND: 'That endpoint could not be found.',
}

const GENERIC_MESSAGE = 'The request could not be completed. Please try again.'
const OFFLINE_MESSAGE = 'Could not reach the server. Check your connection and try again.'
const TIMEOUT_MESSAGE = 'The request took too long. Please try again.'

/**
 * The codes Axios and Node use for a request that ran out of time.
 *
 * Axios reports its own timeout as `ECONNABORTED`, and a socket timeout of
 * the runtime underneath it arrives as `ETIMEDOUT`. Both mean the same thing
 * to the user, so both get the same message.
 */
const TIMEOUT_CODES = new Set(['ECONNABORTED', 'ETIMEDOUT'])

interface ApiErrorEnvelope {
  error: { code: string; message: string }
}

/** Narrows an unknown value to the backend's error envelope. */
function isApiErrorEnvelope(value: unknown): value is ApiErrorEnvelope {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as { error?: { code?: unknown } }

  return typeof candidate.error?.code === 'string'
}

/** Turns any thrown value into a message that is safe to show to the user. */
export function getErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return GENERIC_MESSAGE
  }

  const body = error.response?.data

  if (isApiErrorEnvelope(body)) {
    return MESSAGES_BY_CODE[body.error.code] ?? GENERIC_MESSAGE
  }

  // No response at all means the request never reached the server. A
  // timeout is checked first, because a timeout also has no response, and
  // "the server cannot be reached" would send the user looking at their
  // connection when the connection was fine.
  if (error.code !== undefined && TIMEOUT_CODES.has(error.code)) {
    return TIMEOUT_MESSAGE
  }

  if (error.response === undefined) {
    return OFFLINE_MESSAGE
  }

  return GENERIC_MESSAGE
}
