const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;
const ROOT_DIR = '/home/felipe/memos';

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
});
