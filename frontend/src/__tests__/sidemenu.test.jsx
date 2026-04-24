import { describe, expect, test } from "vitest";
import { buildTree } from "../components/Sidemenu";

describe("buildTree", () => {
  test("returns empty array for empty input", () => {
    expect(buildTree([])).toEqual([]);
  });

  test("handles a single root-level file", () => {
    const result = buildTree(["file.txt"]);
    expect(result).toEqual([
      { name: "file.txt", type: "file", path: "file.txt" },
    ]);
  });

  test("handles a single file in a directory", () => {
    const result = buildTree(["dir/file.txt"]);
    expect(result).toEqual([
      {
        name: "dir",
        type: "directory",
        path: "dir",
        children: [{ name: "file.txt", type: "file", path: "dir/file.txt" }],
      },
    ]);
  });

  test("handles multiple files in the same directory", () => {
    const result = buildTree(["a/b.txt", "a/c.txt"]);
    expect(result).toEqual([
      {
        name: "a",
        type: "directory",
        path: "a",
        children: [
          { name: "b.txt", type: "file", path: "a/b.txt" },
          { name: "c.txt", type: "file", path: "a/c.txt" },
        ],
      },
    ]);
  });

  test("sorts directories before files", () => {
    const result = buildTree(["a/sub/b.txt", "a/readme.md"]);
    const children = result[0].children;
    expect(children[0].type).toBe("directory");
    expect(children[1].type).toBe("file");
  });

  test("sorts alphabetically within same type", () => {
    const result = buildTree(["a/b.txt", "a/c.txt", "a/a.txt"]);
    const children = result[0].children;
    expect(children[0].name).toBe("a.txt");
    expect(children[1].name).toBe("b.txt");
    expect(children[2].name).toBe("c.txt");
  });

  test("sorts directories alphabetically", () => {
    const result = buildTree(["a/c/file.txt", "a/b/file.txt"]);
    const children = result[0].children;
    expect(children[0].name).toBe("b");
    expect(children[1].name).toBe("c");
  });

  test("handles deeply nested paths", () => {
    const result = buildTree(["a/b/c/d.txt"]);
    expect(result).toEqual([
      {
        name: "a",
        type: "directory",
        path: "a",
        children: [
          {
            name: "b",
            type: "directory",
            path: "a/b",
            children: [
              {
                name: "c",
                type: "directory",
                path: "a/b/c",
                children: [
                  { name: "d.txt", type: "file", path: "a/b/c/d.txt" },
                ],
              },
            ],
          },
        ],
      },
    ]);
  });

  test("handles multiple root-level items", () => {
    const result = buildTree(["b/file.txt", "a/file.txt"]);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("a");
    expect(result[1].name).toBe("b");
  });

  test("deduplicates shared directory paths", () => {
    const result = buildTree(["a/b/c.txt", "a/b/d.txt", "a/e.txt"]);
    expect(result).toEqual([
      {
        name: "a",
        type: "directory",
        path: "a",
        children: [
          {
            name: "b",
            type: "directory",
            path: "a/b",
            children: [
              { name: "c.txt", type: "file", path: "a/b/c.txt" },
              { name: "d.txt", type: "file", path: "a/b/d.txt" },
            ],
          },
          { name: "e.txt", type: "file", path: "a/e.txt" },
        ],
      },
    ]);
  });
});
