import { readCharterAssumptionResolutionRecord } from "@/lib/programs/charter-assumption-resolution";
import {
  P1_CHARTER_EVIDENCE_FAMILIES,
  readP1CharterBasisRecord,
} from "@/lib/programs/p1-charter-evidence";

/**
 * The P2 half of the charter-basis promise (`moves_charter_assumptions_discover_v1`).
 *
 * P1 tells the workspace user, in four separate places, that a field answered
 * from an assumption "carries into Discover to be validated". Nothing read it
 * there: `p1_charter_basis` is loaded on `phase === 1` only, so the sentence
 * was a claim the product never kept. This module is the read that keeps it —
 * it folds the recorded P1 bases into the open assumptions P2 inherits, with
 * the owner and the validation plan the person typed when they declared it.
 *
 * Pure on purpose: no React, no flag lookup, no fetch. The caller resolves the
 * flag and supplies the already-loaded module rows; this module only says what
 * follows from them.
 *
 * It is a READ. Nothing here closes, edits, or re-classifies an assumption —
 * the basis stays owned by P1's capture state, and P2 only shows what is open.
 */

/** One charter field P1 left standing on an assumption. */
export interface CarriedCharterAssumption {
  /** The P1 capture section key the assumption was declared against. */
  sectionKey: string;
  /** The charter field's canonical label, as P1 shows it. */
  label: string;
  /** The answer P1 recorded — the thing being assumed. */
  answer: string;
  /** Who owns validating it (required by the basis control; never blank). */
  owner: string;
  /** What Discover will do to confirm or correct it. */
  validationPlan: string;
  /** When the basis was declared, ISO-8601. */
  recordedAt: string;
}

interface CharterCaptureModuleState {
  moduleKey: string;
  status: string;
  state?: Record<string, unknown> | null;
}

/**
 * The surface is reachable only on P2 and only with the flag on for the tenant.
 *
 * P2 is not a presentation choice. The validation plan each assumption carries
 * is literally "how Discover validates it", so the carry-forward is addressed
 * to the phase that does that work; shown on P3+ it would be a list of
 * questions whose answering phase has already closed.
 */
export function charterAssumptionCarryForwardActive(input: {
  flagEnabled: boolean;
  phaseNumber: number;
}): boolean {
  return input.flagEnabled && input.phaseNumber === 2;
}

/**
 * The open charter assumptions P2 inherits, in canonical charter order.
 *
 * `null` and `[]` are deliberately different, matching
 * `charterBasisRollupSections`: `null` means the surface is not active at all
 * and the host renders nothing, which is how flag-off reads byte-for-byte as
 * today. `[]` means the surface IS active and no charter field is standing on
 * an assumption — also rendered as nothing, but for the opposite reason.
 *
 * With `resolutionReadEnabled`, the list is what is still OPEN: an assumption
 * Discover has resolved is excluded, because the row's whole content is an
 * owner and a plan for work that is now done.
 *
 * A row survives only if `readP1CharterBasisRecord` still accepts the stored
 * basis against the field's CURRENT value. That is the same staleness check
 * P1 itself applies: when someone edits a charter answer, its basis is cleared
 * rather than carried, so an edited field can never appear here described by a
 * validation plan that was written about the previous wording.
 */
export function carriedCharterAssumptions(input: {
  active: boolean;
  modules: readonly CharterCaptureModuleState[];
  /**
   * `moves_charter_assumption_resolution_v1`. Off by default, so a caller that
   * does not pass it reads exactly as before: every open assumption carries,
   * including any that happens to have a resolution stored against it.
   *
   * On, an assumption Discover has already resolved drops out of this list.
   * That ordering matters more than it looks: the write path lands after this
   * read, and if the read were not resolution-aware first, the moment anything
   * recorded a resolution the panel would keep listing the assumption as still
   * open and still owed to its owner.
   */
  resolutionReadEnabled?: boolean;
}): CarriedCharterAssumption[] | null {
  if (!input.active) return null;
  const carried: CarriedCharterAssumption[] = [];
  for (const family of P1_CHARTER_EVIDENCE_FAMILIES) {
    const moduleRow = input.modules.find(
      (entry) => entry.moduleKey === `phase_1_${family.sectionKey}`,
    );
    if (!moduleRow) continue;
    const rawValue = moduleRow.state?.value;
    const answer = typeof rawValue === "string" ? rawValue : "";
    const record = readP1CharterBasisRecord(
      moduleRow.state,
      family.sectionKey,
      answer,
    );
    if (record?.kind !== "assumption") continue;
    if (
      input.resolutionReadEnabled &&
      readCharterAssumptionResolutionRecord(
        moduleRow.state,
        family.sectionKey,
        answer,
      )
    ) {
      continue;
    }
    carried.push({
      sectionKey: family.sectionKey,
      label: family.label,
      answer,
      owner: record.owner,
      validationPlan: record.p2ValidationPlan,
      recordedAt: record.recordedAt,
    });
  }
  return carried;
}
