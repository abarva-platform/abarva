'use client';

import { useState, type CSSProperties } from 'react';
import { TRANSITIONS, FOCUS_RING, COLORS } from '@/lib/design-system';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { EyebrowLabel } from '../typography/EyebrowLabel';
import { Body } from '../typography/Body';
import { MetaLabel } from '../typography/MetaLabel';

const PHASE_LABELS = ['Intake', 'Diagnose', 'Design', 'Execute', 'Verify'] as const;

interface Props {
  programName: string;
  // 0..4 · maps to PHASE_LABELS
  currentPhase: number;
  // Sponsor name for quick attribution on the card.
  sponsorName?: string | null;
  sponsorTitle?: string | null;
  // Optional objective code ('GROW' | 'OPTIMISE' | 'PROTECT') or freeform label.
  objective?: string | null;
  // Dollar figure in USD, displayed with size-appropriate formatting. Null
  // when undisclosed (e.g. early-phase programs).
  outcomeFeeUsd?: number | null;
  // Severity badge based on external contradictions / blockers. Absence =
  // no badge. `healthy` renders a quiet teal dot so users see the absence.
  healthSignal?: 'healthy' | 'watch' | 'attention' | null;
  href: string;
  // 'compact' for list rows; 'card' for portfolio glance grids; 'prominent'
  // for single-program hero panels.
  size?: 'compact' | 'card' | 'prominent';
  style?: CSSProperties;
}

function formatUsd(usd: number | null | undefined): string | null {
  if (usd == null || !Number.isFinite(usd)) return null;
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
  if (usd >= 1_000) return `$${Math.round(usd / 1_000)}K`;
  return `$${usd.toFixed(0)}`;
}

// Program surface primitive · stands in for an engagement on portfolio glance
// (C11 Home), roster sidebars, and any surface that needs "here's a program
// you can click into." Phase strip reads as one of five ticks with the
// active phase highlighted. Health signal as a single-character dot to
// avoid stoplight colors per design-system guardrails.
export function ProgramCard({
  programName, currentPhase, sponsorName, sponsorTitle,
  objective, outcomeFeeUsd, healthSignal, href, size = 'card', style,
}: Props) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const reducedMotion = useReducedMotion();

  const isCompact = size === 'compact';
  const isProminent = size === 'prominent';
  const clampedPhase = Math.max(0, Math.min(PHASE_LABELS.length - 1, currentPhase));
  const phaseLabel = PHASE_LABELS[clampedPhase];

  const healthTone: Record<NonNullable<Props['healthSignal']>, string> = {
    healthy: COLORS.teal,
    watch: COLORS.amber,
    attention: '#FF6B4A',
  };
  const healthColor = healthSignal ? healthTone[healthSignal] : null;

  return (
    <a
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        display: 'block',
        padding: isProminent ? 20 : isCompact ? 12 : 16,
        borderRadius: 10,
        background: hovered ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
        border: `0.5px solid ${hovered ? 'rgba(45,212,200,0.25)' : 'rgba(255,255,255,0.08)'}`,
        textDecoration: 'none',
        color: 'inherit',
        outline: 'none',
        transition: reducedMotion
          ? undefined
          : `background-color ${TRANSITIONS.hover}, border-color ${TRANSITIONS.hover}, box-shadow ${TRANSITIONS.focus}`,
        boxShadow: focused ? FOCUS_RING.brand : 'none',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <EyebrowLabel tone="teal" size="xs">PHASE {clampedPhase} · {phaseLabel.toUpperCase()}</EyebrowLabel>
          <div
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: isProminent ? 24 : 18,
              fontWeight: 400,
              color: COLORS.textPrimary,
              marginTop: 6,
              lineHeight: 1.25,
            }}
          >
            {programName}
          </div>
        </div>
        {healthColor ? (
          <span
            aria-hidden="true"
            title={`Signal: ${healthSignal}`}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: healthColor,
              flexShrink: 0,
              marginTop: 6,
            }}
          />
        ) : null}
      </div>

      {(sponsorName || objective || outcomeFeeUsd != null) && (
        <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
          {sponsorName ? (
            <Body size="sm" tone="secondary">
              {sponsorName}
              {sponsorTitle ? <MetaLabel style={{ marginLeft: 6 }}>· {sponsorTitle}</MetaLabel> : null}
            </Body>
          ) : null}
          {objective ? (
            <EyebrowLabel tone="muted" size="xs" style={{ letterSpacing: '0.1em' }}>{objective}</EyebrowLabel>
          ) : null}
          {formatUsd(outcomeFeeUsd) ? (
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: COLORS.teal, letterSpacing: '0.04em' }}>
              {formatUsd(outcomeFeeUsd)}
            </span>
          ) : null}
        </div>
      )}

      {/* Phase strip · 5 ticks with active highlighted. Never stoplight RGB. */}
      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 3 }}>
        {PHASE_LABELS.map((_, i) => (
          <div
            key={i}
            aria-hidden="true"
            style={{
              height: 3,
              borderRadius: 2,
              background: i <= clampedPhase ? COLORS.teal : 'rgba(255,255,255,0.08)',
              opacity: i === clampedPhase ? 1 : i < clampedPhase ? 0.6 : 1,
              transition: reducedMotion ? undefined : `background-color ${TRANSITIONS.inPlace}`,
            }}
          />
        ))}
      </div>
    </a>
  );
}
