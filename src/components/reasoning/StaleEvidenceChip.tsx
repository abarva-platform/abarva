/**
 * StaleEvidenceChip — amber warning pill for evidence items older than a
 * configurable threshold (default 90 days).
 *
 * Server-friendly: no hooks, no event handlers. Renders nothing when the date
 * is missing, unparseable, or within the freshness window.
 *
 * Pairs with `EvidenceQualityChip` — place it inline after the quality chip
 * so users see "Evidence quality: fair  ⚠ Stale (128d)" at a glance.
 */

import { SHELL } from '@/lib/shell/shell-tokens';

export interface StaleEvidenceChipProps {
  date: string | Date | null | undefined;
  /** Days before an item is considered stale. Defaults to 90. */
  thresholdDays?: number;
}

const DEFAULT_THRESHOLD_DAYS = 90;

function ageInDays(date: string | Date): number | null {
  const ts = typeof date === 'string' ? Date.parse(date) : date.getTime();
  if (!Number.isFinite(ts)) return null;
  const nowMs = Date.now();
  const diffMs = nowMs - ts;
  if (diffMs < 0) return null; // future date — not stale
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function StaleEvidenceChip({
  date,
  thresholdDays = DEFAULT_THRESHOLD_DAYS,
}: StaleEvidenceChipProps) {
  if (date === null || date === undefined) return null;

  const days = ageInDays(date);
  if (days === null || days < thresholdDays) return null;

  const tooltip = `Evidence is ${days} days old (threshold: ${thresholdDays} days). Older evidence may no longer reflect current state.`;

  return (
    <span
      data-testid="stale-evidence-chip"
      data-age-days={days}
      title={tooltip}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 9px',
        borderRadius: 999,
        border: `1px solid ${SHELL.AMBER_DOT}`,
        background: SHELL.PEACH_BG,
        fontFamily: SHELL.SANS,
        fontSize: 11,
        color: SHELL.PEACH_TEXT,
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
      }}
    >
      <span aria-hidden>⚠</span>
      <span style={{ fontWeight: 600 }}>
        Stale ({days}d)
      </span>
    </span>
  );
}
