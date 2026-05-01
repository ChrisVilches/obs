import { useEffect, useEffectEvent } from "react";

export default function useInterval(callback, delay) {
  const onTick = useEffectEvent(callback);

  useEffect(() => {
    if (delay == null) return;
    const id = setInterval(() => onTick(), delay);
    return () => clearInterval(id);
  }, [delay]);
}
