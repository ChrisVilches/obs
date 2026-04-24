import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import MarkdownImage from "../components/viewers/markdown/MarkdownImage";

describe("MarkdownImage", () => {
  test("keeps external URLs unchanged", () => {
    render(
      <MarkdownImage
        src="https://example.com/photo.png"
        alt="External"
        file="current.md"
      />,
    );
    const img = screen.getByAltText("External");
    expect(img).toHaveAttribute("src", "https://example.com/photo.png");
  });

  test("transforms local relative paths with current file context", () => {
    render(
      <MarkdownImage
        src="assets/img.png"
        alt="Local"
        file="docs/readme.md"
      />,
    );
    const img = screen.getByAltText("Local");
    expect(img).toHaveAttribute(
      "src",
      "api/files/raw?file=assets/img.png&current=docs/readme.md",
    );
  });

  test("transforms local absolute paths", () => {
    render(
      <MarkdownImage
        src="/images/logo.png"
        alt="Logo"
        file="index.md"
      />,
    );
    const img = screen.getByAltText("Logo");
    expect(img).toHaveAttribute(
      "src",
      "api/files/raw?file=/images/logo.png&current=index.md",
    );
  });

  test("renders image with no src fallback", () => {
    render(<MarkdownImage alt="No src" file="test.md" src="" />);
    expect(screen.getByAltText("No src")).toBeInTheDocument();
  });
});
