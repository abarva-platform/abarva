// ADMIN11 — Pending invites list.
//
// Server component. Per-row "Resend" / "Revoke" affordances render disabled
// (HARD-GATED) — live Clerk writes defer to Wave 27.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type { UsersAccessInviteRow } from '@/lib/admin/users-access-page-view';

export interface InviteListProps {
  invites: ReadonlyArray<UsersAccessInviteRow>;
}

function formatDate(iso: string): string {
  return iso.slice(0, 10);
}

function statusPill(s: UsersAccessInviteRow['status']) {
  if (s === 'pending') return { bg: COLORS.amberSoft, fg: COLORS.amberInk, label: 'Pending' };
  return { bg: COLORS.coralSoft, fg: COLORS.coralInk, label: 'Expired' };
}

export function InviteList({ invites }: InviteListProps) {
  return (
    <section
      data-invite-list="true"
      style={{
        background: COLORS.white,
        borderRadius: RADIUS.lg,
        border: `1px solid ${COLORS.ink}10`,
        padding: SPACING.lg,
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: SPACING.md,
          gap: SPACING.md,
        }}
      >
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 22,
            fontWeight: 700,
            color: COLORS.ink,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Pending invitations
        </h2>
        <span
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}80`,
          }}
        >
          {invites.length} seeded invitations · live writes Wave 27
        </span>
      </header>

      <div role="table" aria-label="Pending invitations">
        <div
          role="row"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.6fr 1fr 1.2fr 0.9fr 0.7fr 0.9fr',
            gap: SPACING.md,
            padding: `${SPACING.sm} 0`,
            borderBottom: `1px solid ${COLORS.ink}15`,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: `${COLORS.ink}80`,
          }}
        >
          <div role="columnheader">Email</div>
          <div role="columnheader">Role</div>
          <div role="columnheader">Invited by</div>
          <div role="columnheader">Sent</div>
          <div role="columnheader">Status</div>
          <div role="columnheader">Actions</div>
        </div>
        {invites.map((inv) => {
          const pill = statusPill(inv.status);
          return (
            <div
              key={inv.id}
              role="row"
              data-invite-row-id={inv.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.6fr 1fr 1.2fr 0.9fr 0.7fr 0.9fr',
                gap: SPACING.md,
                padding: `${SPACING.md} 0`,
                borderBottom: `1px solid ${COLORS.ink}10`,
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 13,
                color: COLORS.ink,
                alignItems: 'center',
              }}
            >
              <div role="cell" style={{ fontWeight: 600 }}>{inv.email}</div>
              <div role="cell">{inv.invitedRoleLabel}</div>
              <div role="cell" style={{ color: `${COLORS.ink}cc` }}>{inv.invitedBy}</div>
              <div role="cell" style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 12 }}>
                {formatDate(inv.sentAt)}
              </div>
              <div role="cell">
                <span
                  style={{
                    padding: '2px 10px',
                    borderRadius: RADIUS.pill,
                    fontSize: 11,
                    fontWeight: 600,
                    background: pill.bg,
                    color: pill.fg,
                  }}
                >
                  {pill.label}
                </span>
              </div>
              <div role="cell" style={{ display: 'flex', gap: SPACING.xs }}>
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  data-invite-action="resend"
                  data-invite-action-status="hard_gated"
                  title="Available in pilot environment (Wave 27)"
                  style={{
                    padding: '4px 10px',
                    borderRadius: RADIUS.sm,
                    border: `1px solid ${COLORS.ink}20`,
                    background: COLORS.cream,
                    color: `${COLORS.ink}80`,
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'not-allowed',
                  }}
                >
                  Resend
                </button>
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  data-invite-action="revoke"
                  data-invite-action-status="hard_gated"
                  title="Available in pilot environment (Wave 27)"
                  style={{
                    padding: '4px 10px',
                    borderRadius: RADIUS.sm,
                    border: `1px solid ${COLORS.ink}20`,
                    background: COLORS.cream,
                    color: `${COLORS.ink}80`,
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'not-allowed',
                  }}
                >
                  Revoke
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
