const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const {
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
} = require("../src/lib/fileUtils");

describe("shouldIgnoreFile", () => {
  it("ignores dot-prefixed entries", () => {
    assert.equal(shouldIgnoreFile(".git"), true);
    assert.equal(shouldIgnoreFile(".DS_Store"), true);
    assert.equal(shouldIgnoreFile(".env"), true);
  });

  it("does not ignore normal entries", () => {
    assert.equal(shouldIgnoreFile("README.md"), false);
    assert.equal(shouldIgnoreFile("notes.md"), false);
    assert.equal(shouldIgnoreFile("src"), false);
  });

  it("does not ignore entries with dots elsewhere", () => {
    assert.equal(shouldIgnoreFile("image.png"), false);
    assert.equal(shouldIgnoreFile("foo.bar.txt"), false);
  });
});

describe("ensureTrailingNewline", () => {
  it("returns empty string for empty input", () => {
    assert.equal(ensureTrailingNewline(""), "");
    assert.equal(ensureTrailingNewline(), "");
  });

  it("adds newline when missing", () => {
    assert.equal(ensureTrailingNewline("hello"), "hello\n");
    assert.equal(ensureTrailingNewline("line1\nline2"), "line1\nline2\n");
  });

  it("preserves existing trailing newline", () => {
    assert.equal(ensureTrailingNewline("hello\n"), "hello\n");
    assert.equal(ensureTrailingNewline("hello\n\n"), "hello\n\n");
  });

  it("handles content with only newlines", () => {
    assert.equal(ensureTrailingNewline("\n"), "\n");
  });
});

describe("assertPathInsideRoot", () => {
  it("does not throw when path is inside root", () => {
    assert.doesNotThrow(() =>
      assertPathInsideRoot("/root", "/root/foo/file.md"),
    );
    assert.doesNotThrow(() => assertPathInsideRoot("/root", "/root"));
  });

  it("throws FileAccessDeniedError when path escapes root", () => {
    assert.throws(
      () => assertPathInsideRoot("/root", "/etc/passwd"),
      FileAccessDeniedError,
    );
    assert.throws(
      () => assertPathInsideRoot("/root", "/other/file.md"),
      FileAccessDeniedError,
    );
  });

  it("throws when path is a substring prefix but not inside", () => {
    assert.throws(
      () => assertPathInsideRoot("/home/user", "/home/usertwo/file.md"),
      FileAccessDeniedError,
    );
  });

  it("allows rootDir itself as a valid path", () => {
    assert.doesNotThrow(() => assertPathInsideRoot("/root", "/root"));
    assert.doesNotThrow(() => assertPathInsideRoot("/home/user", "/home/user"));
  });
});

describe("isTextType", () => {
  it("returns true for text and markdown", () => {
    assert.equal(isTextType("text"), true);
    assert.equal(isTextType("markdown"), true);
  });

  it("returns false for non-text types", () => {
    assert.equal(isTextType("image"), false);
    assert.equal(isTextType("audio"), false);
    assert.equal(isTextType("video"), false);
    assert.equal(isTextType("binary"), false);
    assert.equal(isTextType(""), false);
  });
});

describe("resolveRawPath", () => {
  it("resolves relative path against root", () => {
    const result = resolveRawPath("/root", "notes.md");
    assert.ok(result.startsWith("/root"));
    assert.ok(result.endsWith("notes.md"));
  });

  it("resolves relative to current when current is provided", () => {
    const result = resolveRawPath("/root", "../image.png", "notes/2024/doc.md");
    const expected = path.resolve("/root", "notes", "image.png");
    assert.equal(result, expected);
  });

  it("resolves dot path against root", () => {
    const result = resolveRawPath("/root", "./sub/file.md");
    assert.ok(result.startsWith("/root"));
    assert.ok(result.endsWith("sub/file.md"));
  });

  it("throws when resolved path escapes root via traversal", () => {
    assert.throws(
      () => resolveRawPath("/root", "../../../etc/passwd"),
      FileAccessDeniedError,
    );
  });

  it("throws when current helps escape root via traversal", () => {
    assert.throws(
      () => resolveRawPath("/root", "../../../etc/passwd", "notes/2024/"),
      FileAccessDeniedError,
    );
  });

  it("resolves empty relative path to root", () => {
    const result = resolveRawPath("/root", "");
    const expected = path.resolve("/root", "");
    assert.equal(result, expected);
  });
});

