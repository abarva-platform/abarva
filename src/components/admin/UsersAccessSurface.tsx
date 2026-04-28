// ADM6 · Users & Access Surface.
//
// Server component (no 'use client', no React hooks). Renders the
// deterministic ADM6 users-access readiness view as a calm, Apple-like
// admin posture surface following the AbarVa Visual Canon (DES1).
//
// All design tokens come from @/lib/design/abarva-theme — no local
// hex literals, no local font literals. Honest about what is wired
// today: read-only role inventory, tenant access posture, program
// access posture, pending invite placeholder, risky permission flags,
// and a Steward guidance block. Every future verb (edit / invite /
// revoke) is rendered as a disabled "future · not yet wired" pill.
//
// No live auth runtime. No Clerk import. No API call. No model call.

import { AgentBadge } from '@/components/abarva/AgentBadge';
import {
  BORDER,
  COLORS,
  FONT,
  RADIUS,
  SPACING,
  TYPE,
} from '@/lib/design/abarva-theme';
import {
  buildUsersAccessReadinessView,
  listRiskyPermissionFlags,
  summarizeUsersAccess,
  type RiskyPermissionFlag,
  type RiskySeverity,
  type UsersAccessReadinessView,
} from '@/lib/admin/users-access-readiness';

interface UsersAccessSurfaceProps {
  view?: UsersAccessReadinessView;
}

const FUTURE_LABEL = 'future · not yet wired';

function severityColor(severity: RiskySeverity): {
  fg: string;
  bg: string;
  ring: string;
} {
  if (severity === 'high') {
    return { fg: COLORS.red, bg: COLORS.redSoft, ring: COLORS.red };
  }
  if (severity === 'medium') {
    return { fg: COLORS.amber, bg: COLORS.amberSoft, ring: COLORS.amber };
  }
  return { fg: COLORS.navy, bg: COLORS.navySoft, ring: COLORS.navy };
}

