import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { PublicPattern } from '@/lib/public-patterns/curated-list';

const INK = '#241B14';
const MUTED = '#695B50';
const LINE = 'rgba(63, 49, 38, 0.18)';
const PAPER = '#FFFBF2';
const WASH = '#EFE0C6';
const ACCENT = '#9B4F21';
const GREEN = '#496B44';
const MONO = 'var(--font-inter), "IBM Plex Mono", monospace';
const SERIF = 'var(--font-fraunces), Georgia, serif';
const SANS = 'var(--font-inter), "Inter", sans-serif';

const shellStyle: CSSProperties = {
  minHeight: '100vh',
  background: `radial-gradient(circle at top left, rgba(155,79,33,0.16), transparent 34%), linear-gradient(180deg, ${PAPER}, ${WASH})`,
  color: INK,
  fontFamily: SANS,
};

const cardStyle: CSSProperties = {
  border: `1px solid ${LINE}`,
  borderRadius: 28,
  background: 'rgba(255, 252, 246, 0.76)',
  boxShadow: '0 22px 70px rgba(42, 31, 21, 0.10)',
  padding: 28,
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={cardStyle}>
      <div style={{ color: ACCENT, fontFamily: MONO, fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        {title}
      </div>
      <div style={{ marginTop: 14, color: MUTED, fontSize: 17, lineHeight: 1.7 }}>{children}</div>
    </section>
  );
}

export function PublicPatternDetail({ pattern }: { pattern: PublicPattern }) {
  return (
    <main style={shellStyle}>
      <div style={{ margin: '0 auto', maxWidth: 1120, padding: '34px 22px 80px' }}>
        <Link
          href="/patterns"
          style={{ color: INK, display: 'inline-flex', fontFamily: MONO, fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', textDecoration: 'none', textTransform: 'uppercase' }}
        >
          Back to public patterns
        </Link>

        <header style={{ display: 'grid', gap: 24, gridTemplateColumns: 'minmax(0, 1.5fr) minmax(280px, 0.7fr)', marginTop: 42 }}>
          <div>
            <div style={{ color: ACCENT, fontFamily: MONO, fontSize: 12, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              {pattern.provenanceRibbon}
            </div>
            <h1 style={{ margin: '14px 0 18px', fontFamily: SERIF, fontSize: 'clamp(48px, 9vw, 94px)', lineHeight: 0.92, letterSpacing: '-0.065em' }}>
              {pattern.title}
            </h1>
            <p style={{ margin: 0, maxWidth: 780, color: MUTED, fontSize: 20, lineHeight: 1.62 }}>
              {pattern.publicSummary}
            </p>
          </div>

          <aside style={{ ...cardStyle, alignSelf: 'end' }}>
            <div style={{ color: MUTED, fontFamily: MONO, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Provenance ribbon</div>
            <div style={{ marginTop: 10, color: INK, fontFamily: SERIF, fontSize: 30, lineHeight: 1.05 }}>{pattern.id}</div>
            <dl style={{ display: 'grid', gap: 12, margin: '22px 0 0' }}>
              <div>
                <dt style={{ color: MUTED, fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Tier</dt>
                <dd style={{ margin: '5px 0 0', fontWeight: 800 }}>{pattern.tierLabel}</dd>
              </div>
              <div>
                <dt style={{ color: MUTED, fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Confidence</dt>
                <dd style={{ margin: '5px 0 0', fontWeight: 800 }}>{pattern.confidencePercent}%</dd>
              </div>
              <div>
                <dt style={{ color: MUTED, fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Observation basis</dt>
                <dd style={{ margin: '5px 0 0', fontWeight: 800 }}>{pattern.observationLabel}</dd>
              </div>
            </dl>
          </aside>
        </header>

        <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', marginTop: 30 }}>
          <Section title="Why it matters">{pattern.whyItMatters}</Section>
          <Section title="Where it applies">{pattern.whereItApplies}</Section>
        </div>

        <section style={{ ...cardStyle, marginTop: 18, background: 'rgba(36, 27, 20, 0.92)', color: '#FFF8EB' }}>
          <div style={{ color: '#EAB676', fontFamily: MONO, fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Atlas question stub
          </div>
          <p style={{ margin: '14px 0 0', maxWidth: 820, fontFamily: SERIF, fontSize: 34, lineHeight: 1.12 }}>
            {pattern.atlasQuestion}
          </p>
          <p style={{ margin: '16px 0 0', color: 'rgba(255, 248, 235, 0.72)', fontSize: 14, lineHeight: 1.6 }}>
            This section is intentionally public-safe until the Atlas question workflow is available for this route.
          </p>
        </section>

        <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'minmax(0, 0.8fr) minmax(0, 1.2fr)', marginTop: 18 }}>
          <section style={cardStyle}>
            <div style={{ color: GREEN, fontFamily: MONO, fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Public safeguards</div>
            <ul style={{ display: 'grid', gap: 10, margin: '16px 0 0', padding: 0, listStyle: 'none' }}>
              {pattern.safeguards.map((safeguard) => (
                <li key={safeguard} style={{ color: INK, fontWeight: 800 }}>- {safeguard}</li>
              ))}
            </ul>
          </section>
          <section style={cardStyle}>
            <div style={{ color: ACCENT, fontFamily: MONO, fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Related public lenses</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
              {pattern.connections.map((connection) => (
                <span key={connection} style={{ border: `1px solid ${LINE}`, borderRadius: 999, padding: '9px 12px', fontWeight: 800 }}>
                  {connection}
                </span>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
