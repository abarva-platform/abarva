/**
 * AbarVa canonical design tokens.
 *
 * Locked 2026-04-27 from logo-lockup-v2 + wireframes.
 * No hex literals allowed in admin tree — import from this file.
 */

export const COLORS = {
  // Foundation
  ink: "#070707", // Abar wordmark, primary text
  navy: "#0b4a91", // Va wordmark, primary actions, active fills
  cream: "#FBFAF7", // background, soft surfaces
  white: "#FFFFFF",
  deckInk: "#1B1A17", // Existing v3 presentation ink and dark table band
  deckMuted: "#5E6874",
  deckRule: "#D9DFE6",
  deckCoverMuted: "#CAD3E1",

  // Soft surfaces
  skyPale: "#E8F0FA", // active sub-nav, context-used chips
  mintSoft: "#E8F5E8", // Evidence: Strong
  amberSoft: "#FFF4E1", // Live caveat, cautions
  coralSoft: "#FFE6E1", // Blockers

  // Status text (for soft pills)
  mintInk: "#1B5E20",
  amberInk: "#7A4F01",
  coralInk: "#8B1F0F",
} as const;

export const TYPOGRAPHY = {
  serif: '"Cormorant Garamond", "Georgia", "Times New Roman", serif',
  sans: '"DM Sans", "Inter", system-ui, -apple-system, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
} as const;

// Preserve the established source contract consumed by the Admin integration suite.
// prettier-ignore
export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
} as const;

export const RADIUS = {
  sm: "4px",
  md: "8px",
  lg: "12px",
  pill: "999px",
} as const;

// prettier-ignore
export const ADMIN_LAYOUT = {
  sidebarWidth: '280px',
  agentRailWidth: '320px',
  canvasMaxWidth: '880px',
  collapseBreakpoint: '1280px',
} as const;

const SLIDE_WIDTH_IN = 13.333;
const SLIDE_MARGIN_IN = 0.64;
const SLIDE_GUTTER_IN = Number.parseInt(SPACING.md, 10) / 96;
const SLIDE_COLUMN_IN =
  (SLIDE_WIDTH_IN - 2 * SLIDE_MARGIN_IN - 11 * SLIDE_GUTTER_IN) / 12;

export const SLIDE_DESIGN = {
  canvas: { widthIn: SLIDE_WIDTH_IN, heightIn: 7.5 },
  grid: {
    columns: 12,
    marginIn: SLIDE_MARGIN_IN,
    gutterIn: SLIDE_GUTTER_IN,
    x: (column: number) =>
      SLIDE_MARGIN_IN + column * (SLIDE_COLUMN_IN + SLIDE_GUTTER_IN),
    w: (span: number) => span * SLIDE_COLUMN_IN + (span - 1) * SLIDE_GUTTER_IN,
  },
  type: {
    coverPt: 34,
    headingPt: 31,
    exhibitHeadingPt: 25,
    governingPt: 24,
    pointPt: 16,
    labelPt: 11,
    footnotePt: 9,
  },
  space: { headerBottomIn: 0.62, contentTopIn: 0.85, footerTopIn: 7.17 },
  masters: {
    title: { titleTopIn: 1.6, titleHeightIn: 1.6 },
    sectionDivider: { governingTopIn: 1.62, pointsTopIn: 3.78 },
    twoUp: {
      narrativeColumns: 4,
      exhibitColumns: 8,
      exhibitTopIn: 1.48,
      exhibitMaxHeightIn: 5.02,
    },
    fullBleedExhibit: { exhibitTopIn: 1.55, exhibitMaxHeightIn: 4.5 },
    architecture: {
      minimumFullPageLabelPt: 18,
      minimumPairedLabelPt: 14,
      minimumCaptionPt: 12,
      minimumVisualHeightIn: 3.9,
    },
    comparison: { narrativeColumns: 4, exhibitColumns: 8 },
    table: { tableTopIn: 1.6 },
    closing: { recommendationTopIn: 1.3, actionsTopIn: 2.7 },
  },
} as const;

export const PAGE_DESIGN = {
  widthIn: 8.5,
  heightIn: 11,
  marginIn: 0.82,
  type: {
    titlePt: 27,
    heading1Pt: 17,
    heading2Pt: 13,
    bodyPt: 11,
    captionPt: 9,
  },
  space: {
    sectionBeforePt: 18,
    sectionAfterPt: 8,
    figureBeforePt: 10,
    figureAfterPt: 7,
  },
} as const;

export const EXHIBIT_DESIGN = {
  type: { headingPx: 14, labelPx: 12, detailPx: 10, captionPx: 9 },
  space: { cardPaddingPx: 14, laneGapPx: 10, cardRadiusPx: 8 },
  line: { rulePx: 1, edgePx: 2 },
} as const;

export const SHEET_DESIGN = {
  type: { coverPt: 20, headerPt: 11, bodyPt: 10 },
  columns: { minChars: 12, maxChars: 52, paddingChars: 3 },
  rows: { headerHeightPt: 30, bodyHeightPt: 22 },
  formats: {
    integer: "#,##0;[Red](#,##0);–",
    decimal: "#,##0.00;[Red](#,##0.00);–",
    percent: "0.0%;[Red](0.0%);–",
  },
} as const;

export const BANNED_TOKENS = [
  "#14B8A6", // teal — banned in NAV1
  "#0E9F8C", // teal-adjacent
  "#0D9488", // teal-700
  "#06B6D4", // cyan
  "sparkle",
  "✨",
  "ॐ",
  "Sanskrit",
  // Newly banned 2026-04-27 from drift screenshots
  "#7C3AED", // purple — observed in Intelligence drift
  "#A855F7",
  "#9333EA",
  "#D946EF", // magenta — observed in Tower drift
  "#EC4899",
] as const;

export type ColorToken = keyof typeof COLORS;
export type TypographyToken = keyof typeof TYPOGRAPHY;
export type SpacingToken = keyof typeof SPACING;
