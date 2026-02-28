import { useState, useEffect } from 'react';

export default function useDebounce(value, delay = 150) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    if (value === '') {
      setDebouncedValue('');
      return;
    }

    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
