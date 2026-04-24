import { act, renderHook } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import useListKeyboardNav from "../hooks/useListKeyboardNav";

describe("useListKeyboardNav", () => {
  function setup({ items, onSelect } = {}) {
    return renderHook(
      ({ items }) =>
        useListKeyboardNav({ items, onSelect: onSelect ?? vi.fn() }),
      { initialProps: { items: items ?? [] } },
    );
  }

  test("returns selectedIndex -1 for empty list", () => {
    const { result } = setup({ items: [] });
    expect(result.current.selectedIndex).toBe(-1);
  });

  test("returns selectedIndex 0 for non-empty list", () => {
    const { result } = setup({ items: ["a", "b"] });
    expect(result.current.selectedIndex).toBe(0);
  });

  test("handleKeyDown with ArrowDown increments selectedIndex", () => {
    const { result } = setup({ items: ["a", "b", "c"] });
    act(() => {
      result.current.handleKeyDown({
        key: "ArrowDown",
        preventDefault: vi.fn(),
      });
    });
    expect(result.current.selectedIndex).toBe(1);
    act(() => {
      result.current.handleKeyDown({
        key: "ArrowDown",
        preventDefault: vi.fn(),
      });
    });
    expect(result.current.selectedIndex).toBe(2);
  });

  test("ArrowDown does not exceed last index", () => {
    const { result } = setup({ items: ["a"] });
    act(() => {
      result.current.handleKeyDown({
        key: "ArrowDown",
        preventDefault: vi.fn(),
      });
    });
    expect(result.current.selectedIndex).toBe(0);
  });

  test("ArrowUp decrements selectedIndex", () => {
    const { result } = setup({ items: ["a", "b"] });
    act(() => {
      result.current.handleKeyDown({
        key: "ArrowDown",
        preventDefault: vi.fn(),
      });
    });
    expect(result.current.selectedIndex).toBe(1);
    act(() => {
      result.current.handleKeyDown({
        key: "ArrowUp",
        preventDefault: vi.fn(),
      });
    });
    expect(result.current.selectedIndex).toBe(0);
  });

  test("ArrowUp does not go below 0", () => {
    const { result } = setup({ items: ["a"] });
    act(() => {
      result.current.handleKeyDown({
        key: "ArrowUp",
        preventDefault: vi.fn(),
      });
    });
    expect(result.current.selectedIndex).toBe(0);
  });

  test("Enter calls onSelect with the selected item", () => {
    const onSelect = vi.fn();
    const { result } = setup({ items: ["first", "second"], onSelect });
    act(() => {
      result.current.handleKeyDown({
        key: "Enter",
        preventDefault: vi.fn(),
      });
    });
    expect(onSelect).toHaveBeenCalledWith("first", 0);
  });

  test("Enter does nothing when no item selected", () => {
    const onSelect = vi.fn();
    const { result } = setup({ items: [], onSelect });
    act(() => {
      result.current.handleKeyDown({
        key: "Enter",
        preventDefault: vi.fn(),
      });
    });
    expect(onSelect).not.toHaveBeenCalled();
  });

  test("does nothing when disabled", () => {
    const onSelect = vi.fn();
    const { result } = renderHook(() =>
      useListKeyboardNav({ items: ["a"], onSelect, enabled: false }),
    );
    act(() => {
      result.current.handleKeyDown({
        key: "ArrowDown",
        preventDefault: vi.fn(),
      });
    });
    expect(result.current.selectedIndex).toBe(0);
    act(() => {
      result.current.handleKeyDown({
        key: "Enter",
        preventDefault: vi.fn(),
      });
    });
    expect(onSelect).not.toHaveBeenCalled();
  });

  test("clamps selectedIndex when items shrink", () => {
    const onSelect = vi.fn();
    const { result, rerender } = renderHook(
      ({ items }) => useListKeyboardNav({ items, onSelect }),
      { initialProps: { items: ["a", "b", "c"] } },
    );
    act(() => {
      result.current.handleKeyDown({
        key: "ArrowDown",
        preventDefault: vi.fn(),
      });
    });
    act(() => {
      result.current.handleKeyDown({
        key: "ArrowDown",
        preventDefault: vi.fn(),
      });
    });
    expect(result.current.selectedIndex).toBe(2);

    rerender({ items: ["a"] });
    expect(result.current.selectedIndex).toBe(0);
  });

  test("ArrowDown does nothing when list is empty", () => {
    const { result } = setup({ items: [] });
    act(() => {
      result.current.handleKeyDown({
        key: "ArrowDown",
        preventDefault: vi.fn(),
      });
    });
    expect(result.current.selectedIndex).toBe(-1);
  });

  test("irrelevant keys do nothing", () => {
    const onSelect = vi.fn();
    const { result } = setup({ items: ["a"], onSelect });
    act(() => {
      result.current.handleKeyDown({
        key: "Tab",
        preventDefault: vi.fn(),
      });
    });
    expect(result.current.selectedIndex).toBe(0);
    expect(onSelect).not.toHaveBeenCalled();
  });
});
