import {
  DocumentIcon,
  DocumentTextIcon,
  MusicalNoteIcon,
  PhotoIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/outline";
import { describe, expect, test } from "vitest";
import {
  dirPath,
  formatRelativeTime,
  getFileIcon,
} from "../components/FileList";

describe("getFileIcon", () => {
  test("returns PhotoIcon for image extensions", () => {
    const imageExtensions = [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "webp",
      "svg",
      "bmp",
      "ico",
      "avif",
    ];
    for (const ext of imageExtensions) {
      expect(getFileIcon(`file.${ext}`)).toBe(PhotoIcon);
    }
  });

  test("returns VideoCameraIcon for video extensions", () => {
    const videoExtensions = [
      "mp4",
      "webm",
      "avi",
      "mov",
      "mkv",
      "wmv",
      "flv",
      "m4v",
    ];
    for (const ext of videoExtensions) {
      expect(getFileIcon(`video.${ext}`)).toBe(VideoCameraIcon);
    }
  });

  test("returns MusicalNoteIcon for audio extensions", () => {
    const audioExtensions = [
      "mp3",
      "wav",
      "ogg",
      "flac",
      "aac",
      "wma",
      "m4a",
      "opus",
    ];
    for (const ext of audioExtensions) {
      expect(getFileIcon(`audio.${ext}`)).toBe(MusicalNoteIcon);
    }
  });

  test("returns DocumentTextIcon for document extensions", () => {
    const docExtensions = [
      "md",
      "mdx",
      "txt",
      "pdf",
      "csv",
      "json",
      "xml",
      "yaml",
      "yml",
      "toml",
      "log",
      "rtf",
    ];
    for (const ext of docExtensions) {
      expect(getFileIcon(`doc.${ext}`)).toBe(DocumentTextIcon);
    }
  });

  test("returns DocumentIcon for unknown extension", () => {
    expect(getFileIcon("file.xyz")).toBe(DocumentIcon);
    expect(getFileIcon("makefile")).toBe(DocumentIcon);
  });

  test("is case-insensitive", () => {
    expect(getFileIcon("file.PNG")).toBe(PhotoIcon);
    expect(getFileIcon("file.MP3")).toBe(MusicalNoteIcon);
    expect(getFileIcon("file.MP4")).toBe(VideoCameraIcon);
  });

  test("handles paths with multiple dots", () => {
    expect(getFileIcon("archive.tar.gz")).toBe(DocumentIcon);
    expect(getFileIcon("image.min.png")).toBe(PhotoIcon);
  });
});

describe("dirPath", () => {
  test("returns / for file without directory", () => {
    expect(dirPath("file.txt")).toBe("/");
    expect(dirPath("readme.md")).toBe("/");
  });

  test("returns parent directory path", () => {
    expect(dirPath("dir/file.txt")).toBe("/dir");
  });

  test("returns deeply nested parent directory", () => {
    expect(dirPath("a/b/c/file.txt")).toBe("/a/b/c");
  });

  test("returns / for single-character filenames", () => {
    expect(dirPath("a/b")).toBe("/a");
    expect(dirPath("x")).toBe("/");
  });
});

describe("formatRelativeTime", () => {
  test('returns "just now" for less than 1 minute ago', () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe("just now");
  });

  test('returns minutes for 1-59 minutes', () => {
    const dt = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatRelativeTime(dt)).toBe("5m ago");
  });

  test('returns hours for 1-23 hours', () => {
    const dt = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(dt)).toBe("3h ago");
  });

  test('returns days for 1-29 days', () => {
    const dt = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(dt)).toBe("5d ago");
  });

  test('returns months for 30+ days', () => {
    const dt = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(dt)).toBe("2mo ago");
  });
});
