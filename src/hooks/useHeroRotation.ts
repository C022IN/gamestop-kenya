'use client';

import { useEffect, useState } from 'react';

export function useHeroRotation(itemCount: number, delay = 8000) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (itemCount <= 0) {
      setActiveIndex(0);
      return;
    }

    setActiveIndex((current) => current % itemCount);
  }, [itemCount]);

  useEffect(() => {
    if (itemCount <= 1) {
      return;
    }

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotionQuery.matches) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % itemCount);
    }, delay);

    return () => window.clearInterval(timer);
  }, [delay, itemCount]);

  const goTo = (index: number) => {
    if (itemCount <= 0) {
      return;
    }

    setActiveIndex((index + itemCount) % itemCount);
  };

  const goNext = () => goTo(activeIndex + 1);
  const goPrev = () => goTo(activeIndex - 1);

  return {
    activeIndex,
    goNext,
    goPrev,
    goTo,
  };
}
