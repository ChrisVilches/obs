import { useEffect, useEffectEvent, useState } from "react";

export default function useListKeyboardNav({
  items,
  onSelect,
  enabled = true,
}) {
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    setSelectedIndex((prev) => {
      if (items.length === 0) return -1;
      if (prev < 0) return 0;
      if (prev >= items.length) return items.length - 1;
      return prev;
    });
  }, [items.length]);

  const handleSelect = useEffectEvent((index) => {
    if (items[index]) onSelect(items[index], index);
  });

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
    if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(selectedIndex);
    }
  };

  return { selectedIndex, handleKeyDown, setSelectedIndex };
}
