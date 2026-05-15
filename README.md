# OBS

## Description

OBS is a web-based file explorer with rich Markdown rendering that integrates seamlessly with Obsidian — drop it into a vault or any directory of files and browse, edit, and search from your browser. It runs as a self-contained Node.js server with a React frontend, requiring no database or external services.

## Features

- Browse directory trees with a file explorer sidebar
- Renders Markdown with features such as KaTeX and interactive task checkboxes
- Edit text files in-browser
- File events stream (e.g. file updated, checkbox checked, file bookmarked, etc.) — since the app is git-agnostic, the event stream lets you build your own automation on top of it. Pipe events to stdout or a file and write custom programs that react to them — for example, auto-committing changes to keep your vault in sync with git.

## Tech stack

- **Backend:** Node.js, Express 5, Zod
- **Frontend:** React 19, Vite 6, TailwindCSS 4, react-markdown, SWR
- **Tooling:** Biome, Docker, Vitest, Node.js test runner

## Dependencies

### Backend (Node.js server)

- **Node.js** v24.16.0 — runtime
- **ripgrep (rg)** — required for certain backend operations (e.g., searching file contents)
- **GNU find (findutils)** — required for listing recently modified files
- Packages installed via `npm` (see `backend/package.json`)

### Frontend (Vite / React SPA)

No runtime dependencies. The frontend is compiled to static files and served by the backend.

## Deployment

### Build the Docker image

TODO: Change the image name.

```sh
docker build -t obs-viewer .
```

### Run the container

```sh
docker run -p 8080:8080 \
  -e PORT=8080 \
  -e DATA_ROOT_DIR=/data \
  -e CONFIG_PATH=.obsidian \
  -v /path/to/your/files:/data \
  obs-viewer
```

- `PORT` — environment variable for the port the app listens on (defaults to `5000` if not set). Must match the host-side of `-p`.
- `DATA_ROOT_DIR` — **required**. Points to the directory inside the container where your files are mounted.
- `CONFIG_PATH` — **required**. Relative path (resolved against `DATA_ROOT_DIR`) to the config directory. The app will auto-create `bookmarks.json` and `app.json` in this directory if they don't exist.
- `EVENT_CHANNEL` — optional. Where to emit JSON events (one per line). Supported values: `stdout`, `stderr`, `file:///path/to/file`. Leave unset to disable events. Example: `-e EVENT_CHANNEL=stdout`.
- `-v /path/to/your/files:/data` — bind mount your directory to `/data` (or any path, as long as `DATA_ROOT_DIR` matches).

### Example integrated with an Obsidian vault (bookmarks in `.obsidian/`, events to file)

```sh
docker run -d -p 6001:6001 \
  -e PORT=6001 \
  -e DATA_ROOT_DIR=/data \
  -e CONFIG_PATH=.obsidian \
  -v /home/my-user/my-vault:/data \
  --network my-custom-network \
  -e EVENT_CHANNEL=file:///event-channel \
  -v /tmp/event-channel:/event-channel \
  --name obs-viewer obs-viewer
```

Note: When using `EVENT_CHANNEL=file:///event-channel`, the `/event-channel` file must exist inside the container before starting. You can create it as a regular file (`touch /tmp/event-channel`) or a named pipe (`mkfifo /tmp/event-channel`) on the host — the bind mount makes it available at `/event-channel`.

### Serving static files with Nginx

After running `npm run build`, the `frontend/dist/` directory contains the compiled React SPA. Point Nginx's `root` there and proxy `/api` to the Node backend:

```nginx
server {
    listen 80;
    server_name example.com;
    root /path/to/frontend/dist;
    try_files $uri /index.html;

    location /api {
        proxy_pass http://127.0.0.1:5000;
    }
}
```

The backend also serves the frontend when you run it directly (via `npm run start`), so both deployment styles are supported — Nginx for production serving, Node for development or simpler setups.

### Authentication

This application does **not** include any authentication or authorization system. If you need to restrict access, you must implement it at the web server layer (e.g. Nginx basic auth) or place the app behind a private network (e.g. a VPN or tailnet). For example, with Nginx you can use HTTP Basic Auth:

```nginx
server {
    listen 80;
    server_name example.com;

    auth_basic "Restricted";
    auth_basic_user_file /etc/nginx/.htpasswd;

    root /path/to/frontend/dist;
    try_files $uri /index.html;

    location /api {
        proxy_pass http://127.0.0.1:5000;
    }
}
```