export function UsersAccessSurface({ view }: UsersAccessSurfaceProps) {
  const resolved = view ?? buildUsersAccessReadinessView();
  const summary = summarizeUsersAccess(resolved);
  const riskyOrdered = listRiskyPermissionFlags(resolved);

  return (
    <section
      aria-label="Users and access posture"
      data-surface="adm6-users-access"
      style={{
        background: COLORS.card,
        border: BORDER.hairline,
        borderRadius: RADIUS.lg,
        padding: SPACING.xl,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.xl,
        fontFamily: FONT.body,
        color: COLORS.body,
      }}
    >
      {/* Header */}
      <header
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.xs,
        }}
      >
        <span
          style={{
            ...TYPE.eyebrow,
            color: COLORS.muted,
          }}
        >
          USERS &amp; ACCESS · ADM6
        </span>
        <h2 style={{ ...TYPE.h2, margin: 0 }}>
          Users &amp; access posture
        </h2>
        <p
          style={{
            ...TYPE.caption,
            margin: 0,
            maxWidth: 720,
          }}
        >
          {resolved.healthRationale}
        </p>
      </header>

      {/* Calm grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: SPACING.lg,
        }}
      >
        {/* Role inventory */}
        <article
          aria-label="Role inventory"
          style={panelStyle}
        >
          <SectionHeader
            eyebrow="Role inventory"
            title={`${summary.totalRoles} roles · ${summary.totalSeats} seats`}
          />
          <p style={{ ...TYPE.caption, margin: 0 }}>
            {summary.roleDistributionSentence}
          </p>
          <ul style={listResetStyle}>
            {resolved.roles.map((r) => (
              <li
                key={r.role}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: SPACING.sm,
                  padding: `${SPACING.sm}px 0`,
                  borderBottom: BORDER.hairlineSoft,
                  alignItems: 'baseline',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: COLORS.ink,
                    }}
                  >
                    {r.label}
                  </div>
                  <div
                    style={{
                      ...TYPE.caption,
                      marginTop: 2,
                    }}
                  >
                    {r.scopeNote}
                  </div>
                </div>
                <span
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 11,
                    fontWeight: 600,
                    color: COLORS.navy,
                    background: COLORS.navySoft,
                    borderRadius: RADIUS.pill,
                    padding: '2px 8px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {r.count}
                </span>
              </li>
            ))}
          </ul>
        </article>

        {/* Tenant access posture */}
        <article
          aria-label="Tenant access posture"
          style={panelStyle}
        >
          <SectionHeader
            eyebrow="Tenant access posture"
            title={`${summary.totalTenants} tenants`}
          />
          <ul style={listResetStyle}>
            {resolved.tenants.map((t) => (
              <li
                key={t.tenantLabel}
                style={{
                  padding: `${SPACING.sm}px 0`,
                  borderBottom: BORDER.hairlineSoft,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: SPACING.sm,
                    alignItems: 'baseline',
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: COLORS.ink,
                    }}
                  >
                    {t.tenantLabel}
                  </span>
                  <span
                    style={{
                      fontFamily: FONT.mono,
                      fontSize: 10,
                      letterSpacing: '0.10em',
                      textTransform: 'uppercase',
                      color: t.isolationIntact ? COLORS.navy : COLORS.red,
                    }}
                  >
                    {t.isolationIntact ? 'isolation · intact' : 'isolation · breached'}
                  </span>
                </div>
                <div style={{ ...TYPE.caption, margin: 0 }}>
                  {t.totalSeats} seats · {t.rolesPresent.join(', ')}
                </div>
                <div style={{ ...TYPE.caption, margin: 0 }}>
                  {t.rationale}
                </div>
              </li>
            ))}
          </ul>
        </article>

        {/* Program access posture */}
        <article
          aria-label="Program access posture"
          style={panelStyle}
        >
          <SectionHeader
            eyebrow="Program access posture"
            title={`${summary.totalPrograms} programs`}
          />
          <ul style={listResetStyle}>
            {resolved.programs.map((p) => (
              <li
                key={p.programKey}
                style={{
                  padding: `${SPACING.sm}px 0`,
                  borderBottom: BORDER.hairlineSoft,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: SPACING.sm,
                    alignItems: 'baseline',
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: COLORS.ink,
                    }}
                  >
                    {p.programLabel}
                  </span>
                  <span
                    style={{
                      fontFamily: FONT.mono,
                      fontSize: 10,
                      letterSpacing: '0.10em',
                      textTransform: 'uppercase',
                      color: p.sponsorAssigned ? COLORS.navy : COLORS.amber,
                    }}
                  >
                    {p.sponsorAssigned ? 'sponsor · captured' : 'sponsor · missing'}
                  </span>
                </div>
                <div style={{ ...TYPE.caption, margin: 0 }}>
                  {p.rolesPermitted.join(', ')}
                </div>
                <div style={{ ...TYPE.caption, margin: 0 }}>
                  {p.guidance}
                </div>
              </li>
            ))}
          </ul>
        </article>

        {/* Pending invites placeholder */}
        <article
          aria-label="Pending invites"
          style={panelStyle}
        >
          <SectionHeader
            eyebrow="Pending invites"
            title={`${summary.pendingInvites} pending`}
          />
          <ul style={listResetStyle}>
            {resolved.pendingInvites.map((p) => (
              <li
                key={p.id}
                style={{
                  padding: `${SPACING.sm}px 0`,
                  borderBottom: BORDER.hairlineSoft,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    color: COLORS.body,
                  }}
                >
                  {p.caption}
                </span>
              </li>
            ))}
          </ul>
        </article>

        {/* Risky permission flags */}
        <article
          aria-label="Risky permission flags"
          style={{
            ...panelStyle,
            // gridColumn span is fine — calm grid lets it stretch.
          }}
        >
          <SectionHeader
            eyebrow="Risky permission flags"
            title={`${summary.riskyFlagCount} flags`}
          />
          {riskyOrdered.length === 0 ? (
            <p style={{ ...TYPE.caption, margin: 0 }}>
              No risky permission flags surfaced today.
            </p>
          ) : (
            <ul style={listResetStyle}>
              {riskyOrdered.map((flag) => (
                <RiskyFlagRow key={flag.id} flag={flag} />
              ))}
            </ul>
          )}
        </article>

        {/* Steward guidance */}
        <article
          aria-label="Steward guidance"
          style={panelStyle}
        >
          <SectionHeader
            eyebrow="Steward guidance"
            title="Calm, read-only today"
          />
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: SPACING.sm,
            }}
          >
            <AgentBadge agent="steward" status="read_only" />
            <span style={{ ...TYPE.caption, margin: 0, flex: '1 1 220px' }}>
              {resolved.stewardGuidance}
            </span>
          </div>

          {/* Disabled future actions */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: SPACING.sm,
              marginTop: SPACING.sm,
            }}
          >
            <FutureActionPill label="Edit" />
            <FutureActionPill label="Invite" />
            <FutureActionPill label="Revoke" />
          </div>
        </article>
      </div>

      {/* Footer caption */}
      <footer
        style={{
          ...TYPE.caption,
          margin: 0,
          paddingTop: SPACING.sm,
          borderTop: BORDER.hairlineSoft,
          color: COLORS.muted,
        }}
      >
        Source · deterministic users-access readiness seed · no live auth mutation
      </footer>
    </section>
  );
}

