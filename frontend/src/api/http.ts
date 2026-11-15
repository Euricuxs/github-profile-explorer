import axios from 'axios'

/**
 * How long the browser waits for the backend.
 *
 * The backend gives up on GitHub after 10 seconds and answers with a
 * `GITHUB_TIMEOUT` error, which is more precise than anything the browser
 * can say. The timeout of the browser is a little longer, so that answer
 * arrives first and reaches the user.
 */
const REQUEST_TIMEOUT_MS = 12_000

/**
 * The single Axios instance every request goes through.
 *
 * `baseURL` defaults to the relative path `/api`. In development the Vite dev
 * server proxies that path to the Express backend, so the browser only ever
 * talks to one origin and CORS never comes up. In production
 * `VITE_API_BASE_URL` points at the deployed API instead.
 */
const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

export const http = axios.create({
  baseURL: configuredBaseUrl && configuredBaseUrl.length > 0 ? configuredBaseUrl : '/api',
  timeout: REQUEST_TIMEOUT_MS,
  headers: { Accept: 'application/json' },
})
