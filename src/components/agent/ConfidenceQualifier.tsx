'use client';

// ConfidenceQualifier · File 10 §5.5 P0
//
// Standalone confidence chip. Extracted from AgentCitation so any
// surface (deliverables, Tower pressure cards, pattern detail) can render
// a confidence band without pulling in the full citation primitive.
//
// Tier mapping matches §9.3:
//   HIGH   → score ≥ 0.8
//   MEDIUM → 0.6 ≤ score < 0.8
//   LOW    → score < 0.6 · REQUIRES honest-disclosure prose alongside

import type { ConfidenceTier } from '@/lib/agent/renderedResponse';

interface ConfidenceQualifierProps {
  tier: ConfidenceTier;
  /** Accent hex; defaults to muted neutral so the chip adapts per zone. */
  accent?: string;
  /** Compact inline · default; sectioned · larger for standalone display. */
  size?: 'compact' | 'sectioned';
  /** Optional trailing label (e.g. "· 3 sources"). */
  detail?: string;
}

const TIER_COPY: Record<ConfidenceTier, string> = {
  HIGH: 'HIGH',
  MEDIUM: 'MED',
  LOW: 'LOW',
};

const TIER_OPACITY: Record<ConfidenceTier, number> = {
  HIGH: 1,
  MEDIUM: 0.78,
  LOW: 0.55,
};

export function ConfidenceQualifier({ tier, accent = '#8a7e72', size = 'compact', detail }: ConfidenceQualifierProps) {
  const isCompact = size === 'compact';
  return (
    <span
      className={`confidence-qualifier confidence-${tier.toLowerCase()}`}
      data-confidence-tier={tier}
      title={`Confidence · ${tier}${detail ? ` ${detail}` : ''}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: isCompact ? 10 : 11,
        fontWeight: 700,
        letterSpacing: '0.1em',
        padding: isCompact ? '1px 6px' : '3px 10px',
        borderRadius: isCompact ? 3 : 999,
        background: `${accent}${tier === 'LOW' ? '14' : '22'}`,
        color: accent,
        opacity: TIER_OPACITY[tier],
        textTransform: 'uppercase',
        lineHeight: 1.3,
        verticalAlign: 'baseline',
      }}
    >
      <span>{TIER_COPY[tier]}</span>
      {detail ? <span style={{ opacity: 0.7, fontWeight: 600 }}>{detail}</span> : null}
    </span>
  );
}
