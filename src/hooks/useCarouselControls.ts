'use client';

import { useEffect, useRef, useState } from 'react';

export function useCarouselControls() {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) {
      return;
    }

    let frame = 0;
    const updateControls = () => {
      cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const maxScrollLeft = rail.scrollWidth - rail.clientWidth;
        setCanScrollLeft(rail.scrollLeft > 8);
        setCanScrollRight(maxScrollLeft - rail.scrollLeft > 8);
      });
    };

    updateControls();

    const observer = new ResizeObserver(() => updateControls());
    observer.observe(rail);
    Array.from(rail.children).forEach((child) => observer.observe(child));
    rail.addEventListener('scroll', updateControls, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      rail.removeEventListener('scroll', updateControls);
    };
  }, []);

  const scrollByCard = (direction: 'left' | 'right') => {
    const rail = railRef.current;
    if (!rail) {
      return;
    }

    const firstCard = rail.querySelector<HTMLElement>('[data-rail-card]');
    const gap = Number.parseFloat(window.getComputedStyle(rail).gap || '16') || 16;
    const cardWidth = firstCard?.getBoundingClientRect().width ?? rail.clientWidth * 0.78;
    const nextLeft = direction === 'left' ? -1 * (cardWidth + gap) : cardWidth + gap;

    rail.scrollBy({ left: nextLeft, behavior: 'smooth' });
  };

  return {
    railRef,
    canScrollLeft,
    canScrollRight,
    scrollByCard,
  };
}
