// /admin/pilot/[tenantKey] · C5 pilot success dashboard (Phase 1 + 2)
//
// Per the spec at docs/pilot/C5-PILOT-SUCCESS-METRICS-DASHBOARD-SPEC.md.
//
// What renders today:
//   - Panel 1 (subset): Sentinel turns 7d + engagements active 7d +
//     quarantine open count. Substrate freshness + incidents 7d are
//     blank with explanatory banners (need new tables).
//   - Panel 2: avg latency + tokens 7d + 5 random quality-sample turns.
//     Top-questions panel is empty by design (needs join with
//     engagement-turn message text — banner explains).
//   - Panel 3: full 15 coverage tiles + 6 context cards via the
//     existing broker overview that powers /intelligence.
//
// What's deferred:
//   - Panel 4 (SLA conformance) — depends on incident_log + PagerDuty
//   - Substrate freshness card — depends on tenant_refresh_log
//   - Multi-tenant portfolio cockpit — when 3+ paid pilots exist
//
// Admin-only via Clerk publicMetadata.role.

import { auth, clerkClient } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';
import { CANONICAL_TENANTS_DISPLAY_NAMES } from './tenant-registry';
import {
  loadEngagementAndHeadline,
  loadSubstrateSnapshot,
} from '@/lib/pilot-dashboard/aggregates';
import { azureRead } from '@/lib/data-plane/azureRead';
import type {
  DashboardBanner,
  HeadlineKpis,
  EngagementSnapshot,
  SubstrateSnapshot,
} from '@/lib/pilot-dashboard/types';

export const dynamic = 'force-dynamic';

async function requireAdmin(): Promise<{ userId: string }> {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in?redirect=/admin/pilot');
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const role = (user.publicMetadata?.role as string | undefined) ?? null;
  if (role !== 'admin' && role !== 'maestro') {
    redirect('/home');
  }
  return { userId };
}

interface PageProps {
  params: Promise<{ tenantKey: string }>;
}

export default async function PilotDashboardPage({ params }: PageProps): Promise<React.ReactElement> {
  await requireAdmin();
  const { tenantKey } = await params;
  const displayName = CANONICAL_TENANTS_DISPLAY_NAMES[tenantKey];
  if (!displayName) {
    notFound();
  }

  // Resolve the tenant UUID. This dashboard reads turn_traces which
  // joins through engagements.client_id (UUID), not the tenant key.
  let clientId: string | null = null;
  try {
    const row = await azureRead.maybeSingle<{ id: string }>({
      table: 'clients',
      columns: ['id'],
      where: { tenant_key: tenantKey },
    });
    clientId = row?.id ?? null;
  } catch {
    // fall through; the engagement query will surface a banner
  }

  const [substrate, engagementResult] = await Promise.all([
    loadSubstrateSnapshot(tenantKey, displayName),
    clientId
      ? loadEngagementAndHeadline({ clientId, tenantKey })
      : Promise.resolve({
          headline: {
            sentinelTurns7d: 0,
            engagementsActive7d: 0,
            substrateFreshnessDays: null,
            quarantineOpen: 0,
            incidents7d: null,
          },
          engagement: {
            topQuestions: [],
            qualitySample: [],
            avgLatencyMs7d: null,
            tokens7d: null,
            agentQuality: {
              recordedTurns: 0,
              violationEvents: 0,
              caughtViolationRate: null,
              sentinelInternalConsistencyEvents: 0,
              byType: [],
            },
          },
          banners: [
            {
              severity: 'warning' as const,
              key: 'no-client-row',
              message: `No \`clients\` row found for tenant_key="${tenantKey}". Run \`npm run tenant:bootstrap -- --tenant ${tenantKey} --apply\` first.`,
            },
          ],
        }),
  ]);

  return (
    <main
      style={{
        background: '#F8F7F4',
        minHeight: '100vh',
        padding: '40px clamp(20px, 4vw, 56px)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#0F1115',
      }}
    >
      <header style={{ maxWidth: 1300, margin: '0 auto 24px' }}>
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#5F6470',
            marginBottom: 8,
          }}
        >
          Pilot success · C5
        </div>
        <h1
          style={{
            fontFamily: 'Georgia, serif',
            fontWeight: 400,
            fontSize: 34,
            margin: 0,
            letterSpacing: '-0.005em',
          }}
        >
          {displayName}
        </h1>
        <p
          style={{
            color: '#2C2F36',
            maxWidth: 880,
            lineHeight: 1.55,
            marginTop: 8,
            fontSize: 14.5,
          }}
        >
          Founder weekly health-check. Phase 1 + 2 shipped here; Panel 4 (SLA
          conformance) lands once incident-log + PagerDuty integration are
          wired. See <code>docs/pilot/C5-PILOT-SUCCESS-METRICS-DASHBOARD-SPEC.md</code>.
        </p>
      </header>

      {engagementResult.banners.length > 0 && (
        <section style={{ maxWidth: 1300, margin: '0 auto 24px', display: 'grid', gap: 10 }}>
          {engagementResult.banners.map((b) => (
            <BannerRow key={b.key} banner={b} />
          ))}
        </section>
      )}

      <KpiStrip headline={engagementResult.headline} />
      <EngagementPanel engagement={engagementResult.engagement} />
      <SubstratePanel substrate={substrate} />

      <footer
        style={{
          maxWidth: 1300,
          margin: '32px auto 0',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11,
          color: '#5F6470',
          textAlign: 'right',
        }}
      >
        generated {new Date().toISOString()}
      </footer>
    </main>
  );
}

