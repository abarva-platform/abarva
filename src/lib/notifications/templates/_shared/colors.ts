/**
 * W4-PR-6 · Email template palette.
 *
 * Locked AbarVa design system tokens — these MUST match the in-app
 * canonical palette referenced in `design_system.md`. Do NOT introduce
 * new colors without explicit founder approval.
 *
 * Email clients require inline styles, so every template imports these
 * tokens and inlines them at render time. There are no `<style>` blocks
 * in any email body.
 */

export const COLORS = {
  /** Locked cream paper background. */
  cream: '#F8F7F4',
  /** Slightly cooler paper used for footer + meta blocks. */
  paperSoft: '#F1EFE8',
  /** Border / divider on paper. */
  border: '#E5E1D8',
  /** Primary ink — body copy, headings, button background. */
  ink: '#1A1A1A',
  /** Secondary ink — meta + footer copy. */
  inkMuted: '#5B6C8A',
  /** Accent — caution / attention severity. */
  amber: '#B8772A',
  /** Accent — failure / critical severity. */
  red: '#A23A2E',
  /** Accent — success / advancement. */
  teal: '#1F6E63',
} as const;

/**
 * Font stacks — Georgia for serif display, DM Sans for body, mono for
 * code-like fragments (event ids, timestamps).
 *
 * Email clients ignore @font-face from Google Fonts in most cases
 * (Outlook desktop, Apple Mail in dark mode, Gmail mobile). Always
 * provide a system-safe fallback first in the stack so the locked look
 * still reads on every client.
 */
export const FONTS = {
  serif: "Georgia, 'Times New Roman', Times, serif",
  sans:
    "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  mono: "'JetBrains Mono', 'SF Mono', Menlo, Monaco, Consolas, monospace",
} as const;

/**
 * Optional @import block — kept in a constant so templates can include
 * it in `<head>` as a progressive enhancement. Mail clients that strip
 * `<style>` blocks (most of them) still render fine because every
 * element inlines a complete fallback stack.
 *
 * NOTE: Templates DO NOT inject a `<style>` block. The shape test
 * asserts no `<style>` tag is present anywhere in the rendered output.
 * This constant is documentation-grade only and intentionally unused.
 */
export const FONT_IMPORT_HREF =
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap';
