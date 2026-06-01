const path = require("node:path");
const fs = require("node:fs");
const { emit } = require("../eventChannel");
const {
  parseBookmarkData,
  addBookmarkToItems,
  removeBookmarkFromItems,
  serializeBookmarks,
} = require("../lib/bookmarkUtils");

const defaultBookmarkFileContent = { items: [] };

async function getBookmarks(bookmarksFile) {
  async function reset() {
    await fs.promises.writeFile(
      bookmarksFile,
      serializeBookmarks(defaultBookmarkFileContent),
      "utf-8",
    );
    return { items: [] };
  }

  await fs.promises.mkdir(path.dirname(bookmarksFile), { recursive: true });

  try {
    const raw = await fs.promises.readFile(bookmarksFile, "utf-8");
    const data = parseBookmarkData(raw);
    data.items.reverse();
    return data;
  } catch (err) {
    if (err.code === "ENOENT") {
      return await reset();
    }
    throw err;
  }
}

async function addBookmark(bookmarksFile, filePath, rootDir) {
  const data = await getBookmarks(bookmarksFile);
  const absPath = path.resolve(rootDir, filePath);
  const stat = await fs.promises.stat(absPath);
  const entryType = stat.isDirectory() ? "folder" : "file";
  const newItems = addBookmarkToItems(data.items, filePath, entryType);
  if (newItems !== data.items) {
    data.items = newItems;
    await fs.promises.writeFile(
      bookmarksFile,
      serializeBookmarks(data),
      "utf-8",
    );
  }
  emit({
    type: "bookmark_added",
    file: filePath,
    timestamp: new Date().toISOString(),
  });
}

async function removeBookmark(bookmarksFile, filePath) {
  const data = await getBookmarks(bookmarksFile);
  data.items = removeBookmarkFromItems(data.items, filePath);
  await fs.promises.writeFile(bookmarksFile, serializeBookmarks(data), "utf-8");
  emit({
    type: "bookmark_removed",
    file: filePath,
    timestamp: new Date().toISOString(),
  });
}

module.exports = { getBookmarks, addBookmark, removeBookmark };