// ---------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------

function SectionHeader({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        marginBottom: SPACING.xs,
      }}
    >
      <span
        style={{
          ...TYPE.eyebrow,
          color: COLORS.muted,
        }}
      >
        {eyebrow}
      </span>
      <span
        style={{
          ...TYPE.h3,
          color: COLORS.ink,
        }}
      >
        {title}
      </span>
    </div>
  );
}

function RiskyFlagRow({ flag }: { flag: RiskyPermissionFlag }) {
  const accent = severityColor(flag.severity);
  return (
    <li
      style={{
        padding: `${SPACING.sm}px 0`,
        borderBottom: BORDER.hairlineSoft,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: SPACING.sm,
          alignItems: 'baseline',
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: COLORS.ink,
          }}
        >
          {flag.role}
        </span>
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: accent.fg,
            background: accent.bg,
            border: `1px solid ${accent.ring}`,
            borderRadius: RADIUS.pill,
            padding: '1px 8px',
          }}
        >
          {flag.severity}
        </span>
      </div>
      <div style={{ ...TYPE.caption, margin: 0 }}>{flag.reason}</div>
      <div
        style={{
          ...TYPE.caption,
          margin: 0,
          color: COLORS.mutedSoft,
        }}
      >
        Suggested review: {flag.suggestedReview}
      </div>
    </li>
  );
}

function FutureActionPill({ label }: { label: string }) {
  return (
    <span
      aria-disabled="true"
      data-disabled="true"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: SPACING.xs,
        fontFamily: FONT.mono,
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
        color: COLORS.mutedSoft,
        background: COLORS.surface2,
        border: BORDER.hairlineSoft,
        borderRadius: RADIUS.pill,
        padding: '4px 10px',
        cursor: 'not-allowed',
        opacity: 0.7,
      }}
    >
      <span>{label}</span>
      <span aria-hidden="true" style={{ opacity: 0.5 }}>·</span>
      <span>{FUTURE_LABEL}</span>
    </span>
  );
}

// ---------------------------------------------------------------------
// Shared inline styles
// ---------------------------------------------------------------------

const panelStyle: React.CSSProperties = {
  background: COLORS.surface,
  border: BORDER.hairlineSoft,
  borderRadius: RADIUS.md,
  padding: SPACING.lg,
  display: 'flex',
  flexDirection: 'column',
  gap: SPACING.sm,
};

const listResetStyle: React.CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
};
