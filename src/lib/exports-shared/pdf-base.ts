// exports-shared · @react-pdf base primitives.
//
// StyleSheet definitions and color tokens for @react-pdf/renderer.
// Zero coupling to any product module — may be imported by
// programs/exports, moves/exports, or any future module that generates PDF.
//
// PDF renderers are deferred to EXPORT-5 (per DELIVERABLE_EXPORT_DESIGN.md).
// This module establishes the shared foundation so all PDF renderers share
// a single token source. Added in the journey-kit-phase3 wave.
//
// @react-pdf/renderer is installed when PDF support ships (EXPORT-5).
// The StyleSheet stub below satisfies the type system until then.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let StyleSheet: { create: (styles: Record<string, Record<string, any>>) => Record<string, Record<string, any>> };
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  StyleSheet = require('@react-pdf/renderer').StyleSheet;
} catch {
  // @react-pdf/renderer not yet installed; provide a pass-through stub so
  // this module can be imported without error at type-check and test time.
  StyleSheet = {
    create: <T extends Record<string, Record<string, unknown>>>(styles: T): T => styles,
  };
}

// ── Color tokens ─────────────────────────────────────────────────────────

/** Color palette matching the AbarVa design system. */
export const PDF_COLORS = {
  /** Near-black background and foreground text. */
  ink: '#0A0A0A',
  /** Warm off-white page background. */
  pageBg: '#F8F7F4',
  /** Near-white text on dark headers. */
  headerText: '#F5F5F0',
  /** Accent teal. */
  accent: '#2DD4C8',
  /** Muted warm grey for secondary text. */
  muted: '#706D66',
  /** Amber for warnings/contradictions. */
  amber: '#B45309',
  /** Soft yellow for contradiction rows. */
  contradictionBg: '#FFFBDB',
  /** Light grey for alternating row bands. */
  bandBg: '#F8F7F4',
  /** White. */
  white: '#FFFFFF',
} as const;

// ── Typography tokens ────────────────────────────────────────────────────

/** Font sizes (in pt) matching the docx-base scale. */
export const PDF_FONT_SIZES = {
  title: 22,
  subtitle: 12,
  sectionHeading: 15,
  subsectionHeading: 12,
  body: 11,
  small: 9,
  table: 10,
} as const;

// ── StyleSheet ───────────────────────────────────────────────────────────

/**
 * Canonical @react-pdf StyleSheet.
 *
 * Renderers import this and reference style keys by name, matching the
 * helper function names in docx-base.ts for conceptual parity.
 */
export const styles = StyleSheet.create({
  page: {
    backgroundColor: PDF_COLORS.pageBg,
    paddingTop: 48,
    paddingBottom: 48,
    paddingLeft: 56,
    paddingRight: 56,
    fontFamily: 'Helvetica',
  },

  // Cover page
  titleHeading: {
    fontSize: PDF_FONT_SIZES.title,
    fontWeight: 'bold',
    color: PDF_COLORS.ink,
    marginBottom: 8,
  },
  subtitleParagraph: {
    fontSize: PDF_FONT_SIZES.subtitle,
    fontStyle: 'italic',
    color: PDF_COLORS.muted,
    marginBottom: 6,
  },
  tenantKey: {
    fontSize: PDF_FONT_SIZES.small,
    color: PDF_COLORS.muted,
    fontFamily: 'Courier',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: PDF_FONT_SIZES.small,
    fontStyle: 'italic',
    color: PDF_COLORS.muted,
    marginBottom: 16,
  },
  gateBanner: {
    fontSize: 11,
    fontWeight: 'bold',
    color: PDF_COLORS.ink,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: PDF_COLORS.ink,
    paddingTop: 6,
    paddingBottom: 6,
    marginBottom: 24,
  },

  // Body
  sectionHeading: {
    fontSize: PDF_FONT_SIZES.sectionHeading,
    fontWeight: 'bold',
    color: PDF_COLORS.ink,
    marginTop: 18,
    marginBottom: 6,
  },
  subsectionHeading: {
    fontSize: PDF_FONT_SIZES.subsectionHeading,
    fontWeight: 'bold',
    color: PDF_COLORS.ink,
    marginTop: 12,
    marginBottom: 4,
  },
  bodyParagraph: {
    fontSize: PDF_FONT_SIZES.body,
    color: PDF_COLORS.ink,
    lineHeight: 1.5,
    marginBottom: 6,
  },
  italicParagraph: {
    fontSize: PDF_FONT_SIZES.body,
    fontStyle: 'italic',
    color: PDF_COLORS.ink,
    lineHeight: 1.5,
    marginBottom: 6,
  },
  bulletItem: {
    fontSize: PDF_FONT_SIZES.body,
    color: PDF_COLORS.ink,
    marginLeft: 12,
    marginBottom: 3,
  },
  labeledLine: {
    fontSize: PDF_FONT_SIZES.body,
    color: PDF_COLORS.ink,
    marginBottom: 3,
  },

  // Tables
  tableHeaderCell: {
    backgroundColor: PDF_COLORS.ink,
    color: PDF_COLORS.headerText,
    fontSize: PDF_FONT_SIZES.table,
    fontWeight: 'bold',
    padding: 4,
    flex: 1,
  },
  tableDataCell: {
    fontSize: PDF_FONT_SIZES.table,
    color: PDF_COLORS.ink,
    padding: 4,
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderColor: '#D0CEC9',
  },
  tableBandedRow: {
    flexDirection: 'row',
    backgroundColor: PDF_COLORS.bandBg,
    borderBottomWidth: 0.5,
    borderColor: '#D0CEC9',
  },
});
