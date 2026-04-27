/**
 * AbarVa canonical design tokens.
 *
 * Locked 2026-04-27 from logo-lockup-v2 + wireframes.
 * No hex literals allowed in admin tree — import from this file.
 */

export const COLORS = {
  // Foundation
  ink: '#070707',          // Abar wordmark, primary text
  navy: '#0b4a91',         // Va wordmark, primary actions, active fills
  cream: '#FBFAF7',        // background, soft surfaces
  white: '#FFFFFF',

  // Soft surfaces
  skyPale: '#E8F0FA',      // active sub-nav, context-used chips
  mintSoft: '#E8F5E8',     // Evidence: Strong
  amberSoft: '#FFF4E1',    // Live caveat, cautions
  coralSoft: '#FFE6E1',    // Blockers

  // Status text (for soft pills)
  mintInk: '#1B5E20',
  amberInk: '#7A4F01',
  coralInk: '#8B1F0F',
} as const;

export const TYPOGRAPHY = {
  serif: '"Cormorant Garamond", "Georgia", "Times New Roman", serif',
  sans: '"DM Sans", "Inter", system-ui, -apple-system, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
} as const;

export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
} as const;

export const RADIUS = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  pill: '999px',
} as const;

export const ADMIN_LAYOUT = {
  sidebarWidth: '280px',
  agentRailWidth: '320px',
  canvasMaxWidth: '880px',
  collapseBreakpoint: '1280px',
} as const;

export const BANNED_TOKENS = [
  '#14B8A6',  // teal — banned in NAV1
  '#0E9F8C',  // teal-adjacent
  '#0D9488',  // teal-700
  '#06B6D4',  // cyan
  'sparkle',
  '✨',
  'ॐ',
  'Sanskrit',
  // Newly banned 2026-04-27 from drift screenshots
  '#7C3AED',  // purple — observed in Intelligence drift
  '#A855F7',
  '#9333EA',
  '#D946EF',  // magenta — observed in Tower drift
  '#EC4899',
] as const;

export type ColorToken = keyof typeof COLORS;
export type TypographyToken = keyof typeof TYPOGRAPHY;
export type SpacingToken = keyof typeof SPACING;
