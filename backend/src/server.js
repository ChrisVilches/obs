const path = require('path');
const express = require('express');
const { listFiles, getRecentFiles, getFileInfo, writeFileContent, resolveRawPath, VersionConflictError, FileAccessDeniedError } = require('./services/fileService');
const { getBookmarks, addBookmark, removeBookmark } = require('./services/bookmarkService');
const { searchFiles } = require('./services/searchService');
const { getStatus } = require('./services/statusService');
const { z } = require('zod');
const { fromError, createErrorMap } = require('zod-validation-error');
const initApp = require('./initApp');

// TODO: try to add a formatter and linter, but a very simple one since I'm
// mostly vibe coding.

const { app, ROOT_DIR, BOOKMARKS_FILE, PORT } = initApp();

z.config({
  customError: createErrorMap(),
});

const pathSchema = z.string().min(1)

if (process.env.NODE_ENV !== 'production') {
  app.use((_req, _res, next) => {
    const time = (Math.random() * 400) + 600
    setTimeout(next, time);
  });
}

if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      console.log(`${req.method} ${req.url} ${res.statusCode} ${Date.now() - start}ms`);
    });
    next();
  });
}

app.get('/api/bookmarks', async (_req, res) => {
  res.json(await getBookmarks(BOOKMARKS_FILE));
});

app.post('/api/bookmarks', async (req, res) => {
  const { path } = z.object({ path: pathSchema }).parse(req.body);
  await addBookmark(BOOKMARKS_FILE, path)
  res.json({ isBookmarked: true })
});

app.delete('/api/bookmarks', async (req, res) => {
  const { path } = z.object({ path: pathSchema }).parse(req.body);
  await removeBookmark(BOOKMARKS_FILE, path)
  res.json({ isBookmarked: false })
});

app.get('/api/files/search', async (req, res) => {
  const q = (req.query.q ?? '').trim();
  if (!q) {
    return res.json({ files: [], contentMatches: [] });
  }
  res.json(await searchFiles(ROOT_DIR, q.trim().toLowerCase()));
});

app.get('/api/files', async (_req, res) => {
  res.json(await listFiles(ROOT_DIR));
});

app.get('/api/files/recent', async (req, res) => {
  const { n } = z.object({ n: z.coerce.number().int().min(5).max(50) }).parse(req.query);
  res.json(await getRecentFiles(ROOT_DIR, n));
});

app.get('/api/files/info', async (req, res) => {
  const { file } = z.object({ file: pathSchema }).parse(req.query);
  res.json(await getFileInfo(ROOT_DIR, BOOKMARKS_FILE, file));
});

app.put('/api/files/content', async (req, res) => {
  const { file, content, mtime, force } = z.object({
    file: pathSchema,
    content: z.string().optional().transform(v => v ?? ''),
    mtime: z.iso.datetime(),
    force: z.coerce.boolean().default(false),
  }).parse(req.body);
  const changed = await writeFileContent(ROOT_DIR, file, content, mtime, force)
  res.json({ success: true, modified: changed });
});

app.get('/api/files/raw', (req, res) => {
  const { file, current, attachment } = z.object({
    file: pathSchema,
    current: pathSchema.default('./'),
    attachment: z.enum(['true', 'false']).optional().transform(v => v === 'true'),
  }).parse(req.query);

  const fullPath = resolveRawPath(ROOT_DIR, file, current);
  if (attachment) {
    res.attachment(path.basename(file));
  }
  res.sendFile(fullPath);
});

app.get('/api', (req, res) => {
  res.json(getStatus());
});

app.use(express.static(path.join(__dirname, '..', '..', 'frontend', 'dist')));

app.use((err, _req, res, _next) => {
  if (err instanceof z.ZodError) {
    return res.status(400).json({ error: fromError(err).toString() });
  }
  if (err.code === 'ENOENT') {
    console.log(err)
    return res.status(404).json({ error: 'File not found' });
  }
  if (err instanceof VersionConflictError) {
    return res.status(409).json({ error: 'Version conflict', code: 'VERSION_CONFLICT' });
  }
  if (err instanceof FileAccessDeniedError) {
    return res.status(403).json({ error: 'Access denied' });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ error: err.message });
});

app.use((_req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Serving notes from: ${ROOT_DIR}`);
});
