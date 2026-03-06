const path = require("node:path");
const fs = require("node:fs");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const { emit } = require("../eventChannel");

const execFileAsync = promisify(execFile);
const { getBookmarks } = require("./bookmarkService");

let _fileTypeFromFile;

class VersionConflictError extends Error {}
class FileAccessDeniedError extends Error {}

function shouldIgnoreFile(entryName) {
  return entryName.startsWith(".");
}

function ensureTrailingNewline(fileContent = "") {
  if (fileContent === "") {
    return "";
  }

  return fileContent.endsWith("\n") ? fileContent : `${fileContent}\n`;
}

async function listFiles(rootDir) {
  async function listRecursive(dir) {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      if (shouldIgnoreFile(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(rootDir, fullPath);
      if (entry.isDirectory()) {
        files.push(...(await listRecursive(fullPath)));
      } else {
        files.push(relativePath);
      }
    }
    return files;
  }
  const files = await listRecursive(rootDir);
  const folderName = path.basename(rootDir);
  return { files, folderName };
}

async function getRecentFiles(rootDir, n) {
  const { stdout } = await execFileAsync(
    "find",
    [rootDir, "-type", "f", "!", "-path", "*/.*", "-printf", "%T@\t%p\n"],
    { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 },
  );

  const files = stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const tabIndex = line.indexOf("\t");
      return {
        path: path.relative(rootDir, line.substring(tabIndex + 1)),
        mtime: new Date(
          parseFloat(line.substring(0, tabIndex)) * 1000,
        ).toISOString(),
      };
    })
    .sort((a, b) => b.mtime.localeCompare(a.mtime))
    .slice(0, n);

  return { recent: files };
}

function assertPathInsideRoot(rootDir, fullPath) {
  if (!fullPath.startsWith(rootDir)) {
    throw new FileAccessDeniedError();
  }
}

async function classifyFile(fullPath) {
  if (!_fileTypeFromFile) {
    _fileTypeFromFile = (await import("file-type")).fileTypeFromFile;
  }
  const result = await _fileTypeFromFile(fullPath);
  if (result) {
    const mime = result.mime;
    if (mime.startsWith("image/")) return "image";
    if (mime.startsWith("audio/")) return "audio";
    if (mime.startsWith("video/")) return "video";
    return "binary";
  }
  const ext = path.extname(fullPath).toLowerCase();
  if (ext === ".md") return "markdown";
  return "text";
}

const TEXT_TYPES = new Set(["text", "markdown"]);

async function getFileInfo(rootDir, bookmarksFile, relativePath) {
  const fullPath = path.join(rootDir, relativePath);

  assertPathInsideRoot(rootDir, fullPath);

  const stat = await fs.promises.stat(fullPath);

  const [type, bookmarkData] = await Promise.all([
    classifyFile(fullPath),
    getBookmarks(bookmarksFile),
  ]);

  const isBookmarked = bookmarkData.items.some(
    (item) => item.path === relativePath,
  );

  const result = { type, isBookmarked, mtime: stat.mtime.toISOString() };

  if (TEXT_TYPES.has(type)) {
    result.content = await fs.promises.readFile(fullPath, "utf-8");
  }

  return result;
}

async function writeFileContent(rootDir, file, content, mtime, force) {
  content = ensureTrailingNewline(content);
  const fullPath = path.join(rootDir, file);
  assertPathInsideRoot(rootDir, fullPath);
  if (!force) {
    const stat = await fs.promises.stat(fullPath);
    if (stat.mtime.toISOString() !== mtime) {
      throw new VersionConflictError();
    }
  }

  if ((await fs.promises.readFile(fullPath, "utf-8")) === content) {
    return false;
  }

  await fs.promises.writeFile(fullPath, content, "utf-8");
  emit({ type: "file_updated", file, timestamp: new Date().toISOString() });
  return true;
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

module.exports = {
  listFiles,
  getRecentFiles,
  getFileInfo,
  writeFileContent,
  resolveRawPath,
  VersionConflictError,
  FileAccessDeniedError,
};
