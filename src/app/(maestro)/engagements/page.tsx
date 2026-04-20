import Link from 'next/link';
import { getAllActiveEngagements } from '@/lib/db/engagement';

export const dynamic = 'force-dynamic';

const INK = '#F5F5F0';
const MUTE = 'rgba(245, 245, 240, 0.72)';
const TEAL = '#2DD4C8';
const BORDER_SOFT = '0.5px solid rgba(255,255,255,0.08)';
const FONT_MONO = 'JetBrains Mono, monospace';

const PHASE_LABELS = ['Start', 'Diagnose', 'Design', 'Execute', 'Verify'];

export default async function EngagementsListPage() {
  const rows = await getAllActiveEngagements();
  return (
    <div style={{ padding: '28px 28px 40px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 500 }}>Engagements</div>
          <div style={{ fontSize: 12, color: MUTE, marginTop: 4 }}>
            {rows.length} active
          </div>
        </div>
        <Link
          href="/engagements/new"
          style={{
            padding: '8px 14px',
            background: TEAL,
            color: '#0A0A0A',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          + New engagement
        </Link>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {rows.length === 0 ? (
          <div style={{ color: MUTE, fontSize: 14, fontStyle: 'italic' }}>No active engagements yet.</div>
        ) : (
          rows.map((e) => (
            <Link
              key={e.id}
              href={`/engagements/${encodeURIComponent(e.graph_node_id)}`}
              style={{
                display: 'block',
                padding: 16,
                background: 'rgba(255,255,255,0.03)',
                border: BORDER_SOFT,
                borderRadius: 10,
                textDecoration: 'none',
                color: INK,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{e.name}</div>
                <div
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 10,
                    letterSpacing: '0.14em',
                    color: MUTE,
                    textTransform: 'uppercase',
                  }}
                >
                  Phase {e.current_phase} · {PHASE_LABELS[e.current_phase] ?? ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 14, fontSize: 12, color: MUTE }}>
                <div>{e.sponsor_name ?? 'unassigned'}{e.sponsor_role ? ` · ${e.sponsor_role}` : ''}</div>
                <div style={{ fontFamily: FONT_MONO, letterSpacing: '0.1em' }}>{e.industry_code}</div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
