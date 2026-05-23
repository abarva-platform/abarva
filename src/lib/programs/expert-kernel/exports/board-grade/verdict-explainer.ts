// Verdict-explainer chip — board-grade decks.
//
// Pilot rehearsal log item P2-3: when the deterministic kernel produces a
// non-`fund` / non-`go` verdict on a thin Move (sparse baseline metrics,
// seed-gapped monetisation), the verdict word alone — KILL, RESHAPE, HOLD,
// NO-GO — leaves a first-time reader asking "why?". The kernel knows. It just
// hadn't surfaced the dominant cause in a single short line near the verdict.
//
// This module closes that gap. `dominantVerdictCause(skeleton, binding,
// verdictOverride?)` reads the kernel's already-structured fields — the
// recommendation, `economics.monetisable` / `monetisationBlocked`, the critic
// blockers, the kill criteria, the baseline coverage / seed gaps — and picks
// the single dominant cause. It returns a short chip line that traces directly
// to those fields (no fabrication, no "the model thinks…" copy).
//
// HONESTY DISCIPLINE (mandatory):
//   • Every chip line is grounded in a real kernel field. If no single
//     dominant cause exists but the verdict is non-`fund`/`go`, the chip is the
//     honest "Multiple blockers (see Evidence & Gaps section)" — never an
//     invented reason.
//   • The chip is a UI element only. It does NOT alter the verdict, the
//     kernel logic, or any planning-range / figure. The verdict word still
//     comes from `skeleton.recommendation`.
//
// Pure module: deterministic, no I/O. Same skeleton → same chip.

import type { BusinessCaseSkeleton } from '../../business-case-compiler';
import type { FunctionPackBinding } from '../../domain/function-pack-context-binding';
import { escapeHtml } from './deck-shell';

// ---------------------------------------------------------------------------
// Public chip contract.
// ---------------------------------------------------------------------------

/**
 * A verdict-explainer chip — the single short line that explains a non-fund /
 * non-go kernel verdict to a first-time reader.
 *
 * `severity` is the rendered verdict label the chip is explaining (the chip's
 * tone is keyed off it). `chipText` is the dominant-cause line, capped short.
 */
export interface VerdictExplainerChip {
  /** The dominant-cause one-liner — traces to a real kernel field. */
  chipText: string;
  /** The verdict severity the chip is explaining — keys the chip's tone. */
  severity: 'kill' | 'no-go' | 'hold' | 'shape';
}

/**
 * The verdict-explainer accepts the kernel's native `Recommendation`
 * (`fund` / `shape` / `kill`) or, for the Mobilize go-decision deck, the
 * go-verdict (`go` / `conditional_go` / `no_go`). The resolver maps either
 * onto the chip's `severity` field.
 */
export type ExplainerVerdict =
  | 'fund'
  | 'shape'
  | 'kill'
  | 'go'
  | 'conditional_go'
  | 'no_go'
  // Discover Brief uses `reshape` / `no-go` (hyphen) for the same shape/kill
  // verdict; accept both forms so the resolver covers every renderer.
  | 'reshape'
  | 'no-go'
  // Solution Architecture uses `conditional` / `hold` for the shape/kill
  // equivalents on the architecture-gate deck.
  | 'conditional'
  | 'hold';

/**
 * Resolve the dominant cause for a non-fund / non-go kernel verdict and
 * return the explainer chip.
 *
 * Returns `null` when the verdict is `fund` or `go` — those verdicts need no
 * explainer chip. Returns the chip otherwise. Every code path maps the chip
 * text to a kernel field — never an invented reason.
 *
 * `verdictOverride` is the renderer-side verdict word (e.g. Mobilize uses
 * `MoveGoVerdict`); when omitted the resolver reads `skeleton.recommendation`
 * directly.
 *
 * Pure and deterministic.
 */
