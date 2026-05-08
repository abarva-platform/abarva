import Link from 'next/link';
import { getServerSupabase } from '@/lib/supabase-server';
import { getActiveClientRow } from '@/lib/active-client';

export const dynamic = 'force-dynamic';

const INK = '#F5F5F0';
const TEAL = '#14B8A6';
const GREEN = '#3FB27F';
const AMBER = '#F5C54A';
const CORAL = '#FF6B4A';
const PURPLE = '#9B6DFF';
const MUTE = 'rgba(245, 245, 240, 0.72)';
const DIM = 'rgba(245, 245, 240, 0.48)';
const BORDER = '0.5px solid rgba(255,255,255,0.08)';
const MONO = 'JetBrains Mono, monospace';

interface Row {
  id: string;
  vendor_name: string;
  engagement_type: string | null;
  function_area: string | null;
  headcount_fte: number | null;
  annual_spend_usd: number | null;
  contract_start: string | null;
  contract_end: string | null;
  touches_ai: boolean | null;
  notes: string | null;
}

function dollars(usd: number | null): string {
  if (!usd) return '—';
  if (Math.abs(usd) >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
  if (Math.abs(usd) >= 1_000) return `$${Math.round(usd / 1_000)}k`;
  return `$${Math.round(usd)}`;
}

function pct(num: number, denom: number): string {
  if (!denom) return '—';
  return `${Math.round((num / denom) * 100)}%`;
}

function engagementTypeLabel(t: string | null): string {
  if (!t) return '—';
  return t.replace(/_/g, ' ');
}

function engagementTypeColor(t: string | null): string {
  if (t === 'staff_aug') return TEAL;
  if (t === 'managed_service') return PURPLE;
  if (t === 'fixed_bid') return AMBER;
  if (t === 'retainer') return GREEN;
  return MUTE;
}

function monthsRemaining(end: string | null): number | null {
  if (!end) return null;
  const endDate = new Date(end);
  if (Number.isNaN(endDate.getTime())) return null;
  const months = (endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30);
  return Math.round(months);
}

export default async function StaffAugPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { clientId: overrideId } = await searchParams;
  const active = await getActiveClientRow();
  const effectiveClientId = overrideId ?? active?.id ?? null;

  const sb = getServerSupabase();
  const query = sb
    .from('staff_augmentation')
    .select('id, vendor_name, engagement_type, function_area, headcount_fte, annual_spend_usd, contract_start, contract_end, touches_ai, notes')
    .order('annual_spend_usd', { ascending: false, nullsFirst: false });
  if (effectiveClientId) query.eq('client_id', effectiveClientId);
  const { data } = await query;
  const rows = (data ?? []) as Row[];

  // Rollups
  const totalSpend = rows.reduce((s, r) => s + Number(r.annual_spend_usd ?? 0), 0);
  const totalFte = rows.reduce((s, r) => s + Number(r.headcount_fte ?? 0), 0);
  const aiTouchingRows = rows.filter((r) => r.touches_ai);
  const aiFte = aiTouchingRows.reduce((s, r) => s + Number(r.headcount_fte ?? 0), 0);
  const aiSpend = aiTouchingRows.reduce((s, r) => s + Number(r.annual_spend_usd ?? 0), 0);

  // Vendor groups
  const vendorMap = new Map<string, { fte: number; spend: number; engagements: number; functions: Set<string>; aiFte: number }>();
  for (const r of rows) {
    const existing = vendorMap.get(r.vendor_name) ?? { fte: 0, spend: 0, engagements: 0, functions: new Set(), aiFte: 0 };
    existing.fte += Number(r.headcount_fte ?? 0);
    existing.spend += Number(r.annual_spend_usd ?? 0);
    existing.engagements += 1;
    if (r.function_area) existing.functions.add(r.function_area);
    if (r.touches_ai) existing.aiFte += Number(r.headcount_fte ?? 0);
    vendorMap.set(r.vendor_name, existing);
  }
  const vendors = Array.from(vendorMap.entries())
    .map(([name, v]) => ({ name, ...v, functionCount: v.functions.size }))
    .sort((a, b) => b.spend - a.spend);
  const topVendor = vendors[0];
  const topVendorConcentration = topVendor && totalSpend ? topVendor.spend / totalSpend : 0;
  const avgPerFte = totalFte ? totalSpend / totalFte : 0;

  // Engagement-type groups
  const typeMap = new Map<string, { fte: number; spend: number; count: number }>();
  for (const r of rows) {
    const key = r.engagement_type ?? 'other';
    const existing = typeMap.get(key) ?? { fte: 0, spend: 0, count: 0 };
    existing.fte += Number(r.headcount_fte ?? 0);
    existing.spend += Number(r.annual_spend_usd ?? 0);
    existing.count += 1;
    typeMap.set(key, existing);
  }
  const types = Array.from(typeMap.entries())
    .map(([k, v]) => ({ key: k, ...v }))
    .sort((a, b) => b.spend - a.spend);

  // Function-area groups
  const funcMap = new Map<string, { fte: number; spend: number; aiFte: number }>();
  for (const r of rows) {
    const key = r.function_area ?? '—';
    const existing = funcMap.get(key) ?? { fte: 0, spend: 0, aiFte: 0 };
    existing.fte += Number(r.headcount_fte ?? 0);
    existing.spend += Number(r.annual_spend_usd ?? 0);
    if (r.touches_ai) existing.aiFte += Number(r.headcount_fte ?? 0);
    funcMap.set(key, existing);
  }
  const functions = Array.from(funcMap.entries())
    .map(([k, v]) => ({ name: k, ...v }))
    .sort((a, b) => b.spend - a.spend);

  // Renewal watch — contracts ending in <=6 months
  const renewalWatch = rows
    .map((r) => ({ row: r, months: monthsRemaining(r.contract_end) }))
    .filter((r) => r.months !== null && r.months <= 6)
    .sort((a, b) => (a.months ?? 0) - (b.months ?? 0));

  const towerHref = overrideId ? `/tower?clientId=${overrideId}` : '/tower';

  return (
    <div style={{ padding: '32px 40px 64px', width: '100%', maxWidth: 1800, margin: '0 auto', color: INK, fontFamily: 'Inter, sans-serif' }}>
      <Link href={towerHref} style={{ fontFamily: MONO, fontSize: 10, color: TEAL, textDecoration: 'none', letterSpacing: '0.14em' }}>
        ← CONTROL TOWER
      </Link>

      {/* Header meta strip */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginTop: 14, marginBottom: 4 }}>
        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 30, fontWeight: 400, color: INK, margin: 0 }}>
          Staff Augmentation
        </h1>
        {active && (
          <span style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            ▸ {active.name}
          </span>
        )}
      </div>
      <div style={{ fontSize: 13, color: MUTE, marginBottom: 24 }}>
        External headcount, vendor concentration, and contract exposure across the enterprise.
      </div>

      {/* Signal tile grid — 6 tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 0, border: BORDER, borderRadius: 10, overflow: 'hidden', marginBottom: 28 }}>
        <Tile label="HEADCOUNT" value={totalFte ? totalFte.toLocaleString() : '—'} sub="FTE" accent={INK} />
        <Tile label="ANNUAL SPEND" value={dollars(totalSpend)} sub={rows.length ? `${rows.length} engagements` : '—'} accent={INK} />
        <Tile label="VENDORS" value={vendors.length.toString()} sub={topVendor ? `${topVendor.name.split(' ')[0]} top` : '—'} accent={INK} />
        <Tile label="TOP VENDOR" value={topVendorConcentration ? `${Math.round(topVendorConcentration * 100)}%` : '—'} sub="share of spend" accent={topVendorConcentration > 0.4 ? CORAL : topVendorConcentration > 0.25 ? AMBER : GREEN} />
        <Tile label="AI-TOUCHING" value={pct(aiFte, totalFte)} sub={`${aiTouchingRows.length} of ${rows.length} engagements`} accent={aiTouchingRows.length ? TEAL : MUTE} />
        <Tile label="AVG $/FTE" value={avgPerFte ? dollars(avgPerFte) : '—'} sub="blended annual" accent={INK} isLast />
      </div>

      {/* Two-column: Vendor rollup + Engagement mix */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 20, marginBottom: 28 }}>
        {/* Vendor concentration */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: BORDER, borderRadius: 10, padding: 18 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: MUTE, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>
            Vendor concentration · {vendors.length} partners
          </div>
          {vendors.length === 0 ? (
            <div style={{ color: DIM, fontSize: 13, padding: '16px 0' }}>No vendors on file for {active?.name ?? 'this client'}.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {vendors.slice(0, 8).map((v) => {
                const share = totalSpend ? v.spend / totalSpend : 0;
                return (
                  <div key={v.name} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 70px 60px 70px', gap: 12, alignItems: 'center', fontSize: 13 }}>
                    <div style={{ fontWeight: 600, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {v.name}
                      {v.aiFte > 0 && <span style={{ color: TEAL, fontSize: 9, fontFamily: MONO, marginLeft: 6 }}>● AI</span>}
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.04)', height: 8, borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                      <div style={{ width: `${share * 100}%`, height: '100%', background: share > 0.4 ? CORAL : share > 0.25 ? AMBER : TEAL, opacity: 0.8 }} />
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 11, color: MUTE, textAlign: 'right' }}>{v.fte} FTE</div>
                    <div style={{ fontFamily: MONO, fontSize: 11, color: MUTE, textAlign: 'right' }}>{v.functionCount} fn</div>
                    <div style={{ fontFamily: MONO, fontSize: 12, color: INK, textAlign: 'right' }}>{dollars(v.spend)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Engagement mix */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: BORDER, borderRadius: 10, padding: 18 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: MUTE, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>
            Engagement mix
          </div>
          {types.length === 0 ? (
            <div style={{ color: DIM, fontSize: 13 }}>—</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {types.map((t) => {
                const share = totalSpend ? t.spend / totalSpend : 0;
                return (
                  <div key={t.key} style={{ display: 'grid', gridTemplateColumns: '1fr 48px 80px', gap: 8, alignItems: 'center', fontSize: 13 }}>
                    <div>
                      <span style={{ color: engagementTypeColor(t.key), fontFamily: MONO, fontSize: 9, marginRight: 6 }}>■</span>
                      <span style={{ color: INK }}>{engagementTypeLabel(t.key)}</span>
                      <span style={{ color: DIM, fontFamily: MONO, fontSize: 10, marginLeft: 6 }}>·{t.count}</span>
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 11, color: MUTE, textAlign: 'right' }}>{t.fte} FTE</div>
                    <div style={{ fontFamily: MONO, fontSize: 12, color: INK, textAlign: 'right' }}>
                      {dollars(t.spend)} <span style={{ color: DIM, fontSize: 10 }}>· {Math.round(share * 100)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {renewalWatch.length > 0 && (
            <div style={{ marginTop: 18, paddingTop: 14, borderTop: BORDER }}>
              <div style={{ fontFamily: MONO, fontSize: 10, color: AMBER, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>
                ⚠ Renewal watch · {renewalWatch.length} contract{renewalWatch.length === 1 ? '' : 's'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {renewalWatch.slice(0, 4).map(({ row, months }) => (
                  <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '1fr 56px 70px', gap: 8, alignItems: 'center', fontSize: 12 }}>
                    <div style={{ color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.vendor_name}</div>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: (months ?? 0) < 3 ? CORAL : AMBER, textAlign: 'right' }}>
                      {months === 0 ? 'now' : months! < 0 ? `${Math.abs(months!)}mo over` : `${months}mo`}
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 11, color: MUTE, textAlign: 'right' }}>{dollars(row.annual_spend_usd)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Function-area breakdown */}
      {functions.length > 0 && (
        <div style={{ background: 'rgba(255,255,255,0.02)', border: BORDER, borderRadius: 10, padding: 18, marginBottom: 28 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: MUTE, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>
            Function coverage · {functions.length} areas
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {functions.map((f) => {
              const aiShare = f.fte ? f.aiFte / f.fte : 0;
              return (
                <div key={f.name} style={{ background: 'rgba(255,255,255,0.02)', border: BORDER, borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: INK, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {f.name}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 11, color: MUTE }}>
                    <span>{f.fte} FTE</span>
                    <span>{dollars(f.spend)}</span>
                  </div>
                  {aiShare > 0 && (
                    <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, marginTop: 4 }}>
                      ● {Math.round(aiShare * 100)}% AI-touching
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detail roster */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: BORDER, borderRadius: 10, padding: 18 }}>
        <div style={{ fontFamily: MONO, fontSize: 10, color: MUTE, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>
          Full roster · {rows.length} engagements
        </div>
        {rows.length === 0 ? (
          <div style={{ color: DIM, fontSize: 13, padding: '16px 0' }}>
            No staff-aug engagements on file{active ? ` for ${active.name}` : ''}.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: BORDER }}>
                <th style={thStyle}>Vendor</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Function</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>FTE</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Annual</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>$/FTE</th>
                <th style={thStyle}>Ends</th>
                <th style={thStyle}>AI</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const perFte = r.headcount_fte && r.annual_spend_usd ? Number(r.annual_spend_usd) / Number(r.headcount_fte) : null;
                const months = monthsRemaining(r.contract_end);
                return (
                  <tr key={r.id} style={{ borderBottom: '0.5px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{r.vendor_name}</td>
                    <td style={tdStyle}>
                      <span style={{ color: engagementTypeColor(r.engagement_type), fontFamily: MONO, fontSize: 9, marginRight: 6 }}>■</span>
                      <span style={{ fontFamily: MONO, fontSize: 11, color: MUTE }}>{engagementTypeLabel(r.engagement_type)}</span>
                    </td>
                    <td style={{ ...tdStyle, color: MUTE }}>{r.function_area ?? '—'}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: MONO }}>{r.headcount_fte ?? '—'}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: MONO }}>{dollars(r.annual_spend_usd)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: MONO, color: MUTE }}>{perFte ? dollars(perFte) : '—'}</td>
                    <td style={{ ...tdStyle, fontFamily: MONO, fontSize: 11, color: months !== null && months <= 6 ? AMBER : MUTE }}>
                      {r.contract_end ? `${r.contract_end.slice(0, 7)}${months !== null && months <= 6 ? ` · ${months}mo` : ''}` : '—'}
                    </td>
                    <td style={tdStyle}>{r.touches_ai ? <span style={{ color: TEAL, fontFamily: MONO, fontSize: 11 }}>●</span> : ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Tile({ label, value, sub, accent, isLast }: { label: string; value: string; sub: string; accent: string; isLast?: boolean }) {
  return (
    <div style={{ padding: '14px 16px', borderRight: isLast ? 'none' : BORDER, background: 'rgba(255,255,255,0.02)' }}>
      <div style={{ fontFamily: MONO, fontSize: 9, color: MUTE, letterSpacing: '0.14em' }}>{label}</div>
      <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 22, fontWeight: 400, color: accent, marginTop: 4, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: DIM, marginTop: 4 }}>{sub}</div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '10px 12px',
  textAlign: 'left',
  fontSize: 10,
  fontFamily: MONO,
  color: MUTE,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 600,
};
const tdStyle: React.CSSProperties = { padding: '10px 12px', verticalAlign: 'middle' };
