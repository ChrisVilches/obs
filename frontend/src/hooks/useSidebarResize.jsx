import { useRef, useState, useEffect, useCallback } from 'react';

export default function useSidebarResize({
  minWidth = 180,
  maxWidth = 600,
  defaultWidth = 288,
  storageKey = 'sidebarWidth',
} = {}) {
  const sidebarRef = useRef(null);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (!storageKey) return defaultWidth;
    const saved = localStorage.getItem(storageKey);
    return saved ? parseInt(saved, 10) : defaultWidth;
  });
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    if (!isResizing) return;
    function onMouseMove(e) {
      if (!sidebarRef.current) return;
      const newWidth = Math.max(minWidth, Math.min(maxWidth, e.clientX));
      sidebarRef.current.style.width = `${newWidth}px`;
    }
    function onMouseUp(e) {
      if (!sidebarRef.current) return;
      const finalWidth = Math.max(minWidth, Math.min(maxWidth, e.clientX));
      setSidebarWidth(finalWidth);
      if (storageKey) localStorage.setItem(storageKey, String(finalWidth));
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
  }, [isResizing, minWidth, maxWidth, storageKey]);

  const onResizeHandleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  return { sidebarWidth, sidebarRef, onResizeHandleMouseDown };
}
