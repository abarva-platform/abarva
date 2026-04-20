import Link from 'next/link';
import { redirect } from 'next/navigation';
import { buildTowerViewModel, listTowerClients, type ContradictionRow } from '@/lib/tower/aggregate';
import { loadEnterpriseSummary } from '@/lib/tower/enterprise-summary';
import { TowerUploadZone } from '@/components/tower/TowerUploadZone';
import { EnterpriseContextRow } from '@/components/tower/EnterpriseContextRow';

export const dynamic = 'force-dynamic';

const INK = '#F5F5F0';
const MUTE = 'rgba(245, 245, 240, 0.72)';
const TEAL = '#2DD4C8';
const PURPLE = '#9B6DFF';
const CORAL = '#FF6B4A';
const AMBER = '#F5C54A';
const GREEN = '#3FB27F';
const BORDER_SOFT = '0.5px solid rgba(255,255,255,0.08)';
const FONT_MONO = 'JetBrains Mono, monospace';

function dollarsM(usd: number): string {
  if (Math.abs(usd) >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
  if (Math.abs(usd) >= 1_000) return `$${Math.round(usd / 1_000)}k`;
  return `$${Math.round(usd)}`;
}

function freshnessColor(d: Date | null): string {
  if (!d) return '#6B6B66';
  const days = (Date.now() - d.getTime()) / 86_400_000;
  if (days < 7) return GREEN;
  if (days < 30) return AMBER;
  return CORAL;
}

function freshnessLabel(d: Date | null): string {
  if (!d) return 'no data';
  const days = (Date.now() - d.getTime()) / 86_400_000;
  if (days < 1) return 'today';
  if (days < 30) return `${Math.floor(days)}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function panelFrame(
  accent: string,
  number: string,
  title: string,
  subtitle: string,
  freshness: Date | null,
  children: React.ReactNode,
) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: BORDER_SOFT, borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: accent, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            {number} · {title}
          </div>
          <div style={{ fontSize: 12, color: MUTE, marginTop: 2 }}>{subtitle}</div>
        </div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTE }}>
          <span style={{ color: freshnessColor(freshness), marginRight: 4 }}>●</span>
          {freshnessLabel(freshness)}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </div>
  );
}

function severityColor(sev: string): string {
  if (sev === 'high') return CORAL;
  if (sev === 'medium') return AMBER;
  return MUTE;
}

function contradictionTypeLabel(t: string): string {
  return t.replace(/_/g, ' ');
}

interface ContradictionImpact {
  one_liner?: string;
  monthly_total_usd?: number;
  eliminable_usd_annual?: number;
  eliminable_pct?: number;
  owner_named?: boolean;
  confidence?: string;
}

function formatUsd(n: number | undefined): string | null {
  if (typeof n !== 'number' || !Number.isFinite(n)) return null;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

function ContradictionCard({ c }: { c: ContradictionRow }) {
  const evidence = c.evidence && typeof c.evidence === 'object' ? c.evidence : {};
  const impact = (evidence as { impact?: ContradictionImpact }).impact ?? null;
  const refsRaw = (evidence as { refs?: unknown }).refs;
  const refs = Array.isArray(refsRaw) ? (refsRaw as string[]) : [];
  const monthly = formatUsd(impact?.monthly_total_usd);
  const eliminable = formatUsd(impact?.eliminable_usd_annual);
  const sev = severityColor(c.severity);
  return (
    <div style={{ padding: 14, background: 'rgba(255,255,255,0.03)', border: BORDER_SOFT, borderRadius: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: sev }}>
          {c.severity} · {contradictionTypeLabel(c.contradiction_type)}
        </div>
      </div>
      {impact?.one_liner && (
        <div
          style={{
            fontSize: 14,
            color: INK,
            lineHeight: 1.5,
            fontWeight: 500,
            padding: '10px 12px',
            background: 'rgba(245,197,74,0.06)',
            borderLeft: `2px solid ${sev}`,
            borderRadius: 4,
            marginBottom: 10,
          }}
        >
          {impact.one_liner}
        </div>
      )}
      {(monthly || eliminable || impact?.owner_named === false) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 10 }}>
          {monthly && (
            <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTE }}>
              <span style={{ color: MUTE }}>monthly spend:</span>{' '}
              <span style={{ color: INK }}>{monthly}</span>
            </div>
          )}
          {eliminable && (
            <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTE }}>
              <span style={{ color: MUTE }}>eliminable/yr:</span>{' '}
              <span style={{ color: sev }}>{eliminable}</span>
              {typeof impact?.eliminable_pct === 'number' && (
                <span style={{ color: MUTE }}> · {impact.eliminable_pct}%</span>
              )}
            </div>
          )}
          {impact?.owner_named === false && (
            <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: CORAL }}>
              no owner named
            </div>
          )}
          {impact?.confidence && (
            <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTE }}>
              confidence: {impact.confidence}
            </div>
          )}
        </div>
      )}
      <div style={{ fontSize: 12.5, color: MUTE, lineHeight: 1.5 }}>{c.description}</div>
      {refs.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {refs.slice(0, 4).map((r, i) => (
            <span
              key={i}
              style={{
                fontFamily: FONT_MONO,
                fontSize: 9,
                color: MUTE,
                padding: '2px 6px',
                border: BORDER_SOFT,
                borderRadius: 4,
                letterSpacing: '0.06em',
              }}
            >
              {r}
            </span>
          ))}
        </div>
      )}
      {c.suggested_action && (
        <div style={{ marginTop: 10, fontSize: 12, color: MUTE, fontStyle: 'italic' }}>
          Suggested: {c.suggested_action}
        </div>
      )}
      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
        {c.triggered_engagement_id ? (
          <Link
            href={`/engagements/${encodeURIComponent(c.triggered_engagement_id)}`}
            style={{ fontFamily: FONT_MONO, fontSize: 11, color: TEAL, textDecoration: 'none' }}
          >
            View engagement →
          </Link>
        ) : (
          <span
            title="Auto-trigger lands in Pack 15"
            style={{
              fontFamily: FONT_MONO,
              fontSize: 11,
              color: MUTE,
              padding: '4px 10px',
              border: '0.5px solid rgba(255,255,255,0.12)',
              borderRadius: 6,
            }}
          >
            Trigger engagement · Pack 15
          </span>
        )}
      </div>
    </div>
  );
}

export default async function TowerPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const params = await searchParams;
  // Active client from top-nav dropdown is the source of truth. URL
  // param still honored (deep links); if absent, resolve from the cookie.
  let clientId = params.clientId;
  if (!clientId) {
    const { getActiveClientRow } = await import('@/lib/active-client');
    const active = await getActiveClientRow();
    if (!active) {
      return (
        <div style={{ padding: 40, color: MUTE, fontFamily: 'DM Sans, sans-serif' }}>
          No clients yet. Apply migration 022 and seed Tower data.
        </div>
      );
    }
    clientId = active.id;
  }

  const [vm, enterpriseSummary] = await Promise.all([
    buildTowerViewModel(clientId),
    loadEnterpriseSummary(clientId),
  ]);
  if (!vm) {
    return (
      <div style={{ padding: 40, color: MUTE, fontFamily: 'DM Sans, sans-serif' }}>
        Client <code>{clientId}</code> not found.
      </div>
    );
  }

  const valueRatio = vm.cost.monthlySpendUsd > 0 ? vm.value.verifiedUsd / (vm.cost.monthlySpendUsd * 12) : 0;

  return (
    <div style={{ padding: '24px 24px 40px', maxWidth: 1400, margin: '0 auto', color: INK, fontFamily: 'DM Sans, -apple-system, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: '0.14em', color: TEAL, textTransform: 'uppercase' }}>
            Control Tower
          </div>
          <div style={{ fontSize: 22, fontWeight: 500, marginTop: 4 }}>{vm.client.name}</div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTE, marginTop: 2 }}>
            {vm.client.industry_code ?? 'unclassified'}
          </div>
        </div>
        {/* Client switcher lives in the top-nav dropdown now; no duplicate
            selector rendered here. Single-client main-window principle. */}
      </div>

      {/* Five dimension panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginBottom: 20 }}>
        {panelFrame(
          TEAL,
          '1',
          'Inventory',
          'What exists',
          vm.inventory.freshness,
          <>
            <div>
              <span style={{ fontSize: 28, fontWeight: 500, color: INK }}>{vm.inventory.total}</span>
              <span style={{ fontSize: 12, color: MUTE, marginLeft: 6 }}>use cases</span>
            </div>
            <div style={{ fontSize: 12, color: MUTE, lineHeight: 1.7 }}>
              <div><span style={{ color: GREEN }}>●</span> In production: <span style={{ color: INK }}>{vm.inventory.inProduction}</span></div>
              <div><span style={{ color: AMBER }}>●</span> In pilot: <span style={{ color: INK }}>{vm.inventory.inPilot}</span></div>
              <div><span style={{ color: CORAL }}>●</span> Stalled: <span style={{ color: INK }}>{vm.inventory.stalled}</span></div>
            </div>
          </>,
        )}
        {panelFrame(
          TEAL,
          '2',
          'Adoption',
          'Who uses it',
          vm.adoption.freshness,
          <>
            <div>
              <span style={{ fontSize: 28, fontWeight: 500, color: INK }}>
                {vm.adoption.avgPenetrationPct > 0 ? `${Math.round(vm.adoption.avgPenetrationPct)}%` : '—'}
              </span>
              <span style={{ fontSize: 12, color: MUTE, marginLeft: 6 }}>avg penetration</span>
            </div>
            <div style={{ fontSize: 12, color: MUTE, lineHeight: 1.7 }}>
              <div>DAU: <span style={{ color: INK }}>{vm.adoption.totalDau.toLocaleString()}</span></div>
              <div>WAU: <span style={{ color: INK }}>{vm.adoption.totalWau.toLocaleString()}</span></div>
              <div>Avg drop-off: <span style={{ color: vm.adoption.avgDropOffPct > 40 ? CORAL : INK }}>
                {vm.adoption.avgDropOffPct > 0 ? `${Math.round(vm.adoption.avgDropOffPct)}%` : '—'}
              </span></div>
            </div>
          </>,
        )}
        {panelFrame(
          TEAL,
          '3',
          'Value',
          'Is it working',
          vm.value.freshness,
          <>
            <div>
              <span style={{ fontSize: 28, fontWeight: 500, color: INK }}>{dollarsM(vm.value.verifiedUsd)}</span>
              <span style={{ fontSize: 12, color: MUTE, marginLeft: 6 }}>verified</span>
            </div>
            <div style={{ fontSize: 12, color: MUTE, lineHeight: 1.7 }}>
              <div>Projected: <span style={{ color: INK }}>{dollarsM(vm.value.projectedUsd)}</span></div>
              <div>Drivers tracked: <span style={{ color: INK }}>{Object.keys(vm.value.byDriver).length}</span></div>
              <div>Use cases with baseline: <span style={{ color: INK }}>{vm.value.coveredUseCaseCount}</span></div>
            </div>
          </>,
        )}
        {panelFrame(
          TEAL,
          '4',
          'Risk',
          'Is it safe',
          vm.risk.freshness,
          <>
            <div>
              <span style={{ fontSize: 28, fontWeight: 500, color: INK }}>
                {vm.risk.approved}/{vm.risk.totalAssessed || 0}
              </span>
              <span style={{ fontSize: 12, color: MUTE, marginLeft: 6 }}>approved</span>
            </div>
            <div style={{ fontSize: 12, color: MUTE, lineHeight: 1.7 }}>
              <div>Conditional / pending: <span style={{ color: INK }}>{vm.risk.conditional} · {vm.risk.pending}</span></div>
              <div>High risk: <span style={{ color: vm.risk.highRisk > 0 ? CORAL : INK }}>{vm.risk.highRisk}</span></div>
              <div>PHI classified: <span style={{ color: INK }}>{vm.risk.phiCount}</span></div>
              <div>Bias incidents: <span style={{ color: vm.risk.biasIncidents > 0 ? CORAL : INK }}>{vm.risk.biasIncidents}</span></div>
            </div>
          </>,
        )}
        {panelFrame(
          TEAL,
          '5',
          'Cost',
          'Is it worth it',
          vm.cost.freshness,
          <>
            <div>
              <span style={{ fontSize: 28, fontWeight: 500, color: INK }}>{dollarsM(vm.cost.monthlySpendUsd)}</span>
              <span style={{ fontSize: 12, color: MUTE, marginLeft: 6 }}>/month</span>
            </div>
            <div style={{ fontSize: 12, color: MUTE, lineHeight: 1.7 }}>
              <div>LLM: <span style={{ color: INK }}>{dollarsM(vm.cost.byCategory.llm)}</span></div>
              <div>Compute: <span style={{ color: INK }}>{dollarsM(vm.cost.byCategory.compute)}</span></div>
              <div>License: <span style={{ color: INK }}>{dollarsM(vm.cost.byCategory.license)}</span></div>
              <div>Value ratio: <span style={{ color: valueRatio >= 1 ? GREEN : valueRatio > 0 ? AMBER : MUTE }}>
                {valueRatio > 0 ? `${valueRatio.toFixed(1)}x` : '—'}
              </span></div>
              <div>Projected 6mo: <span style={{ color: vm.cost.projected6moUsd > vm.cost.monthlySpendUsd * 9 ? CORAL : INK }}>
                {dollarsM(vm.cost.projected6moUsd)}
              </span></div>
            </div>
          </>,
        )}
      </div>

      {/* Enterprise context · Pack H Phase 5 */}
      <EnterpriseContextRow summary={enterpriseSummary} />

      {/* Contradiction engine */}
      <div style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: PURPLE }}>
              Contradictions · {vm.contradictions.length} active
            </div>
            <div style={{ fontSize: 12, color: MUTE, marginTop: 2 }}>
              Cross-dimension mismatches that deserve an engagement
            </div>
          </div>
        </div>
        {vm.contradictions.length === 0 ? (
          <div style={{ padding: 20, color: MUTE, fontSize: 13, fontStyle: 'italic', border: BORDER_SOFT, borderRadius: 10 }}>
            No active contradictions. Either data is incomplete or this client is exceptionally well-run.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 12 }}>
            {vm.contradictions.map((c) => (
              <ContradictionCard key={c.id} c={c} />
            ))}
          </div>
        )}
      </div>

      <TowerUploadZone clientId={vm.client.id} />
    </div>
  );
}
