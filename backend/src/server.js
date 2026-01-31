const express = require('express');
const path = require('path');
const fs = require('fs');
const { listFiles, getFileInfo, writeFileContent, resolveRawPath } = require('./services/fileService');
const { getBookmarks, addBookmark, removeBookmark } = require('./services/bookmarkService');
const { searchFiles } = require('./services/searchService');

const app = express();
const PORT = process.env.PORT || 5000;

const ROOT_DIR = process.env.DATA_ROOT_DIR;
if (!ROOT_DIR) {
  console.error('FATAL: DATA_ROOT_DIR environment variable is not set.');
  process.exit(1);
}
if (!fs.existsSync(ROOT_DIR)) {
  console.error(`FATAL: DATA_ROOT_DIR "${ROOT_DIR}" does not exist or is not accessible.`);
  process.exit(1);
}

const BOOKMARKS_REL = process.env.BOOKMARKS_PATH;
if (!BOOKMARKS_REL) {
  console.error('FATAL: BOOKMARKS_PATH environment variable is not set.');
  process.exit(1);
}
const BOOKMARKS_FILE = path.join(ROOT_DIR, BOOKMARKS_REL);

app.use(express.json());

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
  const { path: filePath } = req.body;
  if (!filePath) {
    return res.status(400).json({ error: 'Missing "path" in request body' });
  }
  addBookmark(BOOKMARKS_FILE, filePath)
  res.json({ isBookmarked: true })
});

app.delete('/api/bookmarks', (req, res) => {
  const { path: filePath } = req.body;
  if (!filePath) {
    return res.status(400).json({ error: 'Missing "path" in request body' });
  }
  removeBookmark(BOOKMARKS_FILE, filePath)
  res.json({ isBookmarked: false })
});

app.get('/api/files/search', (req, res) => {
  const q = req.query.q;
  if (!q || !q.trim()) {
    return res.json({ files: [], contentMatches: [] });
  }
  res.json(searchFiles(ROOT_DIR, q.trim().toLowerCase()));
});

app.get('/api/files', (_req, res) => {
  res.json(listFiles(ROOT_DIR));
});

app.get('/api/files/info', async (req, res) => {
  const relativePath = req.query.file;
  if (!relativePath) {
    return res.status(400).json({ error: 'Missing "file" query parameter' });
  }
  res.json(await getFileInfo(ROOT_DIR, BOOKMARKS_FILE, relativePath));
});

app.put('/api/files/content', (req, res) => {
  const { file, content, mtime, force } = req.body;
  if (!file) {
    return res.status(400).json({ error: 'Missing "file" in request body' });
  }
  if (content === undefined) {
    return res.status(400).json({ error: 'Missing "content" in request body' });
  }
  if (!mtime) {
    return res.status(400).json({ error: 'Missing "mtime" in request body' });
  }
  // TODO: what error code does CONFLICT return?
  const changed = writeFileContent(ROOT_DIR, file, content, mtime, force)
  res.json({ success: true, message: changed ? 'Updated' : 'No changes' });
});

app.get('/api/files/raw', (req, res) => {
  const relativePath = req.query.file;
  const current = req.query.current;
  const asAttachment = req.query.attachment === 'true';
  if (!relativePath) {
    return res.status(400).json({ error: 'Missing "file" query parameter' });
  }
  try {
    const fullPath = resolveRawPath(ROOT_DIR, relativePath, current);
    if (asAttachment) {
      res.attachment(path.basename(relativePath));
    }
    res.sendFile(fullPath);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

app.use(express.static(path.join(__dirname, '..', '..', 'frontend', 'dist')));

// TODO: Yep, the custom error should be in the code
// but note, the frontend should be able to see the code as well.
app.use((err, _req, res, _next) => {
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
