'use client';

// PrintAutoTrigger — opens the browser print dialog once on mount.
//
// Used by /admin/reasoning/digest/print so an operator who clicks the
// "Open print view" link (target=_blank) gets the print dialog without
// a second action. The trigger is one-shot per mount; navigating back
// and re-opening creates a new mount and re-fires.
//
// Renders nothing.

import { useEffect } from 'react';

export function PrintAutoTrigger(): null {
  useEffect(() => {
    // Defer to next tick so layout/fonts settle before the dialog opens.
    // Some browsers (Safari) snapshot the page on `print()`; running
    // synchronously inside the effect can capture pre-paint state.
    const handle = window.setTimeout(() => {
      try {
        window.print();
      } catch {
        // Defensive — `window.print()` should never throw, but if it
        // does we silently swallow so the page still renders normally.
      }
    }, 250);
    return () => window.clearTimeout(handle);
  }, []);
  return null;
}
