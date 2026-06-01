function getDefaultBookmarks() {
  return { items: [] };
}

function parseBookmarkData(raw) {
  const trimmed = raw.trim();
  if (!trimmed) {
    return getDefaultBookmarks();
  }
  return JSON.parse(trimmed);
}

function addBookmarkToItems(items, filePath, type) {
  if (items.some((item) => item.path === filePath)) {
    return items;
  }
  return [...items, { type, path: filePath }];
}

function removeBookmarkFromItems(items, filePath) {
  return items.filter((item) => item.path !== filePath);
}

function isFileBookmarked(items, filePath) {
  return items.some((item) => item.path === filePath);
}

function serializeBookmarks(data) {
  return JSON.stringify(data, null, 2);
}

module.exports = {
  getDefaultBookmarks,
  parseBookmarkData,
  addBookmarkToItems,
  removeBookmarkFromItems,
  isFileBookmarked,
  serializeBookmarks,
};
