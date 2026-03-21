import { useEffect, useEffectEvent } from "react";

// TODO: re-test this (make sure numbers change, etc)
export default function useInterval(callback, delay) {
  // TODO: study this hook (what problem it solves, etc)
  const onTick = useEffectEvent(callback);

  useEffect(() => {
    if (delay == null) return;
    const id = setInterval(() => onTick(), delay);
    return () => clearInterval(id);
  }, [delay]);
}
