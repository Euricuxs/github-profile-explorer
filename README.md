# GitHub Profile Explorer

A full-stack web application for searching GitHub developers and exploring their public
profiles, repositories, and programming language statistics.

The backend is the only component that talks to the GitHub REST API. The frontend calls
the backend over HTTP.

## Features

- **Search** GitHub users and organizations by username, with a debounced input so the
  strict search rate limit is not exhausted while typing.
- **Profile page** with the avatar, name, login, bio, company, location, blog, follower
  and following counts, and the number of public repositories.
- **Repository list** with the description, language, stars, forks and last update date
  of every repository, and a link to the repository on GitHub.
- **Filtering and sorting** of the repository list by language and by stars or last
  update, with client-side pagination.
- **Language statistics**: the count and the share of every language, as a table and as a
  segmented chart.
- **Shareable URLs**: the search term lives in the query string, so a search and a profile
  can be linked and restored.
- **Accessible by design**: a visible focus indicator on every interactive element, a
  page title and description per route, live-region announcements for the search results,
  and a text alternative for the chart.
- **Clear states** for loading, empty results, missing accounts, rate limits and network
  failures, including a page for unknown addresses.

## Architecture

```
Browser ──► Frontend (React SPA) ──► Backend (Express API) ──► GitHub REST API
```

The frontend never calls GitHub directly. Every GitHub request goes through the backend,
which is the only place that knows the GitHub API, the rate limits and the token. This
keeps the API key out of the browser, lets the backend normalise GitHub's responses into
the shapes the frontend uses, and gives one place to handle errors and rate limits.

| Concern            | Where it lives                                                       |
| ------------------ | -------------------------------------------------------------------- |
| Routes             | `frontend/src/App.tsx`                                               |
| Pages              | `frontend/src/pages/`                                                |
| Server state       | `frontend/src/hooks/` (TanStack Query)                              |
| HTTP to the backend| `frontend/src/api/`                                                  |
| Routes and controllers | `backend/src/routes/`, `backend/src/controllers/`                |
| GitHub calls       | `backend/src/services/github.service.ts`                            |
| Request validation | `backend/src/schemas/` (Zod)                                         |
| Error handling     | `backend/src/middleware/errorHandler.ts`, `frontend/src/api/errors.ts` |

## Stack

| Layer     | Technology                                                              |
| --------- | ----------------------------------------------------------------------- |
| Frontend  | React 19, TypeScript 7, Vite 8, Tailwind CSS 4, React Router 8, TanStack Query 5, Axios 1 |
| Backend   | Node.js 26, Express 5, TypeScript 7, Axios 1, Zod 4, cors 2             |
| Testing   | Vitest 5, Supertest 7, React Testing Library 16, jsdom 31              |

## Prerequisites

- Node.js **26.13.1** or newer (see `.node-version`)

## Install

```bash
npm install
```

This is an npm workspaces monorepo, so a single install at the root sets up both
`frontend/` and `backend/`.

## Run in development

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3000

The Vite dev server proxies `/api/*` to the backend, so the browser only ever talks to a
single origin and CORS never applies during development.

## Other scripts

```bash
npm run typecheck   # tsc --noEmit in both workspaces
npm run test        # vitest run in both workspaces
npm run lint        # oxlint in both workspaces
npm run build       # production build of both workspaces
```

## Environment variables

Copy the example files and adjust as needed:

- `backend/.env.example` → `backend/.env` (`PORT`, `CORS_ORIGIN`, `GITHUB_API_BASE_URL`, `GITHUB_TOKEN`)
- `frontend/.env.example` → `frontend/.env` (`VITE_API_BASE_URL`)

`CORS_ORIGIN` is a comma-separated allowlist of browser origins and is only needed in
production, where the frontend and the API are served from different origins. The
`GITHUB_TOKEN` is optional and raises the GitHub rate limit; it must never reach the
frontend.

## Layout

