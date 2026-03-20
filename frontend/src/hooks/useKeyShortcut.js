import { useEffect } from "react";

const INPUT_TAGS = ["INPUT", "TEXTAREA", "SELECT"];

export default function useKeyShortcut(key, callback, { enabled = true, ignoreInputs = true } = {}) {
  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e) {
      const keys = Array.isArray(key) ? key : [key];
      if (!keys.includes(e.key)) return;

      if (ignoreInputs && document.activeElement) {
        if (
          INPUT_TAGS.includes(document.activeElement.tagName) ||
          document.activeElement.isContentEditable
        ) {
          return;
        }
      }

      e.preventDefault();
      callback(e);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [key, enabled, ignoreInputs, callback]);
}
