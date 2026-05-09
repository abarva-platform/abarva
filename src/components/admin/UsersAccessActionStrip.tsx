// ADMIN11 — Action strip for the Users & Access surface.
//
// Renders an Invite user / Configure SSO / Export users row. Safe
// actions render as anchor links. Hard-gated actions render as a
// non-button explanation chip (no fake disabled button) so admins
// understand the dependency rather than clicking a dead control —
// per Setup Fix Package PR 5 §2.3.

import Link from 'next/link';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type { UsersAccessActionRow } from '@/lib/admin/users-access-page-view';

export interface UsersAccessActionStripProps {
  actions: ReadonlyArray<UsersAccessActionRow>;
}

export function UsersAccessActionStrip({ actions }: UsersAccessActionStripProps) {
  return (
    <section
      data-users-access-action-strip="true"
      aria-label="Users and access actions"
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
            aria-disabled="true"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: SPACING.xs,
              padding: `${SPACING.xs} ${SPACING.md}`,
              borderRadius: RADIUS.sm,
              background: COLORS.amberSoft,
              border: `1px solid ${COLORS.amberInk}30`,
              maxWidth: 480,
            }}
          >
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: COLORS.amberInk,
              }}
            >
              {action.label} · Wave 27
            </span>
            <span
              data-action-reason={action.id}
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 12,
                color: `${COLORS.ink}cc`,
                lineHeight: 1.4,
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
