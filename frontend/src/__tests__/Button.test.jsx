import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import Button from "../components/Button";

function TestIcon(props) {
  return <svg data-testid="test-icon" {...props} />;
}

describe("Button", () => {
  test("renders as a button by default", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  test("renders as a link when href is provided", () => {
    render(<Button href="/download">Download</Button>);
    expect(screen.getByRole("link")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/download");
  });

  test("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test("renders children text", () => {
    render(<Button>Save</Button>);
    expect(screen.getByText("Save")).toBeInTheDocument();
  });

  test("renders an icon", () => {
    render(<Button icon={<TestIcon />}>With icon</Button>);
    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
  });

  test("applies primary variant classes", () => {
    render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole("button").className).toContain("text-green-300");
  });

  test("applies danger variant classes", () => {
    render(<Button variant="danger">Delete</Button>);
    expect(screen.getByRole("button").className).toContain("text-red-300");
  });

  test("appends custom className", () => {
    render(<Button className="my-custom">Custom</Button>);
    expect(screen.getByRole("button").className).toContain("my-custom");
  });

  test("defaults to secondary variant", () => {
    render(<Button>Default</Button>);
    expect(screen.getByRole("button").className).toContain("text-gray-300");
  });
});
