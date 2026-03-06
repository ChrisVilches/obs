const path = require("node:path");
const fs = require("node:fs");
const { emit } = require("../eventChannel");

const defaultBookmarkFileContent = { items: [] };

async function getBookmarks(bookmarksFile) {
  async function reset() {
    await fs.promises.writeFile(
      bookmarksFile,
      JSON.stringify(defaultBookmarkFileContent, null, 2),
      "utf-8",
    );
    return defaultBookmarkFileContent;
  }

  await fs.promises.mkdir(path.dirname(bookmarksFile), { recursive: true });

  try {
    const raw = await fs.promises.readFile(bookmarksFile, "utf-8");
    const trimmed = raw.trim();

    return trimmed ? JSON.parse(trimmed) : reset();
  } catch (err) {
    if (err.code === "ENOENT") {
      return reset();
    }

    throw err;
  }
}

async function addBookmark(bookmarksFile, filePath) {
  const data = await getBookmarks(bookmarksFile);
  if (!data.items.some((item) => item.path === filePath)) {
    data.items.push({ type: "file", path: filePath });
    await fs.promises.writeFile(
      bookmarksFile,
      JSON.stringify(data, null, 2),
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
  data.items = data.items.filter((item) => item.path !== filePath);
  await fs.promises.writeFile(
    bookmarksFile,
    JSON.stringify(data, null, 2),
    "utf-8",
  );
  emit({
    type: "file_unbookmarked",
    file: filePath,
    timestamp: new Date().toISOString(),
  });
}

module.exports = { getBookmarks, addBookmark, removeBookmark };
