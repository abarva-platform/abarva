import Link from 'next/link';
import { getServerSupabase } from '@/lib/supabase-server';
import { getActiveClientRow } from '@/lib/active-client';

export const dynamic = 'force-dynamic';

const INK = '#F5F5F0';
const TEAL = '#14B8A6';
const AMBER = '#F5C54A';
const GREEN = '#3FB27F';
const CORAL = '#FF6B4A';
const PURPLE = '#9B6DFF';
const MUTE = 'rgba(245, 245, 240, 0.72)';
const DIM = 'rgba(245, 245, 240, 0.48)';
const BORDER = '0.5px solid rgba(255,255,255,0.08)';
const MONO = 'JetBrains Mono, monospace';

interface Row {
  id: string;
  name: string;
  description: string | null;
  program_domain: string | null;
  status: string | null;
  start_date: string | null;
  planned_end_date: string | null;
  total_budget_usd: number | null;
  spent_to_date_usd: number | null;
  exec_sponsor: string | null;
  touches_ai: boolean | null;
}

function dollars(usd: number | null): string {
  if (!usd) return '—';
  if (Math.abs(usd) >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
  if (Math.abs(usd) >= 1_000) return `$${Math.round(usd / 1_000)}k`;
  return `$${Math.round(usd)}`;
}

function statusColor(s: string | null): string {
  switch (s) {
    case 'in_flight': return TEAL;
    case 'stabilizing': return PURPLE;
    case 'approved': return GREEN;
    case 'ideation': return AMBER;
    case 'paused': return CORAL;
    case 'cancelled': return DIM;
    case 'completed': return GREEN;
    default: return MUTE;
  }
}

function statusLabel(s: string | null): string {
  if (!s) return '—';
  return s.replace(/_/g, ' ');
}

function healthFromBurn(burn: number, s: string | null): { tone: string; label: string } {
  if (s === 'paused') return { tone: CORAL, label: 'paused' };
  if (s === 'cancelled') return { tone: DIM, label: 'cancelled' };
  if (s === 'completed') return { tone: GREEN, label: 'done' };
  if (burn >= 110) return { tone: CORAL, label: 'over burn' };
  if (burn >= 90) return { tone: AMBER, label: 'watch' };
  if (burn >= 50) return { tone: TEAL, label: 'on track' };
  if (burn > 0) return { tone: GREEN, label: 'early' };
  return { tone: MUTE, label: 'no spend' };
}

function monthsUntil(d: string | null): number | null {
  if (!d) return null;
  const when = new Date(d);
  if (Number.isNaN(when.getTime())) return null;
  return Math.round((when.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30));
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { clientId: overrideId } = await searchParams;
  const active = await getActiveClientRow();
  const effectiveClientId = overrideId ?? active?.id ?? null;

  const sb = getServerSupabase();
  const query = sb
    .from('tech_projects')
    .select('id, name, description, program_domain, status, start_date, planned_end_date, total_budget_usd, spent_to_date_usd, exec_sponsor, touches_ai')
    .order('total_budget_usd', { ascending: false, nullsFirst: false });
  if (effectiveClientId) query.eq('client_id', effectiveClientId);
  const { data } = await query;
  const rows = (data ?? []) as Row[];

  // Rollups
  const totalBudget = rows.reduce((s, r) => s + Number(r.total_budget_usd ?? 0), 0);
  const totalSpent = rows.reduce((s, r) => s + Number(r.spent_to_date_usd ?? 0), 0);
  const aiRows = rows.filter((r) => r.touches_ai);
  const aiBudget = aiRows.reduce((s, r) => s + Number(r.total_budget_usd ?? 0), 0);
  const inFlight = rows.filter((r) => r.status === 'in_flight');
  const inFlightBudget = inFlight.reduce((s, r) => s + Number(r.total_budget_usd ?? 0), 0);

  // Status breakdown
  const statusMap = new Map<string, { count: number; budget: number }>();
  for (const r of rows) {
    const k = r.status ?? 'unknown';
    const existing = statusMap.get(k) ?? { count: 0, budget: 0 };
    existing.count += 1;
    existing.budget += Number(r.total_budget_usd ?? 0);
    statusMap.set(k, existing);
  }
  const STATUS_ORDER = ['ideation', 'approved', 'in_flight', 'stabilizing', 'completed', 'paused', 'cancelled'];
  const statuses = STATUS_ORDER
    .map((k) => ({ key: k, ...(statusMap.get(k) ?? { count: 0, budget: 0 }) }))
    .filter((s) => s.count > 0);

  // Program domain rollup
  const domainMap = new Map<string, { count: number; budget: number; aiCount: number }>();
  for (const r of rows) {
    const k = r.program_domain ?? 'Unassigned';
    const existing = domainMap.get(k) ?? { count: 0, budget: 0, aiCount: 0 };
    existing.count += 1;
    existing.budget += Number(r.total_budget_usd ?? 0);
    if (r.touches_ai) existing.aiCount += 1;
    domainMap.set(k, existing);
  }
  const domains = Array.from(domainMap.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.budget - a.budget);

  // Risk watch — over-burn + ending soon
  const riskWatch = rows
    .map((r) => {
      const burn = r.total_budget_usd && Number(r.total_budget_usd) > 0
        ? ((Number(r.spent_to_date_usd ?? 0) / Number(r.total_budget_usd)) * 100)
        : 0;
      const months = monthsUntil(r.planned_end_date);
      const overBurn = burn >= 90;
      const endingSoon = months !== null && months <= 3 && r.status !== 'completed' && r.status !== 'cancelled';
      if (!overBurn && !endingSoon) return null;
      return { row: r, burn, months, reason: overBurn && endingSoon ? 'burn + deadline' : overBurn ? 'burn' : 'deadline' };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => (b.burn - a.burn));

  const totalInFlightBurn = inFlightBudget > 0
    ? (inFlight.reduce((s, r) => s + Number(r.spent_to_date_usd ?? 0), 0) / inFlightBudget) * 100
    : 0;

  const towerHref = overrideId ? `/tower?clientId=${overrideId}` : '/tower';

  return (
    <div style={{ padding: '32px 40px 64px', width: '100%', maxWidth: 1800, margin: '0 auto', color: INK, fontFamily: 'DM Sans, sans-serif' }}>
      <Link href={towerHref} style={{ fontFamily: MONO, fontSize: 10, color: TEAL, textDecoration: 'none', letterSpacing: '0.14em' }}>
        ← CONTROL TOWER
      </Link>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginTop: 14, marginBottom: 4 }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 30, fontWeight: 400, color: INK, margin: 0 }}>
          Technology Projects
        </h1>
        {active && (
          <span style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            ▸ {active.name}
          </span>
        )}
      </div>
      <div style={{ fontSize: 13, color: MUTE, marginBottom: 24 }}>
        Project portfolio — status, burn, AI-adjacency, and exec sponsorship exposure.
      </div>

      {/* Signal tile grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 0, border: BORDER, borderRadius: 10, overflow: 'hidden', marginBottom: 28 }}>
        <Tile label="PORTFOLIO" value={rows.length.toString()} sub="projects" accent={INK} />
        <Tile label="TOTAL BUDGET" value={dollars(totalBudget)} sub={`${dollars(totalSpent)} spent`} accent={INK} />
        <Tile label="IN-FLIGHT" value={inFlight.length.toString()} sub={`${dollars(inFlightBudget)} committed`} accent={inFlight.length > 0 ? TEAL : MUTE} />
        <Tile label="AI PROJECTS" value={aiRows.length.toString()} sub={`${dollars(aiBudget)} · ${totalBudget ? Math.round((aiBudget / totalBudget) * 100) : 0}% of budget`} accent={aiRows.length > 0 ? TEAL : MUTE} />
        <Tile label="BURN RATE" value={totalInFlightBurn ? `${Math.round(totalInFlightBurn)}%` : '—'} sub="in-flight weighted" accent={totalInFlightBurn > 90 ? CORAL : totalInFlightBurn > 70 ? AMBER : GREEN} />
        <Tile label="RISK WATCH" value={riskWatch.length.toString()} sub="over-burn or ≤3mo" accent={riskWatch.length > 0 ? CORAL : GREEN} isLast />
      </div>

      {/* Two-column: Status ribbon + Domain rollup */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 20, marginBottom: 28 }}>
        {/* Status ribbon */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: BORDER, borderRadius: 10, padding: 18 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: MUTE, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>
            Status distribution
          </div>
          {statuses.length === 0 ? (
            <div style={{ color: DIM, fontSize: 13 }}>No projects on file.</div>
          ) : (
            <>
              <div style={{ display: 'flex', height: 10, borderRadius: 4, overflow: 'hidden', marginBottom: 14 }}>
                {statuses.map((s) => {
                  const share = rows.length ? s.count / rows.length : 0;
                  return (
                    <div
                      key={s.key}
                      title={`${statusLabel(s.key)} · ${s.count}`}
                      style={{ width: `${share * 100}%`, background: statusColor(s.key), opacity: 0.85 }}
                    />
                  );
                })}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {statuses.map((s) => (
                  <div key={s.key} style={{ display: 'grid', gridTemplateColumns: '1fr 40px 80px', gap: 8, alignItems: 'center', fontSize: 13 }}>
                    <div>
                      <span style={{ color: statusColor(s.key), fontFamily: MONO, fontSize: 9, marginRight: 6 }}>■</span>
                      <span style={{ color: INK, textTransform: 'capitalize' }}>{statusLabel(s.key)}</span>
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 11, color: MUTE, textAlign: 'right' }}>{s.count}</div>
                    <div style={{ fontFamily: MONO, fontSize: 12, color: INK, textAlign: 'right' }}>{dollars(s.budget)}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Program domain rollup */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: BORDER, borderRadius: 10, padding: 18 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: MUTE, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>
            Program domains · {domains.length}
          </div>
          {domains.length === 0 ? (
            <div style={{ color: DIM, fontSize: 13 }}>—</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {domains.slice(0, 6).map((d) => {
                const share = totalBudget ? d.budget / totalBudget : 0;
                return (
                  <div key={d.name} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 56px 80px', gap: 10, alignItems: 'center', fontSize: 13 }}>
                    <div style={{ color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {d.name}
                      {d.aiCount > 0 && <span style={{ color: TEAL, fontSize: 9, fontFamily: MONO, marginLeft: 6 }}>● {d.aiCount}</span>}
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.04)', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${share * 100}%`, height: '100%', background: d.aiCount > 0 ? TEAL : INK, opacity: 0.7 }} />
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 11, color: MUTE, textAlign: 'right' }}>{d.count}</div>
                    <div style={{ fontFamily: MONO, fontSize: 12, color: INK, textAlign: 'right' }}>{dollars(d.budget)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Risk watch */}
      {riskWatch.length > 0 && (
        <div style={{ background: 'rgba(255,107,74,0.04)', border: `0.5px solid ${CORAL}40`, borderRadius: 10, padding: 18, marginBottom: 28 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: CORAL, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>
            ⚠ Risk watch · {riskWatch.length} project{riskWatch.length === 1 ? '' : 's'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {riskWatch.slice(0, 5).map(({ row, burn, months, reason }) => (
              <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 70px 70px 80px', gap: 10, alignItems: 'center', fontSize: 13 }}>
                <div style={{ color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.name}</div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: MUTE, textAlign: 'right' }}>{reason}</div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: burn >= 100 ? CORAL : AMBER, textAlign: 'right' }}>{Math.round(burn)}%</div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: months !== null && months <= 0 ? CORAL : AMBER, textAlign: 'right' }}>
                  {months === null ? '—' : months === 0 ? 'now' : months < 0 ? `${Math.abs(months)}mo over` : `${months}mo`}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 12, color: INK, textAlign: 'right' }}>{dollars(row.total_budget_usd)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full project roster */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontFamily: MONO, fontSize: 10, color: MUTE, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>
          Project roster · {rows.length}
        </div>
        {rows.length === 0 ? (
          <div style={{ color: DIM, fontSize: 13, padding: 24, background: 'rgba(255,255,255,0.02)', border: BORDER, borderRadius: 10 }}>
            No projects on file{active ? ` for ${active.name}` : ''}.
          </div>
        ) : (
          rows.map((r) => {
            const burn = r.total_budget_usd && Number(r.total_budget_usd) > 0
              ? Math.min(100, ((Number(r.spent_to_date_usd ?? 0) / Number(r.total_budget_usd)) * 100))
              : 0;
            const burnRaw = r.total_budget_usd && Number(r.total_budget_usd) > 0
              ? ((Number(r.spent_to_date_usd ?? 0) / Number(r.total_budget_usd)) * 100)
              : 0;
            const health = healthFromBurn(burnRaw, r.status);
            const months = monthsUntil(r.planned_end_date);
            const sColor = statusColor(r.status);
            return (
              <div key={r.id} style={{ padding: 16, background: 'rgba(255,255,255,0.02)', border: BORDER, borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6, gap: 12 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: INK, flex: 1, minWidth: 0 }}>
                    {r.name}
                    {r.touches_ai && <span style={{ color: TEAL, fontSize: 10, marginLeft: 8, fontFamily: MONO, letterSpacing: '0.1em' }}>● AI</span>}
                    {r.program_domain && <span style={{ color: DIM, fontSize: 11, marginLeft: 8, fontFamily: MONO }}>· {r.program_domain}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: sColor, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                      ■ {statusLabel(r.status)}
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: health.tone, letterSpacing: '0.12em' }}>
                      {health.label.toUpperCase()}
                    </span>
                  </div>
                </div>
                {r.description && (
                  <div style={{ fontSize: 13, color: MUTE, marginBottom: 10, lineHeight: 1.5 }}>{r.description}</div>
                )}
                <div style={{ display: 'flex', gap: 14, alignItems: 'center', fontSize: 12 }}>
                  <div style={{ fontFamily: MONO, color: MUTE, minWidth: 130 }}>
                    {dollars(r.spent_to_date_usd)} / {dollars(r.total_budget_usd)}
                  </div>
                  <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                    <div style={{ width: `${burn}%`, height: 4, background: burnRaw >= 100 ? CORAL : burnRaw >= 90 ? AMBER : TEAL }} />
                  </div>
                  <div style={{ fontFamily: MONO, color: MUTE, fontSize: 11, minWidth: 40, textAlign: 'right' }}>
                    {burnRaw.toFixed(0)}%
                  </div>
                  {months !== null && (
                    <div style={{ fontFamily: MONO, fontSize: 11, color: months <= 3 && r.status === 'in_flight' ? AMBER : MUTE, minWidth: 90, textAlign: 'right' }}>
                      {months === 0 ? 'ends now' : months < 0 ? `${Math.abs(months)}mo over` : `${months}mo left`}
                    </div>
                  )}
                  {r.exec_sponsor && (
                    <div style={{ color: MUTE, fontSize: 12, whiteSpace: 'nowrap' }}>· {r.exec_sponsor}</div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function Tile({ label, value, sub, accent, isLast }: { label: string; value: string; sub: string; accent: string; isLast?: boolean }) {
  return (
    <div style={{ padding: '14px 16px', borderRight: isLast ? 'none' : BORDER, background: 'rgba(255,255,255,0.02)' }}>
      <div style={{ fontFamily: MONO, fontSize: 9, color: MUTE, letterSpacing: '0.14em' }}>{label}</div>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 400, color: accent, marginTop: 4, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: DIM, marginTop: 4 }}>{sub}</div>
    </div>
  );
}
