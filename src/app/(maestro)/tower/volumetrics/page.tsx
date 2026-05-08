import Link from 'next/link';
import { getServerSupabase } from '@/lib/supabase-server';
import { getActiveClientRow } from '@/lib/active-client';

export const dynamic = 'force-dynamic';

const INK = '#F5F5F0';
const TEAL = '#14B8A6';
const BLUE = '#4DA3FF';
const AMBER = '#F5C54A';
const GREEN = '#3FB27F';
const CORAL = '#FF6B4A';
const PURPLE = '#9B6DFF';
const MUTE = 'rgba(245, 245, 240, 0.72)';
const DIM = 'rgba(245, 245, 240, 0.48)';
const BORDER = '0.5px solid rgba(255,255,255,0.08)';
const MONO = 'JetBrains Mono, monospace';

interface Row {
  snapshot_date: string;
  api_calls_millions: number | null;
  tokens_billions: number | null;
  storage_tb: number | null;
  queries_millions: number | null;
  active_models: number | null;
  data_pipelines: number | null;
}

function deltaPct(latest: number, prior: number): number | null {
  if (!prior) return null;
  return ((latest - prior) / prior) * 100;
}

function trendColor(delta: number | null, positiveIsGood = true): string {
  if (delta === null) return MUTE;
  if (Math.abs(delta) < 1) return MUTE;
  const up = delta > 0;
  if (positiveIsGood) return up ? GREEN : CORAL;
  return up ? AMBER : GREEN;
}