function BannerRow({ banner }: { banner: DashboardBanner }): React.ReactElement {
  const accent = banner.severity === 'warning' ? '#B91C1C' : '#B45309';
  return (
    <div
      role="status"
      style={{
        background: '#FFFFFF',
        borderLeft: `3px solid ${accent}`,
        border: '1px solid #C9C5BD',
        padding: '12px 16px',
        fontSize: 13,
        color: '#2C2F36',
        lineHeight: 1.5,
      }}
    >
      <strong style={{ color: '#0F1115' }}>
        {banner.severity === 'warning' ? 'Warning' : 'Heads-up'}.
      </strong>{' '}
      {banner.message}
    </div>
  );
}

function KpiStrip({ headline }: { headline: HeadlineKpis }): React.ReactElement {
  const cards = [
    { label: 'Sentinel turns · 7d', value: headline.sentinelTurns7d, hint: 'across all CXOs' },
    { label: 'Active engagements · 7d', value: headline.engagementsActive7d, hint: 'distinct turns join' },
    {
      label: 'Substrate freshness',
      value: headline.substrateFreshnessDays === null ? '—' : `${headline.substrateFreshnessDays}d`,
      hint: headline.substrateFreshnessDays === null ? 'tenant_refresh_log pending' : 'since last refresh',
    },
    { label: 'Quarantine open', value: headline.quarantineOpen, hint: 'sensitive uploads held' },
    {
      label: 'Incidents · 7d',
      value: headline.incidents7d === null ? '—' : headline.incidents7d,
      hint: headline.incidents7d === null ? 'incident_log pending' : 'P1+P2',
    },
  ];
  return (
    <section
      style={{
        maxWidth: 1300,
        margin: '0 auto 24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 12,
      }}
    >
      {cards.map((c) => (
        <div
          key={c.label}
          style={{
            background: '#FFFFFF',
            border: '1px solid #C9C5BD',
            padding: '16px 18px',
          }}
        >
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: '#5F6470',
              marginBottom: 8,
            }}
          >
            {c.label}
          </div>
          <div
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: 26,
              color: '#0F1115',
              lineHeight: 1.1,
              marginBottom: 4,
            }}
          >
            {c.value}
          </div>
          <div style={{ fontSize: 11, color: '#5F6470' }}>{c.hint}</div>
        </div>
      ))}
    </section>
  );
}

