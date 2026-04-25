import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test, vi } from "vitest";
import FileList from "../components/FileList";

function renderFileList(props = {}) {
  return render(
    <MemoryRouter>
      <FileList items={[]} emptyMessage="No files found." {...props} />
    </MemoryRouter>,
  );
}

describe("FileList", () => {
  test("renders loading skeleton when loading is true", () => {
    const { container } = renderFileList({ loading: true });
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  test("renders empty message when no items and not loading", () => {
    renderFileList();
    expect(screen.getByText("No files found.")).toBeInTheDocument();
  });

  test("renders custom empty message", () => {
    renderFileList({ emptyMessage: "Nothing here" });
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });

  test("renders file items as links", () => {
    renderFileList({
      items: [{ path: "dir/file1.md" }, { path: "file2.txt" }],
    });
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/file?f=dir%2Ffile1.md");
    expect(links[1]).toHaveAttribute("href", "/file?f=file2.txt");
  });

  test("renders file names from path", () => {
    renderFileList({
      items: [{ path: "docs/readme.md" }, { path: "notes.txt" }],
    });
    expect(screen.getByText("readme.md")).toBeInTheDocument();
    expect(screen.getByText("notes.txt")).toBeInTheDocument();
  });

  test("calls onItemClick when item is clicked", () => {
    const onItemClick = vi.fn();
    renderFileList({
      items: [{ path: "file.txt" }],
      onItemClick,
    });
    screen.getByRole("link").click();
    expect(onItemClick).toHaveBeenCalledWith({ path: "file.txt" });
  });

  test("shows time column when showTime and mtime are present", () => {
    renderFileList({
      showTime: true,
      items: [{ path: "x.txt", mtime: new Date().toISOString() }],
    });
    expect(screen.getByText("just now")).toBeInTheDocument();
  });

  test("highlights selected index", () => {
    renderFileList({
      items: [{ path: "a.md" }, { path: "b.md" }, { path: "c.md" }],
      selectedIndex: 1,
    });
    const links = screen.getAllByRole("link");
    expect(links[1].className).not.toContain("text-gray-400");
    expect(links[0].className).toContain("text-gray-400");
  });
});
