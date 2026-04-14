// Design system tokens — import these in every product page
// Never hardcode colors or fonts in product pages

export const COLORS = {
  pageBg: '#060A12',
  cardBg: '#0D1520',
  border: '#1C2D45',
  teal: '#2DD4C8',
  textPrimary: '#EFF6FF',
  textSecondary: '#94A3B8',
  red: '#EF4444',
  amber: '#F59E0B',
  green: '#10B981',
  indigo: '#6366F1',
}

export const FONTS = {
  sans: '"DM Sans", system-ui, sans-serif',
  mono: '"JetBrains Mono", "Fira Code", monospace',
  serif: 'Fraunces, Georgia, serif',
}

// Reusable text style objects
export const TEXT = {
  productLabel: {
    fontFamily: FONTS.mono,
    fontSize: '11px',
    fontWeight: 600,
    color: COLORS.teal,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
  sectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: '9px',
    fontWeight: 600,
    color: COLORS.teal,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
  },
  cxoQuestion: {
    fontFamily: FONTS.serif,
    fontSize: '28px',
    fontWeight: 500,
    color: COLORS.textPrimary,
    lineHeight: 1.3,
  },
  metricValue: {
    fontFamily: FONTS.serif,
    fontSize: '24px',
    fontWeight: 500,
    color: COLORS.textPrimary,
  },
  metricLabel: {
    fontFamily: FONTS.mono,
    fontSize: '9px',
    fontWeight: 600,
    color: COLORS.teal,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
  },
  body: {
    fontFamily: FONTS.sans,
    fontSize: '13px',
    color: COLORS.textSecondary,
    lineHeight: 1.6,
  },
  bodyPrimary: {
    fontFamily: FONTS.sans,
    fontSize: '14px',
    color: COLORS.textPrimary,
    lineHeight: 1.6,
  },
}

// Reusable component style objects
export const COMPONENTS = {
  page: {
    minHeight: '100vh',
    background: COLORS.pageBg,
    fontFamily: FONTS.sans,
    color: COLORS.textPrimary,
  },
  card: {
    background: COLORS.cardBg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '8px',
    padding: '20px',
  },
  cardElevated: {
    background: COLORS.cardBg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '12px',
    padding: '24px',
  },
  tealButton: {
    background: COLORS.teal,
    color: COLORS.pageBg,
    border: 'none',
    borderRadius: '6px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: FONTS.sans,
    cursor: 'pointer',
  },
  ghostButton: {
    background: 'transparent',
    color: COLORS.textPrimary,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '6px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 500,
    fontFamily: FONTS.sans,
    cursor: 'pointer',
  },
  input: {
    background: COLORS.cardBg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '6px',
    padding: '10px 14px',
    fontSize: '14px',
    fontFamily: FONTS.sans,
    color: COLORS.textPrimary,
    outline: 'none',
  },
  divider: {
    borderTop: `1px solid ${COLORS.border}`,
  },
}

// Chart color palette for data series
export const CHART_COLORS = [
  COLORS.teal,
  '#6366F1', // indigo
  COLORS.amber,
  COLORS.green,
  COLORS.red,
  '#8B5CF6', // purple
  '#EC4899', // pink
]

/**
 * Generate SVG polyline points string from data array
 * @param data — array of numeric values
 * @param width — SVG viewport width in px
 * @param height — SVG viewport height in px
 */
export function createSparklinePoints(
  data: number[],
  width: number,
  height: number
): string {
  if (!data || data.length < 2) return ''
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const stepX = width / (data.length - 1)
  const pad = height * 0.1
  return data
    .map((v, i) => {
      const x = i * stepX
      const y = height - pad - ((v - min) / range) * (height - pad * 2)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

/**
 * Return a severity color based on comparison to benchmark
 * @param actual — the actual value
 * @param benchmark — the target / baseline value
 * @param direction — 'up-good': higher is better; 'down-good': lower is better
 */
export function severityColor(
  actual: number,
  benchmark: number,
  direction: 'up-good' | 'down-good'
): string {
  const ratio = benchmark !== 0 ? actual / benchmark : 1
  if (direction === 'up-good') {
    if (ratio >= 0.9) return COLORS.teal
    if (ratio >= 0.7) return COLORS.amber
    return COLORS.red
  } else {
    if (ratio <= 1.1) return COLORS.teal
    if (ratio <= 1.3) return COLORS.amber
    return COLORS.red
  }
}