describe("classifyByMimeAndExt", () => {
  it("classifies MIME types", () => {
    assert.equal(classifyByMimeAndExt("image/png", null), "image");
    assert.equal(classifyByMimeAndExt("image/jpeg", null), "image");
    assert.equal(classifyByMimeAndExt("image/svg+xml", null), "image");
    assert.equal(classifyByMimeAndExt("audio/mpeg", null), "audio");
    assert.equal(classifyByMimeAndExt("audio/ogg", null), "audio");
    assert.equal(classifyByMimeAndExt("video/mp4", null), "video");
    assert.equal(classifyByMimeAndExt("video/webm", null), "video");
    assert.equal(classifyByMimeAndExt("application/pdf", null), "binary");
    assert.equal(classifyByMimeAndExt("application/zip", null), "binary");
  });

  it("classifies by extension when no MIME", () => {
    assert.equal(classifyByMimeAndExt(null, ".md"), "markdown");
    assert.equal(classifyByMimeAndExt(null, ".MD"), "markdown");
  });

  it("defaults unknown extensions to text", () => {
    assert.equal(classifyByMimeAndExt(null, ".txt"), "text");
    assert.equal(classifyByMimeAndExt(null, ".js"), "text");
    assert.equal(classifyByMimeAndExt(null, ".json"), "text");
    assert.equal(classifyByMimeAndExt(null, ".xml"), "text");
  });

  it("prioritizes MIME over extension", () => {
    assert.equal(classifyByMimeAndExt("image/png", ".md"), "image");
  });
});

describe("lineHasCheckbox", () => {
  it("matches dash-prefixed unchecked checkbox", () => {
    assert.equal(lineHasCheckbox("- [ ] buy milk"), true);
    assert.equal(lineHasCheckbox("  - [ ] buy milk"), true);
  });

  it("matches asterisk-prefixed unchecked checkbox", () => {
    assert.equal(lineHasCheckbox("* [ ] buy milk"), true);
    assert.equal(lineHasCheckbox("  * [ ] buy milk"), true);
  });

  it("matches asterisk-prefixed checked checkbox", () => {
    assert.equal(lineHasCheckbox("* [x] buy milk"), true);
  });

  it("matches dash-prefixed checked checkbox", () => {
    assert.equal(lineHasCheckbox("- [x] buy milk"), true);
  });

  it("does not match uppercase X as checked", () => {
    assert.equal(lineHasCheckbox("- [X] buy milk"), false);
  });

  it("matches numbered unchecked checkbox", () => {
    assert.equal(lineHasCheckbox("1. [ ] first task"), true);
    assert.equal(lineHasCheckbox("99. [ ] do stuff"), true);
  });

  it("rejects non-checkbox lines", () => {
    assert.equal(lineHasCheckbox("just text"), false);
    assert.equal(lineHasCheckbox("- [] missing space"), false);
    assert.equal(lineHasCheckbox(""), false);
  });

  it("matches checkbox even when text follows immediately", () => {
    assert.equal(lineHasCheckbox("1. [x]checked"), true);
    assert.equal(lineHasCheckbox("- [ ]no space"), true);
  });

  it("matches with leading whitespace", () => {
    assert.equal(lineHasCheckbox("\t- [ ] task"), true);
    assert.equal(lineHasCheckbox("   1. [ ] task"), true);
  });

  it("matches with text after checkbox", () => {
    assert.equal(lineHasCheckbox("- [ ] task with [brackets]"), true);
    assert.equal(lineHasCheckbox("- [x] done task"), true);
  });

  it("matches checkbox with multiple spaces after list marker", () => {
    assert.equal(lineHasCheckbox("-  [ ] buy milk"), true);
    assert.equal(lineHasCheckbox("-   [ ] buy milk"), true);
    assert.equal(lineHasCheckbox("*  [ ] buy milk"), true);
    assert.equal(lineHasCheckbox("*   [x] buy milk"), true);
    assert.equal(lineHasCheckbox("  -  [ ] buy milk"), true);
  });

  it("matches numbered checkbox with multiple spaces", () => {
    assert.equal(lineHasCheckbox("1.  [ ] first task"), true);
    assert.equal(lineHasCheckbox("1.   [x] first task"), true);
    assert.equal(lineHasCheckbox("99.  [ ] do stuff"), true);
  });
});

