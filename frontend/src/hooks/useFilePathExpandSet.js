import { useCallback, useState } from "react";

export default function useFilePathExpandSet() {
  const [expandedSet, setExpandedSet] = useState(() => new Set());

  const expandPathAll = useCallback((path) => {
    const ancestors = path.split("/").reduce((paths, _, i, parts) => {
      paths.push(parts.slice(0, i + 1).join("/"));
      return paths;
    }, []);

    setExpandedSet((prev) => {
      const next = new Set(prev);
      ancestors.forEach((p) => next.add(p));
      return next.size === prev.size ? prev : next;
    });
  }, []);

  const togglePathSingle = useCallback((path) => {
    setExpandedSet((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  return { expandedSet, expandPathAll, togglePathSingle };
}
