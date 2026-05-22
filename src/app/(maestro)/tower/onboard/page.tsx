import Link from 'next/link';
import { TOWER_DIMENSIONS } from '@/lib/tower/onboarding-catalog';

export const dynamic = 'force-dynamic';

// AbarVa locked light design system — cream `#F8F7F4` surface, Fraunces
// serif headings, Inter body, mono eyebrows, black/ghost controls. Mirrors
// the tokens used by the other locked Tower panels (e.g.
// MovePortfolioCardPanel). The previous dark teal theme violated the
// locked system and was re-skinned in the 2026-05 audit pass.
const PAGE_BG = '#F8F7F4';
const INK = '#1A1A18';
const INK_SOFT = '#5b5148';
const RULE = 'rgba(10,10,11,0.12)';
const CARD_BG = '#ffffff';
const SERIF = 'var(--font-fraunces), "Fraunces", Georgia, serif';
const MONO = 'var(--font-body-mono), ui-monospace, SFMono-Regular, Menlo, monospace';
const BODY = 'var(--font-body-sans), "Inter", -apple-system, system-ui, sans-serif';

export default function TowerOnboardIndex() {
  return (
    <div style={{ background: PAGE_BG, minHeight: '100%' }}>
      <div style={{ padding: '40px 40px 64px', width: '100%', maxWidth: 1800, margin: '0 auto', fontFamily: BODY }}>
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', color: INK_SOFT, textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>
          Control Tower · Data setup
        </div>
        <h1 style={{ fontFamily: SERIF, fontSize: 36, fontWeight: 400, color: INK, margin: 0, lineHeight: 1.2 }}>
          Populate the Tower
        </h1>
        <p style={{ fontSize: 15, color: INK_SOFT, marginTop: 10, maxWidth: 720, lineHeight: 1.55 }}>
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
                background: CARD_BG,
                border: `1px solid ${RULE}`,
                borderRadius: 10,
                textDecoration: 'none',
                color: INK,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontFamily: MONO, fontSize: 10, color: INK_SOFT, letterSpacing: '0.16em', fontWeight: 700 }}>
                  {d.num}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: INK_SOFT }}>
                  ~{d.setupMinutes} min
                </div>
              </div>
              <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 400, letterSpacing: '-0.01em', marginBottom: 8, color: INK }}>
                {d.name}
              </div>
              <div style={{ fontSize: 14, color: INK_SOFT, lineHeight: 1.5 }}>{d.tagline}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
