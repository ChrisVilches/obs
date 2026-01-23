const express = require('express');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
let _fileTypeFromFile;
const { emit } = require('./eventChannel');

// TODO: lots of Sync functions here. Maybe I should use async variants.
// Yes, do it because now the search endpoint is Sync!!!!
// TODO: Refactor logic to a services folder or something similar.

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
  const dir = path.dirname(BOOKMARKS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(BOOKMARKS_FILE)) {
    fs.writeFileSync(BOOKMARKS_FILE, JSON.stringify({ items: [] }, null, 2), 'utf-8');
    return { items: [] };
  }
  const raw = fs.readFileSync(BOOKMARKS_FILE, 'utf-8').trim();
  if (!raw) {
    fs.writeFileSync(BOOKMARKS_FILE, JSON.stringify({ items: [] }, null, 2), 'utf-8');
    return { items: [] };
  }
  return JSON.parse(raw);
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
    const data = readBookmarks();
    if (data.items.some(item => item.path === filePath)) {
      return res.json({ success: true, message: 'Already bookmarked' });
    }
    data.items.push({
      type: 'file',
      path: filePath,
    });
    fs.writeFileSync(BOOKMARKS_FILE, JSON.stringify(data, null, 2), 'utf-8');
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
    const data = readBookmarks();
    data.items = data.items.filter(item => item.path !== filePath);
    fs.writeFileSync(BOOKMARKS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    emit({ type: 'file_unbookmarked', file: filePath, timestamp: new Date().toISOString() });
    res.json({ success: true, message: 'Unbookmarked' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// TODO: Not sure about this. Might be inefficient.
app.get('/api/files/search', (req, res) => {
  try {
    const q = req.query.q;
    if (!q || !q.trim()) {
      return res.json({ files: [], contentMatches: [] });
    }
    const query = q.trim().toLowerCase();

    let files = [];
    try {
      const stdout = execFileSync('find', [
        ROOT_DIR,
        '-type', 'f',
        '-iname', `*${query}*`,
        '!', '-name', '.*',
        '!', '-path', '*/.*',
      ], { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
      files = stdout.trim().split('\n').filter(Boolean).map(f => path.relative(ROOT_DIR, f));
    } catch (_) { }

    let contentMatches = [];
    try {
      const escapedQuery = query.replace(/'/g, "'\\''");
      const cmd = `grep -srilF '${escapedQuery}' '${ROOT_DIR}' --exclude-dir='.*' --exclude='.*' | head -n 50`;
      const stdout = execFileSync('sh', ['-c', cmd], { encoding: 'utf-8' });
      contentMatches = stdout.trim().split('\n').filter(Boolean).map(f => path.relative(ROOT_DIR, f));
    } catch (err) {
      contentMatches = (err.stdout || '').trim().split('\n').filter(Boolean).map(f => path.relative(ROOT_DIR, f));
    }

    const fileSet = new Set(files);
    contentMatches = contentMatches.filter(f => !fileSet.has(f));

    res.json({ files, contentMatches });
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

// TODO: works better than mime-types, but still doesn't get which text file is
// a source code or just plain text.
async function classifyFile(fullPath) {
  if (!_fileTypeFromFile) {
    _fileTypeFromFile = (await import('file-type')).fileTypeFromFile;
  }

  const result = await _fileTypeFromFile(fullPath);

  if (result) {
    const mime = result.mime;
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('audio/')) return 'audio';
    if (mime.startsWith('video/')) return 'video';
    return 'binary';
  }

  const ext = path.extname(fullPath).toLowerCase();
  if (ext === '.md') return 'markdown';

  return 'text';
}

const TEXT_TYPES = new Set(['text', 'markdown']);

app.get('/api/files/info', async (req, res) => {
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

    const stat = fs.statSync(fullPath);
    const type = await classifyFile(fullPath);
    const bookmarkData = readBookmarks();
    const isBookmarked = bookmarkData.items.some(item => item.path === relativePath);

    const result = { type, isBookmarked, mtime: stat.mtime.toISOString() };

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

// app.get('/api/files/content', (req, res) => {
//   try {
//     const relativePath = req.query.file;
//     if (!relativePath) {
//       return res.status(400).json({ error: 'Missing "file" query parameter' });
//     }
//     const fullPath = path.join(ROOT_DIR, relativePath);
//     if (!fullPath.startsWith(ROOT_DIR)) {
//       return res.status(403).json({ error: 'Access denied' });
//     }
//     const stat = fs.statSync(fullPath);
//     const content = fs.readFileSync(fullPath, 'utf-8');
//     const bookmarkData = readBookmarks();
//     const isBookmarked = bookmarkData.items.some(item => item.path === relativePath);
//     res.json({ content, isBookmarked, mtime: stat.mtime.toISOString() });
//   } catch (err) {
//     if (err.code === 'ENOENT') {
//       return res.status(404).json({ error: 'File not found' });
//     }
//     res.status(500).json({ error: err.message });
//   }
// });

// TODO: Large files don't work (and the error isn't pretty, so at least fix the error)
app.put('/api/files/content', (req, res) => {
  try {
    // TODO: Test the force flag by pushing from PC and then editing on browser, or similar combinations.
    // (so far I've only tested it on one PC, but I'm not sure if Git modifies the timestamps correctly).
    const { file, content, mtime, force } = req.body;
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

    if (mtime && !force && fs.existsSync(fullPath)) {
      const stat = fs.statSync(fullPath);
      if (stat.mtime.toISOString() !== mtime) {
        return res.status(409).json({ error: 'VERSION_CONFLICT' });
      }
    }

    const existing = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf-8') : '';
    if (existing === content) {
      return res.json({ success: true, message: 'No changes' });
    }
    fs.writeFileSync(fullPath, content, 'utf-8');
    const newStat = fs.statSync(fullPath);
    emit({ type: 'file_updated', file, timestamp: new Date().toISOString() });
    res.json({ success: true, message: 'Updated', mtime: newStat.mtime.toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// TODO: Not sure about this. Some caching might be necessary to make it more
// efficient, but I also want to be able to reload the files on demand. Audit
// and consider optimizations.
app.get('/api/files/raw', (req, res) => {
  try {
    let relativePath = req.query.file;
    const current = req.query.current;
    const asAttachment = req.query.attachment === 'true';
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
    if (asAttachment) {
      res.attachment(path.basename(relativePath));
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
