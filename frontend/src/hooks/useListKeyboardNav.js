import { useEffect, useRef, useState } from "react";

// TODO: do we just need the items count? (not the actual list)
export default function useListKeyboardNav({ items, onSelect, enabled = true }) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    setSelectedIndex((prev) => {
      if (items.length === 0) return -1;
      if (prev < 0) return 0;
      if (prev >= items.length) return items.length - 1;
      return prev;
    });
  }, [items]);

  const handleKeyDown = (e) => {
    if (!enabled) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (items.length === 0) return;
      setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1));
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
      return;
    }

    if (e.key === "Enter" && selectedIndex >= 0 && items[selectedIndex]) {
      e.preventDefault();
      // TODO: what is this [selectedIndex]?
      onSelectRef.current(items[selectedIndex], selectedIndex);
    }
  };

  return { selectedIndex, handleKeyDown, setSelectedIndex };
}
