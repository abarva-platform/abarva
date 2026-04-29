/**
 * EvidenceQualityChip — surfaces an aggregate quality grade for an
 * instance's evidence array as a small inline pill, matching the AbarVa
 * shell-token palette.
 *
 * Server-friendly (no client-only hooks, no event handlers); the tooltip
 * uses the native `title` attribute so it works in SSR-rendered detail
 * pages without hydration cost.
 *
 * Pairs with `summarizeEvidenceQuality` from
 * `@/lib/reasoning/evidence-quality`. The caller passes the summary plus an
 * optional grade hint (computed via `summaryGrade`) so the chip can render
 * "Avg quality: fair · 12 strong / 5 fair / 3 weak" without re-running the
 * scorer in the component.
 */

import { SHELL } from '@/lib/shell/shell-tokens';
import type {
  EvidenceQualityGrade,
  EvidenceQualitySummary,
} from '@/lib/reasoning/evidence-quality';

export interface EvidenceQualityChipProps {
  summary: EvidenceQualitySummary;
  /** Optional pre-computed grade. Falls back to bucket derived from `mean`. */
  grade?: EvidenceQualityGrade;
  /**
   * Optional reasons (e.g. for a single-item rendering). When provided, they
   * extend the tooltip alongside the summary breakdown.
   */
  reasons?: string[];
}

/** Token resolution — keeps colour decisions in one place. */
function paletteFor(grade: EvidenceQualityGrade): {
  border: string;
  background: string;
  text: string;
  dot: string;
  label: string;
} {
  switch (grade) {
    case 'strong':
      return {
        border: SHELL.MINT_LINE,
        background: SHELL.MINT_BG,
        text: SHELL.MINT_TEXT,
        dot: SHELL.MINT_TEXT,
        label: 'strong',
      };
    case 'fair':
      return {
        border: SHELL.PEACH_LINE,
        background: SHELL.PEACH_BG,
        text: SHELL.PEACH_TEXT,
        dot: SHELL.AMBER_DOT,
        label: 'fair',
      };
    case 'weak':
    default:
      return {
        border: SHELL.AMBER_DOT,
        background: SHELL.RUST_BG,
        text: SHELL.RUST_TEXT,
        dot: SHELL.RUST_TEXT,
        label: 'weak',
      };
  }
}

function deriveGrade(mean: number): EvidenceQualityGrade {
  if (mean < 0.4) return 'weak';
  if (mean < 0.7) return 'fair';
  return 'strong';
}

export function EvidenceQualityChip({ summary, grade, reasons }: EvidenceQualityChipProps) {
  if (summary.total === 0) return null;
  const resolvedGrade = grade ?? deriveGrade(summary.mean);
  const palette = paletteFor(resolvedGrade);

  const meanPct = Math.round(summary.mean * 100);

  const tooltipLines = [
    `Avg quality: ${palette.label} (${meanPct}%)`,
    `${summary.strongCount} strong · ${summary.fairCount} fair · ${summary.weakCount} weak`,
    `Total items: ${summary.total}`,
  ];
  if (reasons && reasons.length > 0) {
    tooltipLines.push('—');
    tooltipLines.push(...reasons);
  }
  const tooltip = tooltipLines.join('\n');

  return (
    <span
      data-testid="evidence-quality-chip"
      data-grade={resolvedGrade}
      title={tooltip}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 10px',
        borderRadius: 999,
        border: `1px solid ${palette.border}`,
        background: palette.background,
        fontFamily: SHELL.SANS,
        fontSize: 11,
        color: palette.text,
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        aria-hidden
        style={{
          display: 'inline-block',
          width: 6,
          height: 6,
          borderRadius: 999,
          background: palette.dot,
        }}
      />
      <span style={{ fontWeight: 600 }}>
        Evidence quality: {palette.label}
      </span>
      <span
        data-testid="evidence-quality-chip-counts"
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: '0.04em',
          color: palette.text,
          background: SHELL.CARD_WHITE,
          border: `1px solid ${palette.border}`,
          borderRadius: 999,
          padding: '1px 6px',
        }}
      >
        {summary.strongCount}/{summary.fairCount}/{summary.weakCount}
      </span>
    </span>
  );
}
