import { useState, useEffect, useCallback } from 'react';

export default function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState(null);

  const execute = useCallback(async () => {
    if (!url) {
      setData(null);
      setLoading(false);
      setError(null);
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
      return json;
    } catch (err) {
      setError(err.message);
      setData(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, loading, error, refetch: execute };
}
