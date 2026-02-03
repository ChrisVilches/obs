# AGENTS.md

## Commands

```bash
npm run install-all       # install deps in both packages
npm run dev               # backend (port 5000) + frontend dev server concurrently
npm run build             # frontend production build into frontend/dist
npm start                 # production: serve frontend/dist + API on port 5000
```

No tests, linter, formatter, or typecheck configured in this repo.

## Architecture

- **Backend** (`/backend`): Express 5, CommonJS (`require`), no build step. Entry: `src/server.js`. Dev uses `node --watch`.
- **Frontend** (`/frontend`): React 19 + Vite 6 + react-router-dom (BrowserRouter). ESM. Entry: `src/main.jsx`.
- Monorepo uses root `concurrently` script, not npm workspaces.

## Critical route order (backend `src/server.js`)

1. API (`/api/*`)
2. Frontend static assets — `express.static` from `frontend/dist/`
3. Catch-all `*` — serves `frontend/dist/index.html` for SPA client-side routing

Order matters: the catch-all must be last so it does not swallow API or asset requests.

## Key details

- `ROOT_DIR` comes from env var `DATA_ROOT_DIR` (required). Validated at startup — app crashes with fatal error if unset or directory doesn't exist.
- Files starting with `.` or `archived` are ignored by the API (`server.js:11-16`)
- Path traversal protection: `fullPath.startsWith(ROOT_DIR)` check on content/raw endpoints
- Frontend dev server proxies `/api` to `http://localhost:5000` (see `frontend/vite.config.js`)
- File type detection in `frontend/src/utils/fileType.js`: image extensions, markdown extensions, else text
- Backend sends file contents as JSON strings (`/api/files/content`) and raw files via `res.sendFile` (`/api/files/raw`)
- `react-markdown` renders markdown; has a known caveat: does not render checklists (noted in `MarkdownViewer.jsx:4`)

## Reusable components

### Modal (`frontend/src/components/Modal.jsx`)

A centered dialog with backdrop overlay using `@headlessui/react` Dialog + Transition. Props: `open`, `onClose`, `title`, `children`. Use it for any overlay/dialog needs (confirmations, full-text display, etc.) instead of creating ad-hoc dialogs.
