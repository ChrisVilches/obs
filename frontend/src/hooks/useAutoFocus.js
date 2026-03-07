import { useEffect } from "react";

export default function useAutoFocus(el, { enabled = true, delay = 0 } = {}) {
  useEffect(() => {
    if (!enabled) return;
    if (!el) return;

    el.focus();

    if (delay > 0) {
      const id = setTimeout(() => el.focus(), delay);
      return () => clearTimeout(id);
    }

    // TODO: changes in ref.current won't re-trigger the hook
    // changed to "el", but the caller uses a ref
  }, [enabled, delay, el]);
}
