/**
 * A phase refusal that NAMES its open evidence slots instead of counting them.
 *
 * Two refusals on the Moves phase path already compute the named list and send
 * it to the browser:
 *   - `POST /api/v1/deliverables/generate-phase` -> 409 `required_evidence_open`
 *   - `POST /api/v1/programs/:id/phase-gate-approval` -> 409
 *     `transition_evidence_incomplete`
 * Each carries `requiredEvidenceGaps`, and each entry carries the human slot
 * label (for example "P1 to P2 readiness workbook", or an evidence family's
 * own label) together with the imperative next action for it.
 *
 * Both readers rendered only `detail`, which states a COUNT ("3 required
 * evidence items are not yet approved in Files & Evidence") or a CATEGORY
 * ("Required evidence must be approved, linked to a sourced workbook answer,
 * or formally resolved before this phase can close"). Neither names what to
 * open. A phase held by exactly one thing therefore reads as an unspecified
 * pile of missing evidence, and the one control that would clear it is named
 * nowhere on the screen.
 *
 * This is the client-side mirror of the server-side reporting fix: the list is
 * correct by the time it leaves the route, and is then discarded.
 *
 * Nothing here loosens a gate. The route still refuses, the phase still does
 * not advance, and no build is queued; only the message changes.
 */

/** How many slots are named before the message switches to a remainder count. */
export const MAX_NAMED_EVIDENCE_SLOTS = 4;

/** One open slot as a refusal payload carries it. Shape is untrusted JSON. */
export interface RequiredEvidenceGapLike {
  evidenceSlot?: unknown;
  nextAction?: unknown;
}

/** The part of either 409 body this module reads. */
export interface RequiredEvidenceRefusalLike {
  detail?: unknown;
  requiredEvidenceGaps?: unknown;
}

function boundedText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

/**
 * The named slots a refusal body carries, in payload order.
 *
 * An entry with no readable slot label is dropped rather than rendered as a
 * blank bullet: a nameless row would re-state the count this module exists to
 * replace.
 */
export function readRequiredEvidenceGaps(
  value: unknown,
): Array<{ slot: string; nextAction: string | null }> {
  if (!Array.isArray(value)) return [];
  const gaps: Array<{ slot: string; nextAction: string | null }> = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const gap = entry as RequiredEvidenceGapLike;
    const slot = boundedText(gap.evidenceSlot, 160);
    if (!slot) continue;
    gaps.push({ slot, nextAction: boundedText(gap.nextAction, 240) });
  }
  return gaps;
}

/**
 * The refusal as one sentence pair: the route's own `detail`, then the open
 * slots by name.
 *
 * Returns `null` when the body names no slot, so a caller keeps whatever
 * fallback ladder it already had for every other refusal code. `detail` is
 * folded in as the lead rather than left to the caller, so a caller that
 * prefers this message over `detail` never loses the route's wording.
 */
export function describeRequiredEvidenceRefusal(
  payload: RequiredEvidenceRefusalLike | null | undefined,
): string | null {
  if (!payload) return null;
  const gaps = readRequiredEvidenceGaps(payload.requiredEvidenceGaps);
  if (gaps.length === 0) return null;
  const named = gaps
    .slice(0, MAX_NAMED_EVIDENCE_SLOTS)
    .map((gap) =>
      gap.nextAction ? `${gap.slot} (${gap.nextAction})` : gap.slot,
    );
  const remainder = gaps.length - named.length;
  const open = `Open: ${named.join("; ")}${
    remainder > 0 ? ` and ${remainder} more` : ""
  }.`;
  const lead = boundedText(payload.detail, 600);
  return lead ? `${lead} ${open}` : open;
}
