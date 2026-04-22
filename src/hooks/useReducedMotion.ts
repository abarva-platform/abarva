'use client';

import { useEffect, useState } from 'react';

/**
 * Subscribe to the OS-level `prefers-reduced-motion` setting.
 *
 * Returns `true` when the user has opted out of non-essential motion.
 * Callers should either skip their animation entirely or clamp to
 * `motion.duration.instant` (75ms) per docs/specs/platform/design-system.md §1.6.
 *
 * SSR-safe · returns `false` on the server; upgrades on mount.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    // Safari <14 used addListener · modern browsers use addEventListener
    if (mq.addEventListener) {
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }
    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, []);

  return reduced;
}
