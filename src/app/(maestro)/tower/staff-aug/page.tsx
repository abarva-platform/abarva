import Link from 'next/link';
import { getServerSupabase } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const INK = '#F5F5F0';
const TEAL = '#2DD4C8';
const GREEN = '#3FB27F';
const MUTE = 'rgba(245, 245, 240, 0.72)';
const BORDER = '0.5px solid rgba(255,255,255,0.08)';
const MONO = 'JetBrains Mono, monospace';

interface Row {
  id: string;
  vendor_name: string;
  engagement_type: string | null;
  function_area: string | null;
  headcount_fte: number | null;
  annual_spend_usd: number | null;
  touches_ai: boolean | null;
}

function dollars(usd: number | null): string {
  if (!usd) return '—';
  if (Math.abs(usd) >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
  if (Math.abs(usd) >= 1_000) return `$${Math.round(usd / 1_000)}k`;
  return `$${Math.round(usd)}`;
}

export default async function StaffAugPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { clientId } = await searchParams;
  const sb = getServerSupabase();
  const query = sb
    .from('staff_augmentation')
    .select('id, vendor_name, engagement_type, function_area, headcount_fte, annual_spend_usd, touches_ai')
    .order('annual_spend_usd', { ascending: false, nullsFirst: false });
  if (clientId) query.eq('client_id', clientId);
  const { data } = await query;
  const rows = (data ?? []) as Row[];

  const totalSpend = rows.reduce((s, r) => s + Number(r.annual_spend_usd ?? 0), 0);
  const totalFte = rows.reduce((s, r) => s + Number(r.headcount_fte ?? 0), 0);
  const aiCount = rows.filter((r) => r.touches_ai).length;

  return (
    <div style={{ padding: '40px 40px 64px', width: '100%', maxWidth: 1800, margin: '0 auto', color: INK, fontFamily: 'DM Sans, sans-serif' }}>
      <Link href={clientId ? `/tower?clientId=${clientId}` : '/tower'} style={{ fontFamily: MONO, fontSize: 10, color: TEAL, textDecoration: 'none', letterSpacing: '0.14em' }}>
        ← CONTROL TOWER
      </Link>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 400, color: INK, margin: '14px 0 6px' }}>
        Staff Augmentation
      </h1>
      <div style={{ fontSize: 14, color: MUTE, marginBottom: 32 }}>
        {rows.length} engagements · {totalFte} FTE · {dollars(totalSpend)}/yr · {aiCount} AI-touching
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: BORDER }}>
            <th style={thStyle}>Vendor</th>
            <th style={thStyle}>Engagement type</th>
            <th style={thStyle}>Function</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>FTE</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Annual spend</th>
            <th style={thStyle}>AI</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} style={{ borderBottom: '0.5px solid rgba(255,255,255,0.04)' }}>
              <td style={{ ...tdStyle, fontWeight: 600 }}>{r.vendor_name}</td>
              <td style={{ ...tdStyle, fontFamily: MONO, fontSize: 11, color: MUTE }}>{r.engagement_type ?? '—'}</td>
              <td style={{ ...tdStyle, color: MUTE }}>{r.function_area ?? '—'}</td>
              <td style={{ ...tdStyle, textAlign: 'right', fontFamily: MONO }}>{r.headcount_fte ?? '—'}</td>
              <td style={{ ...tdStyle, textAlign: 'right', fontFamily: MONO }}>{dollars(r.annual_spend_usd)}</td>
              <td style={tdStyle}>{r.touches_ai ? <span style={{ color: GREEN, fontFamily: MONO, fontSize: 11 }}>●</span> : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
