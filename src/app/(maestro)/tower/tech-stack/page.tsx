import Link from 'next/link';
import { getServerSupabase } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const INK = '#F5F5F0';
const TEAL = '#2DD4C8';
const MUTE = 'rgba(245, 245, 240, 0.72)';
const BORDER = '0.5px solid rgba(255,255,255,0.08)';
const MONO = 'JetBrains Mono, monospace';

interface Row {
  id: string;
  category: string;
  vendor_name: string;
  product_name: string | null;
  deployment_model: string | null;
  annual_spend_usd: number | null;
  seat_count: number | null;
  owning_function: string | null;
  touches_ai: boolean | null;
  status: string | null;
  client: { name: string } | null;
}

function dollars(usd: number | null): string {
  if (!usd) return '—';
  if (Math.abs(usd) >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
  if (Math.abs(usd) >= 1_000) return `$${Math.round(usd / 1_000)}k`;
  return `$${Math.round(usd)}`;
}

export default async function TechStackPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { clientId } = await searchParams;
  const sb = getServerSupabase();
  const query = sb
    .from('tech_stack_items')
    .select(
      'id, category, vendor_name, product_name, deployment_model, annual_spend_usd, seat_count, owning_function, touches_ai, status, client:clients(name)',
    )
    .order('annual_spend_usd', { ascending: false, nullsFirst: false });
  if (clientId) query.eq('client_id', clientId);
  const { data } = await query;
  const rows = (data ?? []) as unknown as Row[];

  const totalSpend = rows.reduce((sum, r) => sum + Number(r.annual_spend_usd ?? 0), 0);
  const aiCount = rows.filter((r) => r.touches_ai).length;

  return (
    <div style={{ padding: '40px 40px 64px', width: '100%', maxWidth: 1800, margin: '0 auto', color: INK, fontFamily: 'DM Sans, sans-serif' }}>
      <Link href={clientId ? `/tower?clientId=${clientId}` : '/tower'} style={{ fontFamily: MONO, fontSize: 10, color: TEAL, textDecoration: 'none', letterSpacing: '0.14em' }}>
        ← CONTROL TOWER
      </Link>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 400, color: INK, margin: '14px 0 6px' }}>
        Tech Stack
      </h1>
      <div style={{ fontSize: 14, color: MUTE, marginBottom: 32 }}>
        {rows.length} items · {aiCount} AI-touching · {dollars(totalSpend)}/yr total spend
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: BORDER }}>
            <th style={thStyle}>Category</th>
            <th style={thStyle}>Vendor</th>
            <th style={thStyle}>Product</th>
            <th style={thStyle}>Deployment</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Annual spend</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Seats</th>
            <th style={thStyle}>Owning function</th>
            <th style={thStyle}>AI</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} style={{ borderBottom: '0.5px solid rgba(255,255,255,0.04)' }}>
              <td style={{ ...tdStyle, fontFamily: MONO, fontSize: 11, color: MUTE }}>{r.category}</td>
              <td style={{ ...tdStyle, fontWeight: 600 }}>{r.vendor_name}</td>
              <td style={tdStyle}>{r.product_name ?? '—'}</td>
              <td style={{ ...tdStyle, fontFamily: MONO, fontSize: 11, color: MUTE }}>{r.deployment_model ?? '—'}</td>
              <td style={{ ...tdStyle, textAlign: 'right', fontFamily: MONO }}>{dollars(r.annual_spend_usd)}</td>
              <td style={{ ...tdStyle, textAlign: 'right', fontFamily: MONO, color: MUTE }}>{r.seat_count ?? '—'}</td>
              <td style={{ ...tdStyle, color: MUTE }}>{r.owning_function ?? '—'}</td>
              <td style={tdStyle}>{r.touches_ai ? <span style={{ color: TEAL, fontFamily: MONO, fontSize: 11 }}>●</span> : ''}</td>
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
