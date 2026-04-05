const express = require('express');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');
const { emit } = require('./eventChannel');

// TODO: lots of Sync functions here. Maybe I should use async variants.

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

app.use(express.json());

if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      console.log(`${req.method} ${req.url} ${res.statusCode} ${Date.now() - start}ms`);
    });
    next();
  });
}

function shouldIgnoreFile(entryName) {
  return entryName.startsWith('.');
}

function listFilesRecursive(dir, root) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (shouldIgnoreFile(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(root, fullPath);
    if (entry.isDirectory()) {
      files.push(...listFilesRecursive(fullPath, root));
    } else {
      files.push(relativePath);
    }
  }
  return files;
}

function readBookmarks() {
  const bookmarksPath = path.join(ROOT_DIR, '.obsidian', 'bookmarks.json');
  if (!fs.existsSync(bookmarksPath)) {
    return { items: [] };
  }
  return JSON.parse(fs.readFileSync(bookmarksPath, 'utf-8'));
}

app.get('/api/bookmarks', (req, res) => {
  try {
    res.json(readBookmarks());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bookmarks', (req, res) => {
  try {
    const { path: filePath } = req.body;
    if (!filePath) {
      return res.status(400).json({ error: 'Missing "path" in request body' });
    }
    const bookmarksPath = path.join(ROOT_DIR, '.obsidian', 'bookmarks.json');
    const dir = path.dirname(bookmarksPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const data = fs.existsSync(bookmarksPath)
      ? JSON.parse(fs.readFileSync(bookmarksPath, 'utf-8'))
      : { items: [] };
    if (data.items.some(item => item.path === filePath)) {
      return res.json({ success: true, message: 'Already bookmarked' });
    }
    data.items.push({
      type: 'file',
      path: filePath,
      title: path.basename(filePath),
    });
    fs.writeFileSync(bookmarksPath, JSON.stringify(data, null, 2), 'utf-8');
    emit({ type: 'file_bookmarked', file: filePath, timestamp: new Date().toISOString() });
    res.json({ success: true, message: 'Bookmarked' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/bookmarks', (req, res) => {
  try {
    const filePath = req.query.path;
    if (!filePath) {
      return res.status(400).json({ error: 'Missing "path" query parameter' });
    }
    const bookmarksPath = path.join(ROOT_DIR, '.obsidian', 'bookmarks.json');
    if (!fs.existsSync(bookmarksPath)) {
      return res.json({ success: true, message: 'Not found' });
    }
    const data = JSON.parse(fs.readFileSync(bookmarksPath, 'utf-8'));
    data.items = data.items.filter(item => item.path !== filePath);
    fs.writeFileSync(bookmarksPath, JSON.stringify(data, null, 2), 'utf-8');
    emit({ type: 'file_unbookmarked', file: filePath, timestamp: new Date().toISOString() });
    res.json({ success: true, message: 'Unbookmarked' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/files', (req, res) => {
  try {
    const files = listFilesRecursive(ROOT_DIR, ROOT_DIR);
    const folderName = path.basename(ROOT_DIR);
    res.json({ files, folderName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const TEXT_CODE_TYPES = new Set([
  'application/javascript', 'application/json', 'application/typescript',
  'application/xml', 'application/xhtml+xml', 'application/sql', 'application/yaml',
  'application/ecmascript', 'application/node', 'application/x-csh',
  'application/x-sh', 'application/x-perl', 'application/x-python',
  'application/x-ruby', 'application/x-httpd-php',
]);

function classifyFile(fullPath) {
  const mimeType = mime.lookup(fullPath) || 'text/plain';

  if (mimeType === 'text/markdown') return 'markdown';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('text/')) return 'text';
  if (TEXT_CODE_TYPES.has(mimeType)) return 'text';

  return 'text';
}

const TEXT_TYPES = new Set(['text', 'markdown']);

app.get('/api/files/info', (req, res) => {
  try {
    const relativePath = req.query.file;
    if (!relativePath) {
      return res.status(400).json({ error: 'Missing "file" query parameter' });
    }
    const fullPath = path.join(ROOT_DIR, relativePath);
    if (!fullPath.startsWith(ROOT_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const type = classifyFile(fullPath);
    const bookmarkData = readBookmarks();
    const isBookmarked = bookmarkData.items.some(item => item.path === relativePath);

    const result = { type, isBookmarked };

    if (TEXT_TYPES.has(type)) {
      result.content = fs.readFileSync(fullPath, 'utf-8');
    }

    res.json(result);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return res.status(404).json({ error: 'File not found' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/files/content', (req, res) => {
  try {
    const relativePath = req.query.file;
    if (!relativePath) {
      return res.status(400).json({ error: 'Missing "file" query parameter' });
    }
    const fullPath = path.join(ROOT_DIR, relativePath);
    if (!fullPath.startsWith(ROOT_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const content = fs.readFileSync(fullPath, 'utf-8');
    const bookmarkData = readBookmarks();
    const isBookmarked = bookmarkData.items.some(item => item.path === relativePath);
    res.json({ content, isBookmarked });
  } catch (err) {
    if (err.code === 'ENOENT') {
      return res.status(404).json({ error: 'File not found' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/files/content', (req, res) => {
  try {
    const { file, content } = req.body;
    if (!file) {
      return res.status(400).json({ error: 'Missing "file" in request body' });
    }
    if (content === undefined) {
      return res.status(400).json({ error: 'Missing "content" in request body' });
    }
    const fullPath = path.join(ROOT_DIR, file);
    if (!fullPath.startsWith(ROOT_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const existing = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf-8') : '';
    if (existing === content) {
      return res.json({ success: true, message: 'No changes' });
    }
    fs.writeFileSync(fullPath, content, 'utf-8');
    emit({ type: 'file_updated', file, timestamp: new Date().toISOString() });
    res.json({ success: true, message: 'Updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/files/raw', (req, res) => {
  try {
    let relativePath = req.query.file;
    const current = req.query.current;
    if (!relativePath) {
      return res.status(400).json({ error: 'Missing "file" query parameter' });
    }
    let fullPath;
    if (current) {
      const noteDir = path.dirname(current);
      const baseDir = path.resolve(ROOT_DIR, noteDir);
      fullPath = path.resolve(baseDir, relativePath);
    } else {
      fullPath = path.resolve(ROOT_DIR, relativePath);
    }
    if (!fullPath.startsWith(ROOT_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.sendFile(fullPath);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return res.status(404).json({ error: 'File not found' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.use(express.static(path.join(__dirname, '..', '..', 'frontend', 'dist')));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Serving notes from: ${ROOT_DIR}`);
});
