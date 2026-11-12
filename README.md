# GitHub Profile Explorer

A full-stack web application for searching GitHub developers and exploring their public
profiles, repositories, and programming language statistics.

The backend is the only component that talks to the GitHub REST API. The frontend calls
the backend over HTTP.

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
frontend/   React single-page app
backend/    Express REST API
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
| 429    | `RATE_LIMIT_EXCEEDED`  | GitHub's request rate limit was reached.            |
| 500    | `INTERNAL_SERVER_ERROR`| Unexpected server error.                            |
| 502    | `GITHUB_UNAVAILABLE`   | GitHub could not be reached or returned a 5xx.      |
| 502    | `GITHUB_ERROR`         | GitHub returned an unexpected response.             |
| 504    | `GITHUB_TIMEOUT`       | GitHub did not respond within 10 seconds.           |

### Current limitations

- The repositories endpoint returns a single page of at most **100 repositories** (GitHub's maximum per page), sorted by most recently updated. Users with more than 100 public repositories are truncated, and frontend pagination is not implemented yet.
- The search endpoint returns a single page of at most **30 results**. GitHub caps search at 1000 matches in total, and the query is passed to GitHub unchanged so its full search grammar (`location:`, `followers:>100`, ...) works.
- Without `GITHUB_TOKEN`, GitHub allows only 60 requests per hour per IP address.
- **GitHub's search API has a much stricter rate limit than the rest of the REST API: 10 requests per minute unauthenticated, and 30 requests per minute with a token.** The other endpoints are limited by the hourly 60/5000 requests instead. A frontend search box therefore has to debounce its requests, otherwise a user typing a term will exhaust the search quota in seconds.


## Note

`CLAUDE.md` is a local development guide and is intentionally excluded from Git.
