// ProductMarketingPage · marketing-grade Product surface (PR-PROD).
//
// Replaces the prior internal-doctrine ProductPage with a pitch-style
// landing aligned to docs/training/abarva-marketing-page-v3.5.html.
// Four surfaces + Move lifecycle + substrate + differentiators, each
// section anchored by its own SVG illustration.
//
// SVG art is hand-rolled (deterministic, scalable, theme-tunable)
// rather than raster AI-generated — same visual register without
// the bandwidth/auth cost of an external image service.

import Link from 'next/link';
import type { ReactNode } from 'react';

const F_SERIF = "'Fraunces', Georgia, serif";
const F_SANS = "'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif";
const F_MONO = "'JetBrains Mono', 'SFMono-Regular', Menlo, monospace";

const C = {
  ink: '#15151A',
  inkSoft: '#4A4A52',
  inkMute: '#8A877E',
  accent: '#1F3A8A',
  accentWarm: '#B8651B',
  accentWarmSoft: '#D89762',
  cream: '#FAF7F0',
  creamDeep: '#F2EDE0',
  surface: '#FFFFFF',
  border: '#E8E2D2',
  hair: 'rgba(21,21,26,0.08)',
};

export function ProductMarketingPage() {
  return (
    <div
      data-testid="product-marketing-page"
      style={{
        background: C.cream,
        color: C.ink,
        fontFamily: F_SANS,
        fontSize: 16,
        lineHeight: 1.6,
        minHeight: '100vh',
      }}
    >
      <Hero />
      <FourSurfaces />
      <MoveLifecycle />
      <Substrate />
      <Differentiators />
      <Cta />
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────

function Hero() {
  return (
    <section
      style={{
        padding: '88px 64px 64px',
        background:
          `radial-gradient(circle at 80% 20%, ${C.accentWarmSoft}22 0%, transparent 50%), ` +
          `radial-gradient(circle at 10% 80%, ${C.accent}11 0%, transparent 50%), ` +
          C.cream,
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 480px',
          gap: 64,
          alignItems: 'center',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: F_MONO,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: C.inkMute,
              marginBottom: 18,
            }}
          >
            <span style={{ color: C.accent }}>01</span> · The platform
          </div>
          <h1
            style={{
              fontFamily: F_SERIF,
              fontSize: 'clamp(40px, 5vw, 64px)',
              fontWeight: 400,
              color: C.ink,
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
              margin: '0 0 22px',
              maxWidth: '20ch',
            }}
          >
            AI bets that{' '}
            <span style={{ fontStyle: 'italic', color: C.accent }}>actually</span>{' '}
            ship.
          </h1>
          <p
            style={{
              fontSize: 18,
              lineHeight: 1.55,
              color: C.inkSoft,
              maxWidth: '52ch',
              margin: '0 0 28px',
            }}
          >
            AbarVa is the operating platform for shaping enterprise AI bets.
            Pattern-grounded, tenant-overlaid, agent-collaborative — the
            three things every failed AI program lacked.
          </p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <Link
              href="/home"
              style={{
                background: C.ink,
                color: C.surface,
                padding: '14px 24px',
                borderRadius: 999,
                fontFamily: F_SANS,
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: '-0.005em',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              See it on Meridian →
            </Link>
            <Link
              href="/intelligence#brief"
              style={{
                color: C.ink,
                padding: '14px 24px',
                borderRadius: 999,
                fontFamily: F_SANS,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
                border: `1px solid ${C.ink}`,
              }}
            >
              Watch the brief
            </Link>
          </div>
        </div>
        <HeroIllustration />
      </div>

      {/* Reality stat block */}
      <div
        style={{
          maxWidth: 1280,
          margin: '64px auto 0',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 28,
          padding: '32px 0 0',
          borderTop: `1px solid ${C.border}`,
        }}
      >
        <Stat
          eyebrow="The reality"
          figure="73%"
          label="of enterprise AI initiatives never reach measurable production"
          source="Gartner 2025 · IDC 2024"
        />
        <Stat
          eyebrow="The pattern"
          figure="$2.4M"
          label="average sunk cost per failed AI bet at IDN scale"
          source="KLAS 2025-Q4 · n=87"
        />
        <Stat
          eyebrow="The win"
          figure="3.8×"
          label="success-rate lift when pattern-grounding is wired in early"
          source="AbarVa pilot cohort · 2025"
        />
      </div>
    </section>
  );
}

function Stat({
  eyebrow,
  figure,
  label,
  source,
}: {
  eyebrow: string;
  figure: string;
  label: string;
  source: string;
}) {
  return (
    <div
      style={{
        position: 'relative',
        paddingLeft: 18,
        borderLeft: `3px solid ${C.accent}`,
      }}
    >
      <div
        style={{
          fontFamily: F_MONO,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: C.inkMute,
          marginBottom: 8,
        }}
      >
        {eyebrow}
      </div>
      <div
        style={{
          fontFamily: F_SERIF,
          fontSize: 44,
          fontWeight: 400,
          color: C.ink,
          letterSpacing: '-0.022em',
          lineHeight: 1,
          marginBottom: 8,
        }}
      >
        {figure}
      </div>
      <div style={{ fontSize: 14, color: C.inkSoft, lineHeight: 1.5, marginBottom: 6, maxWidth: '36ch' }}>
        {label}
      </div>
      <div style={{ fontFamily: F_MONO, fontSize: 10, color: C.inkMute, letterSpacing: '0.06em' }}>
        {source}
      </div>
    </div>
  );
}

function HeroIllustration() {
  // Topo-map landscape · "where the bets sit." Concentric contour
  // lines, scattered AI-bet nodes (some above the line, some below),
  // a horizon line marking the cut.
  return (
    <svg
      viewBox="0 0 480 480"
      width="100%"
      style={{ display: 'block', maxWidth: 480 }}
      role="img"
      aria-label="Topographic landscape showing AI bets above and below the line"
    >
      <defs>
        <radialGradient id="hero-glow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor={C.accentWarmSoft} stopOpacity="0.45" />
          <stop offset="60%" stopColor={C.accent} stopOpacity="0.06" />
          <stop offset="100%" stopColor={C.cream} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hero-horizon" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={C.accent} stopOpacity="0" />
          <stop offset="50%" stopColor={C.accent} stopOpacity="0.7" />
          <stop offset="100%" stopColor={C.accent} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Background glow */}
      <rect width="480" height="480" fill="url(#hero-glow)" />

      {/* Contour lines — concentric blobs */}
      {[0.3, 0.45, 0.6, 0.75, 0.9].map((scale, i) => (
        <ellipse
          key={`contour-${i}`}
          cx={240}
          cy={210}
          rx={140 * scale}
          ry={86 * scale}
          fill="none"
          stroke={C.accent}
          strokeWidth={0.8}
          strokeOpacity={0.20 + i * 0.05}
          strokeDasharray={i % 2 === 0 ? '0' : '3 4'}
        />
      ))}
      {[0.4, 0.55, 0.7, 0.85].map((scale, i) => (
        <ellipse
          key={`contour-b-${i}`}
          cx={150}
          cy={340}
          rx={70 * scale}
          ry={42 * scale}
          fill="none"
          stroke={C.accentWarm}
          strokeWidth={0.8}
          strokeOpacity={0.18 + i * 0.05}
          strokeDasharray={i % 2 === 0 ? '0' : '3 4'}
        />
      ))}

      {/* Horizon line · "above the line" cut */}
      <line x1="20" y1="240" x2="460" y2="240" stroke="url(#hero-horizon)" strokeWidth={1.5} />
      <text
        x="20"
        y="232"
        fontFamily={F_MONO}
        fontSize={9}
        fill={C.accent}
        letterSpacing="0.16em"
        fontWeight={700}
      >
        ABOVE THE LINE
      </text>
      <text
        x="20"
        y="258"
        fontFamily={F_MONO}
        fontSize={9}
        fill={C.inkMute}
        letterSpacing="0.16em"
        fontWeight={700}
      >
        EVALUATING
      </text>

      {/* Above-the-line bets (filled, named) */}
      {[
        { x: 240, y: 175, r: 14, label: 'Pop Health' },
        { x: 195, y: 205, r: 11, label: 'Ambient AI' },
        { x: 295, y: 200, r: 9, label: 'Sepsis' },
      ].map((n) => (
        <g key={n.label}>
          <circle cx={n.x} cy={n.y} r={n.r} fill={C.accent} opacity={0.92} />
          <circle cx={n.x} cy={n.y} r={n.r + 4} fill="none" stroke={C.accent} strokeWidth={0.6} opacity={0.4} />
          <text
            x={n.x}
            y={n.y - n.r - 8}
            fontFamily={F_SANS}
            fontSize={10}
            fill={C.ink}
            fontWeight={600}
            textAnchor="middle"
          >
            {n.label}
          </text>
        </g>
      ))}

      {/* Below-the-line bets (lighter) */}
      {[
        { x: 130, y: 295, r: 8 },
        { x: 200, y: 320, r: 6 },
        { x: 260, y: 305, r: 7 },
        { x: 330, y: 315, r: 5 },
        { x: 165, y: 360, r: 6 },
        { x: 240, y: 380, r: 5 },
        { x: 325, y: 360, r: 7 },
        { x: 100, y: 340, r: 5 },
      ].map((n, i) => (
        <circle
          key={`below-${i}`}
          cx={n.x}
          cy={n.y}
          r={n.r}
          fill="none"
          stroke={C.accentWarm}
          strokeWidth={1.2}
          opacity={0.55}
        />
      ))}

      {/* Cluster connection — pattern cascade */}
      <path
        d="M 240,175 Q 217,190 195,205"
        fill="none"
        stroke={C.accent}
        strokeWidth={0.8}
        opacity={0.4}
        strokeDasharray="2 3"
      />
      <path
        d="M 240,175 Q 268,188 295,200"
        fill="none"
        stroke={C.accent}
        strokeWidth={0.8}
        opacity={0.4}
        strokeDasharray="2 3"
      />
    </svg>
  );
}

// ─── Four surfaces ───────────────────────────────────────────────

interface SurfaceMeta {
  num: string;
  name: string;
  tagline: string;
  body: string;
  illustration: ReactNode;
  href: string;
  ctaLabel: string;
}

// Order follows the customer journey: discover the bet (Intelligence)
// → shape and ship it (Moves) → the agent that stays in the room
// (Sentinel) → source the vendors and contracts (Source) → see the
// whole portfolio (Tower).
const SURFACES: ReadonlyArray<SurfaceMeta> = [
  {
    num: '01',
    name: 'Intelligence',
    tagline: 'Pattern → Move funnel',
    body: 'Corpus-grounded patterns scored against your tenant context. The Brief tells you what bets are above the line. The Map shows where you sit in the universe.',
    illustration: <IntelligenceIllustration />,
    href: '/intelligence',
    ctaLabel: 'Open Intelligence →',
  },
  {
    num: '02',
    name: 'Strategic Moves',
    tagline: 'Origination → ship → measure',
    body: 'The lifecycle a Move travels through, end-to-end. Gated approvals, audit trail, value attribution. Failure modes detected before they cost you a quarter.',
    illustration: <MovesIllustration />,
    href: '/strategic-moves',
    ctaLabel: 'Open Moves →',
  },
  {
    num: '03',
    name: 'Source',
    tagline: 'Vendor + contract intelligence',
    body: 'Where the IT spend goes — by category, by vendor, by renewal pressure. Sentinel fronts this surface, surfacing leverage thinness before the negotiation, not during it.',
    illustration: <SourceIllustration />,
    href: '/source',
    ctaLabel: 'Open Source →',
  },
  {
    num: '04',
    name: 'Tower',
    tagline: 'AI portfolio command',
    body: 'Every AI bet your enterprise has placed — measured against committed value. The view a CIO opens before a steering committee, not after.',
    illustration: <TowerIllustration />,
    href: '/tower',
    ctaLabel: 'Open Tower →',
  },
];

function FourSurfaces() {
  return (
    <section style={{ padding: '96px 64px', borderBottom: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <SectionEyebrow num="02">The four surfaces</SectionEyebrow>
        <SectionTitle>One platform. Four surfaces. Each one a CXO answer.</SectionTitle>
        <SectionLead>
          AbarVa isn't a dashboard. Each surface answers a different decision —
          and they're all wired into the same substrate so the answers stay
          consistent.
        </SectionLead>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            marginTop: 56,
          }}
        >
          {SURFACES.map((s, i) => (
            <SurfaceCard key={s.name} surface={s} flip={i % 2 === 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

function SurfaceCard({ surface, flip }: { surface: SurfaceMeta; flip: boolean }) {
  return (
    <article
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: 36,
        display: 'grid',
        gridTemplateColumns: flip ? '320px minmax(0, 1fr)' : 'minmax(0, 1fr) 320px',
        gap: 48,
        alignItems: 'center',
      }}
    >
      <div style={{ order: flip ? 2 : 1 }}>
        <div
          style={{
            fontFamily: F_MONO,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.18em',
            color: C.accent,
            marginBottom: 6,
          }}
        >
          {surface.num} · MODULE
        </div>
        <h3
          style={{
            fontFamily: F_SERIF,
            fontSize: 32,
            fontWeight: 400,
            color: C.ink,
            letterSpacing: '-0.018em',
            lineHeight: 1.1,
            margin: '0 0 4px',
          }}
        >
          {surface.name}
        </h3>
        <div
          style={{
            fontFamily: F_SERIF,
            fontStyle: 'italic',
            fontSize: 18,
            color: C.accentWarm,
            margin: '0 0 16px',
          }}
        >
          {surface.tagline}
        </div>
        <p style={{ fontSize: 15, color: C.inkSoft, lineHeight: 1.6, margin: '0 0 22px', maxWidth: '60ch' }}>
          {surface.body}
        </p>
        <Link
          href={surface.href}
          style={{
            fontFamily: F_SANS,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.04em',
            color: C.ink,
            textDecoration: 'none',
            borderBottom: `1px solid ${C.ink}`,
            paddingBottom: 2,
          }}
        >
          {surface.ctaLabel}
        </Link>
      </div>
      <div style={{ order: flip ? 1 : 2, display: 'flex', justifyContent: 'center' }}>
        {surface.illustration}
      </div>
    </article>
  );
}

// ── Module illustrations · each gets its own visual signature ──

function TowerIllustration() {
  // Watchtower silhouette · horizontal signal ribbons across the canvas.
  return (
    <svg viewBox="0 0 280 220" width="100%" style={{ maxWidth: 280 }} role="img" aria-label="Tower">
      <defs>
        <linearGradient id="tower-sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={C.accentWarmSoft} stopOpacity="0.18" />
          <stop offset="100%" stopColor={C.cream} stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="280" height="220" fill="url(#tower-sky)" />
      {/* Signal ribbons */}
      {[60, 90, 120, 150, 180].map((y, i) => (
        <line
          key={y}
          x1="10"
          y1={y}
          x2="270"
          y2={y}
          stroke={C.accent}
          strokeWidth={0.6}
          strokeOpacity={0.18 + i * 0.04}
          strokeDasharray="2 6"
        />
      ))}
      {/* Tower */}
      <rect x="125" y="40" width="30" height="160" fill={C.ink} />
      <rect x="115" y="32" width="50" height="14" fill={C.ink} />
      <rect x="120" y="28" width="40" height="6" fill={C.accent} />
      <line x1="140" y1="20" x2="140" y2="32" stroke={C.ink} strokeWidth={2} />
      <circle cx="140" cy="18" r="3" fill={C.accentWarm} />

      {/* Pulses radiating */}
      {[18, 28, 38].map((r, i) => (
        <circle
          key={r}
          cx="140"
          cy="40"
          r={r}
          fill="none"
          stroke={C.accentWarm}
          strokeWidth={1}
          opacity={0.5 - i * 0.15}
        />
      ))}

      {/* Bet markers on the signal lines */}
      {[
        { x: 50, y: 60 },
        { x: 220, y: 90 },
        { x: 80, y: 120 },
        { x: 200, y: 150 },
        { x: 60, y: 180 },
        { x: 230, y: 180 },
      ].map((m, i) => (
        <circle
          key={`marker-${i}`}
          cx={m.x}
          cy={m.y}
          r={3}
          fill={i % 2 === 0 ? C.accent : C.accentWarm}
        />
      ))}
    </svg>
  );
}

function SourceIllustration() {
  // Converging streams into a single port.
  return (
    <svg viewBox="0 0 280 220" width="100%" style={{ maxWidth: 280 }} role="img" aria-label="Source">
      <defs>
        <linearGradient id="source-flow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={C.accentWarm} stopOpacity="0.6" />
          <stop offset="100%" stopColor={C.accent} stopOpacity="0.9" />
        </linearGradient>
      </defs>
      {/* Streams */}
      {[
        { y1: 30, label: 'Hardware' },
        { y1: 80, label: 'Software' },
        { y1: 130, label: 'Services' },
        { y1: 180, label: 'Cloud' },
      ].map((s, i) => (
        <g key={i}>
          <path
            d={`M 10,${s.y1} Q 140,${s.y1} 250,110`}
            fill="none"
            stroke="url(#source-flow)"
            strokeWidth={2.5}
            opacity={0.5 + i * 0.1}
          />
          <circle cx="10" cy={s.y1} r="4" fill={C.accentWarm} />
          <text x="20" y={s.y1 + 3} fontFamily={F_MONO} fontSize="9" fill={C.inkSoft} letterSpacing="0.06em">
            {s.label}
          </text>
        </g>
      ))}
      {/* Converging port */}
      <circle cx="250" cy="110" r="14" fill={C.ink} />
      <circle cx="250" cy="110" r="8" fill={C.accent} />
      <circle cx="250" cy="110" r="3" fill={C.surface} />
      <text
        x="250"
        y="148"
        fontFamily={F_MONO}
        fontSize="9"
        fill={C.ink}
        letterSpacing="0.16em"
        textAnchor="middle"
        fontWeight={700}
      >
        $107M
      </text>
    </svg>
  );
}

function IntelligenceIllustration() {
  // Pattern network · nodes connected, one highlighted with a pulse.
  const nodes = [
    { x: 60, y: 50, big: false },
    { x: 140, y: 40, big: true },
    { x: 220, y: 60, big: false },
    { x: 90, y: 110, big: false },
    { x: 175, y: 130, big: false },
    { x: 240, y: 130, big: false },
    { x: 60, y: 170, big: false },
    { x: 140, y: 180, big: false },
    { x: 215, y: 175, big: false },
  ];
  const edges: Array<[number, number]> = [
    [0, 1],
    [1, 2],
    [0, 3],
    [1, 4],
    [2, 5],
    [3, 4],
    [4, 5],
    [3, 6],
    [4, 7],
    [5, 8],
    [6, 7],
    [7, 8],
  ];
  return (
    <svg viewBox="0 0 280 220" width="100%" style={{ maxWidth: 280 }} role="img" aria-label="Intelligence">
      <defs>
        <radialGradient id="int-pulse" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.accentWarm} stopOpacity="0.6" />
          <stop offset="100%" stopColor={C.accentWarm} stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Edges */}
      {edges.map(([a, b], i) => {
        const na = nodes[a]!;
        const nb = nodes[b]!;
        const isPattern = a === 1 || b === 1;
        return (
          <line
            key={i}
            x1={na.x}
            y1={na.y}
            x2={nb.x}
            y2={nb.y}
            stroke={isPattern ? C.accent : C.inkMute}
            strokeWidth={isPattern ? 1.5 : 0.8}
            opacity={isPattern ? 0.7 : 0.3}
            strokeDasharray={isPattern ? '0' : '2 3'}
          />
        );
      })}
      {/* Pulse around big node */}
      <circle cx="140" cy="40" r="40" fill="url(#int-pulse)" />
      {/* Nodes */}
      {nodes.map((n, i) => (
        <g key={i}>
          <circle
            cx={n.x}
            cy={n.y}
            r={n.big ? 9 : 5}
            fill={n.big ? C.accent : C.surface}
            stroke={n.big ? C.accent : C.ink}
            strokeWidth={n.big ? 0 : 1.2}
          />
          {n.big && <circle cx={n.x} cy={n.y} r={3} fill={C.surface} />}
        </g>
      ))}
      {/* Pattern label */}
      <text
        x="140"
        y="22"
        fontFamily={F_MONO}
        fontSize="9"
        fill={C.accent}
        letterSpacing="0.16em"
        textAnchor="middle"
        fontWeight={700}
      >
        P-HC-005
      </text>
    </svg>
  );
}

function MovesIllustration() {
  // Phased arches · 6 nested arches representing lifecycle phases.
  const phases = ['Originate', 'Shape', 'Approve', 'Build', 'Ship', 'Measure'];
  return (
    <svg viewBox="0 0 280 220" width="100%" style={{ maxWidth: 280 }} role="img" aria-label="Moves">
      {phases.map((p, i) => {
        const r = 18 + i * 16;
        return (
          <path
            key={p}
            d={`M ${140 - r},190 A ${r},${r} 0 0 1 ${140 + r},190`}
            fill="none"
            stroke={i === phases.length - 1 ? C.accentWarm : C.accent}
            strokeWidth={1.5}
            opacity={0.4 + i * 0.1}
          />
        );
      })}
      {/* Pin at center */}
      <line x1="140" y1="60" x2="140" y2="190" stroke={C.ink} strokeWidth={1.5} strokeDasharray="2 3" />
      <circle cx="140" cy="60" r="6" fill={C.accentWarm} />
      <circle cx="140" cy="190" r="4" fill={C.ink} />
      {/* Phase labels along the bottom */}
      {phases.map((p, i) => {
        const r = 18 + i * 16;
        const x = 140 - r;
        return (
          <text
            key={`l-${p}`}
            x={x - 4}
            y={195}
            fontFamily={F_MONO}
            fontSize="8"
            fill={C.inkMute}
            letterSpacing="0.08em"
            textAnchor="end"
          >
            {p}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Move lifecycle ──────────────────────────────────────────────

function MoveLifecycle() {
  const phases: ReadonlyArray<{ num: string; label: string; body: string }> = [
    { num: '01', label: 'Originate', body: 'Pattern-grounded shaping. The ask becomes a Move.' },
    { num: '02', label: 'Shape', body: 'Tenant overlay. Stakes, owners, dependencies named.' },
    { num: '03', label: 'Approve', body: 'Gated decision. Steering quorum, audit trail.' },
    { num: '04', label: 'Build', body: 'Vendor + SI selection · contract sourcing · POC.' },
    { num: '05', label: 'Ship', body: 'Production landing. KPI commit window opens.' },
    { num: '06', label: 'Measure', body: 'Measured vs committed. Failure modes flagged early.' },
  ];
  return (
    <section
      style={{
        padding: '96px 64px',
        background: C.creamDeep,
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <SectionEyebrow num="03">How it works</SectionEyebrow>
        <SectionTitle>The Move lifecycle · originate to measure.</SectionTitle>
        <SectionLead>
          Every AI bet AbarVa shapes travels six phases. Each phase has a
          gate, an owner, and an audit trail — so failure modes are visible
          before they cost a quarter.
        </SectionLead>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: 8,
            marginTop: 56,
            position: 'relative',
          }}
        >
          {/* Connecting line */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 18,
              left: 24,
              right: 24,
              height: 2,
              background: `linear-gradient(to right, ${C.accent}, ${C.accentWarm})`,
              opacity: 0.25,
            }}
          />
          {phases.map((p, i) => (
            <div key={p.num} style={{ position: 'relative' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: i === phases.length - 1 ? C.accentWarm : C.accent,
                  color: C.surface,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: F_MONO,
                  fontSize: 12,
                  fontWeight: 700,
                  marginBottom: 14,
                  border: `3px solid ${C.creamDeep}`,
                }}
              >
                {p.num}
              </div>
              <div
                style={{
                  fontFamily: F_SERIF,
                  fontSize: 19,
                  fontWeight: 500,
                  color: C.ink,
                  letterSpacing: '-0.012em',
                  marginBottom: 6,
                }}
              >
                {p.label}
              </div>
              <p style={{ fontSize: 13, color: C.inkSoft, lineHeight: 1.5, margin: 0 }}>
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Substrate ────────────────────────────────────────────────────

function Substrate() {
  return (
    <section style={{ padding: '96px 64px', borderBottom: `1px solid ${C.border}` }}>
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 420px',
          gap: 64,
          alignItems: 'center',
        }}
      >
        <div>
          <SectionEyebrow num="04">The substrate</SectionEyebrow>
          <SectionTitle>What AbarVa knows · before it answers.</SectionTitle>
          <p style={{ fontSize: 15.5, color: C.inkSoft, lineHeight: 1.65, marginBottom: 20, maxWidth: '54ch' }}>
            Every CXO answer is grounded in three layers of substrate. The
            tenant layer is what we know about you. The corpus is the cross-
            tenant pattern library. The industry layer is what's possible at
            the frontier.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 28 }}>
            <SubstrateRow
              label="Tenant"
              detail="23 substrate segments · 1.2k records · live"
              accent={C.accent}
              eyebrow="What we know about you"
            />
            <SubstrateRow
              label="Corpus"
              detail="47 patterns · 28 anti-patterns · 16 regulatory anchors"
              accent={C.accentWarm}
              eyebrow="What patterns exist"
            />
            <SubstrateRow
              label="Industry"
              detail="Healthcare · Retail · Financial Services"
              accent={C.ink}
              eyebrow="What is possible"
            />
          </div>
        </div>
        <SubstrateIllustration />
      </div>
    </section>
  );
}

function SubstrateRow({
  label,
  detail,
  eyebrow,
  accent,
}: {
  label: string;
  detail: string;
  eyebrow: string;
  accent: string;
}) {
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderLeft: `4px solid ${accent}`,
        borderRadius: 10,
        padding: '14px 20px',
      }}
    >
      <div
        style={{
          fontFamily: F_MONO,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: accent,
          marginBottom: 4,
        }}
      >
        {eyebrow}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontFamily: F_SERIF, fontSize: 22, fontWeight: 500, color: C.ink, letterSpacing: '-0.012em' }}>
          {label}
        </span>
        <span style={{ fontSize: 13.5, color: C.inkSoft }}>{detail}</span>
      </div>
    </div>
  );
}

function SubstrateIllustration() {
  // Three concentric layered rings.
  return (
    <svg viewBox="0 0 420 420" width="100%" style={{ maxWidth: 420 }} role="img" aria-label="Substrate">
      <defs>
        <radialGradient id="sub-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.accentWarmSoft} stopOpacity="0.18" />
          <stop offset="100%" stopColor={C.cream} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="210" cy="210" r="200" fill="url(#sub-bg)" />

      {/* Outer ring · Industry */}
      <circle cx="210" cy="210" r="180" fill="none" stroke={C.ink} strokeWidth={1} opacity={0.35} strokeDasharray="3 4" />
      <text x="210" y="40" fontFamily={F_MONO} fontSize="10" fill={C.ink} letterSpacing="0.18em" textAnchor="middle" fontWeight={700}>
        INDUSTRY
      </text>

      {/* Middle ring · Corpus */}
      <circle cx="210" cy="210" r="130" fill="none" stroke={C.accentWarm} strokeWidth={1.5} opacity={0.55} />
      <text x="210" y="92" fontFamily={F_MONO} fontSize="10" fill={C.accentWarm} letterSpacing="0.18em" textAnchor="middle" fontWeight={700}>
        CORPUS
      </text>

      {/* Inner ring · Tenant */}
      <circle cx="210" cy="210" r="76" fill={C.surface} stroke={C.accent} strokeWidth={2} />
      <text x="210" y="200" fontFamily={F_MONO} fontSize="10" fill={C.accent} letterSpacing="0.18em" textAnchor="middle" fontWeight={700}>
        TENANT
      </text>
      <text x="210" y="218" fontFamily={F_SERIF} fontSize="20" fill={C.ink} fontWeight={500} textAnchor="middle">
        Meridian
      </text>
      <text x="210" y="234" fontFamily={F_MONO} fontSize="9" fill={C.inkMute} letterSpacing="0.12em" textAnchor="middle">
        23 / 23 SEGMENTS
      </text>

      {/* Connecting tendrils */}
      {[40, 110, 180, 250, 320].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const r1 = 78;
        const r2 = 128;
        const x1 = 210 + Math.cos(rad) * r1;
        const y1 = 210 + Math.sin(rad) * r1;
        const x2 = 210 + Math.cos(rad) * r2;
        const y2 = 210 + Math.sin(rad) * r2;
        return (
          <line
            key={deg}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={C.accent}
            strokeWidth={0.8}
            opacity={0.5}
            strokeDasharray="2 3"
          />
        );
      })}

      {/* Pattern dots on middle ring */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const x = 210 + Math.cos(rad) * 130;
        const y = 210 + Math.sin(rad) * 130;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={i === 2 ? 5 : 3}
            fill={i === 2 ? C.accentWarm : C.ink}
            opacity={i === 2 ? 1 : 0.5}
          />
        );
      })}
    </svg>
  );
}

// ─── Differentiators ─────────────────────────────────────────────

function Differentiators() {
  const items: ReadonlyArray<{ num: string; title: string; body: string; mark: ReactNode }> = [
    {
      num: '01',
      title: 'Corpus-grounded',
      body: 'Patterns aren\'t opinions. Every binding pattern carries a quantified with-vs-without delta and a primary source. Sentinel can\'t guess; it cites.',
      mark: <DiffMark variant="grounded" />,
    },
    {
      num: '02',
      title: 'Tenant-overlaid',
      body: 'Generic AI advice fails because it ignores your size, segment, regulatory exposure, vendor footprint, and current portfolio. AbarVa scores against all of it.',
      mark: <DiffMark variant="overlay" />,
    },
    {
      num: '03',
      title: 'Agent-collaborative',
      body: 'Sentinel pushes back on framing, surfaces the binding pattern, and stays in the room. The agent is a participant in the decision, not a search box.',
      mark: <DiffMark variant="agent" />,
    },
  ];
  return (
    <section style={{ padding: '96px 64px', borderBottom: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <SectionEyebrow num="05">Why it works</SectionEyebrow>
        <SectionTitle>Three things every failed AI program lacked.</SectionTitle>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 24,
            marginTop: 56,
          }}
        >
          {items.map((item) => (
            <article
              key={item.num}
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 14,
                padding: 32,
              }}
            >
              {item.mark}
              <div
                style={{
                  fontFamily: F_MONO,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  color: C.accent,
                  margin: '20px 0 6px',
                }}
              >
                {item.num} · DIFFERENTIATOR
              </div>
              <h3
                style={{
                  fontFamily: F_SERIF,
                  fontSize: 24,
                  fontWeight: 500,
                  color: C.ink,
                  letterSpacing: '-0.012em',
                  margin: '0 0 14px',
                }}
              >
                {item.title}
              </h3>
              <p style={{ fontSize: 14.5, color: C.inkSoft, lineHeight: 1.6, margin: 0 }}>
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function DiffMark({ variant }: { variant: 'grounded' | 'overlay' | 'agent' }) {
  return (
    <svg viewBox="0 0 80 80" width="80" height="80" role="img" aria-hidden="true">
      {variant === 'grounded' && (
        <>
          <rect x="10" y="10" width="60" height="60" fill="none" stroke={C.accent} strokeWidth={1.2} />
          {[20, 30, 40, 50, 60].map((y) => (
            <line key={y} x1="14" y1={y} x2="66" y2={y} stroke={C.accent} strokeWidth={0.6} opacity={0.4} />
          ))}
          <circle cx="40" cy="40" r="10" fill={C.accent} />
          <circle cx="40" cy="40" r="4" fill={C.surface} />
        </>
      )}
      {variant === 'overlay' && (
        <>
          <circle cx="32" cy="32" r="22" fill="none" stroke={C.accent} strokeWidth={1.4} />
          <circle cx="48" cy="48" r="22" fill="none" stroke={C.accentWarm} strokeWidth={1.4} />
          <circle cx="40" cy="40" r="8" fill={C.ink} />
        </>
      )}
      {variant === 'agent' && (
        <>
          <circle cx="40" cy="40" r="28" fill="none" stroke={C.accent} strokeWidth={0.6} opacity={0.3} />
          <circle cx="40" cy="40" r="20" fill="none" stroke={C.accent} strokeWidth={0.8} opacity={0.5} />
          <circle cx="40" cy="40" r="12" fill={C.accentWarm} />
          <circle cx="40" cy="40" r="6" fill={C.ink} />
          <circle cx="40" cy="40" r="2.5" fill={C.surface} />
        </>
      )}
    </svg>
  );
}

// ─── CTA ─────────────────────────────────────────────────────────

function Cta() {
  return (
    <section
      style={{
        padding: '96px 64px',
        background: C.ink,
        color: C.surface,
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div
          style={{
            fontFamily: F_MONO,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.22em',
            color: C.accentWarmSoft,
            textTransform: 'uppercase',
            marginBottom: 18,
          }}
        >
          06 · See it work
        </div>
        <h2
          style={{
            fontFamily: F_SERIF,
            fontSize: 'clamp(36px, 4.4vw, 52px)',
            fontWeight: 400,
            letterSpacing: '-0.018em',
            lineHeight: 1.1,
            margin: '0 0 22px',
            color: C.surface,
          }}
        >
          Open the brief on a real tenant.
        </h2>
        <p
          style={{
            fontSize: 17,
            lineHeight: 1.6,
            color: 'rgba(255,255,255,0.78)',
            margin: '0 0 36px',
          }}
        >
          Meridian Health is loaded with 23 substrate segments, 47 patterns,
          and 7 active AI initiatives. Pop in and see how AbarVa shapes their
          quarterly read.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/intelligence"
            style={{
              background: C.accentWarm,
              color: C.surface,
              padding: '16px 28px',
              borderRadius: 999,
              fontFamily: F_SANS,
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '-0.005em',
              textDecoration: 'none',
            }}
          >
            Open Intelligence on Meridian →
          </Link>
          <Link
            href="/home"
            style={{
              color: C.surface,
              padding: '16px 28px',
              borderRadius: 999,
              fontFamily: F_SANS,
              fontSize: 14,
              fontWeight: 700,
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.30)',
            }}
          >
            Tenant home
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Section primitives ──────────────────────────────────────────

function SectionEyebrow({ num, children }: { num: string; children: ReactNode }) {
  return (
    <div
      style={{
        fontFamily: F_MONO,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: C.inkMute,
        marginBottom: 14,
      }}
    >
      <span style={{ color: C.accent }}>{num}</span> · {children}
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: F_SERIF,
        fontSize: 'clamp(32px, 3.4vw, 44px)',
        fontWeight: 400,
        color: C.ink,
        letterSpacing: '-0.018em',
        lineHeight: 1.1,
        margin: '0 0 14px',
        maxWidth: '24ch',
      }}
    >
      {children}
    </h2>
  );
}

function SectionLead({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        fontSize: 17,
        color: C.inkSoft,
        lineHeight: 1.6,
        margin: 0,
        maxWidth: '60ch',
      }}
    >
      {children}
    </p>
  );
}
