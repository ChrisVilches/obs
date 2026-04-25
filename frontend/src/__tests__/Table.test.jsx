import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import Table from "../components/viewers/markdown/Table";

describe("Table", () => {
  test("renders children inside a table", () => {
    render(
      <Table>
        <thead>
          <tr>
            <th>Name</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Alice</td>
          </tr>
        </tbody>
      </Table>,
    );
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  test("wraps table in a div with overflow-auto", () => {
    const { container } = render(
      <Table>
        <tbody>
          <tr>
            <td>x</td>
          </tr>
        </tbody>
      </Table>,
    );
    const wrapper = container.firstChild;
    expect(wrapper.tagName).toBe("DIV");
    expect(wrapper.className).toContain("overflow-x-auto");
  });
});
