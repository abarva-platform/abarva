'use client';
// Shared UI primitives for learn guide sections.
// All sections import from here for consistent styling.

import React from 'react';

// ─── Design tokens ───────────────────────────────────────────────────────────
export const T = {
  navy:       '#1B2B5C',
  navyMid:    '#253872',
  navySoft:   'rgba(27,43,92,0.08)',
  navyLine:   'rgba(27,43,92,0.18)',
  teal:       '#0E8A65',
  tealSoft:   'rgba(14,138,101,0.09)',
  tealLine:   'rgba(14,138,101,0.25)',
  purple:     '#5B21B6',
  purpleSoft: 'rgba(91,33,182,0.07)',
  purpleLine: 'rgba(91,33,182,0.2)',
  amber:      '#92400E',
  amberSoft:  'rgba(146,64,14,0.08)',
  amberLine:  'rgba(146,64,14,0.22)',
  ink:        '#0A0C12',
  ink2:       '#1C1F2E',
  body:       '#1F2433',
  muted:      '#3D4454',
  faint:      '#6B7280',
  border:     '#D1D5DB',
  borderLt:   '#E5E7EB',
  surface:    '#ffffff',
  surface2:   '#F9FAFB',
  surface3:   '#F3F4F6',
  fDisp:      "'Fraunces', Georgia, serif",
  fBody:      "'Inter', -apple-system, sans-serif",
  fMono:      "'JetBrains Mono', ui-monospace, monospace",
};

// ─── Section wrapper ──────────────────────────────────────────────────────────
export function Section({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <section
      id={id}
      style={{
        padding: '48px clamp(32px, 4vw, 64px)',
        borderBottom: `1px solid ${T.borderLt}`,
      }}
    >
      {children}
    </section>
  );
}

