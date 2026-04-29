/**
 * InstanceHealthBadge — REASON
 *
 * At-a-glance health pill for a reasoning instance. Aggregates the
 * deterministic Layer-3 signals (pending hard gates, blocked criteria,
 * high-severity contradictions / failure modes / cascades) into a single
 * green / amber / red verdict via `computeInstanceHealth`.
 *
 * Pure presentation: no IO, no Date.now(), no randomness. Server-friendly —
 * safe to render inside server components. AbarVa palette only.
 */

import { SHELL } from '@/lib/shell/shell-tokens';
import type { InstanceHealth, InstanceHealthGrade } from '@/lib/reasoning/instance-health';

export interface InstanceHealthBadgeProps {
  /** Pre-computed health verdict from `computeInstanceHealth(context)`. */
  health: InstanceHealth;
}

interface GradePalette {
  dot: string;
  border: string;
  background: string;
  text: string;
  label: string;
}

function paletteFor(grade: InstanceHealthGrade): GradePalette {
  if (grade === 'green') {
    return {
      dot: SHELL.MINT_TEXT,
      border: SHELL.MINT_LINE,
      background: SHELL.MINT_BG,
      text: SHELL.MINT_TEXT,
      label: 'Clear',
    };
  }
  if (grade === 'amber') {
    return {
      dot: SHELL.AMBER_DOT,
      border: SHELL.PEACH_LINE,
      background: SHELL.PEACH_BG,
      text: SHELL.PEACH_TEXT,
      label: 'Caution',
    };
  }
  return {
    dot: SHELL.RUST_TEXT,
    border: SHELL.RUST_TEXT,
    background: SHELL.RUST_BG,
    text: SHELL.RUST_TEXT,
    label: 'Trouble',
  };
}

export function InstanceHealthBadge({ health }: InstanceHealthBadgeProps) {
  const palette = paletteFor(health.grade);
  // Tooltip surfaces summary first, with the bulleted reasons as a tail so
  // users hovering see the breakdown without leaving the page.
  const tooltip =
    health.reasons.length === 0
      ? health.summary
      : `${health.summary}\n\n${health.reasons.map((r) => `• ${r}`).join('\n')}`;

  return (
    <span
      data-testid="instance-health-badge"
      data-grade={health.grade}
      title={tooltip}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 10px',
        borderRadius: 999,
        border: `1px solid ${palette.border}`,
        background: palette.background,
        fontFamily: SHELL.SANS,
        fontSize: 11,
        color: palette.text,
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        aria-hidden
        data-testid="instance-health-badge-dot"
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: palette.dot,
          flexShrink: 0,
        }}
      />
      <span style={{ fontWeight: 600 }}>
        Health: {palette.label}
      </span>
      <span
        data-testid="instance-health-badge-score"
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: '0.04em',
          color: palette.text,
          background: SHELL.CARD_WHITE,
          border: `1px solid ${palette.border}`,
          borderRadius: 999,
          padding: '1px 6px',
        }}
      >
        {health.score}
      </span>
    </span>
  );
}

export default InstanceHealthBadge;
