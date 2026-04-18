import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

function Hello({ name = "World" }) {
  return <div>Hello {name}</div>;
}

describe("Hello", () => {
  test("renders default greeting", () => {
    render(<Hello />);
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });

  test("renders custom name", () => {
    render(<Hello name="Vitest" />);
    expect(screen.getByText("Hello Vitest")).toBeInTheDocument();
  });
});
