// DES2 · AbarVa design theme tokens.
//
// Single source of truth for AbarVa visual canon: color palette,
// typography, spacing, radii, agent + status accent partitions, and
// shared enums (agent names, status keys, file-type chips, evidence
// states).
//
// All AbarVa primitives (src/components/abarva/**) read from this
// file. Pure tokens — no React, no runtime dependencies, no calls.

// ---------------------------------------------------------------------
// COLOR PALETTE
// ---------------------------------------------------------------------
//
// Light surfaces (default page background): warm off-white. NAVY is the
// canonical accent. Dark surfaces are reserved for high-impact briefs
// (e.g. Atlas Brief hero) — never whole pages.

export const COLORS = {
  // Surfaces
  surface: '#FBFAF7',
  surface2: '#F5F3EE',
  card: '#FFFFFF',
  border: '#E8E6E1',
  borderSoft: '#F0EEEA',

  // Text
  ink: '#0A0C12',
  body: '#1F2433',
  muted: '#525866',
  mutedSoft: '#8B91A1',

  // Primary navy accent
  navy: '#1B2B5C',
  navySoft: 'rgba(27, 43, 92, 0.10)',

  // Amber (partial / high pressure)
  amber: '#B45309',
  amberSoft: 'rgba(180, 83, 9, 0.10)',

  // Red (blocked / critical)
  red: '#B42318',
  redSoft: 'rgba(180, 35, 24, 0.10)',

  // Dark surfaces (reserved for high-impact briefs)
  inkDark: '#0A0C12',
  navyDark: '#10193A',
} as const;

// ---------------------------------------------------------------------
// FONT FAMILIES
// ---------------------------------------------------------------------
//
// Body and headings: DM Sans only (no serif body — serif is intentionally
// retired from the v2 canon).
// Mono: JetBrains Mono for eyebrow chips, status pills, file types.

export const FONT = {
  body: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', 'SFMono-Regular', 'Menlo', monospace",
} as const;

// ---------------------------------------------------------------------
// TYPOGRAPHY SCALE
// ---------------------------------------------------------------------

export const TYPE = {
  h1: {
    fontFamily: FONT.body,
    fontSize: 28,
    fontWeight: 600,
    lineHeight: 1.2,
    color: COLORS.ink,
    letterSpacing: '-0.01em',
  },
  h2: {
    fontFamily: FONT.body,
    fontSize: 20,
    fontWeight: 600,
    lineHeight: 1.25,
    color: COLORS.ink,
    letterSpacing: '-0.005em',
  },
  h3: {
    fontFamily: FONT.body,
    fontSize: 15,
    fontWeight: 600,
    lineHeight: 1.3,
    color: COLORS.ink,
  },
  body: {
    fontFamily: FONT.body,
    fontSize: 14,
    fontWeight: 400,
    lineHeight: 1.5,
    color: COLORS.body,
  },
  eyebrow: {
    fontFamily: FONT.mono,
    fontSize: 10,
    fontWeight: 500,
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    color: COLORS.muted,
  },
  caption: {
    fontFamily: FONT.body,
    fontSize: 12,
    fontWeight: 400,
    lineHeight: 1.45,
    color: COLORS.muted,
  },
} as const;

// ---------------------------------------------------------------------
// SPACING / RADIUS / BORDER
// ---------------------------------------------------------------------

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
} as const;

export const RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 999,
} as const;

export const BORDER = {
  hairline: `1px solid ${COLORS.border}`,
  hairlineSoft: `1px solid ${COLORS.borderSoft}`,
  navy: `1px solid ${COLORS.navy}`,
} as const;

// ---------------------------------------------------------------------
// AGENT ACCENTS  (canon §H · agent partition)
// ---------------------------------------------------------------------
//
// Nexus    → NAVY  (mastermind)
// Sentinel → AMBER (intelligence)
// Atlas    → INK on dark hero, NAVY on light
// Steward  → MUTED (governance / setup)

export const ABARVA_AGENT_NAMES = [
  'nexus',
  'sentinel',
  'atlas',
  'steward',
] as const;

export type AbarvaAgent = (typeof ABARVA_AGENT_NAMES)[number];

export const AGENT_ACCENT: Record<
  AbarvaAgent,
  { fg: string; bg: string; ring: string }
> = {
  nexus: {
    fg: COLORS.navy,
    bg: COLORS.navySoft,
    ring: COLORS.navy,
  },
  sentinel: {
    fg: COLORS.amber,
    bg: COLORS.amberSoft,
    ring: COLORS.amber,
  },
  atlas: {
    fg: COLORS.navy,
    bg: COLORS.navySoft,
    ring: COLORS.navy,
  },
  steward: {
    fg: COLORS.muted,
    bg: 'rgba(82, 88, 102, 0.10)',
    ring: COLORS.muted,
  },
};

// ---------------------------------------------------------------------
// STATUS PARTITION
// ---------------------------------------------------------------------
//
// ready / low / medium → NAVY
// partial / high       → AMBER
// blocked / critical   → RED

export const ABARVA_STATUS_KEYS = [
  'ready',
  'low',
  'medium',
  'partial',
  'high',
  'blocked',
  'critical',
] as const;

export type AbarvaStatus = (typeof ABARVA_STATUS_KEYS)[number];

export function statusAccent(status: AbarvaStatus): {
  fg: string;
  bg: string;
  ring: string;
} {
  if (status === 'ready' || status === 'low' || status === 'medium') {
    return { fg: COLORS.navy, bg: COLORS.navySoft, ring: COLORS.navy };
  }
  if (status === 'partial' || status === 'high') {
    return { fg: COLORS.amber, bg: COLORS.amberSoft, ring: COLORS.amber };
  }
  // blocked | critical
  return { fg: COLORS.red, bg: COLORS.redSoft, ring: COLORS.red };
}

// ---------------------------------------------------------------------
// FILE TYPE CHIPS
// ---------------------------------------------------------------------

export const ABARVA_FILE_CHIPS = [
  'DOC',
  'PDF',
  'XLS',
  'PPT',
  'NOTE',
  'HTML',
  'DATA',
] as const;

export type AbarvaFileChip = (typeof ABARVA_FILE_CHIPS)[number];

// ---------------------------------------------------------------------
// EVIDENCE STATES (PDEL / ADM3 lifecycle)
// ---------------------------------------------------------------------

export const ABARVA_EVIDENCE_STATES = [
  'not_seeded',
  'partial',
  'cited',
  'quality_checked',
  'usable_as_evidence',
  'blocked',
] as const;

export type AbarvaEvidenceState = (typeof ABARVA_EVIDENCE_STATES)[number];