function EngagementPanel({ engagement }: { engagement: EngagementSnapshot }): React.ReactElement {
  return (
    <section
      style={{
        maxWidth: 1300,
        margin: '0 auto 24px',
        background: '#FFFFFF',
        border: '1px solid #C9C5BD',
        padding: '20px 24px',
      }}
    >
      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10.5,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#5F6470',
          marginBottom: 12,
        }}
      >
        Panel 2 · Engagement quality
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <h3 style={{ fontFamily: 'Georgia, serif', fontWeight: 400, fontSize: 18, margin: '0 0 10px' }}>
            7-day turn telemetry
          </h3>
          <dl style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: '#2C2F36' }}>
            <Dt label="Avg latency">
              {engagement.avgLatencyMs7d === null ? '—' : `${engagement.avgLatencyMs7d} ms`}
            </Dt>
            <Dt label="Input tokens">
              {engagement.tokens7d ? engagement.tokens7d.input.toLocaleString() : '—'}
            </Dt>
            <Dt label="Output tokens">
              {engagement.tokens7d ? engagement.tokens7d.output.toLocaleString() : '—'}
            </Dt>
            <Dt label="Guarded turns">
              {engagement.agentQuality.recordedTurns.toLocaleString()}
            </Dt>
            <Dt label="Caught violation rate">
              {engagement.agentQuality.caughtViolationRate === null
                ? '—'
                : `${(engagement.agentQuality.caughtViolationRate * 100).toFixed(1)}%`}
            </Dt>
            <Dt label="Sentinel consistency hits">
              {engagement.agentQuality.sentinelInternalConsistencyEvents.toLocaleString()}
            </Dt>
          </dl>
          <div style={{ marginTop: 12 }}>
            <h4
              style={{
                fontFamily: 'Georgia, serif',
                fontWeight: 400,
                fontSize: 15,
                margin: '0 0 8px',
              }}
            >
              Guard telemetry
            </h4>
            {engagement.agentQuality.byType.length === 0 ? (
              <p style={{ fontSize: 12.5, color: '#5F6470', margin: 0 }}>
                No guard violations recorded in this runtime window.
              </p>
            ) : (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 6 }}>
                {engagement.agentQuality.byType.map((item) => (
                  <li
                    key={item.type}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      border: '1px solid #E2DFD8',
                      padding: '6px 8px',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 11,
                    }}
                  >
                    <span>{item.type}</span>
                    <strong>{item.count}</strong>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div>
          <h3 style={{ fontFamily: 'Georgia, serif', fontWeight: 400, fontSize: 18, margin: '0 0 10px' }}>
            Quality sample · 5 random recent turns
          </h3>
          {engagement.qualitySample.length === 0 ? (
            <p style={{ fontSize: 12.5, color: '#5F6470' }}>No turns in the last 7 days.</p>
          ) : (
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ color: '#5F6470' }}>
                  <th style={{ textAlign: 'left', padding: '4px 6px' }}>Turn</th>
                  <th style={{ textAlign: 'left', padding: '4px 6px' }}>Model</th>
                  <th style={{ textAlign: 'right', padding: '4px 6px' }}>Latency</th>
                  <th style={{ textAlign: 'right', padding: '4px 6px' }}>Tokens (in/out)</th>
                </tr>
              </thead>
              <tbody>
                {engagement.qualitySample.map((s) => (
                  <tr key={s.turnId} style={{ borderTop: '1px solid #E2DFD8' }}>
                    <td
                      style={{
                        padding: '6px',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 11,
                      }}
                    >
                      {s.turnId.slice(0, 8)}…
                    </td>
                    <td style={{ padding: '6px' }}>{s.model ?? '—'}</td>
                    <td style={{ padding: '6px', textAlign: 'right' }}>
                      {s.latencyMs != null ? `${s.latencyMs}ms` : '—'}
                    </td>
                    <td style={{ padding: '6px', textAlign: 'right' }}>
                      {s.inputTokens ?? 0} / {s.outputTokens ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}

function SubstratePanel({ substrate }: { substrate: SubstrateSnapshot }): React.ReactElement {
  return (
    <section
      style={{
        maxWidth: 1300,
        margin: '0 auto 24px',
        background: '#FFFFFF',
        border: '1px solid #C9C5BD',
        padding: '20px 24px',
      }}
    >
      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10.5,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#5F6470',
          marginBottom: 12,
        }}
      >
        Panel 3 · Substrate health
      </div>
      <h3 style={{ fontFamily: 'Georgia, serif', fontWeight: 400, fontSize: 18, margin: '0 0 12px' }}>
        15 coverage tiles
      </h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 8,
          marginBottom: 20,
        }}
      >
        {substrate.coverageTiles.map((tile) => {
          const populated = tile.rowCount > 0;
          return (
            <div
              key={tile.domain}
              style={{
                border: `1px solid ${populated ? '#0F766E' : '#B91C1C'}`,
                background: populated ? 'rgba(15,118,110,0.06)' : 'rgba(185,28,28,0.04)',
                padding: '10px 12px',
                fontSize: 12,
              }}
            >
              <div style={{ color: '#2C2F36', marginBottom: 2 }}>{tile.label}</div>
              <div
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 600,
                  color: populated ? '#0F766E' : '#B91C1C',
                }}
              >
                {tile.rowCount}
              </div>
            </div>
          );
        })}
      </div>

      <h3 style={{ fontFamily: 'Georgia, serif', fontWeight: 400, fontSize: 18, margin: '0 0 12px' }}>
        6 synthesized context cards
      </h3>
      {substrate.contextCards.length === 0 ? (
        <p style={{ fontSize: 12.5, color: '#5F6470' }}>
          No cards synthesized. Run <code>npm run tenant:refresh -- --tenant &lt;key&gt; --apply</code> to rebuild.
        </p>
      ) : (
        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
          }}
        >
          {substrate.contextCards.map((card) => (
            <li
              key={card.key}
              style={{
                border: '1px solid #C9C5BD',
                padding: '10px 12px',
                fontSize: 12.5,
              }}
            >
              <div style={{ color: '#0F1115', fontWeight: 600, marginBottom: 4 }}>{card.title}</div>
              <div style={{ color: '#5F6470', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
                {card.evidenceCount} evidence · confidence {card.confidence}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div
        style={{
          marginTop: 16,
          paddingTop: 12,
          borderTop: '1px dashed #E2DFD8',
          fontSize: 12,
          color: '#5F6470',
          display: 'flex',
          gap: 24,
        }}
      >
        <span>
          total evidence:{' '}
          <strong style={{ color: '#0F1115' }}>{substrate.totalEvidence}</strong>
        </span>
        <span>
          average confidence:{' '}
          <strong style={{ color: '#0F1115' }}>
            {(substrate.averageConfidence * 100).toFixed(0)}%
          </strong>
        </span>
      </div>
    </section>
  );
}

function Dt({ label, children }: { label: string; children: React.ReactNode }): React.ReactElement {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2DFD8', padding: '4px 0' }}>
      <span style={{ color: '#5F6470' }}>{label}</span>
      <strong style={{ color: '#0F1115', fontFamily: 'JetBrains Mono, monospace' }}>{children}</strong>
    </div>
  );
}
