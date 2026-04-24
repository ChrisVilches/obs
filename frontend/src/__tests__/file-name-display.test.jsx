import { describe, expect, test } from "vitest";
import {
  formatBytesBinary,
  formatLocalDateTime,
} from "../components/FileNameDisplay";

describe("formatBytesBinary", () => {
  test("returns 0 B for zero", () => {
    expect(formatBytesBinary(0)).toBe("0 B");
  });

  test('returns "Invalid size" for negative', () => {
    expect(formatBytesBinary(-1)).toBe("Invalid size");
    expect(formatBytesBinary(-100)).toBe("Invalid size");
  });

  test("throws on negative decimals", () => {
    expect(() => formatBytesBinary(100, -1)).toThrow("decimals must be >= 0");
  });

  test("formats bytes", () => {
    expect(formatBytesBinary(500)).toBe("500 B");
    expect(formatBytesBinary(1023)).toBe("1023 B");
  });

  test("formats KiB", () => {
    expect(formatBytesBinary(1024)).toBe("1 KiB");
    expect(formatBytesBinary(2048)).toBe("2 KiB");
    expect(formatBytesBinary(1536)).toBe("1.5 KiB");
  });

  test("formats MiB", () => {
    expect(formatBytesBinary(1048576)).toBe("1 MiB");
    expect(formatBytesBinary(3145728)).toBe("3 MiB");
  });

  test("formats GiB", () => {
    expect(formatBytesBinary(1073741824)).toBe("1 GiB");
  });

  test("formats TiB", () => {
    expect(formatBytesBinary(1099511627776)).toBe("1 TiB");
  });

  test("formats PiB", () => {
    expect(formatBytesBinary(1125899906842624)).toBe("1 PiB");
  });

  test("respects custom decimal count", () => {
    expect(formatBytesBinary(1536, 0)).toBe("2 KiB");
    expect(formatBytesBinary(1536, 3)).toBe("1.5 KiB");
    expect(formatBytesBinary(1400, 1)).toBe("1.4 KiB");
  });

  test("does not overflow past PiB", () => {
    const huge = 1024 ** 7; // 1024^7 bytes = 1048576 PiB, still PiB unit
    expect(formatBytesBinary(huge)).toBe("1048576 PiB");
  });
});

describe("formatLocalDateTime", () => {
  test("formats a date correctly", () => {
    const result = formatLocalDateTime("2024-01-15T08:30:45.000Z");
    expect(result).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
  });

  test("pads single-digit months and days with zero", () => {
    // Use a fixed time so the output is deterministic regardless of timezone.
    // The function uses local time from new Date(isoString), so we use a UTC
    // reference and match the pattern instead of exact values.
    const result = formatLocalDateTime("2024-03-05T04:08:09.000Z");
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    expect(result.length).toBe(19);
  });
});
