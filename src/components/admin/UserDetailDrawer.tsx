// ADMIN11 — User detail drawer.
//
// Server component. Renders inline (not a fixed overlay) when ?user=<id> is
// present. The "close" affordance is a Link back to the canvas without the
// user param. No client state, no JS handlers.

import Link from 'next/link';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type { UsersAccessUserDetail } from '@/lib/admin/users-access-page-view';

export interface UserDetailDrawerProps {
  user: UsersAccessUserDetail;
  baseUrl: string;
  /** Tab to return to when closing the drawer. */
  returnTab: string;
}

function formatTimestamp(iso: string): string {
  // Deterministic: slice ISO. No new Date / locale.
  const date = iso.slice(0, 10);
  const time = iso.slice(11, 16);
  return `${date} · ${time} UTC`;
}

function inviteStatusPill(s: UsersAccessUserDetail['inviteStatus']) {
  if (s === 'accepted') return { bg: COLORS.mintSoft, fg: COLORS.mintInk, label: 'Accepted' };
  if (s === 'pending') return { bg: COLORS.amberSoft, fg: COLORS.amberInk, label: 'Pending' };
  if (s === 'expired') return { bg: COLORS.coralSoft, fg: COLORS.coralInk, label: 'Expired' };
  return { bg: COLORS.cream, fg: COLORS.ink, label: 'Never invited' };
}

export function UserDetailDrawer({ user, baseUrl, returnTab }: UserDetailDrawerProps) {
  const closeHref = `${baseUrl}?tab=${returnTab}`;
  const pill = inviteStatusPill(user.inviteStatus);

  return (
    <aside
      role="complementary"
      aria-label={`Details for ${user.name}`}
      data-user-detail-drawer="true"
      data-user-detail-id={user.id}
      style={{
        background: COLORS.white,
        borderRadius: RADIUS.lg,
        border: `1px solid ${COLORS.ink}15`,
        padding: SPACING.xl,
        marginTop: SPACING.lg,
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: SPACING.lg,
          gap: SPACING.md,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: `${COLORS.ink}99`,
              marginBottom: SPACING.xs,
            }}
          >
            User detail · deterministic seed
          </div>
          <h3
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 24,
              fontWeight: 700,
              color: COLORS.ink,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            {user.name}
          </h3>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 13,
              color: `${COLORS.ink}cc`,
              marginTop: SPACING.xs,
            }}
          >
            {user.email}
          </div>
        </div>
        <Link
          href={closeHref}
          data-user-drawer-close="true"
          aria-label="Close user detail"
          style={{
            padding: `${SPACING.xs} ${SPACING.md}`,
            borderRadius: RADIUS.sm,
            border: `1px solid ${COLORS.ink}20`,
            background: COLORS.cream,
            color: COLORS.ink,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Close
        </Link>
      </header>

      <dl
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: SPACING.md,
          marginBottom: SPACING.lg,
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
        }}
      >
        <div>
          <dt style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: `${COLORS.ink}80`, marginBottom: SPACING.xs }}>
            Role
          </dt>
          <dd style={{ margin: 0, color: COLORS.ink, fontWeight: 600 }}>{user.roleLabel}</dd>
        </div>
        <div>
          <dt style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: `${COLORS.ink}80`, marginBottom: SPACING.xs }}>
            Tenant
          </dt>
          <dd style={{ margin: 0, color: COLORS.ink }}>{user.tenant}</dd>
        </div>
        <div>
          <dt style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: `${COLORS.ink}80`, marginBottom: SPACING.xs }}>
            Last activity
          </dt>
          <dd style={{ margin: 0, color: COLORS.ink, fontFamily: TYPOGRAPHY.mono, fontSize: 12 }}>
            {formatTimestamp(user.lastSignIn)}
          </dd>
        </div>
        <div>
          <dt style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: `${COLORS.ink}80`, marginBottom: SPACING.xs }}>
            Invite status
          </dt>
          <dd style={{ margin: 0 }}>
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
          </dd>
        </div>
      </dl>

      <section style={{ marginBottom: SPACING.lg }}>
        <h4
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: `${COLORS.ink}99`,
            margin: 0,
            marginBottom: SPACING.sm,
          }}
        >
          Permissions
        </h4>
        <ul
          data-user-permissions="true"
          style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexWrap: 'wrap', gap: SPACING.xs }}
        >
          {user.permissions.map((p) => (
            <li
              key={p}
              style={{
                padding: '4px 10px',
                borderRadius: RADIUS.pill,
                background: COLORS.skyPale,
                color: COLORS.navy,
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {p}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h4
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: `${COLORS.ink}99`,
            margin: 0,
            marginBottom: SPACING.sm,
          }}
        >
          Recent activity
        </h4>
        <ul
          data-user-activity="true"
          style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: SPACING.sm }}
        >
          {user.recentActivity.map((a, idx) => (
            <li
              key={`${a.at}-${idx}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '170px 1fr',
                gap: SPACING.md,
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 13,
                color: COLORS.ink,
              }}
            >
              <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 12, color: `${COLORS.ink}99` }}>
                {formatTimestamp(a.at)}
              </span>
              <span>{a.label}</span>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
