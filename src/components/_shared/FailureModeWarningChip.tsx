/**
 * FailureModeWarningChip — REASON-29
 *
 * Surfaces a high-confidence failure-mode detection as a small amber pill in
 * the page header area, so the warning is visible without scrolling to the
 * provenance ribbon.
 *
 * Pure presentation: when there is no top label or no high-confidence
 * detection, the component renders nothing. Inputs come from
 * `summarizeFailureModes(context)` plus the top detection's mitigations.
 */

import { SHELL } from '@/lib/shell/shell-tokens';

export interface FailureModeWarningChipProps {
  /** Label of the highest-confidence failure-mode detection, or `null`. */
  topLabel: string | null;
  /** Confidence of the top detection (0..1). */
  topConfidence: number;
  /** Number of detections with confidence ≥ 0.6. */
  highCount: number;
  /** Mitigation strings authored by the pattern writer for the top detection. */
  mitigations?: string[];
}

export function FailureModeWarningChip({
  topLabel,
  topConfidence,
  highCount,
  mitigations,
}: FailureModeWarningChipProps) {
  if (topLabel === null || highCount === 0) return null;

  const confidencePct = Math.round(topConfidence * 100);
  const topMitigation = mitigations && mitigations[0] ? mitigations[0] : 'see pattern doctrine';
  const tooltip = `Top mitigation: ${topMitigation}`;

  return (
    <span
      data-testid="failure-mode-warning-chip"
      title={tooltip}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 10px',
        borderRadius: 999,
        border: `1px solid ${SHELL.AMBER_DOT}`,
        background: `${SHELL.PEACH_BG}99`,
        fontFamily: SHELL.SANS,
        fontSize: 11,
        color: SHELL.RUST_TEXT,
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
      }}
    >
      {/* Warning glyph — small triangle */}
      <span
        aria-hidden
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 10,
          color: SHELL.AMBER_DOT,
          lineHeight: 1,
        }}
      >
        ▲
      </span>
      <span style={{ fontWeight: 600 }}>
        Failure mode risk: {topLabel}
      </span>
      <span
        data-testid="failure-mode-warning-chip-confidence"
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: '0.04em',
          color: SHELL.AMBER_DOT,
          background: SHELL.CARD_WHITE,
          border: `1px solid ${SHELL.AMBER_DOT}`,
          borderRadius: 999,
          padding: '1px 6px',
        }}
      >
        {confidencePct}%
      </span>
    </span>
  );
}
