'use client';

import { useEffect, useRef, useState } from 'react';

export function useHoverPreview(delay = 450) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setEnabled(mediaQuery.matches);

    update();
    mediaQuery.addEventListener('change', update);

    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const open = (id: string) => {
    if (!enabled) {
      return;
    }

    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => setActiveId(id), delay);
  };

  const close = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setActiveId(null);
  };

  return {
    activeId,
    enabled,
    open,
    close,
  };
}
