import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { PublicPattern } from '@/lib/public-patterns/curated-list';

const INK = '#241B14';
const MUTED = '#6F6257';
const LINE = 'rgba(63, 49, 38, 0.18)';
const PAPER = '#FFFBF2';
const WASH = '#F2E4CB';
const ACCENT = '#9B4F21';
const MONO = 'var(--font-inter), "IBM Plex Mono", monospace';
const SERIF = 'var(--font-fraunces), Georgia, serif';
const SANS = 'var(--font-inter), "DM Sans", sans-serif';

const cardStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  minHeight: 390,
  flexDirection: 'column',
  justifyContent: 'space-between',
  overflow: 'hidden',
  border: `1px solid ${LINE}`,
  borderRadius: 28,
  background: `linear-gradient(145deg, ${PAPER} 0%, #F8EEDC 55%, ${WASH} 100%)`,
  boxShadow: '0 22px 70px rgba(42, 31, 21, 0.12)',
  color: INK,
  padding: 26,
  textDecoration: 'none',
};

const ribbonStyle: CSSProperties = {
  alignSelf: 'flex-start',
  border: `1px solid ${LINE}`,
  borderRadius: 999,
  background: 'rgba(255, 252, 246, 0.72)',
  color: ACCENT,
  fontFamily: MONO,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.11em',
  padding: '8px 11px',
  textTransform: 'uppercase',
};

export function PublicPatternCard({ pattern }: { pattern: PublicPattern }) {
  return (
    <Link href={`/patterns/${pattern.slug}`} style={cardStyle} aria-label={`Read ${pattern.title}`}>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: -64,
          top: -72,
          width: 190,
          height: 190,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(155,79,33,0.23), rgba(155,79,33,0))',
        }}
      />
      <div style={{ position: 'relative', display: 'grid', gap: 20 }}>
        <div style={ribbonStyle}>{pattern.provenanceRibbon}</div>
        <div>
          <div style={{ color: MUTED, fontFamily: MONO, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {pattern.domainLabel} | {pattern.id}
          </div>
          <h2 style={{ margin: '12px 0 0', fontFamily: SERIF, fontSize: 34, lineHeight: 1.03, letterSpacing: '-0.035em' }}>
            {pattern.title}
          </h2>
        </div>
        <p style={{ margin: 0, color: MUTED, fontFamily: SANS, fontSize: 15, lineHeight: 1.62 }}>
          {pattern.publicSummary}
        </p>
      </div>
      <div style={{ position: 'relative', display: 'grid', gap: 18 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {pattern.connections.map((connection) => (
            <span
              key={connection}
              style={{
                border: `1px solid ${LINE}`,
                borderRadius: 999,
                background: 'rgba(255,255,255,0.38)',
                color: INK,
                fontFamily: MONO,
                fontSize: 11,
                padding: '7px 9px',
              }}
            >
              {connection}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, borderTop: `1px solid ${LINE}`, paddingTop: 16 }}>
          <div>
            <div style={{ color: MUTED, fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Confidence</div>
            <div style={{ fontFamily: SERIF, fontSize: 28 }}>{pattern.confidencePercent}%</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: MUTED, fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Public sample</div>
            <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 700 }}>Read pattern</div>
          </div>
        </div>
      </div>
    </Link>
  );
}
