// ADMIN11 — Active users table.
//
// Server component. Each row links via ?user=<id>&tab=all to open the
// detail drawer (rendered by UserDetailDrawer when the URL param is set).

import Link from 'next/link';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type { UsersAccessUserRow } from '@/lib/admin/users-access-page-view';

export interface UserListTableProps {
  users: ReadonlyArray<UsersAccessUserRow>;
  baseUrl: string;
  activeUserId?: string;
}

function formatDate(iso: string): string {
  // Deterministic: just slice the ISO string. No new Date().
  return iso.slice(0, 10);
}

function statusPillStyle(status: UsersAccessUserRow['status']) {
  if (status === 'active') {
    return { background: COLORS.mintSoft, color: COLORS.mintInk };
  }
  if (status === 'invited') {
    return { background: COLORS.amberSoft, color: COLORS.amberInk };
  }
  return { background: COLORS.coralSoft, color: COLORS.coralInk };
}

export function UserListTable({ users, baseUrl, activeUserId }: UserListTableProps) {
  return (
    <section
      data-user-list-table="true"
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
          Active users
        </h2>
        <span
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}80`,
          }}
        >
          {users.length} seeded users
        </span>
      </header>
      <div role="table" aria-label="Active users" data-user-table-rows="true">
        <div
          role="row"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.6fr 1.5fr 1fr 1fr 0.9fr 0.6fr',
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
          <div role="columnheader">Name</div>
          <div role="columnheader">Email</div>
          <div role="columnheader">Role</div>
          <div role="columnheader">Tenant</div>
          <div role="columnheader">Last sign-in</div>
          <div role="columnheader">Status</div>
        </div>
        {users.map((u) => {
          const isActive = u.id === activeUserId;
          const href = `${baseUrl}?tab=all&user=${u.id}`;
          const pill = statusPillStyle(u.status);
          return (
            <Link
              key={u.id}
              href={href}
              role="row"
              data-user-row-id={u.id}
              data-user-row-active={isActive ? 'true' : 'false'}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.6fr 1.5fr 1fr 1fr 0.9fr 0.6fr',
                gap: SPACING.md,
                padding: `${SPACING.md} 0`,
                borderBottom: `1px solid ${COLORS.ink}10`,
                textDecoration: 'none',
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 13,
                color: COLORS.ink,
                background: isActive ? COLORS.skyPale : 'transparent',
                alignItems: 'center',
              }}
            >
              <div role="cell" style={{ fontWeight: 600 }}>{u.name}</div>
              <div role="cell" style={{ color: `${COLORS.ink}cc` }}>{u.email}</div>
              <div role="cell">{u.roleLabel}</div>
              <div role="cell" style={{ color: `${COLORS.ink}cc` }}>{u.tenant}</div>
              <div role="cell" style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 12 }}>
                {formatDate(u.lastSignIn)}
              </div>
              <div role="cell">
                <span
                  style={{
                    padding: '2px 10px',
                    borderRadius: RADIUS.pill,
                    fontSize: 11,
                    fontWeight: 600,
                    background: pill.background,
                    color: pill.color,
                  }}
                >
                  {u.status}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
