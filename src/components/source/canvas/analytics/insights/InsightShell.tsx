'use client';

// Shared chrome for a per-step "✦ Intelligence" insight: the card, the "so what"
// headline foregrounded above the chart, the live/sample provenance badge, and an
// optional honesty note. Every insight component wraps its Recharts chart in this
// so the value-proving framing reads consistently across steps.

import type { CSSProperties, ReactNode } from 'react';
import { ANALYTICS } from '../analytics-tokens';
import type { AdvisorLayer, IntelProvenance } from '../view-model';

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
  /**
   * The advisor layer — best-practice / benchmark / downstream-impact. Rendered as
   * labeled lines beneath the chart so EVERY insight (not just Scope/RFP) can show
   * advisor guidance, not just a chart. Optional; absent → nothing renders.
   */
  advisor?: AdvisorLayer;
  children: ReactNode;
}

export function InsightShell({
  eyebrow,
  headline,
  provenance,
  note,
  isModel,
  advisor,
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

      {advisor ? <AdvisorLines advisor={advisor} /> : null}

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

/**
 * The advisor layer, rendered as labeled lines beneath the chart:
 *   • Best practice — advisor knowledge for this archetype (playbook-sourced).
 *   • Benchmark — a labeled market/peer comparison.
 *   • Downstream impact — the cost of getting this step wrong.
 * This is what turns a chart into advisor GUIDANCE. Any section absent → skipped.
 */
function AdvisorLines({ advisor }: { advisor: AdvisorLayer }) {
  const hasBestPractice =
    Array.isArray(advisor.bestPractice) && advisor.bestPractice.length > 0;
  const hasBenchmark = Boolean(advisor.benchmark);
  const hasDownstream = Boolean(advisor.downstreamImpact);
  if (!hasBestPractice && !hasBenchmark && !hasDownstream) return null;

  const labelStyle: CSSProperties = {
    fontFamily: ANALYTICS.MONO,
    fontSize: 9.5,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: 800,
    display: 'block',
    marginBottom: 5,
  };
  const bodyStyle: CSSProperties = {
    fontSize: 12.5,
    color: ANALYTICS.INK_2,
    lineHeight: 1.5,
    margin: 0,
  };

  return (
    <div
      data-testid="advisor-lines"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        marginTop: 16,
        paddingTop: 14,
        borderTop: `1px solid ${ANALYTICS.LINE}`,
      }}
    >
      {hasBestPractice ? (
        <div data-testid="advisor-best-practice">
          <span style={{ ...labelStyle, color: ANALYTICS.TEAL_BRIGHT }}>
            Best practice
          </span>
          <ul
            style={{
              margin: 0,
              paddingLeft: 18,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            {advisor.bestPractice!.map((line, i) => (
              <li key={i} style={bodyStyle}>
                {line}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hasBenchmark ? (
        <div data-testid="advisor-benchmark">
          <span style={{ ...labelStyle, color: ANALYTICS.BLUE }}>Benchmark</span>
          <p style={bodyStyle}>{advisor.benchmark}</p>
        </div>
      ) : null}

      {hasDownstream ? (
        <div data-testid="advisor-downstream">
          <span style={{ ...labelStyle, color: ANALYTICS.AMBER_TEXT }}>
            Downstream impact
          </span>
          <p style={bodyStyle}>{advisor.downstreamImpact}</p>
        </div>
      ) : null}
    </div>
  );
}
