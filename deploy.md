# Deploy

## Build the Docker image

```sh
docker build -t obs-viewer .
```

## Run the container

```sh
docker run -p 8080:8080 -e PORT=8080 -e DATA_ROOT_DIR=/data -v /path/to/your/notes:/data obs-viewer
```

- `PORT` — environment variable for the port the app listens on (defaults to `5000` if not set). Must match the host-side of `-p`.
- `DATA_ROOT_DIR` — environment variable pointing to the directory inside the container where your notes are mounted.
- `EVENT_CHANNEL` — optional. Where to emit JSON events (one per line). Supported values: `stdout`, `stderr`, `file:///path/to/file`. Leave unset to disable events. Example: `-e EVENT_CHANNEL=stdout`.
- `-v /path/to/your/notes:/data` — bind mount your local Obsidian vault to `/data` (or any path, as long as `DATA_ROOT_DIR` matches).
