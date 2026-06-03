import { useCallback, useEffect, useMemo } from "react";

const channels = new Map();

function getChannel(name) {
  let channel = channels.get(name);

  if (!channel) {
    channel = {
      latest: undefined,
      listeners: new Set(),
    };

    channels.set(name, channel);
  }

  return channel;
}

export function usePubSub(eventName, handler = null) {
  const channel = useMemo(() => getChannel(eventName), [eventName]);

  useEffect(() => {
    if (!handler) return;

    channel.listeners.add(handler);

    if (channel.latest !== undefined) {
      handler(channel.latest);
    }

    return () => {
      channel.listeners.delete(handler);
    };
  }, [channel, handler]);

  const dispatch = useCallback(
    (payload) => {
      channel.latest = payload;

      for (const listener of channel.listeners) {
        listener(payload);
      }
    },
    [channel],
  );

  return { dispatch };
}
