// src/lib/reasoning/cascade-formatters.ts
//
// REASON-31 — Cascade impact card formatters
//
// Pure formatting helpers for `<CascadeImpactCard />`. Kept in `lib/` rather
// than colocated with the component so tests can pin the deterministic
// label/severity outputs without mounting React.
//
// Same inputs always produce the same outputs. No network, no I/O.

import type { CascadeImpact, LinkType } from './types';

/** Human-readable label for each `LinkType`, e.g. "depends on", "unblocks". */
export const LINK_TYPE_LABEL: Record<LinkType, string> = {
  unblocks: 'unblocks',
  'depends-on': 'depends on',
  feeds: 'feeds',
  'shares-vendor': 'shares vendor',
  contradicts: 'contradicts',
};

/** Pillar label for the directional `severity` chip. */
export const SEVERITY_DIR_LABEL: Record<CascadeImpact['severity'], string> = {
  blocking: 'Blocking',
  accelerating: 'Accelerating',
  informational: 'Informational',
};

/**
 * Risk-tier dot semantics (`impactSeverity`). Returns the canonical AbarVa
 * shell-token *name* — the component maps this to a hex value via
 * `SHELL.{name}`. Keeping the function token-name-only lets these helpers
 * stay framework- and theme-agnostic for tests.
 *
 * - `high`   → `RUST_TEXT`  (red)
 * - `medium` → `AMBER_DOT`  (amber)
 * - `low`    → `INK_MUTED`  (gray)
 *
 * `undefined` impactSeverity falls back to `INK_MUTED` (treated as low).
 */
export function severityDotToken(
  impactSeverity: CascadeImpact['impactSeverity'],
): 'RUST_TEXT' | 'AMBER_DOT' | 'INK_MUTED' {
  switch (impactSeverity) {
    case 'high':
      return 'RUST_TEXT';
    case 'medium':
      return 'AMBER_DOT';
    case 'low':
    case undefined:
    default:
      return 'INK_MUTED';
  }
}

/**
 * Aria-friendly label for the severity dot.
 */
export function severityAriaLabel(
  impactSeverity: CascadeImpact['impactSeverity'],
): string {
  switch (impactSeverity) {
    case 'high':
      return 'High impact severity';
    case 'medium':
      return 'Medium impact severity';
    case 'low':
      return 'Low impact severity';
    default:
      return 'Impact severity unknown';
  }
}

/**
 * Pre-format every renderable string for one cascade row. The component
 * consumes the result without further string concat, so tests can assert
 * the output deterministically.
 */
export interface FormattedCascadeRow {
  source: string;
  target: string;
  linkLabel: string;
  severityLabel: string;
  severityDotToken: 'RUST_TEXT' | 'AMBER_DOT' | 'INK_MUTED';
  description: string;
}

export function formatCascadeRow(impact: CascadeImpact): FormattedCascadeRow {
  return {
    source: impact.sourceInstanceId,
    target: impact.targetInstanceName
      ? `${impact.targetInstanceId} · ${impact.targetInstanceName}`
      : impact.targetInstanceId,
    linkLabel: LINK_TYPE_LABEL[impact.linkType],
    severityLabel: SEVERITY_DIR_LABEL[impact.severity],
    severityDotToken: severityDotToken(impact.impactSeverity),
    description: impact.impact ?? '',
  };
}
