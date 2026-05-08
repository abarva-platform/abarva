'use client';

// PressureCardDerivation · File 10 §4.9 PARTIAL completion
//
// A drawer body primitive that shows how a pressure card's headline
// number was computed. Consumers (Tower surfaces, Control Room) call
// openDrawer() with a <PressureCardDerivation> body to give the sponsor
// a click-to-trace path from the $X/mo figure to the contributing
// inputs.
//
// Anti-patterns rejected:
// - Never renders a bare total without the derivation chain
// - Never hides "owner unknown" state — explicit badge if unowned
// - Never collapses below the monthly cadence — the user always sees
//   the time unit the figure is quoted in

import Link from 'next/link';
import type { ReactNode } from 'react';

export interface DerivationInput {
  label: string;
  value: string;
  /** Optional source link · pattern, contradiction, deliverable. */
  href?: string;
  /** Optional qualifier (e.g. "estimate · LOW confidence"). */
  qualifier?: string;
}

export interface PressureCardDerivationProps {
  /** Pressure title · the one-liner from the card. */
  title: string;
  /** Cadence-labeled headline · e.g. "$522K / month" or "$1.3M annualized". */
  headline: string;
  /** Severity tier · drives the accent color. */
  severity: 'critical' | 'high' | 'medium';
  /** Named owner OR the literal string "unowned" when the pressure has no named owner. */
  owner: string | 'unowned';
  /** 2-8 derivation inputs that compose into the headline. */
  inputs: DerivationInput[];
  /** Methodology prose · one sentence on how the inputs compose. */
  method: string;
  /** Optional confidence qualifier (§9.3 tier). */
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  /** Optional links to related patterns / programs / contradictions. */
  relatedLinks?: Array<{ label: string; href: string }>;
  /** Optional slot for Nexus/Atlas handoff or custom CTA. */
  footer?: ReactNode;
}

const SEVERITY_META = {
  critical: { label: 'CRITICAL', accent: '#E04444' },
  high: { label: 'HIGH', accent: '#D97706' },
  medium: { label: 'MEDIUM', accent: '#F59E0B' },
} as const;

const CONFIDENCE_META = {
  HIGH: { color: '#14B8A6', label: 'HIGH' },
  MEDIUM: { color: '#D97706', label: 'MED' },
  LOW: { color: '#E04444', label: 'LOW' },
} as const;

export function PressureCardDerivation({
  title,
  headline,
  severity,
  owner,
  inputs,
  method,
  confidence,
  relatedLinks = [],
  footer,
}: PressureCardDerivationProps) {
  const meta = SEVERITY_META[severity];
  const isUnowned = owner === 'unowned';

  return (
    <article
      style={{
        fontFamily: 'DM Sans, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}
    >
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.16em',
              padding: '4px 10px',
              borderRadius: 999,
              background: meta.accent,
              color: '#FFFFFF',
            }}
          >
            {meta.label}
          </span>
          {confidence ? (
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: CONFIDENCE_META[confidence].color,
                padding: '3px 8px',
                borderRadius: 3,
                background: `${CONFIDENCE_META[confidence].color}14`,
              }}
            >
              confidence · {CONFIDENCE_META[confidence].label}
            </span>
          ) : null}
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.12em',
              padding: '3px 8px',
              borderRadius: 3,
              background: isUnowned ? 'rgba(224,68,68,0.14)' : 'rgba(20,184,166,0.14)',
              color: isUnowned ? '#E04444' : '#0E9F8C',
              textTransform: 'uppercase',
            }}
          >
            {isUnowned ? 'UNOWNED' : `Owner · ${owner}`}
          </span>
        </div>
        <h2 style={{ margin: 0, fontFamily: 'Fraunces, Georgia, serif', fontSize: 24, lineHeight: 1.2, letterSpacing: '-0.015em', color: '#1a1612' }}>
          {title}
        </h2>
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: meta.accent,
            marginTop: 4,
          }}
        >
          {headline}
        </div>
      </header>

      <section>
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#8a7e72',
            marginBottom: 8,
          }}
        >
          How the number was built
        </div>
        <p style={{ margin: '0 0 12px', fontSize: 13.5, lineHeight: 1.6, color: '#3d342d' }}>{method}</p>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {inputs.map((input) => (
            <li
              key={input.label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 8,
                background: '#FFFDF8',
                border: '1px solid rgba(26,22,18,0.08)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1612' }}>
                  {input.href ? (
                    <Link href={input.href} style={{ color: 'inherit', textDecoration: 'underline', textDecorationColor: meta.accent }}>
                      {input.label}
                    </Link>
                  ) : (
                    input.label
                  )}
                </span>
                {input.qualifier ? (
                  <span style={{ fontSize: 11, color: '#8a7e72', fontStyle: 'italic' }}>{input.qualifier}</span>
                ) : null}
              </div>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: meta.accent }}>
                {input.value}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {relatedLinks.length > 0 ? (
        <section>
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#8a7e72',
              marginBottom: 6,
            }}
          >
            Related
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {relatedLinks.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                style={{
                  fontSize: 13,
                  color: meta.accent,
                  textDecoration: 'underline',
                  textDecorationThickness: 1,
                }}
              >
                → {r.label}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {footer ? <footer style={{ marginTop: 4 }}>{footer}</footer> : null}
    </article>
  );
}
