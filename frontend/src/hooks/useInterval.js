import { useEffect, useEffectEvent } from "react";

export default function useInterval(callback, delay) {
  // TODO: study this hook (what problem it solves, etc)
  const onTick = useEffectEvent(callback);

  useEffect(() => {
    if (delay == null) return;
    const id = setInterval(() => onTick(), delay);
    return () => clearInterval(id);
  }, [delay]);
}
