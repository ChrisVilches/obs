import { useState, useEffect, useRef, useCallback } from 'react';

export default function useResizable({
  defaultValue = 288,
  min = 180,
  max = 600,
  storageKey,
  axis = 'x',
} = {}) {
  const [size, setSize] = useState(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) return parseInt(saved, 10);
    }
    return defaultValue;
  });
  const [isResizing, setIsResizing] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!isResizing) return;

    const getPos = (e) => (axis === 'x' ? e.clientX : e.clientY);
    const styleProp = axis === 'x' ? 'width' : 'height';

    function onMouseMove(e) {
      if (!ref.current) return;
      const newSize = Math.max(min, Math.min(max, getPos(e)));
      ref.current.style[styleProp] = `${newSize}px`;
    }

    function onMouseUp(e) {
      if (!ref.current) return;
      const finalSize = Math.max(min, Math.min(max, getPos(e)));
      setSize(finalSize);
      if (storageKey) localStorage.setItem(storageKey, finalSize);
      setIsResizing(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [isResizing, min, max, storageKey, axis]);

  const onHandleMouseDown = useCallback(
    (e) => {
      e.preventDefault();
      setIsResizing(true);
      document.body.style.cursor = axis === 'x' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    },
    [axis]
  );

  return { size, isResizing, ref, onHandleMouseDown };
}
