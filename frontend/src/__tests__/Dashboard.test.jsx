import { render, screen } from "@testing-library/react";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { SWRConfig } from "swr";
import { describe, expect, test, vi } from "vitest";

vi.mock("../utils/fetcher", () => ({
  fetcher: vi.fn(),
}));

import Dashboard from "../pages/Dashboard";
import { fetcher } from "../utils/fetcher";

function renderDashboard() {
  const setLayoutTopContent = vi.fn();
  return render(
    <MemoryRouter>
      <SWRConfig
        value={{
          fetcher,
          revalidateOnFocus: false,
          provider: () => new Map(),
        }}
      >
        <Routes>
          <Route element={<Outlet context={{ setLayoutTopContent }} />}>
            <Route index element={<Dashboard />} />
          </Route>
        </Routes>
      </SWRConfig>
    </MemoryRouter>,
  );
}

describe("Dashboard", () => {
  test("renders loading state for both sections", () => {
    fetcher.mockReturnValue(new Promise(() => {}));

    renderDashboard();

    expect(screen.getByText("Recently Modified")).toBeInTheDocument();
    expect(screen.getByText("Bookmarks")).toBeInTheDocument();
  });

  test("renders recent files and bookmarks from mock", async () => {
    const now = new Date().toISOString();

    fetcher.mockImplementation((url) => {
      if (url.includes("/api/files/recent")) {
        return Promise.resolve({
          recent: [
            { path: "notes.md", mtime: now },
            { path: "todo.md", mtime: now },
          ],
        });
      }
      if (url.includes("/api/bookmarks")) {
        return Promise.resolve({
          items: [{ path: "bookmarked.md" }],
        });
      }
      return Promise.resolve({});
    });

    renderDashboard();

    expect(await screen.findByText("notes.md")).toBeInTheDocument();
    expect(screen.getByText("todo.md")).toBeInTheDocument();
    expect(screen.getByText("bookmarked.md")).toBeInTheDocument();
  });

  test("renders empty messages when no data", async () => {
    fetcher.mockResolvedValue({});

    renderDashboard();

    expect(
      await screen.findByText("No recent files found."),
    ).toBeInTheDocument();
    expect(screen.getByText("No bookmarks found.")).toBeInTheDocument();
  });

  test("shows time column for recent files", async () => {
    const now = new Date().toISOString();

    fetcher.mockImplementation((url) => {
      if (url.includes("/api/files/recent")) {
        return Promise.resolve({ recent: [{ path: "a.md", mtime: now }] });
      }
      return Promise.resolve({ items: [] });
    });

    renderDashboard();

    expect(await screen.findByText("just now")).toBeInTheDocument();
  });
});
