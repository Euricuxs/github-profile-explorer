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

## Note

`CLAUDE.md` is a local development guide and is intentionally excluded from Git.
