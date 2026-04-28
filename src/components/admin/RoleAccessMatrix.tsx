import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type { RoleAccessRow } from '@/lib/admin/users-access-page-view';

export interface RoleAccessMatrixProps {
  roles: ReadonlyArray<RoleAccessRow>;
  pendingInvitesCount: number;
  ssoConfigured: boolean;
}

export function RoleAccessMatrix({ roles, pendingInvitesCount, ssoConfigured }: RoleAccessMatrixProps) {
  return (
    <section
      style={{
        background: COLORS.white,
        borderRadius: RADIUS.lg,
        border: `1px solid ${COLORS.ink}10`,
        padding: SPACING.xl,
      }}
      data-role-access-matrix="true"
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: SPACING.lg,
          flexWrap: 'wrap',
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
          Role access matrix
        </h2>
        <div style={{ display: 'flex', gap: SPACING.md, fontFamily: TYPOGRAPHY.sans, fontSize: 12 }}>
          <span style={{ color: `${COLORS.ink}80` }}>
            Pending invites: <strong style={{ color: COLORS.ink }}>{pendingInvitesCount}</strong>
          </span>
          <span
            style={{
              padding: '2px 10px',
              borderRadius: RADIUS.pill,
              background: ssoConfigured ? COLORS.mintSoft : COLORS.coralSoft,
              color: ssoConfigured ? COLORS.mintInk : COLORS.coralInk,
              fontWeight: 600,
            }}
            data-sso-configured={ssoConfigured ? 'true' : 'false'}
          >
            SSO {ssoConfigured ? 'configured' : 'not configured'}
          </span>
        </div>
      </header>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column' }}>
        {roles.map((role, idx) => (
          <li
            key={role.id}
            style={{
              padding: `${SPACING.md} 0`,
              borderTop: idx === 0 ? 'none' : `1px solid ${COLORS.ink}10`,
              display: 'grid',
              gridTemplateColumns: '180px 80px 1fr 140px',
              gap: SPACING.md,
              alignItems: 'center',
              fontFamily: TYPOGRAPHY.sans,
            }}
            data-role-id={role.id}
          >
            <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.ink }}>{role.label}</div>
            <div
              style={{
                fontFamily: TYPOGRAPHY.serif,
                fontSize: 22,
                fontWeight: 700,
                color: COLORS.ink,
              }}
            >
              {role.count}
            </div>
            <div style={{ fontSize: 13, color: `${COLORS.ink}cc`, lineHeight: 1.5 }}>{role.scope}</div>
            <span
              style={{
                justifySelf: 'end',
                padding: '4px 12px',
                borderRadius: RADIUS.pill,
                background: role.readOnlyToday ? COLORS.amberSoft : COLORS.mintSoft,
                color: role.readOnlyToday ? COLORS.amberInk : COLORS.mintInk,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {role.readOnlyToday ? 'Read-only today' : 'Active'}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
