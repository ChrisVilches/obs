const path = require('path');
const express = require('express');
const { listFiles, getFileInfo, writeFileContent, resolveRawPath } = require('./services/fileService');
const { getBookmarks, addBookmark, removeBookmark } = require('./services/bookmarkService');
const { searchFiles } = require('./services/searchService');
const { z } = require('zod');
const { fromError, createErrorMap } = require('zod-validation-error');
const initApp = require('./initApp');

const { app, ROOT_DIR, BOOKMARKS_FILE, PORT } = initApp();

z.config({
  customError: createErrorMap(),
});

const pathSchema = z.string().min(1)

if (process.env.NODE_ENV !== 'production') {
  app.use((_req, _res, next) => {
    setTimeout(next, 800);
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

app.get('/api/bookmarks', (_req, res) => {
  res.json(getBookmarks(BOOKMARKS_FILE));
});

app.post('/api/bookmarks', (req, res) => {
  const { path } = z.object({ path: pathSchema }).parse(req.body);
  addBookmark(BOOKMARKS_FILE, path)
  res.json({ isBookmarked: true })
});

app.delete('/api/bookmarks', (req, res) => {
  const { path } = z.object({ path: pathSchema }).parse(req.body);
  removeBookmark(BOOKMARKS_FILE, path)
  res.json({ isBookmarked: false })
});

app.get('/api/files/search', (req, res) => {
  const q = (req.query.q ?? '').trim();
  if (!q) {
    return res.json({ files: [], contentMatches: [] });
  }
  res.json(searchFiles(ROOT_DIR, q.trim().toLowerCase()));
});

app.get('/api/files', (_req, res) => {
  res.json(listFiles(ROOT_DIR));
});

app.get('/api/files/info', async (req, res) => {
  const { file } = z.object({ file: pathSchema }).parse(req.query);
  res.json(await getFileInfo(ROOT_DIR, BOOKMARKS_FILE, file));
});

app.put('/api/files/content', (req, res) => {
  const { file, content, mtime, force } = z.object({
    file: pathSchema,
    content: z.string().optional().transform(v => v ?? ''),
    mtime: z.iso.datetime(),
    force: z.coerce.boolean().default(false),
  }).parse(req.body);
  const changed = writeFileContent(ROOT_DIR, file, content, mtime, force)
  res.json({ success: true, message: changed ? 'Updated' : 'No changes' });
});

app.get('/api/files/raw', (req, res) => {
  const { file, current, attachment } = z.object({
    file: pathSchema,
    current: pathSchema,
    attachment: z.enum(['true', 'false']).optional().transform(v => v === 'true'),
  }).parse(req.query);

  const fullPath = resolveRawPath(ROOT_DIR, file, current);
  if (attachment) {
    res.attachment(path.basename(file));
  }
  res.sendFile(fullPath);
});

app.use(express.static(path.join(__dirname, '..', '..', 'frontend', 'dist')));

// TODO: Yep, the custom error should be in the code
// but note, the frontend should be able to see the code as well.
app.use((err, _req, res, _next) => {
  if (err instanceof z.ZodError) {
    return res.status(400).json({ error: fromError(err).toString() });
  }
  if (err.code === 'ENOENT') {
    return res.status(404).json({ error: 'File not found' });
  }
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: err.message });
});

app.use((_req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Serving notes from: ${ROOT_DIR}`);
});
