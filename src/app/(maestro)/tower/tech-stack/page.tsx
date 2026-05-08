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
  category: string;
  vendor_name: string;
  product_name: string | null;
  deployment_model: string | null;
  annual_spend_usd: number | null;
  contract_end: string | null;
  seat_count: number | null;
  owning_function: string | null;
  touches_ai: boolean | null;
  status: string | null;
}

function dollars(usd: number | null): string {
  if (!usd) return '—';
  if (Math.abs(usd) >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
  if (Math.abs(usd) >= 1_000) return `$${Math.round(usd / 1_000)}k`;
  return `$${Math.round(usd)}`;
}

const CATEGORY_LABEL: Record<string, string> = {
  hardware: 'Hardware',
  infrastructure: 'Infrastructure',
  platform: 'Platform',
  business_app: 'Business app',
  data_platform: 'Data platform',
  security: 'Security',
  collaboration: 'Collaboration',
  dev_tools: 'Dev tools',
  ai_platform: 'AI platform',
  ai_model: 'AI model',
  service: 'Service',
  staff_aug: 'Staff aug',
};

const CATEGORY_COLOR: Record<string, string> = {
  hardware: DIM,
  infrastructure: PURPLE,
  platform: PURPLE,
  business_app: INK,
  data_platform: TEAL,
  security: CORAL,
  collaboration: MUTE,
  dev_tools: AMBER,
  ai_platform: TEAL,
  ai_model: TEAL,
  service: MUTE,
  staff_aug: AMBER,
};

function statusTone(s: string | null): string {
  if (s === 'sunsetting') return CORAL;
  if (s === 'in_procurement') return AMBER;
  if (s === 'terminated') return DIM;
  return GREEN;
}

function monthsUntil(d: string | null): number | null {
  if (!d) return null;
  const when = new Date(d);
  if (Number.isNaN(when.getTime())) return null;
  return Math.round((when.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30));
}

export default async function TechStackPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { clientId: overrideId } = await searchParams;
  const active = await getActiveClientRow();
  const effectiveClientId = overrideId ?? active?.id ?? null;

  const sb = getServerSupabase();
  const query = sb
    .from('tech_stack_items')
    .select(
      'id, category, vendor_name, product_name, deployment_model, annual_spend_usd, contract_end, seat_count, owning_function, touches_ai, status',
    )
    .order('annual_spend_usd', { ascending: false, nullsFirst: false });
  if (effectiveClientId) query.eq('client_id', effectiveClientId);
  const { data } = await query;
  const rows = (data ?? []) as Row[];

  // Rollups
  const totalSpend = rows.reduce((s, r) => s + Number(r.annual_spend_usd ?? 0), 0);
  const aiRows = rows.filter((r) => r.touches_ai);
  const aiSpend = aiRows.reduce((s, r) => s + Number(r.annual_spend_usd ?? 0), 0);
  const sunsettingRows = rows.filter((r) => r.status === 'sunsetting');
  const sunsetSpend = sunsettingRows.reduce((s, r) => s + Number(r.annual_spend_usd ?? 0), 0);
  const saasRows = rows.filter((r) => r.deployment_model === 'saas');
  const saasSpend = saasRows.reduce((s, r) => s + Number(r.annual_spend_usd ?? 0), 0);

  // Vendors
  const vendorMap = new Map<string, { count: number; spend: number; aiCount: number }>();
  for (const r of rows) {
    const existing = vendorMap.get(r.vendor_name) ?? { count: 0, spend: 0, aiCount: 0 };
    existing.count += 1;
    existing.spend += Number(r.annual_spend_usd ?? 0);
    if (r.touches_ai) existing.aiCount += 1;
    vendorMap.set(r.vendor_name, existing);
  }
  const vendors = Array.from(vendorMap.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.spend - a.spend);
  const topVendor = vendors[0];
  const topVendorShare = topVendor && totalSpend ? topVendor.spend / totalSpend : 0;

  // Category breakdown
  const catMap = new Map<string, { count: number; spend: number; aiCount: number }>();
  for (const r of rows) {
    const existing = catMap.get(r.category) ?? { count: 0, spend: 0, aiCount: 0 };
    existing.count += 1;
    existing.spend += Number(r.annual_spend_usd ?? 0);
    if (r.touches_ai) existing.aiCount += 1;
    catMap.set(r.category, existing);
  }
  const categories = Array.from(catMap.entries())
    .map(([k, v]) => ({ key: k, ...v }))
    .sort((a, b) => b.spend - a.spend);

  // Deployment breakdown
  const depMap = new Map<string, { count: number; spend: number }>();
  for (const r of rows) {
    const k = r.deployment_model ?? 'unknown';
    const existing = depMap.get(k) ?? { count: 0, spend: 0 };
    existing.count += 1;
    existing.spend += Number(r.annual_spend_usd ?? 0);
    depMap.set(k, existing);
  }
  const deployments = Array.from(depMap.entries())
    .map(([k, v]) => ({ key: k, ...v }))
    .sort((a, b) => b.spend - a.spend);

  // Renewal watch — contracts ending ≤6mo AND status='active'
  const renewalWatch = rows
    .map((r) => ({ row: r, months: monthsUntil(r.contract_end) }))
    .filter((x) => x.months !== null && x.months <= 6 && x.row.status === 'active')
    .sort((a, b) => (a.months ?? 0) - (b.months ?? 0));

  const renewalWatchSpend = renewalWatch.reduce((s, x) => s + Number(x.row.annual_spend_usd ?? 0), 0);

  const towerHref = overrideId ? `/tower?clientId=${overrideId}` : '/tower';

  return (
    <div style={{ padding: '32px 40px 64px', width: '100%', maxWidth: 1800, margin: '0 auto', color: INK, fontFamily: 'DM Sans, sans-serif' }}>
      <Link href={towerHref} style={{ fontFamily: MONO, fontSize: 10, color: TEAL, textDecoration: 'none', letterSpacing: '0.14em' }}>
        ← CONTROL TOWER
      </Link>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginTop: 14, marginBottom: 4 }}>
        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 30, fontWeight: 400, color: INK, margin: 0 }}>
          Tech Stack
        </h1>
        {active && (
          <span style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            ▸ {active.name}
          </span>
        )}
      </div>
      <div style={{ fontSize: 13, color: MUTE, marginBottom: 24 }}>
        Technology footprint — vendor concentration, AI-enablement, renewal exposure, and sunset risk.
      </div>

      {/* Signal tile grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 0, border: BORDER, borderRadius: 10, overflow: 'hidden', marginBottom: 28 }}>
        <Tile label="ANNUAL SPEND" value={dollars(totalSpend)} sub={`${rows.length} items`} accent={INK} />
        <Tile label="VENDORS" value={vendors.length.toString()} sub={topVendor ? `${topVendor.name} ${Math.round(topVendorShare * 100)}%` : '—'} accent={topVendorShare > 0.3 ? AMBER : INK} />
        <Tile label="AI-ENABLED" value={aiRows.length.toString()} sub={`${dollars(aiSpend)} · ${totalSpend ? Math.round((aiSpend / totalSpend) * 100) : 0}%`} accent={aiRows.length > 0 ? TEAL : MUTE} />
        <Tile label="SAAS SHARE" value={totalSpend ? `${Math.round((saasSpend / totalSpend) * 100)}%` : '—'} sub={`${saasRows.length} items · ${dollars(saasSpend)}`} accent={INK} />
        <Tile label="SUNSETTING" value={sunsettingRows.length.toString()} sub={dollars(sunsetSpend)} accent={sunsettingRows.length > 0 ? CORAL : GREEN} />
        <Tile label="RENEWALS ≤6MO" value={renewalWatch.length.toString()} sub={dollars(renewalWatchSpend)} accent={renewalWatch.length > 0 ? AMBER : GREEN} isLast />
      </div>

      {/* Two-column: Category + Deployment */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)', gap: 20, marginBottom: 28 }}>
        {/* Category breakdown */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: BORDER, borderRadius: 10, padding: 18 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: MUTE, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>
            Category distribution · {categories.length}
          </div>
          {categories.length === 0 ? (
            <div style={{ color: DIM, fontSize: 13 }}>No items on file.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {categories.map((c) => {
                const share = totalSpend ? c.spend / totalSpend : 0;
                const accent = CATEGORY_COLOR[c.key] ?? MUTE;
                return (
                  <div key={c.key} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 40px 40px 80px', gap: 10, alignItems: 'center', fontSize: 13 }}>
                    <div style={{ color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <span style={{ color: accent, fontFamily: MONO, fontSize: 9, marginRight: 6 }}>■</span>
                      {CATEGORY_LABEL[c.key] ?? c.key}
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.04)', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${share * 100}%`, height: '100%', background: accent, opacity: 0.8 }} />
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 11, color: MUTE, textAlign: 'right' }}>{c.count}</div>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: c.aiCount > 0 ? TEAL : DIM, textAlign: 'right' }}>
                      {c.aiCount > 0 ? `●${c.aiCount}` : ''}
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 12, color: INK, textAlign: 'right' }}>{dollars(c.spend)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Deployment + renewal watch */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: BORDER, borderRadius: 10, padding: 18 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: MUTE, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>
            Deployment mix
          </div>
          {deployments.length === 0 ? (
            <div style={{ color: DIM, fontSize: 13 }}>—</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {deployments.map((d) => {
                const share = totalSpend ? d.spend / totalSpend : 0;
                return (
                  <div key={d.key} style={{ display: 'grid', gridTemplateColumns: '1fr 40px 80px', gap: 8, alignItems: 'center', fontSize: 13 }}>
                    <div style={{ color: INK, textTransform: 'capitalize' }}>{d.key.replace(/_/g, ' ')}</div>
                    <div style={{ fontFamily: MONO, fontSize: 11, color: MUTE, textAlign: 'right' }}>{d.count}</div>
                    <div style={{ fontFamily: MONO, fontSize: 12, color: INK, textAlign: 'right' }}>
                      {dollars(d.spend)} <span style={{ color: DIM, fontSize: 10 }}>·{Math.round(share * 100)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {renewalWatch.length > 0 && (
            <div style={{ marginTop: 18, paddingTop: 14, borderTop: BORDER }}>
              <div style={{ fontFamily: MONO, fontSize: 10, color: AMBER, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>
                ⚠ Renewal watch · {renewalWatch.length}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {renewalWatch.slice(0, 5).map(({ row, months }) => (
                  <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '1fr 56px 70px', gap: 8, alignItems: 'center', fontSize: 12 }}>
                    <div style={{ color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {row.vendor_name}
                      {row.product_name && <span style={{ color: DIM, marginLeft: 4 }}>/ {row.product_name}</span>}
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: (months ?? 0) <= 3 ? CORAL : AMBER, textAlign: 'right' }}>
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

      {/* Top vendors (if multi-vendor) */}
      {vendors.length > 3 && (
        <div style={{ background: 'rgba(255,255,255,0.02)', border: BORDER, borderRadius: 10, padding: 18, marginBottom: 28 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: MUTE, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>
            Top vendors by spend
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
            {vendors.slice(0, 8).map((v) => (
              <div key={v.name} style={{ background: 'rgba(255,255,255,0.02)', border: BORDER, borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: INK, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {v.name}
                  {v.aiCount > 0 && <span style={{ color: TEAL, fontSize: 9, fontFamily: MONO, marginLeft: 6 }}>● AI</span>}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 11, color: MUTE }}>
                  <span>{v.count} item{v.count === 1 ? '' : 's'}</span>
                  <span style={{ color: INK }}>{dollars(v.spend)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full inventory table */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: BORDER, borderRadius: 10, padding: 18 }}>
        <div style={{ fontFamily: MONO, fontSize: 10, color: MUTE, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>
          Inventory · {rows.length}
        </div>
        {rows.length === 0 ? (
          <div style={{ color: DIM, fontSize: 13, padding: '16px 0' }}>
            No tech-stack items on file{active ? ` for ${active.name}` : ''}.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: BORDER }}>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Vendor</th>
                <th style={thStyle}>Product</th>
                <th style={thStyle}>Deployment</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Spend</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Seats</th>
                <th style={thStyle}>Owner</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>AI</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderBottom: '0.5px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ ...tdStyle, fontFamily: MONO, fontSize: 11 }}>
                    <span style={{ color: CATEGORY_COLOR[r.category] ?? MUTE, marginRight: 4 }}>■</span>
                    <span style={{ color: MUTE }}>{CATEGORY_LABEL[r.category] ?? r.category}</span>
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{r.vendor_name}</td>
                  <td style={tdStyle}>{r.product_name ?? '—'}</td>
                  <td style={{ ...tdStyle, fontFamily: MONO, fontSize: 11, color: MUTE }}>{r.deployment_model ?? '—'}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: MONO }}>{dollars(r.annual_spend_usd)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: MONO, color: MUTE }}>{r.seat_count ?? '—'}</td>
                  <td style={{ ...tdStyle, color: MUTE }}>{r.owning_function ?? '—'}</td>
                  <td style={{ ...tdStyle, fontFamily: MONO, fontSize: 11, color: statusTone(r.status) }}>
                    {r.status ?? 'active'}
                  </td>
                  <td style={tdStyle}>{r.touches_ai ? <span style={{ color: TEAL, fontFamily: MONO, fontSize: 11 }}>●</span> : ''}</td>
                </tr>
              ))}
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
