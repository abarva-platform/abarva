import Link from 'next/link';
import { getServerSupabase } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const INK = '#F5F5F0';
const TEAL = '#2DD4C8';
const MUTE = 'rgba(245, 245, 240, 0.72)';
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

function LineChart({
  data,
  label,
  unit,
  color = TEAL,
}: {
  data: Array<{ date: string; value: number }>;
  label: string;
  unit: string;
  color?: string;
}) {
  if (data.length < 2) return <div style={{ color: MUTE }}>insufficient data</div>;
  const w = 720;
  const h = 120;
  const max = Math.max(...data.map((d) => d.value));
  const min = Math.min(...data.map((d) => d.value));
  const range = max - min || 1;
  const pts = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((d.value - min) / range) * (h - 20) - 10;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: BORDER, borderRadius: 10, padding: 18, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <div style={{ fontFamily: MONO, fontSize: 10, color, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 500, color: INK }}>
          {data[data.length - 1]?.value.toFixed(2)}
          <span style={{ fontSize: 11, color: MUTE, marginLeft: 6 }}>{unit}</span>
        </div>
      </div>
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
        <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: MONO, fontSize: 10, color: MUTE }}>
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
  const { clientId } = await searchParams;
  const sb = getServerSupabase();
  const query = sb
    .from('volumetrics_snapshots')
    .select('snapshot_date, api_calls_millions, tokens_billions, storage_tb, queries_millions, active_models, data_pipelines')
    .order('snapshot_date', { ascending: true });
  if (clientId) query.eq('client_id', clientId);
  const { data } = await query;
  const rows = (data ?? []) as Row[];

  const apiSeries = rows.map((r) => ({ date: r.snapshot_date, value: Number(r.api_calls_millions ?? 0) }));
  const tokenSeries = rows.map((r) => ({ date: r.snapshot_date, value: Number(r.tokens_billions ?? 0) }));
  const querySeries = rows.map((r) => ({ date: r.snapshot_date, value: Number(r.queries_millions ?? 0) }));

  const latest = rows[rows.length - 1];

  return (
    <div style={{ padding: '40px 40px 64px', width: '100%', maxWidth: 1800, margin: '0 auto', color: INK, fontFamily: 'DM Sans, sans-serif' }}>
      <Link href={clientId ? `/tower?clientId=${clientId}` : '/tower'} style={{ fontFamily: MONO, fontSize: 10, color: TEAL, textDecoration: 'none', letterSpacing: '0.14em' }}>
        ← CONTROL TOWER
      </Link>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 400, color: INK, margin: '14px 0 6px' }}>
        Volumetrics
      </h1>
      <div style={{ fontSize: 14, color: MUTE, marginBottom: 32 }}>
        {rows.length} daily snapshots · latest {latest?.snapshot_date ?? '—'}
      </div>

      <LineChart data={apiSeries} label="API calls (millions / day)" unit="M" />
      <LineChart data={tokenSeries} label="Tokens (billions / day)" unit="B" color="#4DA3FF" />
      <LineChart data={querySeries} label="Queries (millions / day)" unit="M" color="#F59E0B" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginTop: 24 }}>
        <Stat label="Active models" value={latest?.active_models ?? 0} />
        <Stat label="Data pipelines" value={latest?.data_pipelines ?? 0} />
        <Stat label="Storage (TB)" value={latest?.storage_tb ?? 0} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{ padding: 14, background: 'rgba(255,255,255,0.02)', border: BORDER, borderRadius: 10 }}>
      <div style={{ fontFamily: MONO, fontSize: 10, color: MUTE, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 500, marginTop: 4 }}>{value}</div>
    </div>
  );
}
