/**
 * Setup-scoped AbarVa canon design tokens.
 *
 * Sourced from `Setup Admin · Module.html` design handoff (Claude Design,
 * 2026-05-07 chat). Per design chat: "i JUST NEED THE COLOR SCHEME/FONT
 * TO BE CHANGED FOR SETUP. THE LAYOUT/DESIGN CAN BE OPTIMIZED FOR
 * ELEGANCE."
 *
 * Scoped to the Setup section (Overview / Data Trust / Connectors /
 * Users & Access / Agent Readiness / Production Readiness) so the
 * canon refresh doesn't bleed into Source / Tower / Intelligence /
 * Moves which are designed against the existing COLORS/SHELL tokens.
 *
 * Tokens locked: never alter without explicit instruction.
 * Updated 2026-05-07: white background approved by user; DM Sans → Inter globally.
 */

export const SETUP = {
  // ── Surface ─────────────────────────────────────────────
  paper: '#ffffff',         // white — page background (user-approved 2026-05-07)
  paperSoft: '#fafafa',     // near-white — subtle content lift
  cardWhite: '#ffffff',     // canon-bg-surface — primary card
  cardLine: '#e5e5e5',      // neutral hairline on white
  cardLineStrong: '#d0d0d0',
  grayBg: '#f4f4f4',

  // ── Ink ─────────────────────────────────────────────────
  ink: '#000000',           // abarva-ink-black — primary text
  inkSoft: '#2a2a28',
  inkMuted: '#5F5E5A',      // abarva-slate
  inkFaint: '#888780',      // abarva-stone

  // ── Brand accents ───────────────────────────────────────
  navy: '#0c1a3a',          // abarva-navy-ink
  navySoft: 'rgba(12,26,58,0.08)',
  signal: '#0066CC',        // abarva-signal-blue — page eyebrow
  skyPale: '#eef3fb',

  // ── Status (canon teal / amber / red) ──────────────────
  mint: '#1d9e75',          // canon-teal — Decision-grade / Ready / Loaded
  mintSoft: '#e3f2eb',
  amber: '#ba7517',         // canon-amber — Partial / Drafting
  amberSoft: '#f7ecd8',
  coral: '#a32d2d',         // canon-red — Empty / Blocked / High-severity
  coralSoft: '#f5dedb',

  // ── Type ────────────────────────────────────────────────
  serif: '"Fraunces", Georgia, "Times New Roman", serif',
  sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
} as const;

/**
 * Display-heading sizes from the Setup design HTML.
 *
 * Page-head H1 — `38px / Fraunces 500 / -0.022em`.
 * Card H2 — `19px / Fraunces 500 / -0.012em`.
 * Tile val — `28px / Fraunces 500 / -0.022em`.
 * Steward editorial body — `17px / Fraunces 400 / -0.005em`.
 */
export const SETUP_TYPE = {
  pageEyebrow: {
    fontFamily: SETUP.mono,
    fontSize: '10.5px',
    fontWeight: 600,
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    color: SETUP.signal,
  },
  pageH1: {
    fontFamily: SETUP.serif,
    fontSize: '38px',
    fontWeight: 500,
    letterSpacing: '-0.022em',
    lineHeight: 1.08,
    color: SETUP.ink,
    margin: 0,
  },
  pageLede: {
    fontFamily: SETUP.sans,
    fontSize: '14px',
    color: SETUP.inkSoft,
    lineHeight: 1.55,
    margin: 0,
    maxWidth: '640px',
  },
  cardH2: {
    fontFamily: SETUP.serif,
    fontSize: '19px',
    fontWeight: 500,
    letterSpacing: '-0.012em',
    color: SETUP.ink,
    margin: 0,
  },
  cardMeta: {
    fontFamily: SETUP.mono,
    fontSize: '11px',
    color: SETUP.inkMuted,
    margin: 0,
  },
  tileLabel: {
    fontFamily: SETUP.mono,
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: SETUP.inkMuted,
    margin: 0,
  },
  tileValue: {
    fontFamily: SETUP.serif,
    fontSize: '28px',
    fontWeight: 500,
    letterSpacing: '-0.022em',
    lineHeight: 1.05,
    color: SETUP.ink,
    margin: 0,
  },
  bodySerif: {
    fontFamily: SETUP.serif,
    fontWeight: 400,
    fontSize: '17px',
    lineHeight: 1.55,
    letterSpacing: '-0.005em',
    color: SETUP.ink,
  },
  bodySans: {
    fontFamily: SETUP.sans,
    fontSize: '13px',
    color: SETUP.inkSoft,
    lineHeight: 1.5,
  },
} as const;

export const SETUP_RADIUS = {
  sm: '6px',
  md: '10px',
  lg: '12px',
  pill: '999px',
} as const;