// ─── Hero band (navy bg for Welcome, teal for Moves overview, purple for Intel) ──
export function HeroBand({
  children,
  color = 'navy',
}: {
  children: React.ReactNode;
  color?: 'navy' | 'teal' | 'purple' | 'slate';
}) {
  const bg =
    color === 'navy'   ? 'linear-gradient(135deg,#1B2B5C 0%,#253872 100%)' :
    color === 'teal'   ? 'linear-gradient(135deg,#0E8A65 0%,#0A6E50 100%)' :
    color === 'purple' ? 'linear-gradient(135deg,#4C1D95 0%,#5B21B6 100%)' :
                         'linear-gradient(135deg,#374151 0%,#4B5563 100%)';
  return (
    <div
      style={{
        background: bg,
        padding: '56px clamp(32px, 4vw, 64px)',
        borderBottom: `1px solid ${T.borderLt}`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Eyebrow label ────────────────────────────────────────────────────────────
export function Eyebrow({ children, light }: { children: React.ReactNode; light?: boolean }) {
  return (
    <div
      style={{
        fontFamily: T.fMono,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: light ? 'rgba(255,255,255,0.6)' : T.faint,
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

// ─── Section title ────────────────────────────────────────────────────────────
export function SectionTitle({ children, light, size = 'lg' }: { children: React.ReactNode; light?: boolean; size?: 'lg' | 'xl' }) {
  return (
    <h2
      style={{
        fontFamily: T.fDisp,
        fontSize: size === 'xl' ? 'clamp(32px, 4vw, 48px)' : 'clamp(22px, 3vw, 28px)',
        fontWeight: 400,
        color: light ? '#fff' : T.ink,
        letterSpacing: '-0.02em',
        lineHeight: 1.2,
        margin: 0,
        marginBottom: 16,
      }}
    >
      {children}
    </h2>
  );
}

// ─── Lead paragraph ───────────────────────────────────────────────────────────
export function Lead({ children, light }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p
      style={{
        fontFamily: T.fBody,
        fontSize: 16,
        color: light ? 'rgba(255,255,255,0.82)' : T.body,
        lineHeight: 1.65,
        margin: 0,
        marginBottom: 28,
        maxWidth: 680,
      }}
    >
      {children}
    </p>
  );
}

// ─── Body paragraph ───────────────────────────────────────────────────────────
export function BodyP({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: T.fBody,
        fontSize: 14,
        color: T.body,
        lineHeight: 1.7,
        margin: '0 0 16px',
      }}
    >
      {children}
    </p>
  );
}

// ─── Subsection heading ───────────────────────────────────────────────────────
export function SubHead({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontFamily: T.fBody,
        fontSize: 17,
        fontWeight: 700,
        color: T.ink,
        margin: '32px 0 12px',
        letterSpacing: '-0.01em',
      }}
    >
      {children}
    </h3>
  );
}

// ─── Callout box ─────────────────────────────────────────────────────────────
export function Callout({
  kind = 'info',
  icon,
  label,
  children,
}: {
  kind?: 'info' | 'warn' | 'success';
  icon?: string;
  label: string;
  children: React.ReactNode;
}) {
  const bg    = kind === 'warn'    ? T.amberSoft  : kind === 'success' ? T.tealSoft  : T.navySoft;
  const line  = kind === 'warn'    ? T.amberLine  : kind === 'success' ? T.tealLine  : T.navyLine;
  const color = kind === 'warn'    ? T.amber       : kind === 'success' ? T.teal      : T.navy;
  return (
    <div
      style={{
        display: 'flex',
        gap: 14,
        background: bg,
        border: `1px solid ${line}`,
        borderRadius: 8,
        padding: '16px 20px',
        margin: '24px 0',
      }}
    >
      {icon && (
        <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.4 }}>{icon}</span>
      )}
      <div>
        <div
          style={{
            fontFamily: T.fMono,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color,
            marginBottom: 6,
          }}
        >
          {label}
        </div>
        <div style={{ fontFamily: T.fBody, fontSize: 13, color: T.body, lineHeight: 1.6 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Step list ────────────────────────────────────────────────────────────────
export function StepList({ children }: { children: React.ReactNode }) {
  return (
    <ol style={{ listStyle: 'none', padding: 0, margin: '24px 0 0', display: 'flex', flexDirection: 'column', gap: 0, counterReset: 'step-num' }}>
      {children}
    </ol>
  );
}

export function Step({
  title,
  path,
  note,
  children,
}: {
  title: string;
  path?: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <li
      style={{
        display: 'flex',
        gap: 20,
        paddingBottom: 28,
        borderLeft: `2px solid ${T.navyLine}`,
        marginLeft: 20,
        paddingLeft: 28,
        position: 'relative',
      }}
    >
      <span
        style={{
          position: 'absolute',
          left: -7,
          top: 4,
          width: 12,
          height: 12,
          background: T.navy,
          borderRadius: '50%',
          flexShrink: 0,
          border: `2px solid #fff`,
        }}
      />
      <div style={{ paddingTop: 2 }}>
        <div
          style={{
            fontFamily: T.fBody,
            fontSize: 14,
            fontWeight: 700,
            color: T.ink,
            marginBottom: 6,
          }}
        >
          {title}
        </div>
        <div style={{ fontFamily: T.fBody, fontSize: 13, color: T.muted, lineHeight: 1.6 }}>
          {children}
        </div>
        {path && (
          <code
            style={{
              display: 'inline-block',
              marginTop: 8,
              fontFamily: T.fMono,
              fontSize: 11,
              color: T.navy,
              background: T.navySoft,
              border: `1px solid ${T.navyLine}`,
              borderRadius: 4,
              padding: '3px 8px',
            }}
          >
            {path}
          </code>
        )}
        {note && (
          <div
            style={{
              marginTop: 8,
              fontFamily: T.fBody,
              fontSize: 12,
              color: T.body,
              background: T.surface3,
              border: `1px solid ${T.borderLt}`,
              borderRadius: 6,
              padding: '8px 12px',
            }}
          >
            {note}
          </div>
        )}
      </div>
    </li>
  );
}

// ─── Terms grid ───────────────────────────────────────────────────────────────
export function TermGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(140px, 180px) 1fr',
        gap: 0,
        border: `1px solid ${T.border}`,
        borderRadius: 8,
        overflow: 'hidden',
        margin: '20px 0',
      }}
    >
      {children}
    </div>
  );
}

export function Term({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <>
      <div
        style={{
          fontFamily: T.fMono,
          fontSize: 11,
          fontWeight: 700,
          color: T.navy,
          background: T.surface2,
          borderBottom: `1px solid ${T.borderLt}`,
          borderRight: `1px solid ${T.borderLt}`,
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'flex-start',
        }}
      >
        {name}
      </div>
      <div
        style={{
          fontFamily: T.fBody,
          fontSize: 13,
          color: T.body,
          lineHeight: 1.6,
          background: T.surface,
          borderBottom: `1px solid ${T.borderLt}`,
          padding: '12px 14px',
        }}
      >
        {children}
      </div>
    </>
  );
}

// ─── Flow diagram ─────────────────────────────────────────────────────────────
export function Flow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 0,
        border: `1px solid ${T.borderLt}`,
        borderRadius: 10,
        overflow: 'hidden',
        margin: '24px 0',
        background: T.surface2,
      }}
    >
      {children}
    </div>
  );
}

