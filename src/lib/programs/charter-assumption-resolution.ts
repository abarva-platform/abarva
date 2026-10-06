import { computeCaptureRevision } from "@/lib/programs/phase-capture-integrity";
import {
  P1_CHARTER_EVIDENCE_FAMILIES,
  readP1CharterBasisRecord,
} from "@/lib/programs/p1-charter-evidence";

/**
 * A resolution recorded against a charter answer that P1 left standing on an
 * assumption (`moves_charter_assumption_resolution_v1`).
 *
 * P2 Discover inherits those assumptions, each with the owner and the plan the
 * person typed for validating it. Showing them is the read half, which already
 * ships; a person looking at one could not say what Discover found. This module
 * is the data model, the read, and the write DECISION for that answer —
 * confirmed as stated, corrected by what Discover found, or superseded by
 * approved evidence.
 *
 * Pure on purpose: no React, no flag lookup, no fetch, no persistence. The
 * caller resolves the flag, supplies the already-loaded module state, and
 * applies what `planCharterAssumptionResolutionWrite` returns.
 *
 * ## Why the write decision lives in this file
 *
 * The decision is written against this module's own record shape, its revision
 * pin and its read — it is the same object's rules, not a second concern. A
 * standalone sibling module would also be reached by nothing until the API
 * route lands, and a module reached only by its own suite is an orphan the
 * reachability audit rejects: a green suite over it would be no evidence the
 * code runs. Here it ships inside a module product code already reaches
 * (`charter-assumptions-carry-forward` imports the read), so what is exported
 * is exposed rather than stranded.
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

/**
 * ============================================================================
 * The write half: what recording a resolution is allowed to do.
 * ============================================================================
 *
 * The data model and the read above already ship: P2 Discover inherits the
 * charter answers P1 left standing on an assumption, each with its owner and
 * the plan for validating it, and the read drops an assumption once a
 * resolution stands against it. Nothing persists one yet — the API route and
 * the P2 control are the next two increments — so this decides what a write
 * will be allowed to do, and no resolution can be recorded by it alone.
 *
 * Everything that makes the write safe is decided here, so the host does not
 * get to decide it: the caller applies `nextState` to the one row named, or
 * surfaces the refusal.
 *
 * ## Why this refuses rather than clamps
 *
 * Every refusal below describes a write that would have produced a believable
 * row. A resolution renders as "Discover checked this", so a write that lands
 * against the wrong section, a stale wording, or a field that was never an
 * assumption does not read as an error — it reads as a validation that never
 * happened. There is no safe degraded write here, so each case returns a named
 * refusal and the state is left untouched.
 *
 * ## Why an existing resolution is not replaced
 *
 * `carriedCharterAssumptions` excludes an assumption once a resolution stands
 * against it, so the P2 panel cannot offer the control for one twice. A second
 * write can therefore only arrive from a client working off a stale list, and
 * overwriting would erase the first finding with nothing left pointing at it.
 * It is refused as `already_resolved` instead.
 */

/** Why a resolution write was refused. Each leaves the stored state untouched. */
export type CharterAssumptionResolutionRefusal =
  /** The flag is off for the tenant, or this is not P2. */
  | "inactive"
  /** No usable outcome, or a blank finding. */
  | "invalid_input"
  /** Not one of the canonical charter fields. */
  | "unknown_section"
  /** The charter field has no capture row to write onto. */
  | "module_missing"
  /**
   * The field is not standing on an open assumption against its CURRENT
   * answer — it was answered from evidence or an assertion, or someone edited
   * the answer after the basis was declared, which clears it.
   */
  | "not_an_assumption"
  /** A resolution already stands against this answer. */
  | "already_resolved";

export interface CharterAssumptionResolutionWritePlan {
  ok: true;
  /** The single capture-module row to persist onto. */
  moduleKey: string;
  /** The charter section the resolution was recorded against. */
  sectionKey: string;
  /** The record to store under the sibling key. */
  record: CharterAssumptionResolutionRecord;
  /**
   * The row's full next state. Every other key is carried through unchanged,
   * `p1_charter_basis` included: a resolution says what Discover found, it
   * does not re-declare how P1 knew.
   */
  nextState: Record<string, unknown>;
}

export interface CharterAssumptionResolutionWriteRefused {
  ok: false;
  refusal: CharterAssumptionResolutionRefusal;
}

export type CharterAssumptionResolutionWriteResult =
  | CharterAssumptionResolutionWritePlan
  | CharterAssumptionResolutionWriteRefused;

interface CharterCaptureModuleState {
  moduleKey: string;
  status: string;
  state?: Record<string, unknown> | null;
}

/** The capture-module row a charter section's answer and basis live on. */
export function charterSectionModuleKey(sectionKey: string): string {
  return `phase_1_${sectionKey}`;
}

/**
 * What a resolution write should do, or the named reason it may not.
 *
 * The checks run cheapest-and-most-structural first, so a refusal names the
 * outermost thing that is wrong: a caller with the flag off is told `inactive`
 * even if its payload is also unusable.
 */
export function planCharterAssumptionResolutionWrite(input: {
  flagEnabled: boolean;
  phaseNumber: number;
  sectionKey: string;
  /** The raw request payload; parsed and trimmed here. */
  rawInput: unknown;
  modules: readonly CharterCaptureModuleState[];
  userId: string;
  email?: string | null;
  /** ISO-8601, supplied by the caller so this stays pure. */
  resolvedAt: string;
}): CharterAssumptionResolutionWriteResult {
  if (
    !charterAssumptionResolutionActive({
      flagEnabled: input.flagEnabled,
      phaseNumber: input.phaseNumber,
    })
  ) {
    return { ok: false, refusal: "inactive" };
  }

  const parsed = parseCharterAssumptionResolutionInput(input.rawInput);
  if (!parsed) return { ok: false, refusal: "invalid_input" };

  const family = P1_CHARTER_EVIDENCE_FAMILIES.find(
    (entry) => entry.sectionKey === input.sectionKey,
  );
  if (!family) return { ok: false, refusal: "unknown_section" };

  const moduleKey = charterSectionModuleKey(family.sectionKey);
  const moduleRow = input.modules.find((entry) => entry.moduleKey === moduleKey);
  if (!moduleRow) return { ok: false, refusal: "module_missing" };

  const rawValue = moduleRow.state?.value;
  const answer = typeof rawValue === "string" ? rawValue : "";
  const basis = readP1CharterBasisRecord(
    moduleRow.state,
    family.sectionKey,
    answer,
  );
  if (basis?.kind !== "assumption") {
    return { ok: false, refusal: "not_an_assumption" };
  }

  if (
    readCharterAssumptionResolutionRecord(
      moduleRow.state,
      family.sectionKey,
      answer,
    )
  ) {
    return { ok: false, refusal: "already_resolved" };
  }

  const record = createCharterAssumptionResolutionRecord({
    input: parsed,
    sectionKey: family.sectionKey,
    value: answer,
    userId: input.userId,
    email: input.email ?? null,
    resolvedAt: input.resolvedAt,
  });

  return {
    ok: true,
    moduleKey,
    sectionKey: family.sectionKey,
    record,
    nextState: {
      ...(moduleRow.state ?? {}),
      [CHARTER_ASSUMPTION_RESOLUTION_STATE_KEY]: record,
    },
  };
}
