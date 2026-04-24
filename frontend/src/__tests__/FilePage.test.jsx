import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, test, vi } from "vitest";

vi.mock("../components/FileViewer", () => ({
  default: function MockFileViewer({ file }) {
    return <div data-testid="file-viewer">{file}</div>;
  },
}));

import FilePage from "../pages/FilePage";

function renderFilePage(initialEntries = ["/file?f=myfile.md"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/file" element={<FilePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("FilePage", () => {
  test('renders "No file specified" when f param is missing', () => {
    renderFilePage(["/file"]);
    expect(screen.getByText("No file specified.")).toBeInTheDocument();
  });

  test("renders FileViewer when f param is present", () => {
    renderFilePage(["/file?f=readme.md"]);
    expect(screen.getByTestId("file-viewer")).toBeInTheDocument();
    expect(screen.getByText("readme.md")).toBeInTheDocument();
  });
});
