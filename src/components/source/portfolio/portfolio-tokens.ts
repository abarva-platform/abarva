// Portfolio design tokens.
//
// Elegant / productivity-first palette — modeled on Claude / GPT / Linear /
// Notion. Type-driven hierarchy. Hairlines, not borders. One color per job.
// Status hue appears only on the indicator dot, never on chip backgrounds.

import { SHELL } from '@/lib/shell/shell-tokens';

export const PORTFOLIO = {
  // ── Surface ────────────────────────────────────────────────────────────────
  PAGE_BG: '#f5f1eb',           // cream — same as the rest of the cockpit
  CARD: '#fdfbf7',              // warm white — used sparingly
  SURFACE_HOVER: 'rgba(10,10,11,0.035)',  // table row hover
  SURFACE_HOVER_STRONG: 'rgba(10,10,11,0.06)',  // sidebar checkbox hover

  // ── Lines ──────────────────────────────────────────────────────────────────
  // Two weights. Hairlines for inside-component structure, soft for grouping.
  HAIRLINE: 'rgba(10,10,11,0.06)',
  RULE: 'rgba(10,10,11,0.10)',
  RULE_STRONG: 'rgba(10,10,11,0.16)',

  // ── Ink ────────────────────────────────────────────────────────────────────
  INK: '#0c1a3a',
  INK_2: '#2c2c2a',
  INK_SOFT: '#5b6c8a',
  INK_MUTED: '#8b95a8',
  GRAY: '#888780',
  GRAY_DK: '#5F5E5A',

  // ── Status (dot only — no chip background) ────────────────────────────────
  ACTIVE: '#1d9e75',
  WAITING: '#ba7517',
  BLOCKED: '#a32d2d',
  COMPLETED: '#8b8779',

  // Reserved low-saturation tints for the rare case we DO need a tint
  // (e.g. attention banner left edge has a 6% wash to differentiate severity).
  ATTN_CRIT_WASH: 'rgba(163,45,45,0.06)',
  ATTN_STD_WASH: 'rgba(186,117,23,0.05)',

  // ── Aging ──────────────────────────────────────────────────────────────────
  AGE_NORMAL: '#5F5E5A',
  AGE_WARN: '#ba7517',
  AGE_BAD: '#a32d2d',

  // ── Type ───────────────────────────────────────────────────────────────────
  // Display: Fraunces serif. Body: Inter. Utility: JetBrains Mono.
  SERIF: 'var(--font-fraunces), "Fraunces", Georgia, serif',
  SANS: 'var(--font-inter), "Inter", system-ui, -apple-system, sans-serif',
  MONO: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',

  // ── Type scale ─────────────────────────────────────────────────────────────
  // Pinned numbers, used everywhere — keeps the page from drifting toward
  // ad-hoc font sizes.
  T_DISPLAY: 38,        // h1
  T_NUMBER_LARGE: 30,   // KPI value
  T_HEADING: 20,        // section / group titles
  T_BODY: 14,           // body / table cells
  T_BODY_SMALL: 13,
  T_META: 12,           // meta lines, helper text
  T_MICRO: 10,          // mono caps utility
  T_MICRO_SMALL: 9,

  // ── Spacing scale ──────────────────────────────────────────────────────────
  S_PAGE: 32,            // page horizontal padding
  S_BLOCK: 24,           // between major blocks
  S_SECTION: 16,         // inside a block
  S_GAP: 8,              // tight items
  S_TIGHT: 4,
  RADIUS: 10,
  RADIUS_TIGHT: 6,
} as const;

export type PortfolioToken = keyof typeof PORTFOLIO;

// Re-export selected SHELL tokens for the rare component that needs to bridge
// (kept here so component files import only from one tokens file).
export const SHELL_BRIDGE = {
  CARD_LINE: SHELL.CARD_LINE,
} as const;
