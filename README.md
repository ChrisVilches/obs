## Dependencies

### Backend (Node.js server)

- **Node.js** v24.16.0 — runtime
- **GNU grep** — required for certain backend operations (e.g., searching file contents)
- **GNU find (findutils)** — required for listing recently modified files
- Packages installed via `npm` (see `backend/package.json`)

### Frontend (Vite / React SPA)

No runtime dependencies. The frontend is compiled to static files and served by the backend.

TODO: Explain how to deploy the frontend and backend individually so that the
web server (Apache, Nginx) renders static files instead of Node.

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
  -e BOOKMARKS_PATH=bookmarks.json \
  -v /path/to/your/files:/data \
  obs-viewer
```

- `PORT` — environment variable for the port the app listens on (defaults to `5000` if not set). Must match the host-side of `-p`.
- `DATA_ROOT_DIR` — **required**. Points to the directory inside the container where your files are mounted.
- `BOOKMARKS_PATH` — **required**. Relative path (resolved against `DATA_ROOT_DIR`) to the bookmarks JSON file. If the file doesn't exist or is empty, it will be initialized with `{ items: [] }`.
- `EVENT_CHANNEL` — optional. Where to emit JSON events (one per line). Supported values: `stdout`, `stderr`, `file:///path/to/file`. Leave unset to disable events. Example: `-e EVENT_CHANNEL=stdout`.
- `-v /path/to/your/files:/data` — bind mount your directory to `/data` (or any path, as long as `DATA_ROOT_DIR` matches).

### Example integrated with an Obsidian vault (bookmarks in `.obsidian/`, events to file)

```sh
docker run -d -p 6001:6001 \
  -e PORT=6001 \
  -e DATA_ROOT_DIR=/data \
  -e BOOKMARKS_PATH=.obsidian/bookmarks.json \
  -v /home/my-user/my-vault:/data \
  --network my-custom-network \
  -e EVENT_CHANNEL=file:///event-channel \
  -v /tmp/event-channel:/event-channel \
  --name obs-viewer obs-viewer
```

Note: When using `EVENT_CHANNEL=file:///event-channel`, the `/event-channel` file must exist inside the container before starting. You can create it as a regular file (`touch /tmp/event-channel`) or a named pipe (`mkfifo /tmp/event-channel`) on the host — the bind mount makes it available at `/event-channel`.
