const path = require('path');
const fs = require('fs');
const { emit } = require('../eventChannel');

const defaultBookmarkFileContent = { items: [] }

function writeDefaultValue() {
  fs.writeFileSync(bookmarksFile, JSON.stringify(defaultBookmarkFileContent, null, 2), 'utf-8');
}

function getBookmarks(bookmarksFile) {
  const dir = path.dirname(bookmarksFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(bookmarksFile)) {
    writeDefaultValue();
    return defaultBookmarkFileContent;
  }
  const raw = fs.readFileSync(bookmarksFile, 'utf-8').trim();
  if (!raw) {
    writeDefaultValue()
    return defaultBookmarkFileContent;
  }
  return JSON.parse(raw);
}

function addBookmark(bookmarksFile, filePath) {
  const data = getBookmarks(bookmarksFile);
  if (!data.items.some(item => item.path === filePath)) {
    data.items.push({ type: 'file', path: filePath });
    fs.writeFileSync(bookmarksFile, JSON.stringify(data, null, 2), 'utf-8');
  }
  emit({ type: 'file_bookmarked', file: filePath, timestamp: new Date().toISOString() });
}

function removeBookmark(bookmarksFile, filePath) {
  const data = getBookmarks(bookmarksFile);
  data.items = data.items.filter(item => item.path !== filePath);
  fs.writeFileSync(bookmarksFile, JSON.stringify(data, null, 2), 'utf-8');
  emit({ type: 'file_unbookmarked', file: filePath, timestamp: new Date().toISOString() });
}

module.exports = { getBookmarks, addBookmark, removeBookmark };
