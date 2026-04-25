// DES2 · AbarVa theme tokens.
//
// Pure deterministic theme module. Components import from here; no
// component embeds raw hex codes.
//
// No Date.now(), no random IDs, no model calls. This module imports
// nothing from src/lib/source, src/lib/sentinel, src/lib/atlas,
// src/lib/nexus, src/lib/agent, src/lib/auth, supabase, etc.

// ---------------------------------------------------------------------
// Color tokens (canon §D)
// ---------------------------------------------------------------------

export const COLORS = {
  // Surfaces
  surface: '#FAFAF8',
  surface2: '#F5F5F2',
  card: '#FFFFFF',
  border: '#E6E6E2',
  borderSoft: '#EFEFEB',

  // Type
  ink: '#0F1115',
  body: '#2B2F36',
  muted: '#5A5F66',
  mutedSoft: '#8A8F96',

  // Semantic accents
  navy: '#1B2B5C',
  navySoft: 'rgba(27,43,92,0.08)',
  amber: '#B45309',
  amberSoft: 'rgba(180,83,9,0.10)',
  red: '#B5322B',
  redSoft: 'rgba(181,50,43,0.10)',

  // Auxiliary (storytelling-moment dark surfaces)
  inkDark: '#0A0C12',
  navyDark: '#10193A',
} as const;

export type AbarvaColorToken = keyof typeof COLORS;

// ---------------------------------------------------------------------
// Typography tokens (canon §E)
// ---------------------------------------------------------------------

export const FONT = {
  body: 'DM Sans, -apple-system, BlinkMacSystemFont, sans-serif',
  mono: '"JetBrains Mono", "Courier New", monospace',
} as const;

export const TYPE = {
  // Page title
  h1: {
    fontFamily: FONT.body,
    fontSize: 26,
    fontWeight: 700,
    lineHeight: 1.2,
    color: COLORS.ink,
    letterSpacing: '-0.005em',
  },
  // Section
  h2: {
    fontFamily: FONT.body,
    fontSize: 20,
    fontWeight: 700,
    lineHeight: 1.25,
    color: COLORS.ink,
  },
  // Card
  h3: {
    fontFamily: FONT.body,
    fontSize: 16,
    fontWeight: 600,
    lineHeight: 1.3,
    color: COLORS.ink,
  },
  // Body
  body: {
    fontFamily: FONT.body,
    fontSize: 13,
    fontWeight: 400,
    lineHeight: 1.55,
    color: COLORS.body,
  },
  // Muted body
  bodyMuted: {
    fontFamily: FONT.body,
    fontSize: 13,
    fontWeight: 400,
    lineHeight: 1.55,
    color: COLORS.muted,
  },
  // Eyebrow / chip
  eyebrow: {
    fontFamily: FONT.mono,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: COLORS.mutedSoft,
  },
  // Italic interpretation caption
  caption: {
    fontFamily: FONT.body,
    fontSize: 11,
    fontWeight: 400,
    fontStyle: 'italic' as const,
    color: COLORS.mutedSoft,
    lineHeight: 1.55,
  },
} as const;

// ---------------------------------------------------------------------
// Spacing + radius tokens
// ---------------------------------------------------------------------

export const SPACING = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 24,
} as const;

export const RADIUS = {
  pill: 999,
  chip: 4,
  card: 12,
  cardSmall: 10,
  drawer: 0,
} as const;

// ---------------------------------------------------------------------
// Border helpers
// ---------------------------------------------------------------------

export const BORDER = {
  default: `1px solid ${COLORS.border}`,
  soft: `1px solid ${COLORS.borderSoft}`,
  dashed: `1px dashed ${COLORS.border}`,
  hairlineDashed: `1px dashed ${COLORS.borderSoft}`,
} as const;

// ---------------------------------------------------------------------
// Agent accent partition (canon §H)
// ---------------------------------------------------------------------

export type AbarvaAgent = 'nexus' | 'sentinel' | 'atlas' | 'steward';

export interface AbarvaAgentAccent {
  fg: string;        // foreground accent color
  bg: string;        // tinted chip / background color
  ring: string;      // 3px left border accent
}

export const AGENT_ACCENT: Record<AbarvaAgent, AbarvaAgentAccent> = {
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
    fg: COLORS.ink,
    bg: COLORS.navySoft,
    ring: COLORS.navy,
  },
  steward: {
    fg: COLORS.muted,
    bg: COLORS.surface2,
    ring: COLORS.muted,
  },
};

// ---------------------------------------------------------------------
// Status accent partition
// ---------------------------------------------------------------------

export type AbarvaStatus = 'ready' | 'partial' | 'blocked' | 'low' | 'medium' | 'high' | 'critical';

export function statusAccent(status: string): AbarvaAgentAccent {
  switch (status.toLowerCase()) {
    case 'ready':
    case 'low':
    case 'medium':
      return { fg: COLORS.navy, bg: COLORS.navySoft, ring: COLORS.navy };
    case 'partial':
    case 'high':
      return { fg: COLORS.amber, bg: COLORS.amberSoft, ring: COLORS.amber };
    case 'blocked':
    case 'critical':
      return { fg: COLORS.red, bg: COLORS.redSoft, ring: COLORS.red };
    default:
      return { fg: COLORS.muted, bg: COLORS.surface2, ring: COLORS.muted };
  }
}

// ---------------------------------------------------------------------
// Re-exports for tests / consumers
// ---------------------------------------------------------------------

export const ABARVA_AGENT_NAMES: ReadonlyArray<AbarvaAgent> = [
  'nexus',
  'sentinel',
  'atlas',
  'steward',
];

export const ABARVA_STATUS_KEYS: ReadonlyArray<AbarvaStatus> = [
  'ready',
  'partial',
  'blocked',
  'low',
  'medium',
  'high',
  'critical',
];

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

export const ABARVA_EVIDENCE_STATES = [
  'not_seeded',
  'partial',
  'cited',
  'quality_checked',
  'usable_as_evidence',
  'blocked',
] as const;

export type AbarvaEvidenceState = (typeof ABARVA_EVIDENCE_STATES)[number];
