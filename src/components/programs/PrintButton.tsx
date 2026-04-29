'use client';

// PrintButton — A client component that triggers window.print() on click.
// Used by the program report page (server component) to provide a print/PDF
// button that works in the browser without making the whole page client-side.

import { COLORS, TYPOGRAPHY, RADIUS } from '@/lib/design/design-tokens';

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.06em',
        background: COLORS.ink,
        color: COLORS.white,
        border: 'none',
        borderRadius: RADIUS.sm,
        padding: '7px 18px',
        cursor: 'pointer',
      }}
    >
      Print / Save as PDF
    </button>
  );
}
