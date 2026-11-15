import request from 'supertest'
import { describe, expect, it } from 'vitest'
import app from '../app.js'

describe('GET /api/health', () => {
  it('responds with ok', async () => {
    const response = await request(app).get('/api/health')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok' })
  })
})

describe('unknown API routes', () => {
  it('answers with the error envelope and not with a page of HTML', async () => {
    const response = await request(app).get('/api/does-not-exist')

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'The requested endpoint does not exist.',
      },
    })
    expect(response.type).toBe('application/json')
  })

  it('answers the same way for an unknown route below a known one', async () => {
    const response = await request(app).get('/api/users/octocat/unknown')

    expect(response.status).toBe(404)
    expect(response.body.error.code).toBe('NOT_FOUND')
  })

  it('does not catch the routes that do exist', async () => {
    const response = await request(app).get('/api/health')

    expect(response.status).toBe(200)
  })
})
