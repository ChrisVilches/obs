const path = require('path');
const fs = require('fs');
const { emit } = require('../eventChannel');
const { getBookmarks } = require('./bookmarkService');

let _fileTypeFromFile;

function shouldIgnoreFile(entryName) {
  return entryName.startsWith('.');
}

function listFiles(rootDir) {
  function listRecursive(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      if (shouldIgnoreFile(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(rootDir, fullPath);
      if (entry.isDirectory()) {
        files.push(...listRecursive(fullPath));
      } else {
        files.push(relativePath);
      }
    }
    return files;
  }
  const files = listRecursive(rootDir);
  const folderName = path.basename(rootDir);
  return { files, folderName };
}

function assertPathInsideRoot(rootDir, fullPath) {
  if (!fullPath.startsWith(rootDir)) {
    const err = new Error('Access denied');
    err.statusCode = 403;
    throw err;
  }
}

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

async function getFileInfo(rootDir, bookmarksFile, relativePath) {
  const fullPath = path.join(rootDir, relativePath);
  assertPathInsideRoot(rootDir, fullPath);
  if (!fs.existsSync(fullPath)) {
    const err = new Error('File not found');
    err.statusCode = 404;
    throw err;
  }
  const stat = fs.statSync(fullPath);
  const type = await classifyFile(fullPath);
  const bookmarkData = getBookmarks(bookmarksFile);
  const isBookmarked = bookmarkData.items.some(item => item.path === relativePath);
  const result = { type, isBookmarked, mtime: stat.mtime.toISOString() };
  if (TEXT_TYPES.has(type)) {
    result.content = fs.readFileSync(fullPath, 'utf-8');
  }
  return result;
}

function writeFileContent(rootDir, file, content, mtime, force) {
  const fullPath = path.join(rootDir, file);
  assertPathInsideRoot(rootDir, fullPath);
  if (!force && fs.existsSync(fullPath)) {
    const stat = fs.statSync(fullPath);
    if (stat.mtime.toISOString() !== mtime) {
      const err = new Error('VERSION_CONFLICT');
      err.statusCode = 409;
      throw err;
    }
  }
  const existing = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf-8') : '';
  if (existing === content) {
    return false
  }
  fs.writeFileSync(fullPath, content, 'utf-8');
  emit({ type: 'file_updated', file, timestamp: new Date().toISOString() });
  return true
}

function resolveRawPath(rootDir, relativePath, current) {
  let fullPath;
  if (current) {
    const noteDir = path.dirname(current);
    const baseDir = path.resolve(rootDir, noteDir);
    fullPath = path.resolve(baseDir, relativePath);
  } else {
    fullPath = path.resolve(rootDir, relativePath);
  }
  assertPathInsideRoot(rootDir, fullPath);
  return fullPath;
}

module.exports = { listFiles, getFileInfo, writeFileContent, resolveRawPath };
