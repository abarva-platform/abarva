import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';

import { AppShell } from '@/components/shell/AppShell';
import { SHELL } from '@/lib/shell/shell-tokens';

const C = {
  paper: '#F6F1EA',
  panel: '#FFFFFF',
  panelSoft: '#FBF8F2',
  ink: '#0C1A3A',
  body: '#27324A',
  muted: '#69758A',
  faint: '#8B95A8',
  line: '#E6DFD6',
  lineStrong: '#D0C5B8',
  teal: '#0E7668',
  tealSoft: '#E5F2EF',
  amber: '#9A5A00',
  amberSoft: '#FFF2D9',
  red: '#9F3E3B',
  redSoft: '#F9E6E4',
  blue: '#1E5F99',
  blueSoft: '#E9F1FB',
};

interface InsightItem {
  source: 'Source' | 'Moves' | 'Tower' | 'Atlas';
  title: string;
  read: string;
  action: string;
  href: string;
  confidence: 'High confidence' | 'Needs review' | 'Human approval required';
  tone: 'ok' | 'warn' | 'risk';
}

const insightItems: ReadonlyArray<InsightItem> = [
  {
    source: 'Source',
    title: 'Sourcing decision risk changed',
    read: 'The executive decision is ready to review, but one commercial-risk assumption still needs a named owner before approval.',
    action: 'Review decision pack',
    href: '/source',
    confidence: 'Human approval required',
    tone: 'risk',
  },
  {
    source: 'Moves',
    title: 'Stage advance is close, not automatic',
    read: 'The move has enough supporting evidence to brief leadership; the final stage change still needs a human rationale.',
    action: 'Open move checkpoint',
    href: '/strategic-moves',
    confidence: 'Needs review',
    tone: 'warn',
  },
  {
    source: 'Tower',
    title: 'Cost pressure has a new executive consequence',
    read: 'The latest variance changes the value story for one active initiative and should be reviewed before the next sponsor update.',
    action: 'Inspect pressure',
    href: '/tower',
    confidence: 'High confidence',
    tone: 'ok',
  },
];

const decisions = [
  {
    label: 'Approve or send back',
    title: 'Executive sourcing recommendation',
    detail: 'Decision-support only. Human approval and rationale are required.',
    href: '/source',
  },
  {
    label: 'Review',
    title: 'Move stage checkpoint',
    detail: 'AI draft is ready for edit-before-commit review.',
    href: '/strategic-moves',
  },
  {
    label: 'Acknowledge',
    title: 'Tower risk movement',
    detail: 'Confirm whether this risk changes the sponsor narrative.',
    href: '/tower',
  },
] as const;

const outputs = [
  ['Board pack', 'Ready for executive edit', '/source'],
  ['Decision brief', 'Awaiting human approval', '/strategic-moves'],
  ['Value ledger', 'Updated since last read', '/tower'],
] as const;

