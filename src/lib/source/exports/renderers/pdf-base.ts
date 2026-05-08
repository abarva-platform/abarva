// Source · pdf renderer base styles
//
// Shared style tokens + StyleSheet for every Source PDF renderer.
// Mirrors the docx-base / xlsx-base pattern. Uses @react-pdf/renderer's
// StyleSheet API (Flexbox-like; not full CSS).
//
// Brand parity: same color palette + typography intent as the docx and
// HTML renderers. @react-pdf only ships built-in fonts (Helvetica /
// Times / Courier); registering AbarVa display fonts (DM Sans / Georgia)
// would require shipping font files. For v1 we use the closest built-in
// matches:
//   - Body: Helvetica (DM Sans equivalent — clean sans)
//   - Display: Times-Roman (Georgia equivalent — serif)
//   - Mono: Courier
//
// A future slice can register actual AbarVa font files via Font.register
// for closer brand fidelity once we have them deployed.

import 'server-only';

import { StyleSheet } from '@react-pdf/renderer';

export const PDF_COLORS = {
  /** AbarVa ink (deep navy). */
  HEADER: '#0C1A3A',
  /** AbarVa muted text. */
  MUTED: '#706D66',
  /** Sentinel teal accent. */
  ACCENT: '#2DD4C8',
  /** Soft amber for callouts. */
  WARNING: '#F4B400',
  /** Cream / page bg. */
  BG: '#F8F7F4',
  /** Soft surface (list bg, code bg). */
  SOFT: '#F4F2EC',
  /** Rule color. */
  RULE: '#D8D5CC',
} as const;

export const PDF_FONTS = {
  BODY: 'Helvetica',
  BODY_BOLD: 'Helvetica-Bold',
  BODY_ITALIC: 'Helvetica-Oblique',
  DISPLAY: 'Times-Roman',
  DISPLAY_BOLD: 'Times-Bold',
  MONO: 'Courier',
} as const;

export const PDF_STYLES = StyleSheet.create({
  // Page-level
  page: {
    backgroundColor: PDF_COLORS.BG,
    padding: 48,
    fontFamily: PDF_FONTS.BODY,
    fontSize: 10,
    color: PDF_COLORS.HEADER,
    lineHeight: 1.45,
  },
  // Cover
  eyebrow: {
    fontSize: 8,
    fontFamily: PDF_FONTS.BODY_BOLD,
    color: PDF_COLORS.MUTED,
    letterSpacing: 1.2,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 22,
    fontFamily: PDF_FONTS.DISPLAY,
    color: PDF_COLORS.HEADER,
    marginBottom: 12,
  },
  meta: {
    fontSize: 10,
    color: PDF_COLORS.MUTED,
    marginBottom: 4,
  },
  scaffoldWarning: {
    backgroundColor: '#FBEFC4',
    borderColor: PDF_COLORS.WARNING,
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    marginTop: 12,
    marginBottom: 6,
    fontSize: 9,
    color: '#5B3F00',
  },
  divider: {
    borderBottomColor: PDF_COLORS.RULE,
    borderBottomWidth: 1,
    marginVertical: 16,
  },
  // Body
  h1: {
    fontSize: 16,
    fontFamily: PDF_FONTS.BODY_BOLD,
    color: PDF_COLORS.HEADER,
    marginTop: 16,
    marginBottom: 8,
  },
  h2: {
    fontSize: 13,
    fontFamily: PDF_FONTS.BODY_BOLD,
    color: PDF_COLORS.HEADER,
    marginTop: 14,
    marginBottom: 6,
  },
  h3: {
    fontSize: 11,
    fontFamily: PDF_FONTS.BODY_BOLD,
    color: PDF_COLORS.HEADER,
    marginTop: 12,
    marginBottom: 4,
  },
  body: {
    fontSize: 10,
    color: PDF_COLORS.HEADER,
    marginBottom: 6,
    lineHeight: 1.5,
  },
  hr: {
    borderBottomColor: PDF_COLORS.RULE,
    borderBottomWidth: 1,
    marginVertical: 12,
  },
  // Lists
  list: {
    marginVertical: 6,
    marginLeft: 4,
  },
  listNested: {
    marginLeft: 16,
    marginVertical: 4,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  listMarker: {
    width: 14,
    fontSize: 10,
    color: PDF_COLORS.MUTED,
  },
  listItemBody: {
    flex: 1,
  },
  listItemText: {
    fontSize: 10,
    color: PDF_COLORS.HEADER,
    lineHeight: 1.45,
  },
  // Block quote
  blockquote: {
    borderLeftColor: PDF_COLORS.ACCENT,
    borderLeftWidth: 2,
    paddingLeft: 10,
    paddingVertical: 4,
    marginVertical: 8,
    backgroundColor: PDF_COLORS.SOFT,
  },
  blockquoteText: {
    fontSize: 9,
    fontFamily: PDF_FONTS.BODY_ITALIC,
    color: PDF_COLORS.MUTED,
  },
  // Code block
  codeBlock: {
    backgroundColor: PDF_COLORS.SOFT,
    borderLeftColor: PDF_COLORS.RULE,
    borderLeftWidth: 2,
    padding: 8,
    marginVertical: 6,
    borderRadius: 3,
  },
  codeBlockText: {
    fontFamily: PDF_FONTS.MONO,
    fontSize: 8,
    color: '#383530',
    lineHeight: 1.35,
  },
  // Tables
  table: {
    marginVertical: 8,
    borderColor: PDF_COLORS.RULE,
    borderWidth: 1,
    borderRadius: 2,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: PDF_COLORS.HEADER,
  },
  tableRow: {
    flexDirection: 'row',
    borderTopColor: PDF_COLORS.RULE,
    borderTopWidth: 0.5,
  },
  tableHeaderCell: {
    flex: 1,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  tableCell: {
    flex: 1,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  tableHeaderText: {
    color: '#FAF7F1',
    fontFamily: PDF_FONTS.BODY_BOLD,
    fontSize: 9,
  },
  tableCellText: {
    color: PDF_COLORS.HEADER,
    fontSize: 9,
  },
  // Page header / footer
  pageHeader: {
    position: 'absolute',
    top: 20,
    left: 48,
    right: 48,
    fontSize: 8,
    color: PDF_COLORS.MUTED,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pageFooter: {
    position: 'absolute',
    bottom: 20,
    left: 48,
    right: 48,
    fontSize: 8,
    color: PDF_COLORS.MUTED,
    fontFamily: PDF_FONTS.BODY_ITALIC,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

/** PDF MIME (Adobe). */
export const PDF_CONTENT_TYPE = 'application/pdf';
