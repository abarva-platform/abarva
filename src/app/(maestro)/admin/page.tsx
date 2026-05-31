import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { resolveAdminTenant } from '@/lib/admin/admin-tenant';
import { getClientOption } from '@/lib/client-config';
import { COLORS, TYPOGRAPHY } from '@/lib/design/design-tokens';

export const metadata = { title: 'Admin Home | AbarVa' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const palette = {
  paper: COLORS.cream,
  card: COLORS.white,
  line: COLORS.skyPale,
  ink: COLORS.ink,
  muted: COLORS.amberInk,
  blue: COLORS.navy,
  mint: COLORS.mintInk,
  amber: COLORS.amberInk,
  coral: COLORS.coralInk,
  softBlue: COLORS.skyPale,
  softMint: COLORS.mintSoft,
  softAmber: COLORS.amberSoft,
  softCoral: COLORS.coralSoft,
  white: COLORS.white,
};

const dataRows = [
  {
    dimension: 'Enterprise profile',
    loaded: 'Ready',
    completeness: '92%',
    evidence: 'Leadership, footprint, operating model',
    next: 'Keep current',
  },
  {
    dimension: 'Data estate',
    loaded: 'In progress',
    completeness: '81%',
    evidence: 'Systems, ownership, lineage',
    next: 'Confirm stale source owners',
  },
  {
    dimension: 'Access and roles',
    loaded: 'Needs attention',
    completeness: '74%',
    evidence: 'Admins, pending invites, SSO posture',
    next: 'Clear two access gaps',
  },
  {
    dimension: 'Connectors',
    loaded: 'In progress',
    completeness: '68%',
    evidence: 'Critical sources and test results',
    next: 'Reconnect priority systems',
  },
  {
    dimension: 'Assistant grounding',
    loaded: 'Ready',
    completeness: '86%',
    evidence: 'Capabilities mapped to evidence',
    next: 'Review gap queue',
  },
] as const;

const actionRows = [
  {
    label: 'Clear access blocker',
    owner: 'Admin owner',
    due: 'Today',
    impact: 'Unblocks pilot approvals and notification coverage.',
  },
  {
    label: 'Confirm connector owners',
    owner: 'Data steward',
    due: 'This week',
    impact: 'Raises data estate completeness for assistant answers.',
  },
  {
    label: 'Review production blockers',
    owner: 'Release lead',
    due: 'This week',
    impact: 'Keeps demo, pilot, and production gates separated.',
  },
] as const;

function clientMark(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function statusColor(status: string): { color: string; background: string } {
  if (status === 'Ready') return { color: palette.mint, background: palette.softMint };
  if (status === 'Needs attention') return { color: palette.coral, background: palette.softCoral };
  return { color: palette.amber, background: palette.softAmber };
}

export default async function AdminOverviewPage() {
  const tenant = await resolveAdminTenant();
  const clientOption = getClientOption(tenant.clientKey);
  const mark = clientMark(tenant.tenantName);

  return (
    <AdminCanonShellV2 tenantName={tenant.tenantName}>
      <main
        data-admin-home-native="true"
        style={{
          minHeight: '100%',
          background: palette.paper,
          color: palette.ink,
          padding: '26px 30px 34px',
        }}
      >
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 320px',
            gap: 22,
            alignItems: 'stretch',
            marginBottom: 18,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
              <div
                aria-label={`${tenant.tenantName} client mark`}
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: clientOption.color,
                  color: palette.white,
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 14,
                  fontWeight: 850,
                  letterSpacing: '0.08em',
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.26)',
                }}
              >
                {mark}
              </div>
              <div>
                <p
                  style={{
                    margin: 0,
                    color: palette.muted,
                    fontSize: 11,
                    fontWeight: 850,
                    letterSpacing: '0.11em',
                    textTransform: 'uppercase',
                  }}
                >
                  {clientOption.vertical} admin command center
                </p>
                <h1
                  style={{
                    margin: '5px 0 0',
                    fontFamily: TYPOGRAPHY.serif,
                    fontSize: 38,
                    lineHeight: 1.04,
                    letterSpacing: 0,
                  }}
                >
                  {tenant.tenantName} admin home
                </h1>
              </div>
            </div>
            <p style={{ maxWidth: 860, margin: 0, color: palette.ink, fontSize: 16, lineHeight: 1.48 }}>
              One native control canvas for loaded data, readiness, access, notifications, and next
              actions. The first screen shows what is ready, what is incomplete, and who owns the next move.
            </p>
          </div>

          <aside
            style={{
              border: `1px solid ${palette.line}`,
              borderRadius: 8,
              background: palette.card,
              padding: 16,
              display: 'grid',
              gap: 10,
              alignContent: 'start',
            }}
          >
            <p
              style={{
                margin: 0,
                color: palette.muted,
                fontSize: 11,
                fontWeight: 850,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Next decision
            </p>
            <h2 style={{ margin: 0, fontSize: 20, lineHeight: 1.18 }}>
              Clear access and connector gaps before expanding production scope.
            </h2>
            <a
              href="/admin/production-readiness"
              style={{
                width: 'fit-content',
                marginTop: 4,
                color: palette.white,
                background: palette.blue,
                borderRadius: 6,
                padding: '8px 12px',
                fontSize: 13,
                fontWeight: 800,
                textDecoration: 'none',
              }}
            >
              Open readiness
            </a>
          </aside>
        </section>

        <section
          aria-label="Admin status summary"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: 12,
            marginBottom: 18,
          }}
        >
          {[
            ['Data completeness', '81%', 'Across critical dimensions', palette.softBlue, palette.blue],
            ['Admin actions', '3', 'Need owner attention', palette.softAmber, palette.amber],
            ['Access posture', '74%', 'SSO and role coverage', palette.softCoral, palette.coral],
            ['Assistant grounding', '86%', 'Evidence-backed answers', palette.softMint, palette.mint],
          ].map(([label, value, detail, background, color]) => (
            <div
              key={label}
              style={{
                border: `1px solid ${palette.line}`,
                borderRadius: 8,
                background,
                padding: '14px 15px',
                minHeight: 104,
              }}
            >
              <p
                style={{
                  margin: 0,
                  color,
                  fontSize: 11,
                  fontWeight: 850,
                  letterSpacing: '0.09em',
                  textTransform: 'uppercase',
                }}
              >
                {label}
              </p>
              <strong style={{ display: 'block', marginTop: 10, fontSize: 30, lineHeight: 1 }}>
                {value}
              </strong>
              <span style={{ display: 'block', marginTop: 8, color: palette.muted, fontSize: 13 }}>
                {detail}
              </span>
            </div>
          ))}
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.35fr) minmax(320px, 0.65fr)',
            gap: 18,
          }}
        >
          <div style={{ border: `1px solid ${palette.line}`, borderRadius: 8, background: palette.card }}>
            <div
              style={{
                padding: '14px 16px',
                borderBottom: `1px solid ${palette.line}`,
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: 18 }}>Loaded data by dimension</h2>
                <p style={{ margin: '4px 0 0', color: palette.muted, fontSize: 13 }}>
                  Completeness is shown as client-facing operating coverage, not implementation detail.
                </p>
              </div>
              <a
                href="/admin/data-trust"
                style={{ color: palette.blue, fontSize: 13, fontWeight: 800, textDecoration: 'none' }}
              >
                View data trust
              </a>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
              <thead>
                <tr style={{ color: palette.muted, textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px', fontSize: 11, textTransform: 'uppercase' }}>Dimension</th>
                  <th style={{ padding: '10px 14px', fontSize: 11, textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '10px 14px', fontSize: 11, textTransform: 'uppercase' }}>Complete</th>
                  <th style={{ padding: '10px 14px', fontSize: 11, textTransform: 'uppercase' }}>Evidence</th>
                  <th style={{ padding: '10px 14px', fontSize: 11, textTransform: 'uppercase' }}>Next</th>
                </tr>
              </thead>
              <tbody>
                {dataRows.map((row) => {
                  const status = statusColor(row.loaded);
                  return (
                    <tr key={row.dimension} style={{ borderTop: `1px solid ${palette.line}` }}>
                      <td style={{ padding: '11px 14px', fontWeight: 750 }}>{row.dimension}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            borderRadius: 999,
                            padding: '4px 8px',
                            color: status.color,
                            background: status.background,
                            fontSize: 12,
                            fontWeight: 800,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {row.loaded}
                        </span>
                      </td>
                      <td style={{ padding: '11px 14px', fontWeight: 800 }}>{row.completeness}</td>
                      <td style={{ padding: '11px 14px', color: palette.ink }}>{row.evidence}</td>
                      <td style={{ padding: '11px 14px', color: palette.muted }}>{row.next}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ border: `1px solid ${palette.line}`, borderRadius: 8, background: palette.card }}>
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${palette.line}` }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>Action queue</h2>
              <p style={{ margin: '4px 0 0', color: palette.muted, fontSize: 13 }}>
                Only items that change client readiness appear here.
              </p>
            </div>
            <div style={{ display: 'grid' }}>
              {actionRows.map((action, index) => (
                <div
                  key={action.label}
                  style={{
                    padding: '13px 16px',
                    borderTop: index === 0 ? 'none' : `1px solid ${palette.line}`,
                    display: 'grid',
                    gap: 6,
                  }}
                >
                  <strong style={{ fontSize: 14 }}>{action.label}</strong>
                  <span style={{ color: palette.muted, fontSize: 12.5 }}>
                    {action.owner} - {action.due}
                  </span>
                  <p style={{ margin: 0, color: palette.ink, fontSize: 13, lineHeight: 1.38 }}>
                    {action.impact}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </AdminCanonShellV2>
  );
}
