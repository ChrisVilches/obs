import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import TextViewer from "../components/viewers/TextViewer";

describe("TextViewer", () => {
  test("renders the content text", () => {
    const { container } = render(<TextViewer content="Hello world" />);
    expect(container.textContent).toBe("Hello world");
  });

  test("renders empty string when content is empty", () => {
    const { container } = render(<TextViewer content="" />);
    expect(container.textContent).toBe("");
  });

  test("renders multi-line content", () => {
    const { container } = render(<TextViewer content={"line1\nline2\nline3"} />);
    expect(container.querySelector("pre")).toBeInTheDocument();
    expect(container.textContent).toBe("line1\nline2\nline3");
  });

  test("renders a <pre> element", () => {
    const { container } = render(<TextViewer content="test" />);
    expect(container.querySelector("pre")).toBeInTheDocument();
  });
});
