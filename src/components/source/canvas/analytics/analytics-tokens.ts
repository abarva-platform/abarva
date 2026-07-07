// ─────────────────────────────────────────────────────────────────────────────
// Analytics-canvas tokens — the redesigned (three-beat) Source stage canvas.
//
// On-system only: every value bridges to `SHELL` / `CANVAS` / `PORTFOLIO`
// tokens (Fraunces serif, Inter sans, ink / paper / mint / blue / amber). This
// module does NOT invent a new visual language — it names the roles the
// approved prototype uses so the components stay legible, and pins them to the
// canonical palette.
// ─────────────────────────────────────────────────────────────────────────────

import { SHELL } from '@/lib/shell/shell-tokens';
import { PORTFOLIO } from '@/components/source/portfolio/portfolio-tokens';
import type { IntelPointTone } from './view-model';
import type { ValueType } from '@/lib/source/archetypes/types';

export const ANALYTICS = {
  // Surfaces
  PAGE_BG: PORTFOLIO.PAGE_BG,
  CARD: PORTFOLIO.CARD,
  SOFT: SHELL.PAPER_SOFT,
  // A warm intel-panel gradient top, resolving to card white.
  INTEL_GRADIENT: `linear-gradient(180deg, #fbfaf7, ${PORTFOLIO.CARD} 55%)`,

  // Lines
  LINE: PORTFOLIO.RULE,
  LINE_SOFT: PORTFOLIO.HAIRLINE,
  LINE_STRONG: PORTFOLIO.RULE_STRONG,

  // Ink
  INK: PORTFOLIO.INK,
  INK_2: SHELL.INK_MID,
  MUTED: PORTFOLIO.INK_SOFT,
  FAINT: PORTFOLIO.INK_MUTED,

  // Status
  GREEN: PORTFOLIO.ACTIVE,
  GREEN_TINT: SHELL.MINT_BG,
  GREEN_TEXT: SHELL.MINT_TEXT,
  AMBER: PORTFOLIO.WAITING,
  AMBER_TINT: SHELL.PEACH_BG,
  AMBER_TEXT: SHELL.PEACH_TEXT,
  RUST: SHELL.RUST_TEXT,
  RUST_TINT: '#fbe9ea',
  BLUE: '#2a5aa8',
  BLUE_TINT: SHELL.BLUE_BG,
  // aVa's teal accent (matches the docked launcher mark).
  TEAL_DEEP: '#12332e',
  TEAL_BRIGHT: '#5fd0c2',

  // Type
  SERIF: SHELL.SERIF,
  SANS: SHELL.SANS,
  MONO: SHELL.MONO,

  // Radius / spacing
  RADIUS: 12,
  RADIUS_SM: 8,
  RADIUS_LG: 14,
  SHADOW_SM: '0 1px 2px rgba(10,10,11,0.05)',
} as const;

/** Chip palette for an intel point's tone. */
export function intelToneStyle(tone: IntelPointTone): { bg: string; fg: string } {
  switch (tone) {
    case 'found':
      return { bg: ANALYTICS.GREEN_TINT, fg: ANALYTICS.GREEN_TEXT };
    case 'archetype':
      return { bg: 'rgba(63,184,168,0.16)', fg: '#1f8578' };
    case 'benchmark':
      return { bg: ANALYTICS.BLUE_TINT, fg: ANALYTICS.BLUE };
    case 'traps':
      return { bg: ANALYTICS.RUST_TINT, fg: ANALYTICS.RUST };
    case 'without':
      return { bg: ANALYTICS.AMBER_TINT, fg: ANALYTICS.AMBER_TEXT };
    case 'muted':
    default:
      return { bg: 'rgba(10,10,11,0.06)', fg: ANALYTICS.MUTED };
  }
}

/** Human label + chip palette for a canonical value type. */
export function valueTypeMeta(valueType: ValueType): {
  label: string;
  short: string;
  bg: string;
  fg: string;
} {
  switch (valueType) {
    case 'expected_concession':
      return {
        label: 'Expected concession',
        short: 'concession',
        bg: 'rgba(10,10,11,0.06)',
        fg: ANALYTICS.MUTED,
      };
    case 'incremental_negotiated':
      return {
        label: 'Incremental negotiated',
        short: 'incremental',
        bg: ANALYTICS.GREEN_TINT,
        fg: ANALYTICS.GREEN_TEXT,
      };
    case 'solution_tightening':
      return {
        label: 'Solution tightening',
        short: 'solution',
        bg: ANALYTICS.BLUE_TINT,
        fg: ANALYTICS.BLUE,
      };
    case 'protected':
      return {
        label: 'Protected value',
        short: 'protected',
        bg: 'rgba(63,184,168,0.16)',
        fg: '#1f8578',
      };
    case 'risk_adjusted':
    default:
      return {
        label: 'Risk-adjusted',
        short: 'risk-adjusted',
        bg: ANALYTICS.AMBER_TINT,
        fg: ANALYTICS.AMBER_TEXT,
      };
  }
}

/** The verb affordance for a task type. */
export function taskVerb(type: 'provide' | 'confirm' | 'decide'): string {
  return type === 'provide' ? 'Upload' : type === 'confirm' ? 'Review' : 'Decide';
}
