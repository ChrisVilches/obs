import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import ErrorDisplay from "../components/ErrorDisplay";

describe("ErrorDisplay", () => {
  test("renders the error message", () => {
    render(<ErrorDisplay message="Something went wrong" />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  test('renders default message when none provided', () => {
    render(<ErrorDisplay />);
    expect(screen.getByText("An error occurred")).toBeInTheDocument();
  });

  test("renders the file path when provided", () => {
    render(
      <ErrorDisplay message="Not found" file="/path/to/file.md" />,
    );
    expect(screen.getByText("/path/to/file.md")).toBeInTheDocument();
  });

  test("does not render file element when file not provided", () => {
    render(<ErrorDisplay message="Oops" />);
    expect(screen.queryByText("Oops")).toBeInTheDocument();
    expect(screen.queryByText("An error occurred")).not.toBeInTheDocument();
  });
});
