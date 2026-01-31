# Deploy

## Build the Docker image

```sh
docker build -t obs-viewer .
```

## Run the container

```sh
docker run -p 5000:5000 -e DATA_ROOT_DIR=/data -v /path/to/your/notes:/data obs-viewer
```

- `DATA_ROOT_DIR` — environment variable pointing to the directory inside the container where your notes are mounted.
- `-v /path/to/your/notes:/data` — bind mount your local Obsidian vault to `/data` (or any path, as long as `DATA_ROOT_DIR` matches).
