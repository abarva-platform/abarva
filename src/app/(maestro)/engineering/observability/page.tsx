import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { sampleTelemetry, summarizeTelemetry } from '@/lib/observability/request-telemetry';

export const metadata = { title: 'Operational observability · AbarVa' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const PLATFORM_ADMIN_EMAIL_ALLOWLIST = new Set([
  'anand.sundaram@thesundaram.com',
]);

const S = {
  page: {
    display: 'grid',
    gap: 18,
    padding: 24,
  },
  header: {
    display: 'grid',
    gap: 6,
  },
  eyebrow: {
    color: '#475569',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  title: {
    margin: 0,
    fontSize: 28,
    lineHeight: 1.15,
    color: '#0f172a',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
    gap: 12,
  },
  metric: {
    border: '1px solid rgba(15,23,42,0.10)',
    borderRadius: 8,
    padding: 14,
    background: '#fff',
  },
  label: {
    margin: 0,
    fontSize: 12,
    color: '#64748b',
  },
  value: {
    margin: '5px 0 0',
    fontSize: 22,
    fontWeight: 800,
    color: '#0f172a',
  },
  tableWrap: {
    overflowX: 'auto',
    border: '1px solid rgba(15,23,42,0.10)',
    borderRadius: 8,
    background: '#fff',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '10px 12px',
    fontSize: 11,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#64748b',
    borderBottom: '1px solid rgba(15,23,42,0.10)',
  },
  td: {
    padding: '10px 12px',
    borderBottom: '1px solid rgba(15,23,42,0.08)',
    fontSize: 13,
    verticalAlign: 'top',
    color: '#0f172a',
  },
  chip: {
    display: 'inline-flex',
    borderRadius: 999,
    padding: '3px 8px',
    fontSize: 12,
    fontWeight: 700,
  },
  notice: {
    border: '1px solid rgba(15,23,42,0.12)',
    borderRadius: 8,
    background: '#fff',
    padding: 18,
    maxWidth: 760,
  },
} as const;

function isPlatformAdmin(user: Awaited<ReturnType<typeof currentUser>>): boolean {
  const role = (user?.publicMetadata?.role as string | undefined) ?? '';
  const platformRole =
    (user?.publicMetadata?.platformRole as string | undefined)
    ?? (user?.unsafeMetadata?.platformRole as string | undefined);
  const primaryEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
  return (
    role === 'platform_admin'
    || platformRole === 'platform_admin'
    || (!!primaryEmail && PLATFORM_ADMIN_EMAIL_ALLOWLIST.has(primaryEmail))
  );
}

function AdminOnlyNotice() {
  return (
    <main style={S.page}>
      <header style={S.header}>
        <p style={S.eyebrow}>Wave 0 quality spine</p>
        <h1 style={S.title}>Operational observability</h1>
      </header>
      <section style={S.notice} aria-label="Admin access only">
        <h2 style={{ margin: '0 0 8px', fontSize: 18, color: '#0f172a' }}>
          Admin access only
        </h2>
        <p style={{ margin: 0, color: '#475569', lineHeight: 1.5 }}>
          This internal quality-spine dashboard contains cross-client operational telemetry
          samples and is restricted to AbarVa platform administrators.
        </p>
      </section>
    </main>
  );
}

export default async function OperationalObservabilityPage() {
  const session = await auth();
  if (!session.userId) {
    redirect('/sign-in?redirect=/engineering/observability');
  }

  const user = await currentUser();
  if (!isPlatformAdmin(user)) {
    return <AdminOnlyNotice />;
  }

  const rows = sampleTelemetry();
  const summary = summarizeTelemetry(rows);

  return (
    <main style={S.page}>
      <header style={S.header}>
        <p style={S.eyebrow}>Wave 0 quality spine</p>
        <h1 style={S.title}>Operational observability</h1>
        <p style={{ margin: 0, color: '#475569', maxWidth: 760 }}>
          Live-vs-fallback mode, latency, timeouts, model cost, and answer quality for
          agent-facing surfaces. The sample rows keep the route deterministic until live
          telemetry is wired to persistence.
        </p>
      </header>

      <section style={S.summaryGrid} aria-label="Telemetry summary">
        <Metric label="Requests" value={summary.total.toString()} />
        <Metric label="Live mode" value={`${summary.liveModePercent}%`} />
        <Metric label="Fallback mode" value={`${summary.fallbackModePercent}%`} />
        <Metric label="Timeout rate" value={`${summary.timeoutRatePercent}%`} />
        <Metric label="p95 latency" value={`${summary.p95LatencyMs}ms`} />
        <Metric label="Avg quality" value={`${summary.averageQualityScore}/100`} />
      </section>

      <section style={S.tableWrap} aria-label="Telemetry rows">
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Client</th>
              <th style={S.th}>Surface</th>
              <th style={S.th}>Mode</th>
              <th style={S.th}>Latency</th>
              <th style={S.th}>Cost</th>
              <th style={S.th}>Quality</th>
              <th style={S.th}>Failure</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.requestId}>
                <td style={S.td}>{row.tenantKey}</td>
                <td style={S.td}>{row.surface}</td>
                <td style={S.td}>
                  <span
                    style={{
                      ...S.chip,
                      background: row.mode === 'live' ? '#dcfce7' : '#fef3c7',
                      color: row.mode === 'live' ? '#166534' : '#92400e',
                    }}
                  >
                    {row.mode}
                  </span>
                </td>
                <td style={S.td}>{row.latencyMs}ms</td>
                <td style={S.td}>${row.inferenceCostUsd.toFixed(3)}</td>
                <td style={S.td}>{row.answerQualityScore}/100</td>
                <td style={S.td}>{row.userVisibleFailure?.message ?? 'None'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={S.metric}>
      <p style={S.label}>{label}</p>
      <p style={S.value}>{value}</p>
    </div>
  );
}
