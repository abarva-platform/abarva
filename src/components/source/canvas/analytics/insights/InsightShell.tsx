'use client';

// Shared chrome for a per-step "✦ Intelligence" insight: the card, the "so what"
// headline foregrounded above the chart, the live/sample provenance badge, and an
// optional honesty note. Every insight component wraps its Recharts chart in this
// so the value-proving framing reads consistently across steps.

import type { CSSProperties, ReactNode } from 'react';
import { ANALYTICS } from '../analytics-tokens';
import type { IntelProvenance } from '../view-model';

interface InsightShellProps {
  /** Small eyebrow, e.g. 'Strategy · Value pool'. */
  eyebrow: string;
  /** The "so what" — foregrounded prominently above the chart. */
  headline: string;
  provenance: IntelProvenance;
  /** Sample/model honesty note (shown when present). */
  note?: string;
  /** When true the badge reads "Model" instead of "Sample" (illustrative logic). */
  isModel?: boolean;
  children: ReactNode;
}

export function InsightShell({
  eyebrow,
  headline,
  provenance,
  note,
  isModel,
  children,
}: InsightShellProps) {
  const isSample = provenance === 'sample';
  const cardStyle: CSSProperties = {
    border: `1px solid ${ANALYTICS.LINE}`,
    borderRadius: ANALYTICS.RADIUS_LG,
    background: ANALYTICS.CARD,
    padding: '18px 20px',
  };
  const badgeLabel = isSample ? (isModel ? 'Model' : 'Sample') : 'Live';
  return (
    <section style={cardStyle} data-testid="step-insight">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontFamily: ANALYTICS.MONO,
            fontSize: 9.5,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
            fontWeight: 800,
            color: ANALYTICS.TEAL_BRIGHT,
          }}
        >
          <span aria-hidden style={{ marginRight: 6 }}>
            ✦
          </span>
          {eyebrow}
        </span>
        <span
          data-testid="insight-provenance"
          style={{
            marginLeft: 'auto',
            fontSize: 10,
            letterSpacing: 0.4,
            textTransform: 'uppercase',
            fontWeight: 700,
            padding: '3px 9px',
            borderRadius: 999,
            background: isSample ? 'rgba(10,10,11,0.06)' : ANALYTICS.GREEN_TINT,
            color: isSample ? ANALYTICS.MUTED : ANALYTICS.GREEN_TEXT,
          }}
        >
          {badgeLabel}
        </span>
      </div>

      {/* The "so what" — the killer line, foregrounded above the chart. */}
      <p
        data-testid="insight-headline"
        style={{
          fontFamily: ANALYTICS.SERIF,
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: '-0.3px',
          color: ANALYTICS.INK,
          lineHeight: 1.35,
          margin: '0 0 16px',
        }}
      >
        {headline}
      </p>

      {children}

      {note ? (
        <div
          style={{
            display: 'flex',
            gap: 9,
            padding: '11px 14px',
            borderRadius: ANALYTICS.RADIUS,
            background: ANALYTICS.AMBER_TINT,
            fontSize: 12.5,
            color: ANALYTICS.INK_2,
            lineHeight: 1.5,
            marginTop: 14,
          }}
        >
          <span style={{ color: ANALYTICS.AMBER, fontWeight: 800, flexShrink: 0 }}>
            !
          </span>
          <div>{note}</div>
        </div>
      ) : null}
    </section>
  );
}
