// ADMIN17 — Architecture action strip.
// Three affordances:
//   1. "Open Azure story" — internal link to the Azure sub-tab (SAFE).
//   2. "Review private data plane" — internal docs link (SAFE).
//   3. "Export architecture diagram" — HARD-GATED until Wave 27,
//      rendered as a disabled chip with an inline reason.
//
// No live writes. Server-renderable.

import Link from 'next/link';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';

export interface ArchitectureActionStripProps {
  azureHref: string;
  privatePlaneHref?: string;
}

export function ArchitectureActionStrip({
  azureHref,
  privatePlaneHref = '/admin/architecture?view=azure',
}: ArchitectureActionStripProps) {
  const baseChip = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: `${SPACING.sm} ${SPACING.md}`,
    borderRadius: RADIUS.pill,
    fontSize: 13,
    fontWeight: 600,
    textDecoration: 'none',
    fontFamily: TYPOGRAPHY.sans,
    border: `1px solid ${COLORS.ink}20`,
  } as const;

  return (
    <nav
      data-architecture-action-strip="true"
      aria-label="Architecture actions"
      style={{
        display: 'flex',
        gap: SPACING.sm,
        flexWrap: 'wrap',
        marginTop: SPACING.lg,
      }}
    >
      <Link
        href={azureHref}
        data-architecture-action="open-azure-story"
        style={{
          ...baseChip,
          background: COLORS.navy,
          color: COLORS.white,
          borderColor: COLORS.navy,
        }}
      >
        Open Azure story
      </Link>
      <Link
        href={privatePlaneHref}
        data-architecture-action="review-private-data-plane"
        style={{
          ...baseChip,
          background: COLORS.white,
          color: COLORS.ink,
        }}
      >
        Review private data plane
      </Link>
      <span
        data-architecture-action="export-diagram"
        data-architecture-action-disabled="true"
        title="Diagram export available in Wave 27"
        aria-disabled="true"
        style={{
          ...baseChip,
          background: COLORS.cream,
          color: `${COLORS.ink}80`,
          borderStyle: 'dashed',
          cursor: 'not-allowed',
        }}
      >
        Export architecture diagram
        <span
          style={{
            marginLeft: SPACING.sm,
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: `${COLORS.ink}60`,
          }}
        >
          Wave 27
        </span>
      </span>
    </nav>
  );
}
