# Deploy

## Build the Docker image

```sh
docker build -t obs-viewer .
```

## Run the container

```sh
docker run -p 8080:8080 \
  -e PORT=8080 \
  -e DATA_ROOT_DIR=/data \
  -e BOOKMARKS_PATH=/data/bookmarks.json \
  -v /path/to/your/files:/data \
  obs-viewer
```

- `PORT` — environment variable for the port the app listens on (defaults to `5000` if not set). Must match the host-side of `-p`.
- `DATA_ROOT_DIR` — **required**. Points to the directory inside the container where your files are mounted.
- `BOOKMARKS_PATH` — **required**. Path to the bookmarks JSON file. If the file doesn't exist or is empty, it will be initialized with `{ items: [] }`.
- `EVENT_CHANNEL` — optional. Where to emit JSON events (one per line). Supported values: `stdout`, `stderr`, `file:///path/to/file`. Leave unset to disable events. Example: `-e EVENT_CHANNEL=stdout`.
- `-v /path/to/your/files:/data` — bind mount your directory to `/data` (or any path, as long as `DATA_ROOT_DIR` matches).
