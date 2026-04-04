'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef } from 'react';

type Direction = 'left' | 'right' | 'up' | 'down';

const TV_MODE_STORAGE_KEY = 'gamestop.tv-navigation.enabled';
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[role="button"]:not([aria-disabled="true"])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function isTvUserAgent(userAgent: string): boolean {
  return /smart-tv|smarttv|googletv|google tv|hbbtv|aft|bravia|netcast|web0s|webos|tizen|crkey|roku|tv/i.test(
    userAgent
  );
}

function shouldStartInTvMode(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    if (window.sessionStorage.getItem(TV_MODE_STORAGE_KEY) === '1') {
      return true;
    }
  } catch {
    // Ignore storage failures.
  }

  if (isTvUserAgent(window.navigator.userAgent)) {
    return true;
  }

  const coarsePointer = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  return coarsePointer && window.innerWidth >= 960;
}

function isTextEditingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
    return true;
  }

  if (!(target instanceof HTMLInputElement)) {
    return false;
  }

  const navigableTypes = new Set(['button', 'checkbox', 'radio', 'range', 'submit', 'reset']);
  return !navigableTypes.has(target.type);
}

function isVisible(element: HTMLElement): boolean {
  for (let current: HTMLElement | null = element; current; current = current.parentElement) {
    if (current.hidden || current.getAttribute('aria-hidden') === 'true') {
      return false;
    }

    const style = window.getComputedStyle(current);
    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      style.opacity === '0' ||
      style.pointerEvents === 'none'
    ) {
      return false;
    }
  }

  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function getVisibleModalScope(): HTMLElement | null {
  const modals = Array.from(
    document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"]')
  ).filter(isVisible);

  return modals.at(-1) ?? null;
}

function getFocusableElements(scope?: ParentNode): HTMLElement[] {
  const searchRoot = scope ?? document;
  return Array.from(searchRoot.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) =>
      isVisible(element) &&
      !element.closest('[data-tv-skip="true"]') &&
      element.getAttribute('tabindex') !== '-1'
  );
}

function getElementCenter(rect: DOMRect) {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

function sharesTvGroup(current: HTMLElement, candidate: HTMLElement): boolean {
  const currentGroup = current.closest<HTMLElement>('[data-tv-group]')?.dataset.tvGroup;
  const candidateGroup = candidate.closest<HTMLElement>('[data-tv-group]')?.dataset.tvGroup;
  return Boolean(currentGroup && candidateGroup && currentGroup === candidateGroup);
}

function overlapsCrossAxis(currentRect: DOMRect, candidateRect: DOMRect, direction: Direction) {
  if (direction === 'left' || direction === 'right') {
    return currentRect.top <= candidateRect.bottom && candidateRect.top <= currentRect.bottom;
  }

  return currentRect.left <= candidateRect.right && candidateRect.left <= currentRect.right;
}

function scoreCandidate(
  current: HTMLElement,
  candidate: HTMLElement,
  direction: Direction
): number {
  const currentRect = current.getBoundingClientRect();
  const candidateRect = candidate.getBoundingClientRect();
  const currentCenter = getElementCenter(currentRect);
  const candidateCenter = getElementCenter(candidateRect);

  const deltaX = candidateCenter.x - currentCenter.x;
  const deltaY = candidateCenter.y - currentCenter.y;
  const primaryDistance =
    direction === 'left'
      ? -deltaX
      : direction === 'right'
        ? deltaX
        : direction === 'up'
          ? -deltaY
          : deltaY;

  if (primaryDistance <= 0) {
    return Number.POSITIVE_INFINITY;
  }

  const secondaryDistance =
    direction === 'left' || direction === 'right' ? Math.abs(deltaY) : Math.abs(deltaX);
  const overlapPenalty = overlapsCrossAxis(currentRect, candidateRect, direction) ? 0 : 3500;
  const groupBonus = sharesTvGroup(current, candidate) ? -500 : 0;

  return primaryDistance * 12 + secondaryDistance * 2 + overlapPenalty + groupBonus;
}

function findNextElement(
  current: HTMLElement,
  direction: Direction,
  focusables: HTMLElement[]
): HTMLElement | null {
  let bestCandidate: HTMLElement | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const candidate of focusables) {
    if (candidate === current) {
      continue;
    }

    const score = scoreCandidate(current, candidate, direction);
    if (score < bestScore) {
      bestScore = score;
      bestCandidate = candidate;
    }
  }

  return bestCandidate;
}

function focusElement(element: HTMLElement | null) {
  if (!element) {
    return;
  }

  element.focus({ preventScroll: true });
  element.scrollIntoView({
    block: 'nearest',
    inline: 'nearest',
    behavior: 'smooth',
  });
}

function setBodyTvMode(enabled: boolean) {
  document.body.dataset.tvMode = enabled ? 'true' : 'false';
}

export default function TvRemoteNavigation() {
  const pathname = usePathname();
  const tvModeRef = useRef(false);
  const pendingRouteFocusRef = useRef<number | null>(null);

  const initialTvMode = useMemo(() => shouldStartInTvMode(), []);

  useEffect(() => {
    tvModeRef.current = initialTvMode;
    setBodyTvMode(initialTvMode);
  }, [initialTvMode]);

  useEffect(() => {
    const enableTvMode = () => {
      if (tvModeRef.current) {
        return;
      }

      tvModeRef.current = true;
      setBodyTvMode(true);

      try {
        window.sessionStorage.setItem(TV_MODE_STORAGE_KEY, '1');
      } catch {
        // Ignore storage failures.
      }
    };

    const focusPreferredElement = () => {
      const scope = getVisibleModalScope();
      const focusables = getFocusableElements(scope ?? document);
      const preferred =
        focusables.find((element) => element.dataset.tvAutofocus === 'true') ?? focusables[0] ?? null;
      focusElement(preferred);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      const direction =
        event.key === 'ArrowLeft'
          ? 'left'
          : event.key === 'ArrowRight'
            ? 'right'
            : event.key === 'ArrowUp'
              ? 'up'
              : event.key === 'ArrowDown'
                ? 'down'
                : null;

      if (!direction) {
        return;
      }

      if (isTextEditingTarget(event.target)) {
        return;
      }

      enableTvMode();

      const scope = getVisibleModalScope();
      const focusables = getFocusableElements(scope ?? document);
      if (focusables.length === 0) {
        return;
      }

      const activeElement =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const current =
        activeElement && focusables.includes(activeElement)
          ? activeElement
          : activeElement
            ? focusables.find((element) => element.contains(activeElement)) ?? null
            : null;

      if (!current) {
        event.preventDefault();
        focusPreferredElement();
        return;
      }

      const next = findNextElement(current, direction, focusables);
      if (!next) {
        return;
      }

      event.preventDefault();
      focusElement(next);
    };

    window.addEventListener('keydown', handleKeyDown);

    if (tvModeRef.current) {
      pendingRouteFocusRef.current = window.setTimeout(() => {
        const active = document.activeElement;
        if (active === document.body || !(active instanceof HTMLElement)) {
          focusPreferredElement();
        }
      }, 140);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (pendingRouteFocusRef.current !== null) {
        window.clearTimeout(pendingRouteFocusRef.current);
      }
    };
  }, [pathname]);

  return null;
}
