import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import ImageViewer from "../components/viewers/ImageViewer";

describe("ImageViewer", () => {
  test("renders an image element", () => {
    render(<ImageViewer file="photo.png" />);
    const img = screen.getByRole("img");
    expect(img).toBeInTheDocument();
  });

  test("uses file name as alt text", () => {
    render(<ImageViewer file="vacation.jpg" />);
    expect(screen.getByAltText("vacation.jpg")).toBeInTheDocument();
  });

  test("constructs correct src URL", () => {
    render(<ImageViewer file="dir/photo.png" />);
    const img = screen.getByAltText("dir/photo.png");
    expect(img).toHaveAttribute(
      "src",
      "/api/files/raw?file=dir%2Fphoto.png",
    );
  });
});
