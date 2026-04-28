import type { Metadata } from 'next';
import { PublicPatternCard } from '@/components/public-pattern/PublicPatternCard';
import { getPublicPatternSample } from '@/lib/public-patterns/curated-list';

export const metadata: Metadata = {
  title: 'Public Pattern Sample | AbarVa',
  description: 'A public-safe sample of seven authored patterns from the AbarVa intelligence corpus.',
};

const INK = '#241B14';
const MUTED = '#695B50';
const LINE = 'rgba(63, 49, 38, 0.18)';
const PAPER = '#FFF8EB';
const WASH = '#EEDCC0';
const ACCENT = '#9B4F21';
const MONO = 'var(--font-inter), "IBM Plex Mono", monospace';
const SERIF = 'var(--font-fraunces), Georgia, serif';
const SANS = 'var(--font-inter), "DM Sans", sans-serif';

export default function PublicPatternsPage() {
  const patterns = getPublicPatternSample();

  return (
    <main
      style={{
        minHeight: '100vh',
        background: `radial-gradient(circle at 18% 2%, rgba(155,79,33,0.18), transparent 30%), radial-gradient(circle at 85% 12%, rgba(73,107,68,0.14), transparent 28%), linear-gradient(180deg, ${PAPER}, ${WASH})`,
        color: INK,
        fontFamily: SANS,
      }}
    >
      <div style={{ margin: '0 auto', maxWidth: 1240, padding: '48px 22px 86px' }}>
        <header style={{ display: 'grid', gap: 26, gridTemplateColumns: 'minmax(0, 1fr) minmax(260px, 360px)', alignItems: 'end' }}>
          <div>
            <div style={{ color: ACCENT, fontFamily: MONO, fontSize: 12, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              Public pattern sample | No auth required
            </div>
            <h1 style={{ margin: '16px 0 18px', maxWidth: 850, fontFamily: SERIF, fontSize: 'clamp(54px, 10vw, 112px)', lineHeight: 0.88, letterSpacing: '-0.075em' }}>
              Seven patterns, printed for public review.
            </h1>
            <p style={{ margin: 0, maxWidth: 760, color: MUTED, fontSize: 20, lineHeight: 1.62 }}>
              A paper-style sample from the KF-1 corpus loader. Each card keeps provenance visible while removing tenant names, source document paths, and customer-specific decisions.
            </p>
          </div>
          <aside style={{ border: `1px solid ${LINE}`, borderRadius: 28, background: 'rgba(255, 252, 246, 0.68)', padding: 24 }}>
            <div style={{ color: MUTED, fontFamily: MONO, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Sample contents</div>
            <div style={{ display: 'grid', gap: 14, marginTop: 18 }}>
              <div>
                <div style={{ fontFamily: SERIF, fontSize: 44, lineHeight: 1 }}>{patterns.length}</div>
                <div style={{ color: MUTED, fontSize: 14 }}>public-safe patterns</div>
              </div>
              <div>
                <div style={{ fontFamily: SERIF, fontSize: 44, lineHeight: 1 }}>KF-1</div>
                <div style={{ color: MUTED, fontSize: 14 }}>corpus-backed source</div>
              </div>
            </div>
          </aside>
        </header>

        <section style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', marginTop: 44 }}>
          {patterns.map((pattern) => (
            <PublicPatternCard key={pattern.id} pattern={pattern} />
          ))}
        </section>
      </div>
    </main>
  );
}
