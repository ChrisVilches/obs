import { useEffect } from "react";

export default function useAutoFocus(ref, { enabled = true, delay = 0 } = {}) {
  useEffect(() => {
    if (!enabled) return;

    const el = ref.current;
    if (!el) return;

    el.focus();

    if (delay > 0) {
      const id = setTimeout(() => el.focus(), delay);
      return () => clearTimeout(id);
    }
  }, [enabled, delay]);
}
