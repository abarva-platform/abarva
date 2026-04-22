import Link from 'next/link';
import { buildTowerViewModel, type ContradictionRow } from '@/lib/tower/aggregate';
import { loadEnterpriseSummary } from '@/lib/tower/enterprise-summary';
import { TowerUploadZone } from '@/components/tower/TowerUploadZone';
import { EnterpriseContextRow } from '@/components/tower/EnterpriseContextRow';
import { AtlasRail } from '@/components/atlas/AtlasRail';

export const dynamic = 'force-dynamic';

const PAGE_BG = '#F6F1E8';
const PAGE_PANEL = '#FFFDFC';
const PAGE_SOFT = '#F3EBDD';
const PAGE_LINE = 'rgba(23,20,17,0.1)';
const PAGE_INK = '#171411';
const PAGE_MUTE = '#6B5B52';
const PAGE_TEAL = '#0E9F8C';
const PAGE_SHADOW = '0 24px 72px rgba(23,20,17,0.08)';
const SANS = '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const INK = '#F5F5F0';
const MUTE = 'rgba(245, 245, 240, 0.72)';
const TEAL = '#14B8A6';
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
    <div style={{ background: 'rgba(255,255,255,0.03)', border: BORDER_SOFT, borderRadius: 12, padding: 22, display: 'flex', flexDirection: 'column', gap: 14, minHeight: 224 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: accent, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            {number} · {title}
          </div>
          <div style={{ fontSize: 14, color: MUTE, marginTop: 4, lineHeight: 1.5 }}>{subtitle}</div>
        </div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: MUTE }}>
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
    <div style={{ padding: 16, background: 'rgba(255,255,255,0.03)', border: BORDER_SOFT, borderRadius: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: sev }}>
          {c.severity} · {contradictionTypeLabel(c.contradiction_type)}
        </div>
      </div>
      {impact?.one_liner && (
        <div
          style={{
            fontSize: 16,
            color: INK,
            lineHeight: 1.5,
            fontWeight: 500,
            padding: '12px 14px',
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
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: MUTE }}>
              <span style={{ color: MUTE }}>monthly spend:</span>{' '}
              <span style={{ color: INK }}>{monthly}</span>
            </div>
          )}
          {eliminable && (
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: MUTE }}>
              <span style={{ color: MUTE }}>eliminable/yr:</span>{' '}
              <span style={{ color: sev }}>{eliminable}</span>
              {typeof impact?.eliminable_pct === 'number' && (
                <span style={{ color: MUTE }}> · {impact.eliminable_pct}%</span>
              )}
            </div>
          )}
          {impact?.owner_named === false && (
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: CORAL }}>
              no owner named
            </div>
          )}
          {impact?.confidence && (
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: MUTE }}>
              confidence: {impact.confidence}
            </div>
          )}
        </div>
      )}
      <div style={{ fontSize: 14, color: MUTE, lineHeight: 1.65 }}>{c.description}</div>
      {refs.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {refs.slice(0, 4).map((r, i) => (
            <span
              key={i}
              style={{
                fontFamily: FONT_MONO,
                fontSize: 10,
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
        <div style={{ marginTop: 10, fontSize: 13, color: MUTE, fontStyle: 'italic' }}>
          Suggested: {c.suggested_action}
        </div>
      )}
      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
        {c.triggered_engagement_id ? (
          <Link
            href={`/engagements/${encodeURIComponent(c.triggered_engagement_id)}`}
            style={{ fontFamily: FONT_MONO, fontSize: 12, color: TEAL, textDecoration: 'none' }}
          >
            View engagement →
          </Link>
        ) : (
          <span
            title="Auto-trigger lands in Pack 15"
            style={{
              fontFamily: FONT_MONO,
              fontSize: 12,
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

  // Spend trajectory · 12-month rollup from spend_breakdown (Pack J seeds)
  let trajectory: Array<{ month: string; total: number; categoryCount: number }> = [];
  try {
    const { getServerSupabase } = await import('@/lib/supabase-server');
    const sb = getServerSupabase();
    const { data: spend } = await sb
      .from('spend_breakdown')
      .select('month, amount_usd, cost_center_id')
      .eq('client_id', clientId)
      .order('month', { ascending: true });
    const byMonth = new Map<string, { total: number; centers: Set<string> }>();
    for (const r of (spend as Array<{ month: string; amount_usd: number | null; cost_center_id: string | null }> | null) ?? []) {
      const key = r.month.slice(0, 7); // YYYY-MM
      const entry = byMonth.get(key) ?? { total: 0, centers: new Set<string>() };
      entry.total += Number(r.amount_usd ?? 0);
      if (r.cost_center_id) entry.centers.add(r.cost_center_id);
      byMonth.set(key, entry);
    }
    trajectory = Array.from(byMonth.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, v]) => ({ month, total: v.total, categoryCount: v.centers.size }));
  } catch {
    // quiet fail · trajectory stays empty · section hides
  }

  // Shadow AI · from applications.business_function='Shadow AI'
  let shadowAiFindings: Array<{ id: string; name: string; vendor: string | null; criticality: string; annual_cost_usd: number | null }> = [];
  try {
    const { getServerSupabase } = await import('@/lib/supabase-server');
    const sb = getServerSupabase();
    const { data } = await sb
      .from('applications')
      .select('id, name, vendor, criticality, annual_cost_usd')
      .eq('client_id', clientId)
      .eq('business_function', 'Shadow AI')
      .order('criticality', { ascending: true })
      .limit(12);
    shadowAiFindings = ((data as Array<{ id: string; name: string; vendor: string | null; criticality: string; annual_cost_usd: number | null }> | null) ?? []);
  } catch {
    // quiet fail · section hides
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: `radial-gradient(circle at top left, rgba(14,159,140,0.08), transparent 28%), ${PAGE_BG}`,
        color: PAGE_INK,
        fontFamily: SANS,
      }}
    >
      <div style={{ maxWidth: 1480, margin: '0 auto', padding: '28px 24px 56px' }}>
        <section
          className="tower-hero-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 0.7fr)',
            gap: 24,
            alignItems: 'stretch',
            marginBottom: 26,
          }}
        >
          <div
            style={{
              padding: '28px clamp(24px, 3vw, 40px)',
              background: PAGE_PANEL,
              border: `1px solid ${PAGE_LINE}`,
              borderRadius: 28,
              boxShadow: PAGE_SHADOW,
            }}
          >
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 11,
                letterSpacing: '0.14em',
                color: PAGE_TEAL,
                textTransform: 'uppercase',
              }}
            >
              Control Tower
            </div>
            <div
              style={{
                fontFamily: '"Fraunces", Georgia, serif',
                fontSize: 'clamp(46px, 6vw, 84px)',
                lineHeight: 0.92,
                letterSpacing: '-0.05em',
                color: PAGE_INK,
                marginTop: 14,
                maxWidth: 760,
              }}
            >
              {vm.client.name}
            </div>
            <div
              style={{
                marginTop: 18,
                maxWidth: 760,
                fontSize: 'clamp(17px, 1.2vw + 12px, 22px)',
                lineHeight: 1.55,
                color: PAGE_MUTE,
              }}
            >
              The operating view for adoption, value, risk, spend, and contradiction pressure.
              This page should read like a leadership cockpit, not a system dump.
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 22 }}>
              {[
                `${vm.client.industry_code ?? 'UNCLASSIFIED'} tenant`,
                `${vm.inventory.total} mapped use cases`,
                `${vm.contradictions.length} contradictions active`,
                `${dollarsM(vm.cost.monthlySpendUsd)} monthly spend`,
              ].map((pill) => (
                <span
                  key={pill}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 999,
                    background: PAGE_SOFT,
                    border: `1px solid ${PAGE_LINE}`,
                    fontFamily: FONT_MONO,
                    fontSize: 10,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: PAGE_MUTE,
                  }}
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>

          <div
            style={{
              padding: 24,
              background: `linear-gradient(180deg, ${PAGE_PANEL}, ${PAGE_SOFT})`,
              border: `1px solid ${PAGE_LINE}`,
              borderRadius: 28,
              boxShadow: PAGE_SHADOW,
              display: 'grid',
              gap: 16,
              alignContent: 'start',
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 10,
                  letterSpacing: '0.14em',
                  color: PAGE_TEAL,
                  textTransform: 'uppercase',
                }}
              >
                Portfolio read
              </div>
              <div
                style={{
                  marginTop: 10,
                  fontSize: 15,
                  lineHeight: 1.65,
                  color: PAGE_MUTE,
                }}
              >
                Atlas sits alongside the dashboard, but the left surface should already be legible in the
                room without narration. The core question is simple: where is the program reality drifting from
                the story leadership thinks it is telling?
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
              <div style={{ padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.56)', border: `1px solid ${PAGE_LINE}` }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: PAGE_TEAL }}>Verified value</div>
                <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: PAGE_INK }}>{dollarsM(vm.value.verifiedUsd)}</div>
              </div>
              <div style={{ padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.56)', border: `1px solid ${PAGE_LINE}` }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: PAGE_TEAL }}>High risk</div>
                <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: PAGE_INK }}>{vm.risk.highRisk}</div>
              </div>
              <div style={{ padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.56)', border: `1px solid ${PAGE_LINE}` }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: PAGE_TEAL }}>Use cases</div>
                <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: PAGE_INK }}>{vm.inventory.total}</div>
              </div>
              <div style={{ padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.56)', border: `1px solid ${PAGE_LINE}` }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: PAGE_TEAL }}>Value ratio</div>
                <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: PAGE_INK }}>
                  {valueRatio > 0 ? `${valueRatio.toFixed(1)}x` : '—'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <Link
                href="/tower/tech-stack"
                style={{
                  padding: '10px 14px',
                  borderRadius: 999,
                  background: PAGE_INK,
                  color: PAGE_BG,
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                Open tech stack
              </Link>
              <Link
                href="/programs"
                style={{
                  padding: '10px 14px',
                  borderRadius: 999,
                  border: `1px solid ${PAGE_LINE}`,
                  color: PAGE_INK,
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                Review programs
              </Link>
            </div>
          </div>
        </section>

        <section
          style={{
            padding: '22px 22px 28px',
            background: '#15110F',
            borderRadius: 30,
            boxShadow: '0 28px 72px rgba(23,20,17,0.16)',
          }}
        >
          <div style={{ color: INK, fontFamily: SANS }}>
            <div className="tower-main-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 24, alignItems: 'start' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 22 }}>
                  <div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: '0.14em', color: TEAL, textTransform: 'uppercase' }}>
                      Live system
                    </div>
                    <div style={{ fontSize: 'clamp(28px, 2vw + 18px, 36px)', fontWeight: 500, marginTop: 6, lineHeight: 1.1 }}>
                      Portfolio state, contradiction pressure, and enterprise footprint
                    </div>
                    <div style={{ fontSize: 14, color: MUTE, marginTop: 8, maxWidth: 720, lineHeight: 1.6 }}>
                      The top strip answers whether the current estate is real, adopted, valuable, safe, and worth
                      the spend. The sections below make that answer inspectable.
                    </div>
                  </div>
                </div>

          {/* Five dimension panels · force 5 columns so Cost never orphans
              on its own row. Drops to 3 columns below 1280px and 1 column
              below 640px via media query in the style-jsx block below. */}
          <div className="tower-dimension-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 14, marginBottom: 20 }}>
        {panelFrame(
          TEAL,
          '1',
          'Inventory',
          'What exists',
          vm.inventory.freshness,
          <>
            <div>
              <span style={{ fontSize: 'clamp(32px, 2.4vw + 18px, 44px)', fontWeight: 500, color: INK }}>{vm.inventory.total}</span>
              <span style={{ fontSize: 14, color: MUTE, marginLeft: 6 }}>use cases</span>
            </div>
            <div style={{ fontSize: 14, color: MUTE, lineHeight: 1.7 }}>
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
              <span style={{ fontSize: 'clamp(32px, 2.4vw + 18px, 44px)', fontWeight: 500, color: INK }}>
                {vm.adoption.avgPenetrationPct > 0 ? `${Math.round(vm.adoption.avgPenetrationPct)}%` : '—'}
              </span>
              <span style={{ fontSize: 14, color: MUTE, marginLeft: 6 }}>avg penetration</span>
            </div>
            <div style={{ fontSize: 14, color: MUTE, lineHeight: 1.7 }}>
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
              <span style={{ fontSize: 'clamp(32px, 2.4vw + 18px, 44px)', fontWeight: 500, color: INK }}>{dollarsM(vm.value.verifiedUsd)}</span>
              <span style={{ fontSize: 14, color: MUTE, marginLeft: 6 }}>verified</span>
            </div>
            <div style={{ fontSize: 14, color: MUTE, lineHeight: 1.7 }}>
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
              <span style={{ fontSize: 'clamp(32px, 2.4vw + 18px, 44px)', fontWeight: 500, color: INK }}>
                {vm.risk.approved}/{vm.risk.totalAssessed || 0}
              </span>
              <span style={{ fontSize: 14, color: MUTE, marginLeft: 6 }}>approved</span>
            </div>
            <div style={{ fontSize: 14, color: MUTE, lineHeight: 1.7 }}>
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
              <span style={{ fontSize: 'clamp(32px, 2.4vw + 18px, 44px)', fontWeight: 500, color: INK }}>{dollarsM(vm.cost.monthlySpendUsd)}</span>
              <span style={{ fontSize: 14, color: MUTE, marginLeft: 6 }}>/month</span>
            </div>
            <div style={{ fontSize: 14, color: MUTE, lineHeight: 1.7 }}>
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

                {/* 12-month spend trajectory · sparkline bars from spend_breakdown */}
                {trajectory.length > 0 && (
                  <section style={{ marginTop: 24, padding: 18, background: 'rgba(255,255,255,0.03)', border: BORDER_SOFT, borderRadius: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: TEAL }}>
                Spend trajectory · last 12 months
              </div>
              <div style={{ fontSize: 12, color: MUTE, marginTop: 2 }}>
                Monthly rollup across {trajectory[trajectory.length - 1]?.categoryCount ?? 0} cost centers · total {dollarsM(trajectory.reduce((s, r) => s + r.total, 0))} annualized
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTE }}>LATEST MONTH</div>
              <div style={{ fontSize: 18, fontWeight: 500, color: INK }}>
                {dollarsM(trajectory[trajectory.length - 1]?.total ?? 0)}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 88, marginTop: 8 }}>
            {(() => {
              const maxV = Math.max(...trajectory.map((r) => r.total), 1);
              return trajectory.map((r, i) => {
                const pct = (r.total / maxV) * 100;
                const isLast = i === trajectory.length - 1;
                return (
                  <div key={r.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div
                      title={`${r.month} · ${dollarsM(r.total)}`}
                      style={{
                        width: '100%',
                        height: `${Math.max(pct, 4)}%`,
                        background: isLast ? TEAL : 'rgba(20,184,166,0.5)',
                        borderRadius: 2,
                      }}
                    />
                    <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: MUTE }}>
                      {r.month.slice(5, 7)}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
                  </section>
                )}

                {/* Shadow AI inventory · from applications where business_function='Shadow AI' */}
                {shadowAiFindings.length > 0 && (
                  <section style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: CORAL }}>
                Shadow AI · {shadowAiFindings.length} discovered
              </div>
              <div style={{ fontSize: 12, color: MUTE, marginTop: 2 }}>
                AI in use without enterprise governance · discovered via network logs, expense trails, incident reports
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 10 }}>
            {shadowAiFindings.map((s) => {
              const critColor = s.criticality === 'critical' || s.criticality === 'high' ? CORAL : s.criticality === 'medium' ? AMBER : MUTE;
              return (
                <div key={s.id} style={{ padding: 14, background: 'rgba(255,107,74,0.04)', border: '0.5px solid rgba(255,107,74,0.2)', borderRadius: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: critColor, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                      {s.criticality}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: INK }}>{s.vendor ?? 'Unknown vendor'}</span>
                  </div>
                  <div style={{ fontSize: 12, color: INK, lineHeight: 1.4, marginBottom: 4 }}>
                    {s.name}
                  </div>
                  {s.annual_cost_usd != null && s.annual_cost_usd > 0 && (
                    <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: AMBER }}>
                      ~{dollarsM(s.annual_cost_usd / 12)}/mo annualized
                    </div>
                  )}
                </div>
              );
            })}
          </div>
                  </section>
                )}

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

              <AtlasRail clientId={clientId} clientName={vm.client.name} />
            </div>
          </div>
        </section>

        <style
          dangerouslySetInnerHTML={{
            __html: `
              @media (max-width: 1360px) {
                .tower-main-grid { grid-template-columns: 1fr !important; }
              }
              @media (max-width: 1280px) {
                .tower-dimension-grid { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
              }
              @media (max-width: 980px) {
                .tower-hero-grid { grid-template-columns: 1fr !important; }
              }
              @media (max-width: 720px) {
                .tower-dimension-grid { grid-template-columns: 1fr !important; }
              }
            `,
          }}
        />
      </div>
    </div>
  );
}
