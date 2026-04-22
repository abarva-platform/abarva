import Link from 'next/link';
import { DATA_CLIENTS } from '@/lib/data/clients';

export const dynamic = 'force-dynamic';

const INK = '#F5F5F0';
const MUTE = 'rgba(245, 245, 240, 0.72)';
const BORDER_SOFT = '0.5px solid rgba(255,255,255,0.08)';
const FONT_MONO = 'JetBrains Mono, monospace';

export default function DataSetupPage() {
  return (
    <div style={{ padding: '28px 28px 40px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 500 }}>Data setup</div>
        <div style={{ fontSize: 13, color: MUTE, marginTop: 4 }}>
          Load client-specific data into the knowledge index. AbarVa already has industry benchmarks + regulatory context — you add what's unique to each client.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {DATA_CLIENTS.map((c) => (
          <div
            key={c.id}
            style={{
              padding: 16,
              background: 'rgba(255,255,255,0.03)',
              border: BORDER_SOFT,
              borderRadius: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, color: INK }}>{c.name}</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em', color: MUTE, textTransform: 'uppercase', marginTop: 4 }}>
                {c.industryLabel}
              </div>
            </div>
            <Link
              href={{ pathname: '/platform/data/new', query: { clientId: c.id } }}
              style={{
                padding: '8px 12px',
                background: 'transparent',
                border: '0.5px solid rgba(20,184,166,0.35)',
                borderRadius: 8,
                color: '#14B8A6',
                fontSize: 12,
                fontWeight: 500,
                textDecoration: 'none',
                textAlign: 'center',
                marginTop: 'auto',
              }}
            >
              Continue loading data
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
