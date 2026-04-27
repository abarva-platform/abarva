// ADMIN14 — Action strip for the Data Trust surface.
//
// Server component. Renders Approve dataset / Add policy (HARD-GATED) +
// Open evidence ledger / Export trust report (SAFE links).

import Link from 'next/link';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type { DataTrustActionRow } from '@/lib/admin/data-trust-page-view';

export interface DataTrustActionStripProps {
  actions: ReadonlyArray<DataTrustActionRow>;
}

export function DataTrustActionStrip({ actions }: DataTrustActionStripProps) {
  return (
    <section
      data-data-trust-action-strip="true"
      aria-label="Data trust actions"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: SPACING.sm,
        padding: SPACING.md,
        borderRadius: RADIUS.md,
        background: COLORS.cream,
        border: `1px solid ${COLORS.ink}10`,
        marginBottom: SPACING.lg,
        alignItems: 'center',
      }}
    >
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: `${COLORS.ink}99`,
          marginRight: SPACING.sm,
        }}
      >
        Actions
      </span>
      {actions.map((action) => {
        if (action.status === 'safe' && action.href) {
          return (
            <Link
              key={action.id}
              href={action.href}
              data-action-id={action.id}
              data-action-status="safe"
              style={{
                padding: `${SPACING.xs} ${SPACING.md}`,
                borderRadius: RADIUS.sm,
                border: `1px solid ${COLORS.navy}40`,
                background: COLORS.white,
                color: COLORS.navy,
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              {action.label}
            </Link>
          );
        }
        return (
          <span
            key={action.id}
            data-action-id={action.id}
            data-action-status="hard_gated"
            style={{ display: 'inline-flex', alignItems: 'center', gap: SPACING.xs }}
          >
            <button
              type="button"
              disabled
              aria-disabled="true"
              data-action-button={action.id}
              title={action.reason ?? 'Available in pilot environment (Wave 27)'}
              style={{
                padding: `${SPACING.xs} ${SPACING.md}`,
                borderRadius: RADIUS.sm,
                border: `1px solid ${COLORS.ink}20`,
                background: COLORS.white,
                color: `${COLORS.ink}80`,
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'not-allowed',
              }}
            >
              {action.label}
            </button>
            <span
              data-action-reason={action.id}
              style={{
                padding: '2px 10px',
                borderRadius: RADIUS.pill,
                background: COLORS.amberSoft,
                color: COLORS.amberInk,
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {action.reason ?? 'Available in pilot environment (Wave 27)'}
            </span>
          </span>
        );
      })}
    </section>
  );
}
