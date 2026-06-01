const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  getDefaultBookmarks,
  parseBookmarkData,
  addBookmarkToItems,
  removeBookmarkFromItems,
  isFileBookmarked,
  serializeBookmarks,
} = require("../src/lib/bookmarkUtils");

describe("getDefaultBookmarks", () => {
  it("returns structure with empty items array", () => {
    const result = getDefaultBookmarks();
    assert.deepEqual(result, { items: [] });
  });

  it("returns a new object each call", () => {
    const a = getDefaultBookmarks();
    const b = getDefaultBookmarks();
    assert.notEqual(a, b);
    assert.notEqual(a.items, b.items);
  });
});

describe("parseBookmarkData", () => {
  it("parses valid JSON", () => {
    const result = parseBookmarkData(
      JSON.stringify({ items: [{ type: "file", path: "notes.md" }] }),
    );
    assert.deepEqual(result, {
      items: [{ type: "file", path: "notes.md" }],
    });
  });

  it("returns default for empty string", () => {
    const result = parseBookmarkData("");
    assert.deepEqual(result, { items: [] });
  });

  it("returns default for whitespace-only string", () => {
    const result = parseBookmarkData("  \n  ");
    assert.deepEqual(result, { items: [] });
  });

  it("throws on invalid JSON", () => {
    assert.throws(() => parseBookmarkData("{not valid}"), SyntaxError);
  });
});

describe("addBookmarkToItems", () => {
  it("adds a new bookmark item", () => {
    const items = [];
    const result = addBookmarkToItems(items, "notes.md", "file");
    assert.deepEqual(result, [{ type: "file", path: "notes.md" }]);
    assert.notEqual(result, items);
  });

  it("uses folder type when provided", () => {
    const items = [];
    const result = addBookmarkToItems(items, "projects", "folder");
    assert.deepEqual(result, [{ type: "folder", path: "projects" }]);
  });

  it("does not duplicate existing bookmarks", () => {
    const items = [{ type: "file", path: "notes.md" }];
    const result = addBookmarkToItems(items, "notes.md", "file");
    assert.equal(result, items);
  });

  it("adds to existing bookmarks", () => {
    const items = [{ type: "file", path: "notes.md" }];
    const result = addBookmarkToItems(items, "todo.md", "file");
    assert.equal(result.length, 2);
    assert.ok(result.some((i) => i.path === "notes.md"));
    assert.ok(result.some((i) => i.path === "todo.md"));
  });
});

describe("removeBookmarkFromItems", () => {
  it("removes a bookmark by path", () => {
    const items = [{ type: "file", path: "notes.md" }];
    const result = removeBookmarkFromItems(items, "notes.md");
    assert.deepEqual(result, []);
    assert.notEqual(result, items);
  });

  it("returns same structure when path not found", () => {
    const items = [{ type: "file", path: "notes.md" }];
    const result = removeBookmarkFromItems(items, "other.md");
    assert.deepEqual(result, items);
    assert.notEqual(result, items);
  });

  it("only removes matching item", () => {
    const items = [
      { type: "file", path: "notes.md" },
      { type: "file", path: "todo.md" },
    ];
    const result = removeBookmarkFromItems(items, "notes.md");
    assert.deepEqual(result, [{ type: "file", path: "todo.md" }]);
  });
});

describe("isFileBookmarked", () => {
  it("returns true for bookmarked file", () => {
    const items = [
      { type: "file", path: "notes.md" },
      { type: "file", path: "todo.md" },
    ];
    assert.equal(isFileBookmarked(items, "notes.md"), true);
  });

  it("returns false for unbookmarked file", () => {
    const items = [{ type: "file", path: "notes.md" }];
    assert.equal(isFileBookmarked(items, "other.md"), false);
  });

  it("returns false for empty items", () => {
    assert.equal(isFileBookmarked([], "notes.md"), false);
  });
});

describe("serializeBookmarks", () => {
  it("serializes to formatted JSON", () => {
    const result = serializeBookmarks({
      items: [{ type: "file", path: "notes.md" }],
    });
    assert.equal(
      result,
      '{\n  "items": [\n    {\n      "type": "file",\n      "path": "notes.md"\n    }\n  ]\n}',
    );
  });

  it("serializes empty bookmarks", () => {
    const result = serializeBookmarks({ items: [] });
    assert.equal(result, '{\n  "items": []\n}');
  });
});
