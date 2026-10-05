import {
  CHARTER_ASSUMPTION_RESOLUTION_STATE_KEY,
  type CharterAssumptionResolutionRecord,
  charterAssumptionResolutionActive,
  createCharterAssumptionResolutionRecord,
  parseCharterAssumptionResolutionInput,
  readCharterAssumptionResolutionRecord,
} from "@/lib/programs/charter-assumption-resolution";
import {
  P1_CHARTER_EVIDENCE_FAMILIES,
  readP1CharterBasisRecord,
} from "@/lib/programs/p1-charter-evidence";

/**
 * The write half of the charter-assumption resolution
 * (`moves_charter_assumption_resolution_v1`).
 *
 * The data model and the read already ship: P2 Discover inherits the charter
 * answers P1 left standing on an assumption, each with its owner and the plan
 * for validating it, and the read drops an assumption once a resolution stands
 * against it. Nothing writes one, so the panel is still a list of work nobody
 * can close from the screen it is shown on. This module decides what a write
 * is allowed to do.
 *
 * Pure on purpose: no React, no flag lookup, no fetch, no persistence. The
 * caller resolves the flag, supplies the already-loaded module rows, and
 * applies the returned state to the one row this names. Everything that makes
 * the write safe is decided here, so the host does not get to decide it.
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
