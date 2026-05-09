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
- Linter/formatter: Biome. No typecheck.
- Tests: Vitest (frontend), Node.js native test runner (backend).

## API

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/files` | Lists all files recursively |
| GET | `/api/files/info?file=<relpath>` | Returns `{type, isBookmarked, mtime, size, content?}` |
| PUT | `/api/files/content` | Body `{file, content, mtime, force?}`. Writes to disk. |
| GET | `/api/files/raw?file=<relpath>` | Binary/sendFile variant |
| PUT | `/api/files/checkbox` | Body `{file, checked, line, mtime}`. Toggles a checkbox on disk. |
| GET | `/api/files/recent?n=<5-50>` | Recently modified files |
| GET | `/api/files/search?q=<query>` | Full-text search (filenames + content via ripgrep) |
| GET/POST/DELETE | `/api/bookmarks` | Reads/writes `bookmarks.json` in `CONFIG_PATH` |
| GET/PATCH | `/api/config` | Reads/writes `app.json` in `CONFIG_PATH` |
| GET | `/api` | Status endpoint (deps, event channel info) |

## Frontend

- TailwindCSS with `@tailwindcss/typography` plugin
- `react-router-dom` v7 with `BrowserRouter`
- Routes: `/` (Dashboard), `/file?f=` (FilePage), `*` fallback to Dashboard
- File viewer supports: text, markdown (react-markdown), images, audio/video, binary
- Dashboard shows recently modified files and bookmarks

## Deployment

- Multi-stage Dockerfile (`FROM node:22-alpine`)
- Env: `PORT` (default 5000), `DATA_ROOT_DIR`, `CONFIG_PATH`, `EVENT_CHANNEL` (stdout|stderr|file://)
- `EVENT_CHANNEL` emits JSON-line events for file_bookmarked, file_unbookmarked, file_updated, file_checkbox_checked, file_checkbox_unchecked, config_updated
