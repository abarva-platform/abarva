/**
 * ABARVA DESIGN SYSTEM
 * Single source of truth for all product pages.
 * Import this in every product page — never hardcode colors or fonts.
 *
 * RULE: Every product page must use these constants.
 * If you see #F8FAFC or Inter font in a product page — it is wrong.
 */

// ─── COLORS ────────────────────────────────────────────────────────────────

export const COLORS = {
  // Backgrounds
  pageBg:     '#060A12',  // page background — all products
  cardBg:     '#0D1520',  // card background
  surfaceBg:  '#060A12',  // inset surface (inside cards)
  border:     '#1C2D45',  // all borders
  borderHover:'#2DD4C8',  // border on hover

  // Brand
  teal:       '#2DD4C8',  // primary brand color
  tealDim:    'rgba(45,212,200,0.12)', // teal background dim
  tealBorder: 'rgba(45,212,200,0.25)', // teal border dim

  // Text — ALL white on dark background
  textPrimary:   '#EFF6FF',  // main text — white
  textSecondary: '#94A3B8',  // secondary text — light gray (NOT #6B7280)
  textMuted:     '#475569',  // muted — only for timestamps/metadata
  textDisabled:  '#374151',  // disabled states

  // Semantic
  red:    '#EF4444',
  redDim: 'rgba(239,68,68,0.12)',
  amber:  '#F59E0B',
  amberDim: 'rgba(245,158,11,0.12)',
  green:  '#34D399',
  greenDim: 'rgba(52,211,153,0.12)',
  indigo: '#818CF8',
  indigoDim: 'rgba(129,140,248,0.12)',

  // Critical — NEVER use these on dark backgrounds
  // These are LIGHT theme colors — only for investor page
  LIGHT_bg:   '#F8FAFC',  // ← WRONG for product pages
  LIGHT_card: '#FFFFFF',  // ← WRONG for product pages
  LIGHT_text: '#0F172A',  // ← WRONG for product pages
} as const

// ─── TYPOGRAPHY ────────────────────────────────────────────────────────────

export const FONTS = {
  sans:  '"DM Sans", -apple-system, sans-serif',
  mono:  '"JetBrains Mono", "Fira Code", monospace',
  serif: '"Fraunces", Georgia, serif',
} as const

export const TEXT = {
  // Product label (JetBrains Mono) — used for product names, section labels
  productLabel: {
    fontFamily: FONTS.mono,
    fontSize: '11px',
    fontWeight: 600,
    color: COLORS.teal,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
  },

  // Section label (JetBrains Mono) — used for section headers
  sectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: '9px',
    fontWeight: 600,
    color: COLORS.teal,
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    marginBottom: '12px',
  },

  // CXO question (Fraunces) — the hero question on each product
  cxoQuestion: {
    fontFamily: FONTS.serif,
    fontSize: '28px',
    fontWeight: 500,
    color: COLORS.textPrimary,
    lineHeight: 1.3,
  },

  // Metric value (Fraunces) — large numbers
  metricValue: {
    fontFamily: FONTS.serif,
    fontSize: '28px',
    fontWeight: 500,
    color: COLORS.textPrimary,
    lineHeight: 1,
  },

  // Body text (DM Sans)
  body: {
    fontFamily: FONTS.sans,
    fontSize: '14px',
    color: COLORS.textPrimary,
    lineHeight: 1.6,
  },

  // Secondary body (DM Sans)
  bodySecondary: {
    fontFamily: FONTS.sans,
    fontSize: '13px',
    color: COLORS.textSecondary,
    lineHeight: 1.5,
  },

  // Small label (DM Sans)
  small: {
    fontFamily: FONTS.sans,
    fontSize: '11px',
    color: COLORS.textSecondary,
  },

  // Mono value — for metrics, codes
  monoValue: {
    fontFamily: FONTS.mono,
    fontSize: '11px',
    color: COLORS.textPrimary,
  },
} as const

// ─── COMPONENT STYLES ──────────────────────────────────────────────────────

