import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import MediaViewer from "../components/viewers/MediaViewer";

describe("MediaViewer", () => {
  test("renders an audio element when type is audio", () => {
    const { container } = render(
      <MediaViewer file="song.mp3" type="audio" />,
    );
    expect(container.querySelector("audio")).toBeInTheDocument();
    expect(container.querySelector("video")).not.toBeInTheDocument();
  });

  test("renders a video element when type is video", () => {
    const { container } = render(
      <MediaViewer file="movie.mp4" type="video" />,
    );
    expect(container.querySelector("video")).toBeInTheDocument();
  });

  test("constructs correct src URL for audio", () => {
    const { container } = render(
      <MediaViewer file="music/song.mp3" type="audio" />,
    );
    const audio = container.querySelector("audio");
    expect(audio).toHaveAttribute(
      "src",
      "/api/files/raw?file=music%2Fsong.mp3",
    );
  });

  test("constructs correct src URL for video", () => {
    const { container } = render(
      <MediaViewer file="clips/video.mp4" type="video" />,
    );
    const video = container.querySelector("video");
    expect(video).toHaveAttribute(
      "src",
      "/api/files/raw?file=clips%2Fvideo.mp4",
    );
  });
});
