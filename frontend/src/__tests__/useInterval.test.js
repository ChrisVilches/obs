import { renderHook } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import useInterval from "../hooks/useInterval";

describe("useInterval", () => {
  test("calls callback at regular intervals", () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    renderHook(() => useInterval(callback, 100));

    vi.advanceTimersByTime(350);
    expect(callback).toHaveBeenCalledTimes(3);
    vi.useRealTimers();
  });

  test("does not call callback when delay is null", () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    renderHook(() => useInterval(callback, null));

    vi.advanceTimersByTime(500);
    expect(callback).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  test("does not call callback when delay is undefined", () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    renderHook(() => useInterval(callback));

    vi.advanceTimersByTime(500);
    expect(callback).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  test("updates callback reference without resetting interval", () => {
    vi.useFakeTimers();
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const { rerender } = renderHook(
      ({ cb, delay }) => useInterval(cb, delay),
      { initialProps: { cb: cb1, delay: 100 } },
    );

    vi.advanceTimersByTime(100);
    expect(cb1).toHaveBeenCalledTimes(1);

    rerender({ cb: cb2, delay: 100 });
    vi.advanceTimersByTime(100);
    expect(cb2).toHaveBeenCalledTimes(1);
    expect(cb1).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});