export const COMPONENTS = {
  // Page wrapper — every product page starts with this
  page: {
    minHeight: '100vh',
    background: COLORS.pageBg,
    fontFamily: FONTS.sans,
    color: COLORS.textPrimary,
  },

  // Product header — dark band below nav
  productHeader: {
    background: COLORS.cardBg,
    borderBottom: `1px solid ${COLORS.border}`,
    padding: '20px 28px',
  },

  // Standard card
  card: {
    background: COLORS.cardBg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '12px',
    padding: '16px',
  },

  // Inset card (inside another card)
  cardInset: {
    background: COLORS.surfaceBg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '8px',
    padding: '12px 14px',
  },

  // Metric tile
  metricTile: {
    background: COLORS.surfaceBg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '10px',
    padding: '14px',
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },

  // Severity bar (2px top border on metric tiles)
  severityBar: {
    position: 'absolute' as const,
    top: 0, left: 0, right: 0,
    height: '2px',
  },

  // Source attribution pill
  sourcePill: (type: 'data' | 'industry' | 'genome') => ({
    fontFamily: FONTS.mono,
    fontSize: '8px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    marginBottom: '4px',
    color: type === 'data' ? COLORS.teal : type === 'industry' ? COLORS.amber : COLORS.indigo,
  }),

  // Three-source attribution column
  sourceColumn: {
    background: COLORS.surfaceBg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '6px',
    padding: '10px 12px',
  },

  // Button primary
  btnPrimary: {
    background: COLORS.teal,
    color: COLORS.pageBg,
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: FONTS.sans,
  },

  // Button secondary
  btnSecondary: {
    background: 'transparent',
    color: COLORS.textPrimary,
    border: `1px solid ${COLORS.border}`,
    padding: '9px 16px',
    borderRadius: '8px',
    fontSize: '12px',
    cursor: 'pointer',
    fontFamily: FONTS.sans,
  },

  // Tab navigator
  tab: (active: boolean) => ({
    padding: '11px 20px',
    fontSize: '13px',
    fontWeight: 500,
    color: active ? COLORS.teal : COLORS.textPrimary,
    cursor: 'pointer',
    borderBottom: active ? `2px solid ${COLORS.teal}` : '2px solid transparent',
    opacity: active ? 1 : 0.7,
    fontFamily: FONTS.sans,
  }),

  // Risk pill
  riskPill: (level: 'low' | 'medium' | 'high') => ({
    fontFamily: FONTS.mono,
    fontSize: '9px',
    padding: '3px 8px',
    borderRadius: '20px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    background: level === 'low' ? COLORS.greenDim : level === 'medium' ? COLORS.amberDim : COLORS.redDim,
    color: level === 'low' ? COLORS.green : level === 'medium' ? COLORS.amber : COLORS.red,
    border: `1px solid ${level === 'low' ? 'rgba(52,211,153,0.2)' : level === 'medium' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'}`,
  }),
} as const

// ─── CHARTS ────────────────────────────────────────────────────────────────

export const CHART_COLORS = {
  teal:   '#2DD4C8',  // positive, on track, teal line
  red:    '#EF4444',  // critical, declining, red line
  amber:  '#F59E0B',  // warning, amber
  gray:   '#1C2D45',  // benchmark/peer bars
  white:  '#EFF6FF',  // labels on dark
}

// Sparkline data helpers
export const createSparklinePoints = (
  data: number[],
  width: number,
  height: number
): string => {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  return data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * height
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
}

// Severity bar color
export const severityColor = (
  value: number,
  benchmark: number,
  direction: 'lower-is-better' | 'higher-is-better'
): string => {
  const isBad = direction === 'lower-is-better'
    ? value > benchmark * 1.05
    : value < benchmark * 0.95
  const isGood = direction === 'lower-is-better'
    ? value <= benchmark
    : value >= benchmark
  return isBad ? COLORS.red : isGood ? COLORS.green : COLORS.amber
}