```
frontend/
  index.html
  public/                     favicon.svg, avatar-placeholder.svg
  src/
    App.tsx                   the routes of the single-page app
    api/                      Axios instance, backend calls, error messages
    components/               the reusable pieces of the interface
    hooks/                    TanStack Query hooks and usePageMeta
    pages/                    HomePage, ProfilePage, NotFoundPage
    types/                    the shapes of the data
    utils/                    pure logic (sorting, filtering, statistics, chart)
    test/                     the tests, with the shared fixtures
backend/
  src/
    app.ts                    the Express application
    server.ts                 the HTTP server
    controllers/              the HTTP handlers
    routes/                   the endpoint definitions
    schemas/                  the Zod validation of the incoming requests
    services/                 the calls to the GitHub API
    middleware/               the shared error handling
    errors/                   the ApiError type
    types/                    the shapes of the GitHub responses
```

## API

| Method | Path                          | Description                                     |
| ------ | ----------------------------- | ----------------------------------------------- |
| GET    | `/api/health`                 | Liveness check.                                  |
| GET    | `/api/users/:username`        | Public profile of a GitHub user.                 |
| GET    | `/api/users/:username/repos`  | Public repositories of a GitHub user.            |
| GET    | `/api/search/users?q=term`    | Search GitHub for users and organizations.       |

`/api/search/users` returns the first page of at most **30 results**:

```json
{
  "totalCount": 42,
  "incompleteResults": false,
  "users": [
    {
      "id": 583231,
      "login": "octocat",
      "avatarUrl": "https://avatars.githubusercontent.com/u/583231?v=4",
      "profileUrl": "https://github.com/octocat",
      "type": "User"
    }
  ]
}
```

`type` is either `User` or `Organization`. `incompleteResults` is `true` when GitHub hit its own search time budget and the result set is partial.

Errors always use the same shape:

```json
{ "error": { "code": "USER_NOT_FOUND", "message": "GitHub user not found." } }
```

| Status | Code                   | Meaning                                            |
| ------ | ---------------------- | -------------------------------------------------- |
| 400    | `INVALID_USERNAME`     | The username does not match GitHub's rules.         |
| 400    | `INVALID_SEARCH_QUERY` | The search query is missing, empty or too long.     |
| 403    | `GITHUB_FORBIDDEN`     | GitHub rejected the request for another reason.     |
| 404    | `USER_NOT_FOUND`       | GitHub has no such user.                            |
| 404    | `NOT_FOUND`            | The API has no such endpoint.                       |
| 429    | `RATE_LIMIT_EXCEEDED`  | GitHub's request rate limit was reached.            |
| 500    | `INTERNAL_SERVER_ERROR`| Unexpected server error.                            |
| 502    | `GITHUB_UNAVAILABLE`   | GitHub could not be reached or returned a 5xx.      |
| 502    | `GITHUB_ERROR`         | GitHub returned an unexpected response.             |
| 504    | `GITHUB_TIMEOUT`       | GitHub did not respond within 10 seconds.           |

An unknown `/api/*` path answers with the same error shape and the status 404, so a client
never has to parse an HTML error page:

```json
{ "error": { "code": "NOT_FOUND", "message": "The requested endpoint does not exist." } }
```

### Current limitations

- The repositories endpoint returns a single page of at most **100 repositories** (GitHub's maximum per page), sorted by most recently updated. Accounts with more than 100 public repositories are truncated, and the interface says so instead of claiming that 100 is the total. The list of these repositories is filtered, sorted and paginated in the browser, so the pagination covers the 100 repositories that were returned, not every public repository of the account.
- The search endpoint returns a single page of at most **30 results**. GitHub caps search at 1000 matches in total, and the query is passed to GitHub unchanged so its full search grammar (`location:`, `followers:>100`, ...) works.
- The language statistics describe the repositories that the backend returned (at most 100), not every public repository of the account.
- Without `GITHUB_TOKEN`, GitHub allows only 60 requests per hour per IP address.
- **GitHub's search API has a much stricter rate limit than the rest of the REST API: 10 requests per minute unauthenticated, and 30 requests per minute with a token.** The other endpoints are limited by the hourly 60/5000 requests instead. A frontend search box therefore has to debounce its requests, otherwise a user typing a term will exhaust the search quota in seconds.


## Note

`CLAUDE.md` is a local development guide and is intentionally excluded from Git.
