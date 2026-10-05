import { computeCaptureRevision } from "@/lib/programs/phase-capture-integrity";

/**
 * A resolution recorded against a charter answer that P1 left standing on an
 * assumption (`moves_charter_assumption_resolution_v1`).
 *
 * P2 Discover inherits those assumptions, each with the owner and the plan the
 * person typed for validating it. Showing them is the read half, which already
 * ships; a person looking at one could not say what Discover found. This module
 * is the data model and the read for that answer — confirmed as stated,
 * corrected by what Discover found, or superseded by approved evidence.
 *
 * Pure on purpose: no React, no flag lookup, no fetch, no write. The caller
 * resolves the flag and supplies the already-loaded module state.
 *
 * ## Why a sibling key, not a field inside the basis record
 *
 * A resolution is stored under `p1_charter_assumption_resolution` on the SAME
 * P1 capture-module row as `p1_charter_basis`, not nested inside it. The basis
 * writer assigns `state.p1_charter_basis = record` wholesale, so a nested
 * resolution would be silently discarded the next time anyone re-declared the
 * basis. A sibling key survives that, and keeps `readP1CharterBasisRecord`
 * byte-identical — it builds its result from a known field list and drops
 * anything else on the raw object, so it can neither see nor corrupt this.
 *
 * ## Why the revision pin is the whole safety story
 *
 * The resolution carries `valueRevision`, computed the same way the basis
 * computes its own: over the charter answer it was recorded against. A
 * resolution therefore describes one specific wording. Edit the answer and the
 * revision no longer matches, so this read returns `null` — exactly as the
 * basis read does, and for the same reason. A resolution can never be shown
 * against an answer it was not written about.
 */

/** What Discover concluded about a charter answer held as an assumption. */
export type CharterAssumptionResolutionOutcome =
  /** Discover checked it and the answer stands as P1 wrote it. */
  | "confirmed"
  /** Discover checked it and the answer is wrong; `note` says what is true. */
  | "corrected"
  /** Approved evidence now covers it, so the assumption no longer carries. */
  | "superseded";

/** A resolution as stored on the P1 capture-module row. */
export interface CharterAssumptionResolutionRecord {
  outcome: CharterAssumptionResolutionOutcome;
  /** What Discover found. Required: an outcome with no finding is not a proof. */
  note: string;
  resolvedByUserId: string;
  resolvedByEmail: string | null;
  /** ISO-8601. */
  resolvedAt: string;
  /** The revision of the charter answer this resolution was recorded against. */
  valueRevision: string;
}

/** The caller-supplied half of a resolution; the rest is stamped on write. */
export interface CharterAssumptionResolutionInput {
  outcome: CharterAssumptionResolutionOutcome;
  note: string;
}

/** The state key a resolution lives under, alongside `p1_charter_basis`. */
export const CHARTER_ASSUMPTION_RESOLUTION_STATE_KEY =
  "p1_charter_assumption_resolution";

const OUTCOMES: readonly CharterAssumptionResolutionOutcome[] = [
  "confirmed",
  "corrected",
  "superseded",
];

/**
 * A resolution is recorded from P2, because Discover is the phase that does the
 * validating the plan names. Same shape as
 * `charterAssumptionCarryForwardActive`, and deliberately a separate flag: a
 * tenant can inherit the assumptions read-only without the resolve path.
 */
export function charterAssumptionResolutionActive(input: {
  flagEnabled: boolean;
  phaseNumber: number;
}): boolean {
  return input.flagEnabled && input.phaseNumber === 2;
}

/**
 * The caller's half of a resolution, or `null` when it is not usable.
 *
 * A blank or whitespace-only note is rejected rather than stored empty: the
 * product's claim is that Discover validated the assumption, and an outcome
 * with nothing behind it would render as that claim while carrying no finding.
 */
export function parseCharterAssumptionResolutionInput(
  raw: unknown,
): CharterAssumptionResolutionInput | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const value = raw as Record<string, unknown>;
  const outcome = value.outcome;
  if (
    typeof outcome !== "string" ||
    !OUTCOMES.includes(outcome as CharterAssumptionResolutionOutcome)
  ) {
    return null;
  }
  const note = typeof value.note === "string" ? value.note.trim() : "";
  if (!note) return null;
  return { outcome: outcome as CharterAssumptionResolutionOutcome, note };
}

/** Stamp a parsed input into the record stored on the capture-module row. */
export function createCharterAssumptionResolutionRecord(args: {
  input: CharterAssumptionResolutionInput;
  sectionKey: string;
  value: string;
  userId: string;
  email?: string | null;
  resolvedAt: string;
}): CharterAssumptionResolutionRecord {
  return {
    outcome: args.input.outcome,
    note: args.input.note,
    resolvedByUserId: args.userId,
    resolvedByEmail: args.email ?? null,
    resolvedAt: args.resolvedAt,
    valueRevision: computeCaptureRevision({ [args.sectionKey]: args.value }),
  };
}

/**
 * The resolution standing against this charter answer, or `null`.
 *
 * `null` covers every reason a resolution does not apply, and the caller does
 * not need to tell them apart: nothing stored, a malformed or partial record,
 * or a record whose `valueRevision` no longer matches the answer because
 * someone edited it after Discover resolved it.
 */
export function readCharterAssumptionResolutionRecord(
  state: Record<string, unknown> | null | undefined,
  sectionKey: string,
  value: string,
): CharterAssumptionResolutionRecord | null {
  const raw = state?.[CHARTER_ASSUMPTION_RESOLUTION_STATE_KEY];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  const input = parseCharterAssumptionResolutionInput(record);
  if (!input) return null;
  if (
    record.valueRevision !== computeCaptureRevision({ [sectionKey]: value })
  ) {
    return null;
  }
  if (
    typeof record.resolvedByUserId !== "string" ||
    !record.resolvedByUserId.trim() ||
    typeof record.resolvedAt !== "string" ||
    !record.resolvedAt.trim()
  ) {
    return null;
  }
  return {
    outcome: input.outcome,
    note: input.note,
    resolvedByUserId: record.resolvedByUserId,
    resolvedByEmail:
      typeof record.resolvedByEmail === "string" ? record.resolvedByEmail : null,
    resolvedAt: record.resolvedAt,
    valueRevision: record.valueRevision as string,
  };
}
