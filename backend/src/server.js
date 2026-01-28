const express = require('express');
const path = require('path');
const fs = require('fs');

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

function shouldIgnoreFile(entryName) {
  // TODO: This is custom for my current folder. Remove later.
  if (entryName.startsWith("archived")) return true

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

app.get('/api/bookmarks', (req, res) => {
  try {
    const bookmarksPath = path.join(ROOT_DIR, '.obsidian', 'bookmarks.json');
    if (!fs.existsSync(bookmarksPath)) {
      return res.json({ items: [] });
    }
    const data = JSON.parse(fs.readFileSync(bookmarksPath, 'utf-8'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/files', (req, res) => {
  try {
    const files = listFilesRecursive(ROOT_DIR, ROOT_DIR);
    res.json({ files });
  } catch (err) {
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
    res.json({ content });
  } catch (err) {
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
