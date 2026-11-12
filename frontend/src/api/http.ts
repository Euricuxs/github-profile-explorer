import axios from 'axios'

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
  timeout: 10_000,
  headers: { Accept: 'application/json' },
})
