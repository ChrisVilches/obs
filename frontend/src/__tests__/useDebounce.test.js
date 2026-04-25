import { act, renderHook } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import useDebounce from "../hooks/useDebounce";

describe("useDebounce", () => {
  test("returns initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("hello", 150));
    expect(result.current).toBe("hello");
  });

  test("returns updated value after delay", async () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 150),
      { initialProps: { value: "a" } },
    );

    rerender({ value: "b" });
    expect(result.current).toBe("a");

    await act(() => vi.advanceTimersByTimeAsync(150));
    expect(result.current).toBe("b");

    vi.useRealTimers();
  });

  test("resets timer on rapid changes", async () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 200),
      { initialProps: { value: "a" } },
    );

    rerender({ value: "b" });
    await act(() => vi.advanceTimersByTimeAsync(100));
    rerender({ value: "c" });
    await act(() => vi.advanceTimersByTimeAsync(100));
    expect(result.current).toBe("a");

    await act(() => vi.advanceTimersByTimeAsync(100));
    expect(result.current).toBe("c");

    vi.useRealTimers();
  });

  test("uses default delay of 150ms", async () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
      initialProps: { value: "x" },
    });

    rerender({ value: "y" });
    await act(() => vi.advanceTimersByTimeAsync(149));
    expect(result.current).toBe("x");
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(result.current).toBe("y");

    vi.useRealTimers();
  });
});