describe("toggleCheckboxInLine", () => {
  it("toggles unchecked to checked", () => {
    assert.equal(
      toggleCheckboxInLine("- [ ] buy milk", true),
      "- [x] buy milk",
    );
    assert.equal(
      toggleCheckboxInLine("* [ ] buy milk", true),
      "* [x] buy milk",
    );
  });

  it("toggles checked to unchecked", () => {
    assert.equal(
      toggleCheckboxInLine("- [x] buy milk", false),
      "- [ ] buy milk",
    );
    assert.equal(
      toggleCheckboxInLine("* [x] buy milk", false),
      "* [ ] buy milk",
    );
  });

  it("handles uppercase X in checkbox", () => {
    assert.equal(
      toggleCheckboxInLine("- [X] buy milk", false),
      "- [ ] buy milk",
    );
    assert.equal(
      toggleCheckboxInLine("* [X] buy milk", false),
      "* [ ] buy milk",
    );
  });

  it("handles numbered lists", () => {
    assert.equal(toggleCheckboxInLine("1. [ ] first", true), "1. [x] first");
    assert.equal(
      toggleCheckboxInLine("99. [x] do stuff", false),
      "99. [ ] do stuff",
    );
  });

  it("preserves leading whitespace", () => {
    assert.equal(
      toggleCheckboxInLine("    - [ ] task", true),
      "    - [x] task",
    );
    assert.equal(
      toggleCheckboxInLine("    * [ ] task", true),
      "    * [x] task",
    );
  });

  it("preserves multiple spaces after list marker", () => {
    assert.equal(
      toggleCheckboxInLine("-  [ ] buy milk", true),
      "-  [x] buy milk",
    );
    assert.equal(
      toggleCheckboxInLine("*   [ ] buy milk", false),
      "*   [ ] buy milk",
    );
    assert.equal(
      toggleCheckboxInLine("-  [x] buy milk", false),
      "-  [ ] buy milk",
    );
    assert.equal(toggleCheckboxInLine("1.  [ ] first", true), "1.  [x] first");
  });
});

describe("toggleCheckboxInContent", () => {
  it("toggles a checkbox in a multiline document", () => {
    const content = "- [ ] first\n- [x] second\n- [ ] third\n";
    const result = toggleCheckboxInContent(content, 1, true);
    assert.equal(result.content, "- [x] first\n- [x] second\n- [ ] third\n");
    assert.equal(result.error, null);
  });

  it("toggles asterisk-prefixed checkbox in a document", () => {
    const content = "* [ ] first\n* [x] second\n* [ ] third\n";
    const result = toggleCheckboxInContent(content, 1, true);
    assert.equal(result.content, "* [x] first\n* [x] second\n* [ ] third\n");
    assert.equal(result.error, null);
  });

  it("returns NO_CHECKBOX for lines without checkboxes", () => {
    const content = "plain text\n- [ ] task\n";
    const result = toggleCheckboxInContent(content, 1, true);
    assert.equal(result.content, null);
    assert.equal(result.error, "NO_CHECKBOX");
  });

  it("returns INVALID_LINE for out-of-range lines", () => {
    const content = "- [ ] task\n";
    assert.equal(
      toggleCheckboxInContent(content, 0, true).error,
      "INVALID_LINE",
    );
    assert.equal(
      toggleCheckboxInContent(content, 5, true).error,
      "INVALID_LINE",
    );
  });

  it("ensures trailing newline in result", () => {
    const content = "- [ ] task\n- [ ] another";
    const result = toggleCheckboxInContent(content, 1, true);
    assert.ok(result.content.endsWith("\n"));
  });

  it("handles checkbox toggle at end of file", () => {
    const content = "some text\n- [ ] last task";
    const result = toggleCheckboxInContent(content, 2, true);
    assert.equal(result.content, "some text\n- [x] last task\n");
  });

  it("toggles checkbox with multiple spaces after list marker", () => {
    const content = "-  [ ] first\n*  [x] second\n*   [ ] third\n";
    const result = toggleCheckboxInContent(content, 1, true);
    assert.equal(result.error, null);
    assert.ok(result.content.includes("-  [x] first"));
    assert.ok(result.content.includes("*  [x] second"));
    assert.ok(result.content.includes("*   [ ] third"));
  });
});