export function ImpactInsightsHome({
  activeTenantName,
  hasTenantKey,
}: {
  activeTenantName: string;
  hasTenantKey: boolean;
}) {
  return (
    <AppShell
      surface="home"
      topBarProps={{
        tenantName: activeTenantName,
        showLocked: hasTenantKey,
        context: 'Home',
      }}
      hasTenantKey={hasTenantKey}
      middleStrip={
        <div
          data-testid="home-impact-strip"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            fontFamily: SHELL.MONO,
            fontSize: 10,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: SHELL.INK_SOFT,
          }}
        >
          <span>Insight pulse</span>
          <span style={{ color: SHELL.PEACH_TEXT }}>Decision-support only</span>
          <span>Evidence-linked</span>
          <span>Client locked</span>
        </div>
      }
    >
      <main
        data-testid="home-impact-insights"
        style={{
          minHeight: 0,
          flex: 1,
          overflowY: 'auto',
          background: C.paper,
          color: C.body,
          padding: '28px clamp(22px, 4vw, 44px) 44px',
          fontFamily: SHELL.SANS,
        }}
      >
        <style>
          {`
            @keyframes home-signal-dash {
              from { stroke-dashoffset: 54; }
              to { stroke-dashoffset: 0; }
            }
            @keyframes home-signal-pulse {
              0%, 100% { transform: scale(1); opacity: 0.88; }
              50% { transform: scale(1.035); opacity: 1; }
            }
            @media (prefers-reduced-motion: reduce) {
              [data-home-signal-line],
              [data-home-signal-node] {
                animation: none !important;
              }
            }
          `}
        </style>
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.15fr) minmax(320px, 0.85fr)',
            gap: 18,
            alignItems: 'stretch',
            marginBottom: 18,
          }}
        >
          <div style={panelStyle}>
            <div style={eyebrowStyle}>Home · insight pulse</div>
            <h1
              style={{
                margin: 0,
                maxWidth: 920,
                fontFamily: SHELL.SERIF_DISPLAY,
                fontSize: 42,
                lineHeight: 1.05,
                fontWeight: 500,
                color: C.ink,
                letterSpacing: '-0.01em',
              }}
            >
              What changed, what matters, and what needs a human decision.
            </h1>
            <p
              style={{
                margin: '14px 0 0',
                maxWidth: 760,
                color: C.muted,
                fontSize: 15,
                lineHeight: 1.6,
              }}
            >
              Home is the read-only operating room for {activeTenantName}. It
              shows business consequences, decisions, value movement, and
              evidence confidence without exposing control workflows.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>
              <Pill tone="ok">Client boundary locked</Pill>
              <Pill>Cross-workspace read</Pill>
              <Pill tone="warn">Human approval stays explicit</Pill>
            </div>
          </div>

          <aside style={panelStyle}>
            <InsightConstellation />
            <div style={{ ...eyebrowStyle, marginTop: 16 }}>Atlas read</div>
            <p
              style={{
                margin: 0,
                fontFamily: SHELL.SERIF_DISPLAY,
                fontSize: 24,
                lineHeight: 1.28,
                color: C.ink,
              }}
            >
              The next valuable action is reviewing the decision-support
              evidence already surfaced across Source, Moves, and Tower.
            </p>
            <div style={{ display: 'grid', gap: 8, marginTop: 18 }}>
              {['Explain today’s top decision', 'Show risk movement', 'Prepare my executive read'].map((label) => (
                <Link key={label} href="/intelligence" style={promptStyle}>
                  {label}
                </Link>
              ))}
            </div>
          </aside>
        </section>

        <section style={{ marginBottom: 18 }}>
          <SectionHeader
            eyebrow="01 · top insights"
            title="Impactful insights"
            actionLabel="Ask Atlas"
            href="/intelligence"
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 12,
            }}
          >
            {insightItems.map((item) => (
              <InsightCard key={item.title} item={item} />
            ))}
          </div>
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.05fr) minmax(320px, 0.95fr)',
            gap: 18,
            marginBottom: 18,
          }}
        >
          <div style={panelStyle}>
            <SectionHeader eyebrow="02 · decisions" title="Needs you today" />
            <div style={{ display: 'grid', gap: 10 }}>
              {decisions.map((decision) => (
                <DecisionRow key={decision.title} {...decision} />
              ))}
            </div>
          </div>

          <div style={panelStyle}>
            <SectionHeader eyebrow="03 · movement" title="Value and risk movement" />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: 10,
              }}
            >
              <MovementCard label="Value story" value="Changed" detail="Sponsor narrative needs review." tone="warn" />
              <MovementCard label="Approval posture" value="Explicit" detail="No autonomous commitments." tone="ok" />
              <MovementCard label="Risk movement" value="Elevated" detail="One assumption needs owner review." tone="risk" />
              <MovementCard label="Evidence confidence" value="Mixed" detail="Two high, one needs review." tone="warn" />
            </div>
          </div>
        </section>

        <section style={panelStyle}>
          <SectionHeader eyebrow="04 · outputs" title="Outputs ready for review" />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 10,
            }}
          >
            {outputs.map(([title, detail, href]) => (
              <Link key={title} href={href} style={outputStyle}>
                <strong style={{ color: C.ink, fontSize: 15 }}>{title}</strong>
                <span style={{ color: C.muted, fontSize: 13 }}>{detail}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function InsightConstellation() {
  return (
    <div
      aria-label="Insight signal map"
      style={{
        border: `1px solid ${C.line}`,
        borderRadius: 8,
        background: '#0C1A3A',
        minHeight: 238,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <svg
        viewBox="0 0 520 280"
        role="img"
        aria-label="Client-locked insight constellation connecting decisions, risk, value, and outputs"
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          minHeight: 238,
        }}
      >
        <defs>
          <linearGradient id="homeLine" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#D7EFE7" stopOpacity="0.82" />
            <stop offset="0.52" stopColor="#F3C36E" stopOpacity="0.82" />
            <stop offset="1" stopColor="#E8918D" stopOpacity="0.76" />
          </linearGradient>
          <filter id="homeGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width="520" height="280" fill="#0C1A3A" />
        <path d="M46 224 C126 156, 182 122, 262 140 S416 116, 478 54" fill="none" stroke="#FFFFFF" strokeOpacity="0.08" strokeWidth="1" />
        <path d="M78 62 C150 116, 205 170, 278 140 S382 64, 462 182" fill="none" stroke="#FFFFFF" strokeOpacity="0.08" strokeWidth="1" />
        <path
          data-home-signal-line
          d="M260 140 L120 74 M260 140 L414 72 M260 140 L98 210 M260 140 L426 216"
          stroke="url(#homeLine)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="14 8"
          style={{ animation: 'home-signal-dash 5.5s linear infinite' }}
        />
        <circle cx="260" cy="140" r="52" fill="#12264E" stroke="#D7EFE7" strokeOpacity="0.7" />
        <circle cx="260" cy="140" r="34" fill="#F6F1EA" />
        <text x="260" y="134" textAnchor="middle" fill="#0C1A3A" fontSize="12" fontWeight="800" fontFamily="Inter, sans-serif">CLIENT</text>
        <text x="260" y="151" textAnchor="middle" fill="#69758A" fontSize="10" fontWeight="700" fontFamily="JetBrains Mono, monospace">LOCKED</text>

        <SignalNode x={120} y={74} label="DECISION" value="3" fill="#F3C36E" />
        <SignalNode x={414} y={72} label="VALUE" value="↑" fill="#9EE0CB" />
        <SignalNode x={98} y={210} label="RISK" value="!" fill="#E8918D" />
        <SignalNode x={426} y={216} label="OUTPUTS" value="5" fill="#BBD6F7" />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: 14,
          bottom: 12,
          right: 14,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          color: 'rgba(246,241,234,0.72)',
          fontFamily: SHELL.MONO,
          fontSize: 10,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        <span>Evidence-linked</span>
        <span>Review only</span>
      </div>
    </div>
  );
}

function SignalNode({
  x,
  y,
  label,
  value,
  fill,
}: {
  x: number;
  y: number;
  label: string;
  value: string;
  fill: string;
}) {
  return (
    <g
      data-home-signal-node
      style={{
        transformOrigin: `${x}px ${y}px`,
        animation: 'home-signal-pulse 4.2s ease-in-out infinite',
      }}
      filter="url(#homeGlow)"
    >
      <circle cx={x} cy={y} r="36" fill="#12264E" stroke={fill} strokeWidth="2" />
      <circle cx={x} cy={y - 5} r="14" fill={fill} />
      <text x={x} y={y} textAnchor="middle" fill="#0C1A3A" fontSize="15" fontWeight="900" fontFamily="Inter, sans-serif">{value}</text>
      <text x={x} y={y + 24} textAnchor="middle" fill="#F6F1EA" fontSize="10" fontWeight="800" fontFamily="JetBrains Mono, monospace">{label}</text>
    </g>
  );
}

function SectionHeader({
  eyebrow,
  title,
  actionLabel,
  href,
}: {
  eyebrow: string;
  title: string;
  actionLabel?: string;
  href?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 12,
      }}
    >
      <div>
        <div style={eyebrowStyle}>{eyebrow}</div>
        <h2
          style={{
            margin: 0,
            color: C.ink,
            fontFamily: SHELL.SERIF_DISPLAY,
            fontSize: 26,
            fontWeight: 500,
            letterSpacing: '-0.005em',
          }}
        >
          {title}
        </h2>
      </div>
      {href && actionLabel ? (
        <Link
          href={href}
          style={{
            color: C.ink,
            fontWeight: 700,
            fontSize: 13,
            textDecoration: 'none',
            borderBottom: `1px solid ${C.lineStrong}`,
            paddingBottom: 2,
          }}
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

function InsightCard({ item }: { item: InsightItem }) {
  return (
    <article style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
        <Pill>{item.source}</Pill>
        <Pill tone={item.tone}>{item.confidence}</Pill>
      </div>
      <h3
        style={{
          margin: 0,
          color: C.ink,
          fontSize: 18,
          lineHeight: 1.25,
          fontWeight: 700,
        }}
      >
        {item.title}
      </h3>
      <p style={{ margin: '10px 0 16px', color: C.muted, fontSize: 13.5, lineHeight: 1.55 }}>
        {item.read}
      </p>
      <Link href={item.href} style={inlineActionStyle}>
        {item.action}
      </Link>
    </article>
  );
}

function DecisionRow({
  label,
  title,
  detail,
  href,
}: {
  label: string;
  title: string;
  detail: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'grid',
        gridTemplateColumns: '112px minmax(0, 1fr)',
        gap: 12,
        alignItems: 'center',
        padding: 12,
        border: `1px solid ${C.line}`,
        borderRadius: 8,
        background: C.panelSoft,
        color: 'inherit',
        textDecoration: 'none',
      }}
    >
      <Pill tone="warn">{label}</Pill>
      <span style={{ minWidth: 0 }}>
        <strong style={{ display: 'block', color: C.ink, fontSize: 14.5, marginBottom: 3 }}>
          {title}
        </strong>
        <span style={{ color: C.muted, fontSize: 12.5 }}>{detail}</span>
      </span>
    </Link>
  );
}

function MovementCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: 'ok' | 'warn' | 'risk';
}) {
  return (
    <div
      style={{
        border: `1px solid ${C.line}`,
        borderRadius: 8,
        background: tone === 'ok' ? C.tealSoft : tone === 'risk' ? C.redSoft : C.amberSoft,
        padding: 13,
      }}
    >
      <div style={{ color: C.muted, fontSize: 11, fontFamily: SHELL.MONO, textTransform: 'uppercase' }}>
        {label}
      </div>
      <strong style={{ display: 'block', color: C.ink, fontSize: 19, marginTop: 6 }}>{value}</strong>
      <span style={{ color: C.muted, fontSize: 12.5 }}>{detail}</span>
    </div>
  );
}

function Pill({
  children,
  tone,
}: {
  children: ReactNode;
  tone?: 'ok' | 'warn' | 'risk';
}) {
  const color =
    tone === 'ok' ? C.teal : tone === 'warn' ? C.amber : tone === 'risk' ? C.red : C.muted;
  const background =
    tone === 'ok' ? C.tealSoft : tone === 'warn' ? C.amberSoft : tone === 'risk' ? C.redSoft : C.panelSoft;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        width: 'fit-content',
        border: `1px solid ${C.line}`,
        borderRadius: 999,
        padding: '4px 8px',
        background,
        color,
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

const panelStyle = {
  border: `1px solid ${C.line}`,
  borderRadius: 8,
  background: C.panel,
  padding: 18,
  boxShadow: '0 12px 32px rgba(12, 26, 58, 0.06)',
} satisfies CSSProperties;

const eyebrowStyle = {
  marginBottom: 8,
  color: C.faint,
  fontFamily: SHELL.MONO,
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
} satisfies CSSProperties;

const promptStyle = {
  display: 'block',
  padding: '10px 12px',
  border: `1px solid ${C.line}`,
  borderRadius: 8,
  background: C.panelSoft,
  color: C.ink,
  textDecoration: 'none',
  fontSize: 13,
  fontWeight: 700,
} satisfies CSSProperties;

const inlineActionStyle = {
  color: C.ink,
  fontSize: 13,
  fontWeight: 800,
  textDecoration: 'none',
  borderBottom: `1px solid ${C.lineStrong}`,
  paddingBottom: 2,
} satisfies CSSProperties;

const outputStyle = {
  display: 'grid',
  gap: 5,
  border: `1px solid ${C.line}`,
  borderRadius: 8,
  background: C.panelSoft,
  padding: 14,
  color: 'inherit',
  textDecoration: 'none',
} satisfies CSSProperties;