export function dominantVerdictCause(
  skeleton: BusinessCaseSkeleton,
  binding: FunctionPackBinding,
  verdictOverride?: ExplainerVerdict,
): VerdictExplainerChip | null {
  const verdict: ExplainerVerdict =
    verdictOverride ?? skeleton.recommendation;

  // `fund` / `go` — the kernel cleared the case. No chip needed.
  if (verdict === 'fund' || verdict === 'go') return null;

  const severity = severityFor(verdict);

  // Cause ordering matters — the first matching cause is the dominant cause.
  // Order = strongest signal first, so a thin Move's seed-gap blocker doesn't
  // get masked by a generic "downside negative" line.
  //
  // 1. Monetisation blocked — the kernel's CFO blocker; the planning-range
  //    proxy cannot be turned into a hard dollar return.
  if (!skeleton.economics.monetisable) {
    return {
      chipText: 'Seed gap blocks monetisation — value rests on a planning-range proxy until the missing unit economics are supplied.',
      severity,
    };
  }

  // 2. Critic blocker — the kernel surfaced an explicit funding-blocking
  //    finding. Use its message (truncated) so the chip text is the kernel's
  //    own words, not a paraphrase.
  const firstBlocker = skeleton.critic.blockers[0];
  if (firstBlocker) {
    return {
      chipText: `Critic blocker · ${truncate(firstBlocker.message, 180)}`,
      severity,
    };
  }

  // 3. Base-case net return non-positive — the kernel's "kill, does not pay
  //    back" path. Surfaced before baseline coverage because it is the most
  //    direct economic blocker.
  if (skeleton.economics.netReturn.point <= 0) {
    return {
      chipText: 'Base-case net return is not positive — the Move does not pay back on current assumptions.',
      severity,
    };
  }

  // 4. Baseline coverage insufficient — the binding's expected metrics aren't
  //    sufficiently recorded. The exact seed-gap count is the kernel's own
  //    `baseline.seedGaps`; the binding carries the precise gap statements.
  const seedGapCount = skeleton.baseline.seedGaps.length;
  if (seedGapCount > 0) {
    // Use the binding's first precise seed-gap metric name when available; it
    // is the function-pack-grounded label for the gap.
    const firstGap =
      binding.seedGaps[0]?.metricName ??
      skeleton.baseline.seedGaps[0]?.label ??
      'an expected operating metric';
    const coverage = Math.round(skeleton.baseline.coverage * 100);
    return {
      chipText:
        `Baseline coverage insufficient (${coverage}% of expected metrics ` +
        `recorded) — ${seedGapCount} seed gap${seedGapCount === 1 ? '' : 's'} ` +
        `including "${truncate(firstGap, 80)}".`,
      severity,
    };
  }

  // 5. Downside exposed or multiple concerns — the kernel's "shape to protect
  //    the floor" path. A precise statement names the downside number when
  //    available; the kernel exposes it on `economics.netReturn.low`.
  if (skeleton.economics.netReturn.low < 0) {
    return {
      chipText: 'Downside net return is negative — the case does not hold in the conservative scenario.',
      severity,
    };
  }
  if (skeleton.critic.concerns.length >= 3) {
    return {
      chipText:
        `Critic raised ${skeleton.critic.concerns.length} concerns — shape ` +
        'the Move to address them before funding.',
      severity,
    };
  }

  // 6. A kill criterion fired — surface the named criterion when one exists.
  const namedKill = skeleton.killCriteria[0];
  if (namedKill) {
    return {
      chipText: `Kill criterion · ${truncate(namedKill.condition, 180)}`,
      severity,
    };
  }

  // 7. Honest catch-all — no single dominant cause but the verdict is still
  //    non-fund / non-go. Point the reader at the existing gaps section.
  return {
    chipText: 'Multiple blockers (see Evidence & Gaps section).',
    severity,
  };
}

/** Map any explainer verdict onto the rendered chip severity. */
function severityFor(
  verdict: Exclude<ExplainerVerdict, 'fund' | 'go'>,
): VerdictExplainerChip['severity'] {
  // Map every renderer's verdict vocabulary onto the four canonical chip
  // severities. The chip word matches the deck's own verdict copy.
  if (verdict === 'no_go' || verdict === 'no-go') return 'no-go';
  if (verdict === 'conditional_go' || verdict === 'hold') return 'hold';
  if (verdict === 'kill') return 'kill';
  // `shape`, `reshape`, `conditional` — all map to the shape severity.
  return 'shape';
}

/** Truncate text to `max` characters, appending an ellipsis when cut. */
function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

// ---------------------------------------------------------------------------
// Chip rendering — a tiny consistent helper.
// ---------------------------------------------------------------------------

/**
 * Render the verdict-explainer chip as a small HTML element. Designed to sit
 * inside the existing `.board-card` block (or near it) — small, subtle, and
 * one line. Uses inline styles so it does not depend on a CSS class being
 * added to the deck stylesheet.
 *
 * Tone:
 *   • `kill` / `no-go` — soft red ground, dark red ink.
 *   • `hold` / `shape` — soft amber ground, dark amber ink.
 *
 * Returns `''` when `chip` is `null` so renderers can interpolate freely.
 */
export function renderVerdictExplainerChip(
  chip: VerdictExplainerChip | null,
): string {
  if (!chip) return '';
  const tone = severityTone(chip.severity);
  const label = severityLabel(chip.severity);
  // Inline styles so the chip works on every deck without a CSS change. Kept
  // small and quiet — fits inside the `.board-card` block near the verdict.
  return (
    `<div class="verdict-explainer-chip" ` +
    `style="margin-top:10px;display:flex;gap:8px;align-items:flex-start;` +
    `padding:8px 12px;border-radius:4px;` +
    `background:${tone.bg};color:${tone.ink};` +
    `font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;` +
    `line-height:1.45;border:1px solid ${tone.border};">` +
    `<span style="font-weight:700;letter-spacing:0.06em;text-transform:uppercase;` +
    `white-space:nowrap;">Why ${escapeHtml(label)}?</span>` +
    `<span style="font-family:'DM Sans','Inter',system-ui,sans-serif;` +
    `font-size:12px;line-height:1.45;">${escapeHtml(chip.chipText)}</span>` +
    `</div>`
  );
}

interface SeverityTone {
  bg: string;
  ink: string;
  border: string;
}

function severityTone(
  severity: VerdictExplainerChip['severity'],
): SeverityTone {
  if (severity === 'kill' || severity === 'no-go') {
    return { bg: '#fdecea', ink: '#7a1b14', border: '#f1c0bc' };
  }
  return { bg: '#fdf3dc', ink: '#7a4f0d', border: '#ecd49a' };
}

function severityLabel(
  severity: VerdictExplainerChip['severity'],
): string {
  if (severity === 'no-go') return 'no-go';
  return severity;
}
