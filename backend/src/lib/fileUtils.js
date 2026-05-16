const path = require("node:path");

class FileAccessDeniedError extends Error {}

const checkboxRegex = /^\s*([-*]\s|(\d+\.\s))\[[ x]\]/;

function shouldIgnoreFile(entryName) {
  return entryName.startsWith(".");
}

function ensureTrailingNewline(fileContent = "") {
  if (fileContent === "") {
    return "";
  }
  return fileContent.endsWith("\n") ? fileContent : `${fileContent}\n`;
}

function assertPathInsideRoot(rootDir, fullPath) {
  const normalizedRoot = path.resolve(rootDir);
  const normalized = path.resolve(fullPath);
  if (
    normalized !== normalizedRoot &&
    !normalized.startsWith(normalizedRoot + path.sep)
  ) {
    throw new FileAccessDeniedError();
  }
}

function isTextType(type) {
  return type === "text" || type === "markdown";
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

function classifyByMimeAndExt(mime, ext) {
  if (mime) {
    if (mime.startsWith("image/")) return "image";
    if (mime.startsWith("audio/")) return "audio";
    if (mime.startsWith("video/")) return "video";
    return "binary";
  }
  if (ext && ext.toLowerCase() === ".md") return "markdown";
  return "text";
}

function lineHasCheckbox(line) {
  return checkboxRegex.test(line);
}

function toggleCheckboxInLine(line, checked) {
  const bracketPos = line.indexOf("[");
  const afterCheckbox = line.substring(bracketPos + 3);
  if (checked) {
    return line.substring(0, bracketPos) + "[x]" + afterCheckbox;
  }
  return line.substring(0, bracketPos) + "[ ]" + afterCheckbox;
}

function toggleCheckboxInContent(content, lineNumber, checked) {
  const lines = content.split("\n");
  const idx = lineNumber - 1;

  if (idx < 0 || idx >= lines.length) {
    return { content: null, error: "INVALID_LINE" };
  }
  if (!lineHasCheckbox(lines[idx])) {
    return { content: null, error: "NO_CHECKBOX" };
  }

  lines[idx] = toggleCheckboxInLine(lines[idx], checked);
  return { content: ensureTrailingNewline(lines.join("\n")), error: null };
}

function parseFindRecentOutput(stdout, rootDir, limit) {
  return stdout
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
    .slice(0, limit);
}

function parseFindSearchOutput(stdout, rootDir) {
  return stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((f) => path.relative(rootDir, f));
}

function parseRgOutput(stdout, rootDir, limit) {
  return stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .slice(0, limit)
    .map((f) => path.relative(rootDir, f));
}

module.exports = {
  FileAccessDeniedError,
  shouldIgnoreFile,
  ensureTrailingNewline,
  assertPathInsideRoot,
  isTextType,
  resolveRawPath,
  classifyByMimeAndExt,
  lineHasCheckbox,
  toggleCheckboxInLine,
  toggleCheckboxInContent,
  parseFindRecentOutput,
  parseFindSearchOutput,
  parseRgOutput,
};
