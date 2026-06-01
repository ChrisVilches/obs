const path = require("node:path");
const express = require("express");
const expressWinston = require("express-winston");
const logger = require("./logger");
const {
  listFiles,
  getRecentFiles,
  getTodoFiles,
  getFileInfo,
  toggleFileCheckbox,
  writeFileContent,
  resolveRawPath,
  VersionConflictError,
  FileAccessDeniedError,
  InvalidFileModification,
} = require("./services/fileService");
const {
  getBookmarks,
  addBookmark,
  removeBookmark,
} = require("./services/bookmarkService");
const {
  getAppConfig,
  updateAppConfig,
} = require("./services/appConfigService");
const { searchFiles } = require("./services/searchService");
const { getStatus } = require("./services/statusService");
const { z } = require("zod");
const { fromError, createErrorMap } = require("zod-validation-error");
const env = require("./env");
const initApp = require("./initApp");

const { app, ROOT_DIR, BOOKMARKS_FILE, APP_CONFIG_FILE, PORT } = initApp();

z.config({
  customError: createErrorMap(),
});

const pathSchema = z.string().min(1);

if (env.NODE_ENV !== "production") {
  app.use((_req, _res, next) => {
    const time = Math.random() * 400 + 600;
    setTimeout(next, time);
  });
}

app.use(expressWinston.logger({ winstonInstance: logger }));

app.get("/api/bookmarks", async (_req, res) => {
  res.json(await getBookmarks(BOOKMARKS_FILE));
});

app.post("/api/bookmarks", async (req, res) => {
  const { path } = z.object({ path: pathSchema }).parse(req.body);
  await addBookmark(BOOKMARKS_FILE, path, ROOT_DIR);
  res.json({ isBookmarked: true });
});

app.delete("/api/bookmarks", async (req, res) => {
  const { path } = z.object({ path: pathSchema }).parse(req.body);
  await removeBookmark(BOOKMARKS_FILE, path);
  res.json({ isBookmarked: false });
});

app.get("/api/files/search", async (req, res) => {
  const q = (req.query.q ?? "").trim();
  if (!q) {
    return res.json({ files: [], contentMatches: [] });
  }
  res.json(await searchFiles(ROOT_DIR, q.trim().toLowerCase()));
});

app.get("/api/files", async (_req, res) => {
  res.json(await listFiles(ROOT_DIR));
});

app.get("/api/files/recent", async (req, res) => {
  const { n } = z
    .object({ n: z.coerce.number().int().min(5).max(50) })
    .parse(req.query);
  res.json(await getRecentFiles(ROOT_DIR, n));
});

app.get("/api/files/todos", async (req, res) => {
  const { n } = z
    .object({ n: z.coerce.number().int().min(5).max(50) })
    .parse(req.query);
  res.json(await getTodoFiles(ROOT_DIR, n));
});

app.get("/api/files/info", async (req, res) => {
  const { file } = z.object({ file: pathSchema }).parse(req.query);
  res.json(await getFileInfo(ROOT_DIR, BOOKMARKS_FILE, file));
});

app.put("/api/files/content", async (req, res) => {
  const { file, content, mtime, force } = z
    .object({
      file: pathSchema,
      content: z
        .string()
        .optional()
        .transform((v) => v ?? ""),
      mtime: z.iso.datetime(),
      force: z.coerce.boolean().default(false),
    })
    .parse(req.body);
  const changed = await writeFileContent(ROOT_DIR, file, content, mtime, force);
  res.json({ modified: changed });
});

app.put("/api/files/checkbox", async (req, res) => {
  const { file, checked, line, mtime } = z
    .object({
      file: pathSchema,
      checked: z.coerce.boolean(),
      line: z.coerce.number().int().min(1),
      mtime: z.iso.datetime(),
    })
    .parse(req.body);
  await toggleFileCheckbox(ROOT_DIR, file, checked, line, mtime);
  res.json(await getFileInfo(ROOT_DIR, BOOKMARKS_FILE, file));
});

app.get("/api/files/raw", (req, res) => {
  const { file, current, attachment } = z
    .object({
      file: pathSchema,
      current: pathSchema.default("./"),
      attachment: z
        .enum(["true", "false"])
        .optional()
        .transform((v) => v === "true"),
    })
    .parse(req.query);

  const fullPath = resolveRawPath(ROOT_DIR, file, current);
  if (attachment) {
    res.attachment(path.basename(file));
  }
  res.sendFile(fullPath);
});

app.get("/api/config", async (_req, res) => {
  res.json(await getAppConfig(APP_CONFIG_FILE));
});

app.patch("/api/config", async (req, res) => {
  const updates = z.object({ strictLineBreaks: z.boolean() }).parse(req.body);
  res.json(await updateAppConfig(APP_CONFIG_FILE, updates));
});

app.get("/api", async (_req, res) => {
  res.json(await getStatus());
});

app.use(express.static(path.join(__dirname, "..", "..", "frontend", "dist")));

app.use((err, _req, res, _next) => {
  if (err instanceof z.ZodError) {
    return res.status(400).json({ error: fromError(err).toString() });
  }
  if (err.code === "ENOENT") {
    return res.status(404).json({ error: "File not found" });
  }
  if (err instanceof VersionConflictError) {
    return res
      .status(409)
      .json({ error: "Version conflict", code: "VERSION_CONFLICT" });
  }
  if (err instanceof FileAccessDeniedError) {
    return res.status(403).json({ error: "Access denied" });
  }
  if (err instanceof InvalidFileModification) {
    return res.status(400).json({ error: err.message });
  }

  logger.error("unhandled error", { err });
  res.status(500).json({
    error:
      env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
});

app.use((_req, res) => {
  res.sendFile(
    path.join(__dirname, "..", "..", "frontend", "dist", "index.html"),
  );
});

app.listen(PORT, () => {
  logger.info("server started", { port: PORT, rootDir: ROOT_DIR });
});
