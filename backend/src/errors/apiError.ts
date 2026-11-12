/**
 * An error that carries the HTTP status and machine-readable code that should
 * be sent to the client.
 *
 * The service layer talks to GitHub and has no reason to know HTTP, but
 * something has to translate "GitHub said 404" into "the client gets 404".
 * `ApiError` is that small bridge: the service throws it, the centralized
 * error middleware turns it into a response.
 */
export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}
