import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { Code } from "../components/viewers/markdown/Code";

describe("Code", () => {
  test("renders inline code when start and end line are the same", () => {
    const node = { position: { start: { line: 1 }, end: { line: 1 } } };
    render(<Code node={node}>const x = 1;</Code>);
    const code = screen.getByText("const x = 1;");
    expect(code.tagName).toBe("CODE");
    expect(code.className).toContain("before:content-none");
  });

  test("renders block code when start and end line differ", () => {
    const node = { position: { start: { line: 1 }, end: { line: 3 } } };
    const { container } = render(<Code node={node}>{'line1\nline2\nline3'}</Code>);
    const code = container.querySelector("code");
    expect(code).toBeInTheDocument();
    expect(code.tagName).toBe("CODE");
    expect(code.textContent).toBe("line1\nline2\nline3");
  });

  test("renders children content", () => {
    const node = { position: { start: { line: 1 }, end: { line: 1 } } };
    render(<Code node={node}>test</Code>);
    expect(screen.getByText("test")).toBeInTheDocument();
  });
});