export function FlowStep({
  badge,
  badgeColor = 'navy',
  icon,
  label,
  desc,
}: {
  badge: string;
  badgeColor?: 'navy' | 'teal' | 'purple' | 'slate';
  icon: string;
  label: string;
  desc: string;
}) {
  const bg =
    badgeColor === 'teal'   ? T.teal   :
    badgeColor === 'purple' ? T.purple :
    badgeColor === 'slate'  ? '#4B5563' :
    T.navy;
  return (
    <div
      style={{
        flex: '1 1 140px',
        padding: '20px 16px',
        borderRight: `1px solid ${T.borderLt}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        alignItems: 'flex-start',
      }}
    >
      <span
        style={{
          fontFamily: T.fMono,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          background: bg,
          color: '#fff',
          borderRadius: 4,
          padding: '3px 8px',
        }}
      >
        {badge}
      </span>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span style={{ fontFamily: T.fBody, fontSize: 13, fontWeight: 700, color: T.ink }}>
        {label}
      </span>
      <span style={{ fontFamily: T.fBody, fontSize: 11, color: T.faint, lineHeight: 1.4 }}>
        {desc}
      </span>
    </div>
  );
}

// ─── Phase card ───────────────────────────────────────────────────────────────
export function PhaseCard({
  num,
  name,
  gate,
  goal,
  chatExample,
  deliverables,
  criteria,
  color = 'navy',
}: {
  num: string;
  name: string;
  gate: string;
  goal: string;
  chatExample: string;
  deliverables: Array<{ label: string; isGate?: boolean; tag?: string }>;
  criteria: Array<{ text: string; hard: boolean }>;
  color?: 'navy' | 'teal';
}) {
  const accentBg   = color === 'teal' ? T.teal   : T.navy;
  const accentSoft = color === 'teal' ? T.tealSoft  : T.navySoft;
  const accentLine = color === 'teal' ? T.tealLine  : T.navyLine;
  return (
    <div
      style={{
        border: `1px solid ${T.border}`,
        borderRadius: 12,
        overflow: 'hidden',
        margin: '24px 0',
        background: T.surface,
      }}
    >
      {/* Header */}
      <div
        style={{
          background: accentBg,
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: T.fMono,
            fontSize: 20,
            fontWeight: 700,
            color: '#fff',
            letterSpacing: '-0.02em',
          }}
        >
          {num}
        </span>
        <span
          style={{
            fontFamily: T.fDisp,
            fontSize: 20,
            fontWeight: 400,
            color: '#fff',
            letterSpacing: '-0.01em',
          }}
        >
          {name}
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontFamily: T.fMono,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.75)',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: 4,
            padding: '4px 10px',
          }}
        >
          Gate: {gate}
        </span>
      </div>

      <div style={{ padding: '24px' }}>
        {/* Goal */}
        <p style={{ fontFamily: T.fBody, fontSize: 14, color: T.body, lineHeight: 1.65, margin: '0 0 20px' }}>
          {goal}
        </p>

        {/* Chat example */}
        <div
          style={{
            background: accentSoft,
            border: `1px solid ${accentLine}`,
            borderRadius: 8,
            padding: '16px 18px',
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontFamily: T.fMono,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: color === 'teal' ? T.teal : T.navy,
              marginBottom: 8,
            }}
          >
            Example chat with Nexus
          </div>
          <div style={{ fontFamily: T.fBody, fontSize: 13, color: T.body, lineHeight: 1.6 }}>
            {chatExample}
          </div>
        </div>

        {/* Two-column grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 24,
          }}
        >
          {/* Deliverables */}
          <div>
            <div
              style={{
                fontFamily: T.fMono,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: T.faint,
                marginBottom: 10,
              }}
            >
              Deliverables generated
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {deliverables.map((d, i) => (
                <span
                  key={i}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontFamily: T.fBody,
                    fontSize: 12,
                    fontWeight: 500,
                    color: T.body,
                    background: T.surface2,
                    border: `1px solid ${T.border}`,
                    borderRadius: 6,
                    padding: '5px 10px',
                  }}
                >
                  {d.label}
                  {d.isGate && (
                    <span
                      style={{
                        fontFamily: T.fMono,
                        fontSize: 8,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        color: '#fff',
                        background: T.teal,
                        borderRadius: 3,
                        padding: '2px 5px',
                      }}
                    >
                      GATE
                    </span>
                  )}
                  {d.tag && (
                    <span
                      style={{
                        fontFamily: T.fMono,
                        fontSize: 8,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        color: T.navy,
                        background: T.navySoft,
                        border: `1px solid ${T.navyLine}`,
                        borderRadius: 3,
                        padding: '2px 5px',
                      }}
                    >
                      {d.tag}
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Gate criteria */}
          <div>
            <div
              style={{
                fontFamily: T.fMono,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: T.faint,
                marginBottom: 10,
              }}
            >
              Gate criteria
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {criteria.map((c, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    fontFamily: T.fBody,
                    fontSize: 12,
                    color: T.body,
                    lineHeight: 1.5,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: c.hard ? T.navy : T.faint,
                      flexShrink: 0,
                      marginTop: 5,
                    }}
                  />
                  <span>
                    {c.text}{' '}
                    <span
                      style={{
                        fontFamily: T.fMono,
                        fontSize: 8,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        color: c.hard ? '#fff' : T.faint,
                        background: c.hard ? T.navy : 'transparent',
                        border: c.hard ? 'none' : `1px solid ${T.border}`,
                        borderRadius: 3,
                        padding: '2px 5px',
                        verticalAlign: 'middle',
                      }}
                    >
                      {c.hard ? 'Hard' : 'Soft'}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Setup tile grid ─────────────────────────────────────────────────────────
export function TileGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 16,
        margin: '24px 0',
      }}
    >
      {children}
    </div>
  );
}

export function Tile({
  icon,
  name,
  desc,
  path,
}: {
  icon: string;
  name: string;
  desc: string;
  path?: string;
}) {
  return (
    <div
      style={{
        border: `1px solid ${T.border}`,
        borderRadius: 10,
        padding: 20,
        background: T.surface,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <span style={{ fontSize: 24 }}>{icon}</span>
      <div style={{ fontFamily: T.fBody, fontSize: 14, fontWeight: 700, color: T.ink }}>
        {name}
      </div>
      <div style={{ fontFamily: T.fBody, fontSize: 12, color: T.muted, lineHeight: 1.55 }}>
        {desc}
      </div>
      {path && (
        <code
          style={{
            fontFamily: T.fMono,
            fontSize: 10,
            color: T.navy,
            background: T.navySoft,
            border: `1px solid ${T.navyLine}`,
            borderRadius: 4,
            padding: '3px 7px',
            marginTop: 4,
            alignSelf: 'flex-start',
          }}
        >
          {path}
        </code>
      )}
    </div>
  );
}

// ─── Signal / intel card ──────────────────────────────────────────────────────
export function IntelCard({
  icon,
  name,
  desc,
}: {
  icon: string;
  name: string;
  desc: string;
}) {
  return (
    <div
      style={{
        border: `1.5px solid ${T.purpleLine}`,
        background: T.purpleSoft,
        borderRadius: 10,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <span style={{ fontSize: 22 }}>{icon}</span>
      <div style={{ fontFamily: T.fBody, fontSize: 13, fontWeight: 700, color: T.ink }}>{name}</div>
      <div style={{ fontFamily: T.fBody, fontSize: 12, color: T.muted, lineHeight: 1.55 }}>{desc}</div>
    </div>
  );
}

// ─── Pressure card mockup ─────────────────────────────────────────────────────
export function PressureCardMock() {
  return (
    <div
      style={{
        border: `1px solid ${T.border}`,
        borderRadius: 10,
        overflow: 'hidden',
        margin: '24px 0',
        background: T.surface,
        maxWidth: 600,
      }}
    >
      <div
        style={{
          background: 'rgba(153,27,27,0.06)',
          borderBottom: `1px solid rgba(153,27,27,0.15)`,
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#DC2626',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: T.fMono,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#991B1B',
          }}
        >
          Cost pressure · High severity
        </span>
        <span
          style={{
            fontFamily: T.fBody,
            fontSize: 13,
            fontWeight: 600,
            color: T.ink,
            marginLeft: 4,
          }}
        >
          Routing inefficiency — Contact Center
        </span>
      </div>
      <div style={{ padding: '18px' }}>
        <p
          style={{
            fontFamily: T.fBody,
            fontSize: 13,
            color: T.body,
            lineHeight: 1.65,
            margin: '0 0 14px',
          }}
        >
          <strong>What the signal says:</strong> Average handle time in the inbound routing layer has increased 18% over two quarters. Authentication failures, billing disputes, and routing timeouts account for 61% of excess time. ML-assisted routing could recover <strong>$2.8–4.1M annually</strong>.
        </p>
        <div
          style={{
            fontFamily: T.fMono,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: T.faint,
            marginBottom: 6,
          }}
        >
          Evidence sources
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          {['Call center ops data · 6mo', 'IVR routing logs · Q3–Q4', 'Industry benchmark · AHT peers'].map((s) => (
            <span
              key={s}
              style={{
                fontFamily: T.fBody,
                fontSize: 11,
                background: T.surface3,
                border: `1px solid ${T.border}`,
                borderRadius: 4,
                padding: '3px 8px',
                color: T.muted,
              }}
            >
              {s}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            style={{
              fontFamily: T.fBody,
              fontSize: 12,
              fontWeight: 600,
              color: '#fff',
              background: T.navy,
              border: 'none',
              borderRadius: 6,
              padding: '7px 14px',
              cursor: 'pointer',
            }}
          >
            → Originate a Move
          </button>
          <button
            style={{
              fontFamily: T.fBody,
              fontSize: 12,
              color: T.body,
              background: T.surface2,
              border: `1px solid ${T.border}`,
              borderRadius: 6,
              padding: '7px 14px',
              cursor: 'pointer',
            }}
          >
            Deep dive
          </button>
          <button
            style={{
              fontFamily: T.fBody,
              fontSize: 12,
              color: T.faint,
              background: 'transparent',
              border: `1px solid ${T.borderLt}`,
              borderRadius: 6,
              padding: '7px 14px',
              cursor: 'pointer',
            }}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tip do/don't card ────────────────────────────────────────────────────────
export function TipGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 14,
        margin: '16px 0 28px',
      }}
    >
      {children}
    </div>
  );
}

export function Tip({
  kind,
  text,
  example,
}: {
  kind: 'do' | 'dont';
  text: string;
  example: string;
}) {
  const isDo = kind === 'do';
  return (
    <div
      style={{
        border: `1px solid ${isDo ? T.tealLine : T.amberLine}`,
        background: isDo ? T.tealSoft : T.amberSoft,
        borderRadius: 8,
        padding: '14px 16px',
      }}
    >
      <div
        style={{
          fontFamily: T.fMono,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: isDo ? T.teal : T.amber,
          marginBottom: 6,
        }}
      >
        {isDo ? '✓ Do' : '✗ Don\'t'}
      </div>
      <div
        style={{
          fontFamily: T.fBody,
          fontSize: 13,
          fontWeight: 600,
          color: T.ink,
          marginBottom: 6,
          lineHeight: 1.45,
        }}
      >
        {text}
      </div>
      <div style={{ fontFamily: T.fBody, fontSize: 12, color: T.muted, lineHeight: 1.55, fontStyle: 'italic' }}>
        {example}
      </div>
    </div>
  );
}
