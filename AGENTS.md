# OBS (Obsidian File Viewer)

Monorepo: Express 5 backend + React 19 / Vite 6 frontend. Views files from an Obsidian vault.

## Dev commands

```sh
npm run install-all   # install deps in both sub-packages
npm run dev           # concurrently: backend (port 5000) + frontend (Vite, proxy /api -> 5000)
npm run build         # vite build only
npm run start         # node backend/src/server.js (production)
```

## Setup

- `DATA_ROOT_DIR` env var is **required** (path to file root). Backend exits if missing.
- `CONFIG_PATH` env var is **required** (relative path to config directory, resolved against `DATA_ROOT_DIR`). Backend exits if missing. The directory must contain or will be auto-populated with `bookmarks.json` and `app.json`.
- Backend dev: `node --watch src/server.js` (auto-restart)
- Vite proxies `/api` to `localhost:5000`
- Backend is **CJS** (`require`). Frontend is **ESM** (`import`).
- No linter, no typecheck, no test framework.

## API

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/files` | Lists all files recursively |
| GET | `/api/files/content?file=<relpath>` | Returns `{content, isBookmarked}` |
| PUT | `/api/files/content` | Body `{file, content}`. Writes to disk. |
| GET | `/api/files/raw?file=<relpath>` | Binary/sendFile variant |
| GET/POST/DELETE | `/api/bookmarks` | Reads/writes `bookmarks.json` in `CONFIG_PATH` |
| GET/PATCH | `/api/config` | Reads/writes `app.json` in `CONFIG_PATH` |

## Frontend

- TailwindCSS with `@tailwindcss/typography` plugin
- `react-router-dom` v7 with `BrowserRouter`
- Routes: `*` -> `Home` component (catch-all SPA routing)
- File viewer supports: text, markdown (react-markdown), images
- Resizable sidebar width persisted in `localStorage('sidebarWidth')`

## Deployment

- Multi-stage Dockerfile (`FROM node:22-alpine`)
- Env: `PORT` (default 5000), `DATA_ROOT_DIR`, `CONFIG_PATH`, `EVENT_CHANNEL` (stdout|stderr|file://)
- `EVENT_CHANNEL` emits JSON-line events for file_bookmarked, file_unbookmarked, file_updated
