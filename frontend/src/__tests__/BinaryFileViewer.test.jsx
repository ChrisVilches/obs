import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import BinaryFileViewer from "../components/viewers/BinaryFileViewer";

describe("BinaryFileViewer", () => {
  test("renders the file name in the description", () => {
    render(<BinaryFileViewer file="archive.zip" />);
    expect(screen.getByText(/archive\.zip/)).toBeInTheDocument();
  });

  test("renders a download link", () => {
    render(<BinaryFileViewer file="data.bin" />);
    const link = screen.getByRole("link", { name: /download/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href");
  });

  test("renders binary file heading", () => {
    render(<BinaryFileViewer file="x" />);
    expect(screen.getByText("Binary file")).toBeInTheDocument();
  });
});