function deltaLabel(delta: number | null): string {
  if (delta === null) return '—';
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)}%`;
}

function LineChart({
  data,
  label,
  unit,
  color = TEAL,
  delta,
}: {
  data: Array<{ date: string; value: number }>;
  label: string;
  unit: string;
  color?: string;
  delta: number | null;
}) {
  if (data.length < 2) return <div style={{ color: DIM, fontSize: 13 }}>{label}: insufficient data</div>;
  const w = 720;
  const h = 100;
  const max = Math.max(...data.map((d) => d.value));
  const min = Math.min(...data.map((d) => d.value));
  const range = max - min || 1;
  const pts = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((d.value - min) / range) * (h - 16) - 8;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const areaPts = `0,${h} ${pts} ${w},${h}`;

  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: BORDER, borderRadius: 10, padding: 16, marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <div style={{ fontFamily: MONO, fontSize: 10, color, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{label}</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
          <div style={{ fontSize: 18, fontWeight: 500, color: INK, fontFamily: 'Fraunces, Georgia, serif' }}>
            {data[data.length - 1]?.value.toFixed(2)}
            <span style={{ fontSize: 11, color: MUTE, marginLeft: 6 }}>{unit}</span>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: trendColor(delta) }}>
            {deltaLabel(delta)}
          </div>
        </div>
      </div>
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
        <polygon points={areaPts} fill={color} fillOpacity={0.08} />
        <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: MONO, fontSize: 10, color: MUTE }}>
        <span>{data[0]?.date}</span>
        <span>min {min.toFixed(1)} · max {max.toFixed(1)}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}

export default async function VolumetricsPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { clientId: overrideId } = await searchParams;
  const active = await getActiveClientRow();
  const effectiveClientId = overrideId ?? active?.id ?? null;

  const sb = getServerSupabase();
  const query = sb
    .from('volumetrics_snapshots')
    .select('snapshot_date, api_calls_millions, tokens_billions, storage_tb, queries_millions, active_models, data_pipelines')
    .order('snapshot_date', { ascending: true });
  if (effectiveClientId) query.eq('client_id', effectiveClientId);
  const { data } = await query;
  const rows = (data ?? []) as Row[];

  const latest = rows[rows.length - 1];
  const thirtyAgo = rows[Math.max(0, rows.length - 31)];
  const sevenAgo = rows[Math.max(0, rows.length - 8)];

  const apiSeries = rows.map((r) => ({ date: r.snapshot_date, value: Number(r.api_calls_millions ?? 0) }));
  const tokenSeries = rows.map((r) => ({ date: r.snapshot_date, value: Number(r.tokens_billions ?? 0) }));
  const querySeries = rows.map((r) => ({ date: r.snapshot_date, value: Number(r.queries_millions ?? 0) }));
  const storageSeries = rows.map((r) => ({ date: r.snapshot_date, value: Number(r.storage_tb ?? 0) }));

  // 30d deltas
  const apiDelta30 = thirtyAgo ? deltaPct(Number(latest?.api_calls_millions ?? 0), Number(thirtyAgo.api_calls_millions ?? 0)) : null;
  const tokenDelta30 = thirtyAgo ? deltaPct(Number(latest?.tokens_billions ?? 0), Number(thirtyAgo.tokens_billions ?? 0)) : null;
  const queryDelta30 = thirtyAgo ? deltaPct(Number(latest?.queries_millions ?? 0), Number(thirtyAgo.queries_millions ?? 0)) : null;
  const storageDelta30 = thirtyAgo ? deltaPct(Number(latest?.storage_tb ?? 0), Number(thirtyAgo.storage_tb ?? 0)) : null;
  const modelDelta7 = sevenAgo ? Number(latest?.active_models ?? 0) - Number(sevenAgo.active_models ?? 0) : null;
  const pipelineDelta7 = sevenAgo ? Number(latest?.data_pipelines ?? 0) - Number(sevenAgo.data_pipelines ?? 0) : null;

  const towerHref = overrideId ? `/tower?clientId=${overrideId}` : '/tower';

  return (
    <div style={{ padding: '32px 40px 64px', width: '100%', maxWidth: 1800, margin: '0 auto', color: INK, fontFamily: 'DM Sans, sans-serif' }}>
      <Link href={towerHref} style={{ fontFamily: MONO, fontSize: 10, color: TEAL, textDecoration: 'none', letterSpacing: '0.14em' }}>
        ← CONTROL TOWER
      </Link>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginTop: 14, marginBottom: 4 }}>
        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 30, fontWeight: 400, color: INK, margin: 0 }}>
          Volumetrics
        </h1>
        {active && (
          <span style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            ▸ {active.name}
          </span>
        )}
      </div>
      <div style={{ fontSize: 13, color: MUTE, marginBottom: 24 }}>
        {rows.length} daily snapshots · latest {latest?.snapshot_date ?? '—'} · 30d trend and current state.
      </div>

      {/* Signal tile grid with 30d deltas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 0, border: BORDER, borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
        <DeltaTile label="API / DAY" value={latest?.api_calls_millions != null ? `${Number(latest.api_calls_millions).toFixed(1)}M` : '—'} delta={apiDelta30} color={TEAL} />
        <DeltaTile label="TOKENS / DAY" value={latest?.tokens_billions != null ? `${Number(latest.tokens_billions).toFixed(2)}B` : '—'} delta={tokenDelta30} color={BLUE} />
        <DeltaTile label="QUERIES / DAY" value={latest?.queries_millions != null ? `${Number(latest.queries_millions).toFixed(1)}M` : '—'} delta={queryDelta30} color={AMBER} />
        <DeltaTile label="STORAGE" value={latest?.storage_tb != null ? `${Number(latest.storage_tb).toFixed(1)}TB` : '—'} delta={storageDelta30} color={PURPLE} />
        <StaticTile label="ACTIVE MODELS" value={(latest?.active_models ?? 0).toString()} sub={modelDelta7 != null ? `${modelDelta7 >= 0 ? '+' : ''}${modelDelta7} · 7d` : '—'} accent={INK} />
        <StaticTile label="DATA PIPELINES" value={(latest?.data_pipelines ?? 0).toString()} sub={pipelineDelta7 != null ? `${pipelineDelta7 >= 0 ? '+' : ''}${pipelineDelta7} · 7d` : '—'} accent={INK} isLast />
      </div>

      {rows.length === 0 ? (
        <div style={{ padding: 24, background: 'rgba(255,255,255,0.02)', border: BORDER, borderRadius: 10, color: DIM, fontSize: 13 }}>
          No volumetrics snapshots on file{active ? ` for ${active.name}` : ''}.
        </div>
      ) : (
        <>
          <LineChart data={apiSeries} label="API calls (millions / day)" unit="M" delta={apiDelta30} color={TEAL} />
          <LineChart data={tokenSeries} label="Tokens (billions / day)" unit="B" color={BLUE} delta={tokenDelta30} />
          <LineChart data={querySeries} label="Queries (millions / day)" unit="M" color={AMBER} delta={queryDelta30} />
          <LineChart data={storageSeries} label="Storage (TB)" unit="TB" color={PURPLE} delta={storageDelta30} />
        </>
      )}
    </div>
  );
}

function DeltaTile({ label, value, delta, color }: { label: string; value: string; delta: number | null; color: string }) {
  return (
    <div style={{ padding: '14px 16px', borderRight: BORDER, background: 'rgba(255,255,255,0.02)' }}>
      <div style={{ fontFamily: MONO, fontSize: 9, color: MUTE, letterSpacing: '0.14em' }}>{label}</div>
      <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 22, fontWeight: 400, color, marginTop: 4, lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: trendColor(delta), marginTop: 4 }}>
        {deltaLabel(delta)} · 30d
      </div>
    </div>
  );
}

function StaticTile({ label, value, sub, accent, isLast }: { label: string; value: string; sub: string; accent: string; isLast?: boolean }) {
  return (
    <div style={{ padding: '14px 16px', borderRight: isLast ? 'none' : BORDER, background: 'rgba(255,255,255,0.02)' }}>
      <div style={{ fontFamily: MONO, fontSize: 9, color: MUTE, letterSpacing: '0.14em' }}>{label}</div>
      <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 22, fontWeight: 400, color: accent, marginTop: 4, lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: DIM, marginTop: 4 }}>{sub}</div>
    </div>
  );
}
