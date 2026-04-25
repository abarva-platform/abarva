// DES2 · EmptyInspector.
//
// Honest placeholder for empty inspector slots. Imports restricted
// to next/link and the AbarVa theme module.

import Link from 'next/link';
import {
  COLORS,
  RADIUS,
  TYPE,
} from '@/lib/design/abarva-theme';

export interface EmptyInspectorProps {
  caption: string;
  routeHint?: { label: string; href: string };
}

export function EmptyInspector({ caption, routeHint }: EmptyInspectorProps) {
  return (
    <div
      data-abarva-empty-inspector
      style={{
        padding: '12px 14px',
        background: COLORS.surface2,
        border: `1px dashed ${COLORS.border}`,
        borderRadius: RADIUS.cardSmall,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <span
        style={{
          ...TYPE.caption,
          fontSize: 12,
          color: COLORS.mutedSoft,
        }}
      >
        {caption}
      </span>
      {routeHint ? (
        <Link
          href={routeHint.href}
          data-abarva-empty-inspector-route
          style={{
            fontSize: 11,
            color: COLORS.navy,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          {routeHint.label} →
        </Link>
      ) : null}
    </div>
  );
}
