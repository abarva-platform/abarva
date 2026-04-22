import Link from 'next/link';
import { TOWER_DIMENSIONS } from '@/lib/tower/onboarding-catalog';

export const dynamic = 'force-dynamic';

const INK = '#F5F5F0';
const TEAL = '#2DD4C8';
const MUTE = 'rgba(245, 245, 240, 0.72)';
const PANEL_BG = 'rgba(255,255,255,0.02)';
const BORDER = '0.5px solid rgba(255,255,255,0.08)';

export default function TowerOnboardIndex() {
  return (
    <div style={{ padding: '40px 40px 64px', width: '100%', maxWidth: 1800, margin: '0 auto' }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.14em', color: TEAL, textTransform: 'uppercase', marginBottom: 10 }}>
        Control Tower · Data setup
      </div>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 36, fontWeight: 400, color: INK, margin: 0, lineHeight: 1.2 }}>
        Populate the Tower
      </h1>
      <p style={{ fontSize: 15, color: MUTE, marginTop: 10, maxWidth: 720, lineHeight: 1.55 }}>
        Five dimensions make up a complete Control Tower. Pick the dimension you want to populate first — each one tells you where to find the data in common enterprise systems and gives you a template you can fill and drop back in.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, marginTop: 40 }}>
        {TOWER_DIMENSIONS.map((d) => (
          <Link
            key={d.key}
            href={`/tower/onboard/${d.key}`}
            style={{
              display: 'block',
              padding: 24,
              background: PANEL_BG,
              border: BORDER,
              borderRadius: 10,
              textDecoration: 'none',
              color: INK,
              transition: 'border-color 120ms ease, background 120ms ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: TEAL, letterSpacing: '0.14em' }}>
                {d.num}
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: MUTE }}>
                ~{d.setupMinutes} min
              </div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 8 }}>
              {d.name}
            </div>
            <div style={{ fontSize: 14, color: MUTE, lineHeight: 1.5 }}>{d.tagline}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