describe("parseFindRecentOutput", () => {
  const createLine = (ts, filePath) => `${ts}\t${filePath}`;

  it("parses valid find output", () => {
    const now = Date.now() / 1000;
    const stdout =
      createLine(now, "/root/file1.md") +
      "\n" +
      createLine(now - 100, "/root/file2.md");
    const result = parseFindRecentOutput(stdout, "/root", 10);
    assert.equal(result.length, 2);
    assert.equal(result[0].path, "file1.md");
    assert.equal(result[1].path, "file2.md");
  });

  it("sorts by mtime descending", () => {
    const now = Date.now() / 1000;
    const stdout =
      createLine(now - 200, "/root/oldest") +
      "\n" +
      createLine(now, "/root/newest") +
      "\n" +
      createLine(now - 100, "/root/middle");
    const result = parseFindRecentOutput(stdout, "/root", 10);
    assert.equal(result[0].path, "newest");
    assert.equal(result[1].path, "middle");
    assert.equal(result[2].path, "oldest");
  });

  it("limits results to n", () => {
    const now = Date.now() / 1000;
    const lines = [];
    for (let i = 0; i < 10; i++) {
      lines.push(createLine(now - i * 10, `/root/file${i}`));
    }
    const result = parseFindRecentOutput(lines.join("\n"), "/root", 3);
    assert.equal(result.length, 3);
  });

  it("returns empty array for empty stdout", () => {
    assert.deepEqual(parseFindRecentOutput("", "/root", 10), []);
    assert.deepEqual(parseFindRecentOutput("\n", "/root", 10), []);
  });

  it("computes relative paths correctly", () => {
    const stdout = createLine(1720000000, "/root/sub/dir/file.md");
    const result = parseFindRecentOutput(stdout, "/root", 10);
    assert.equal(result[0].path, "sub/dir/file.md");
  });
});

describe("parseFindSearchOutput", () => {
  it("parses find output to relative paths", () => {
    const result = parseFindSearchOutput(
      "/root/notes.md\n/root/src/app.js\n",
      "/root",
    );
    assert.deepEqual(result, ["notes.md", "src/app.js"]);
  });

  it("returns empty array for empty input", () => {
    assert.deepEqual(parseFindSearchOutput("", "/root"), []);
    assert.deepEqual(parseFindSearchOutput("\n\n", "/root"), []);
  });
});

describe("parseRgOutput", () => {
  it("parses and limits rg output", () => {
    const lines = Array.from(
      { length: 60 },
      (_, i) => `/root/file${i}.md`,
    ).join("\n");
    const result = parseRgOutput(lines, "/root", 50);
    assert.equal(result.length, 50);
    assert.equal(result[0], "file0.md");
  });

  it("returns empty array for empty input", () => {
    assert.deepEqual(parseRgOutput("", "/root", 50), []);
  });

  it("returns relative paths from absolute paths", () => {
    const result = parseRgOutput("/root/sub/deep/file.md\n", "/root", 50);
    assert.deepEqual(result, ["sub/deep/file.md"]);
  });
});
