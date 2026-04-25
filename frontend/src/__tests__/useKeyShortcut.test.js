import { renderHook } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import useKeyShortcut from "../hooks/useKeyShortcut";

describe("useKeyShortcut", () => {
  test("calls callback when key is pressed", () => {
    const callback = vi.fn();
    renderHook(() => useKeyShortcut("Escape", callback));

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test("does not call for other keys", () => {
    const callback = vi.fn();
    renderHook(() => useKeyShortcut("Enter", callback));

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(callback).not.toHaveBeenCalled();
  });

  test("supports array of keys", () => {
    const callback = vi.fn();
    renderHook(() => useKeyShortcut(["Escape", "Enter"], callback));

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(callback).toHaveBeenCalledTimes(2);
  });

  test("does not call when disabled", () => {
    const callback = vi.fn();
    renderHook(() => useKeyShortcut("Escape", callback, { enabled: false }));

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(callback).not.toHaveBeenCalled();
  });

  test("ignores keypress when focus is on input element", () => {
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    const callback = vi.fn();
    renderHook(() => useKeyShortcut("Enter", callback, { ignoreInputs: true }));

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(callback).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  test("fires in input when ignoreInputs is false", () => {
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    const callback = vi.fn();
    renderHook(() =>
      useKeyShortcut("Enter", callback, { ignoreInputs: false }),
    );

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(callback).toHaveBeenCalledTimes(1);

    document.body.removeChild(input);
  });
});
