import { useState, useEffect } from 'react';

export default function useDebouncedValue(value, delay = 150) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    if (!value) {
      setDebouncedValue(value);
    } else {
      const timer = setTimeout(() => setDebouncedValue(value), delay);
      return () => clearTimeout(timer);
    }
  }, [value, delay]);

  return debouncedValue;
}
