import { isP1CharterEvidenceFamily } from "@/lib/programs/p1-charter-evidence";
import type { PhaseCaptureSection } from "@/lib/programs/phase-capture-contract";

/**
 * The host join for the per-field charter basis surface
 * (`moves_charter_basis_v1`, flag-gated).
 *
 * Every decision about WHETHER the basis surface exists for a given phase and
 * a given capture section used to be inline in `MovesPhaseStandaloneClient`,
 * which has no suite — so the three guards that keep the surface off (flag off,
 * wrong phase, non-charter section) were the only part of this family that
 * nothing pinned. The rendering halves are all tested
 * (`CharterBasisField.test.tsx`, `CharterGateAssumptionNotice.test.tsx`), as is
 * the gate's own fold (`charter-gate-assumption-disclosure.test.ts`); the join
 * that decides when any of them is reached was not.
 *
 * Pure on purpose: no React, no flag lookup, no fetch. The caller resolves the
 * flag; this module only says what follows from it.
 */

/**
 * The surface is reachable only on P1 and only with the flag on for the tenant.
 * P1 is not a presentation choice — the gate it declares a basis FOR
 * (`p1-charter-evidence.ts`) exists for phase 1 alone, so a basis declared
 * anywhere else would be recorded against no gate.
 */
export function charterBasisSurfaceActive(input: {
  flagEnabled: boolean;
  phaseNumber: number;
}): boolean {
  return input.flagEnabled && input.phaseNumber === 1;
}

/**
 * Which capture sections carry a basis control. Only sections that declare a
 * P1 charter evidence family do: those are the ones the gate reads, and a basis
 * on any other section would be unreadable by it.
 *
 * Inactive surface ⇒ the empty set, which is what makes every per-section
 * render guard below answer `false` without a second flag check.
 */
export function charterBasisSectionKeys(input: {
  active: boolean;
  sections: readonly PhaseCaptureSection[];
}): Set<string> {
  if (!input.active) return new Set<string>();
  return new Set(
    input.sections
      .filter((section) => isP1CharterEvidenceFamily(section.evidenceFamily))
      .map((section) => section.key),
  );
}

/**
 * The shared guard for all three per-section surfaces — the basis field itself,
 * the amber assumption badge, and the hand-off recap mark. One predicate so the
 * three cannot drift into disagreeing about which rows are in scope.
 */
export function charterBasisSurfaceForSection(
  sectionKey: string,
  sectionKeys: ReadonlySet<string>,
): boolean {
  return sectionKeys.has(sectionKey);
}

/**
 * The `{ key, label }` rows the charter-level fold is taken over, or `null`
 * when there are none.
 *
 * `null` and `[]` are deliberately different: `null` means "this Move has no
 * charter basis surface at all" and collapses both the hand-off rollup and the
 * gate disclosure to nothing, which is how flag-off reads byte-for-byte as it
 * does today. An empty array would instead be a real fold over zero rows and
 * would render a rollup saying zero of zero.
 */
export function charterBasisRollupSections(input: {
  sections: readonly PhaseCaptureSection[];
  sectionKeys: ReadonlySet<string>;
}): { key: string; label: string }[] | null {
  if (input.sectionKeys.size === 0) return null;
  return input.sections
    .filter((section) => input.sectionKeys.has(section.key))
    .map((section) => ({ key: section.key, label: section.label }));
}
