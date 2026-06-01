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
    return defaultBookmarkFileContent;
  }

  await fs.promises.mkdir(path.dirname(bookmarksFile), { recursive: true });

  try {
    const raw = await fs.promises.readFile(bookmarksFile, "utf-8");
    const data = parseBookmarkData(raw);
    data.items.reverse();
    return data;
  } catch (err) {
    if (err.code === "ENOENT") {
      return reset();
    }
    throw err;
  }
}

async function addBookmark(bookmarksFile, filePath) {
  const data = await getBookmarks(bookmarksFile);
  const newItems = addBookmarkToItems(data.items, filePath);
  if (newItems !== data.items) {
    data.items = newItems;
    await fs.promises.writeFile(
      bookmarksFile,
      serializeBookmarks(data),
      "utf-8",
    );
  }
  emit({
    type: "file_bookmarked",
    file: filePath,
    timestamp: new Date().toISOString(),
  });
}

async function removeBookmark(bookmarksFile, filePath) {
  const data = await getBookmarks(bookmarksFile);
  data.items = removeBookmarkFromItems(data.items, filePath);
  await fs.promises.writeFile(bookmarksFile, serializeBookmarks(data), "utf-8");
  emit({
    type: "file_unbookmarked",
    file: filePath,
    timestamp: new Date().toISOString(),
  });
}

module.exports = { getBookmarks, addBookmark, removeBookmark };
