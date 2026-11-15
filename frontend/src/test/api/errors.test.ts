import { describe, expect, it } from 'vitest'
import { getErrorMessage } from '../../api/errors'

/** An error of the shape Axios throws when a request fails. */
function axiosError(properties: Record<string, unknown>) {
  return { isAxiosError: true, ...properties }
}

describe('getErrorMessage', () => {
  it('uses the message of the backend for a known error code', () => {
    const error = axiosError({
      response: {
        status: 429,
        data: { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Rate limit exceeded.' } },
      },
    })

    expect(getErrorMessage(error)).toMatch(/rate limit exceeded/i)
  })

  it('falls back to a generic message for an unknown error code', () => {
    const error = axiosError({
      response: { status: 500, data: { error: { code: 'SOMETHING_NEW', message: '...' } } },
    })

    expect(getErrorMessage(error)).toMatch(/could not be completed/i)
  })

  it('reports a timeout of Axios', () => {
    const error = axiosError({ code: 'ECONNABORTED', request: {}, response: undefined })

    expect(getErrorMessage(error)).toMatch(/took too long/i)
  })

  it('reports a timeout of the runtime underneath Axios', () => {
    const error = axiosError({ code: 'ETIMEDOUT', request: {}, response: undefined })

    expect(getErrorMessage(error)).toMatch(/took too long/i)
  })

  it('reports a connection failure separately from a timeout', () => {
    const error = axiosError({ code: 'ECONNREFUSED', request: {}, response: undefined })

    expect(getErrorMessage(error)).toMatch(/could not reach the server/i)
    expect(getErrorMessage(error)).not.toMatch(/took too long/i)
  })

  it('reports a failure without a response as a connection failure', () => {
    const error = axiosError({ request: {}, response: undefined })

    expect(getErrorMessage(error)).toMatch(/could not reach the server/i)
  })

  it('falls back to a generic message for something that is not an Axios error', () => {
    expect(getErrorMessage(new Error('boom'))).toMatch(/could not be completed/i)
  })
})
