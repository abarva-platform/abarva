import Link from 'next/link';
import { getServerSupabase } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const INK = '#F5F5F0';
const TEAL = '#2DD4C8';
const AMBER = '#F59E0B';
const MUTE = 'rgba(245, 245, 240, 0.72)';
const BORDER = '0.5px solid rgba(255,255,255,0.08)';
const MONO = 'JetBrains Mono, monospace';

interface Row {
  id: string;
  name: string;
  description: string | null;
  program_domain: string | null;
  status: string | null;
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

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { clientId } = await searchParams;
  const sb = getServerSupabase();
  const query = sb
    .from('tech_projects')
    .select('id, name, description, program_domain, status, total_budget_usd, spent_to_date_usd, exec_sponsor, touches_ai')
    .order('total_budget_usd', { ascending: false, nullsFirst: false });
  if (clientId) query.eq('client_id', clientId);
  const { data } = await query;
  const rows = (data ?? []) as Row[];

  const totalBudget = rows.reduce((s, r) => s + Number(r.total_budget_usd ?? 0), 0);
  const totalSpent = rows.reduce((s, r) => s + Number(r.spent_to_date_usd ?? 0), 0);
  const aiCount = rows.filter((r) => r.touches_ai).length;
  const inFlight = rows.filter((r) => r.status === 'in_flight').length;

  return (
    <div style={{ padding: '40px 40px 64px', width: '100%', maxWidth: 1800, margin: '0 auto', color: INK, fontFamily: 'DM Sans, sans-serif' }}>
      <Link href={clientId ? `/tower?clientId=${clientId}` : '/tower'} style={{ fontFamily: MONO, fontSize: 10, color: TEAL, textDecoration: 'none', letterSpacing: '0.14em' }}>
        ← CONTROL TOWER
      </Link>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 400, color: INK, margin: '14px 0 6px' }}>
        Technology Projects
      </h1>
      <div style={{ fontSize: 14, color: MUTE, marginBottom: 32 }}>
        {rows.length} projects · {aiCount} AI-adjacent · {inFlight} in-flight · {dollars(totalSpent)} / {dollars(totalBudget)}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rows.map((r) => {
          const pct = r.total_budget_usd && r.total_budget_usd > 0
            ? Math.min(100, ((r.spent_to_date_usd ?? 0) / r.total_budget_usd) * 100)
            : 0;
          return (
            <div key={r.id} style={{ padding: 16, background: 'rgba(255,255,255,0.02)', border: BORDER, borderRadius: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: INK }}>
                  {r.name}
                  {r.touches_ai && <span style={{ color: TEAL, fontSize: 11, marginLeft: 8, fontFamily: MONO }}>AI</span>}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: MUTE, letterSpacing: '0.08em' }}>
                  {r.status?.toUpperCase()}
                </div>
              </div>
              {r.description && (
                <div style={{ fontSize: 13, color: MUTE, marginBottom: 10 }}>{r.description}</div>
              )}
              <div style={{ display: 'flex', gap: 20, alignItems: 'center', fontSize: 12 }}>
                <div style={{ fontFamily: MONO, color: MUTE }}>
                  {dollars(r.spent_to_date_usd)} / {dollars(r.total_budget_usd)}
                </div>
                <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(245,158,11,0.12)', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: 4, background: AMBER }} />
                </div>
                <div style={{ fontFamily: MONO, color: MUTE, fontSize: 11 }}>
                  {pct.toFixed(0)}%
                </div>
                {r.exec_sponsor && (
                  <div style={{ color: MUTE, fontSize: 12 }}>· {r.exec_sponsor}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
