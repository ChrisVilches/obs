const path = require("node:path");
const fs = require("node:fs");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const { emit } = require("../eventChannel");
const {
  FileAccessDeniedError,
  shouldIgnoreFile,
  ensureTrailingNewline,
  assertPathInsideRoot,
  isTextType,
  resolveRawPath,
  classifyByMimeAndExt,
  toggleCheckboxInContent,
  parseFindRecentOutput,
} = require("../lib/fileUtils");

const execFileAsync = promisify(execFile);
const { getBookmarks } = require("./bookmarkService");

let _fileTypeFromFile;

class VersionConflictError extends Error {}
class InvalidFileModification extends Error {}

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

  return { recent: parseFindRecentOutput(stdout, rootDir, n) };
}

async function classifyFile(fullPath) {
  _fileTypeFromFile ??= (await import("file-type")).fileTypeFromFile;

  const result = await _fileTypeFromFile(fullPath);
  if (result) {
    return classifyByMimeAndExt(result.mime, null);
  }
  const ext = path.extname(fullPath).toLowerCase();
  return classifyByMimeAndExt(null, ext);
}

async function getTodoFiles(rootDir, n) {
  const { stdout } = await execFileAsync(
    "sh",
    [
      "-c",
      `rg -l '^- \\[ \\] ' '${rootDir}' | while IFS= read -r f; do printf '%s\\t%s\\n' "$(stat -c '%Y' "$f")" "$f"; done | sort -rn | head -n ${n}`,
    ],
    { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 },
  );
  return { todos: parseFindRecentOutput(stdout, rootDir, n) };
}

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

  const result = {
    type,
    isBookmarked,
    mtime: stat.mtime.toISOString(),
    size: stat.size,
  };

  if (isTextType(type)) {
    result.content = await fs.promises.readFile(fullPath, "utf-8");
  }

  return result;
}

async function toggleFileCheckbox(rootDir, file, checked, line, mtime) {
  const fullPath = path.join(rootDir, file);
  assertPathInsideRoot(rootDir, fullPath);

  const stat = await fs.promises.stat(fullPath);
  if (stat.mtime.toISOString() !== mtime) {
    throw new VersionConflictError();
  }

  const content = await fs.promises.readFile(fullPath, "utf-8");

  const result = toggleCheckboxInContent(content, line, checked);
  if (result.error === "NO_CHECKBOX") {
    throw new InvalidFileModification("There is no checkbox at this position");
  }
  if (result.error === "INVALID_LINE") {
    throw new InvalidFileModification("Invalid line number");
  }

  await fs.promises.writeFile(fullPath, result.content, "utf-8");
  emit({
    type: checked ? "file_checkbox_checked" : "file_checkbox_unchecked",
    file,
    timestamp: new Date().toISOString(),
  });
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

module.exports = {
  listFiles,
  getRecentFiles,
  getTodoFiles,
  getFileInfo,
  toggleFileCheckbox,
  writeFileContent,
  resolveRawPath,
  VersionConflictError,
  FileAccessDeniedError,
  InvalidFileModification,
};
