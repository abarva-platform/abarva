// AbarVa brand tokens
// Locked: April 28, 2026
// Source of truth for all brand color references across product, public site, mobile, and corpus.

export const BrandColors = {
  // Primary brand
  inkBlack: '#000000',          // wordmark "Abar", body text, primary headings
  signalBlue: '#0066CC',        // wordmark "Va", links, primary action, brand highlights
  paper: '#faf7f1',             // app background, cards, public site canvas

  // Supporting palette
  navyInk: '#0c1a3a',           // AgentColumn, dark variants, navy backgrounds
  stone: '#888780',             // borders, dividers, secondary text
  slate: '#5F5E5A',             // body text on paper, captions
} as const;

export const BrandColorsRGB = {
  inkBlack: 'rgb(0, 0, 0)',
  signalBlue: 'rgb(0, 102, 204)',
  paper: 'rgb(250, 247, 241)',
  navyInk: 'rgb(12, 26, 58)',
  stone: 'rgb(136, 135, 128)',
  slate: 'rgb(95, 94, 90)',
} as const;

export const BrandTypography = {
  serif: 'Fraunces, Georgia, "Times New Roman", serif',  // headlines, editorial, paper aesthetic
  sans: 'Inter, -apple-system, system-ui, sans-serif',    // body, UI, microcopy
  mono: 'JetBrains Mono, ui-monospace, Menlo, monospace', // code, IDs, hex values
} as const;

export const BrandSpacing = {
  // Logo clear-space rule: equal to half the cap height of "A" in the wordmark
  logoClearSpace: '0.5em',
  // Minimum logo sizes
  logoMinWidthWeb: '96px',
  logoMinWidthPrint: '24mm',
} as const;

export type BrandColorKey = keyof typeof BrandColors;

// Convenience exports for the AppShell tokens file
// (use these in src/lib/shell/shell-tokens.ts)
export const BrandTokens = {
  colors: BrandColors,
  colorsRgb: BrandColorsRGB,
  typography: BrandTypography,
  spacing: BrandSpacing,
} as const;

export default BrandTokens;
