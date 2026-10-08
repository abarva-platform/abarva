// The per-section word budget stated to the model, reconciled with the word
// FLOOR the quality gate will measure the finished document against.
//
// Two numbers reach the generation prompt from two different declarations:
//
//   • the document floor and ceiling — `qualityBar.minBodyWords` /
//     `targetBodyWordsMax`, calibrated per artifact type in
//     quality-bar-registry.ts → artifact-contracts.ts; and
//   • a per-section hard cap, parsed out of each section's own editorial
//     `expertLatitude` prose ("Keep under 450 words plus one workflow
//     exhibit"), rendered as `Hard cap for this section: N body words.`
//
// Nothing reconciled them, and for two deliverables in the default P3 build set
// they did not reconcile:
//
//   solution_design    floor 2,800   section caps 300+450+700+650+450+150 = 2,700
//   sourcing_strategy  floor 1,800   section caps 200+650+350+500+80      = 1,780
//
// A model that obeys every hard cap it is given cannot reach the floor the same
// prompt sets, and the document is then blocked `document too short: N words;
// minimum M` — so the only paths through were to disobey a stated cap or to get
// lucky. The repair pass made the contradiction explicit in one sentence: it
// asks for `sectionShareOfFloor` words "while staying under the hard cap
// above", which for four of solution_design's six sections was a request for
// more words than the line above it permits.
//
// The consequence is not cosmetic. P3 enqueues its six documents as a
// SEQUENTIAL chain and `blockRunsWithFailedDependencies` cascades from a
// blocked parent, so one document stuck below its own floor holds every later
// P3 document, the P3 gate, and the phase.
//
// This module resolves both numbers together, from the declarations that are
// already there:
//
//   INV1  every section's repair target is at or below its own cap, so
//         "write at least X, stay under Y" is never a contradiction;
//   INV2  the repair targets TOTAL at least the floor, so writing every
//         section to its target clears the gate; and
//   INV3  the caps total no more than the ceiling the gate BLOCKS on
//         (`advisoryBandMax ?? targetBodyWordsMax`), so obeying them cannot
//         breach the maximum instead.
//
// INV3 caught a third mismatch, in the other direction: value_measurement_contract's
// seven caps total 4,800 against a 4,200 blocking ceiling. That one is weaker
// than the floor cases — a cap is a maximum, so a model that writes below its
// caps is fine — but the stated budget still permits a document the gate then
// refuses, so the caps are brought inside the ceiling for the same reason.
//
// It never lowers a floor or raises a ceiling — the quality bar is untouched.
// When the declared caps already clear the floor it returns them unchanged, so
// every deliverable that reconciled before is byte-identical. When they do not,
// it raises them PROPORTIONALLY, which keeps the editorial judgement about
// which section carries the weight (solution_components is still more than
// twice exec_decision) instead of flattening every section to an even share.

import { sectionShareOfFloor } from "@/lib/deliverables/shared/body-word-count";

export interface DeclaredSectionBudget {
  key: string;
  /**
   * The cap this section declared for itself, or null when it declared none
   * (the caller then applies the shared fallback).
   */
  declaredCap: number | null;
}

export interface SectionWordBudget {
  key: string;
  /** The hard cap stated to the model for this section. */
  cap: number;
  /** The completeness target the repair pass may ask for. Never above `cap`. */
  repairTarget: number;
  /** What the section declared, for audit — null when it declared nothing. */
  declaredCap: number | null;
}

export type SectionWordBudgetBasis =
  | "declared_caps_fit_the_band"
  | "declared_caps_raised_to_reach_floor"
  | "declared_caps_lowered_to_fit_ceiling"
  /**
   * The floor cannot be covered without breaching the ceiling. Nothing this
   * module can do makes the bar satisfiable, so the declared caps are left
   * exactly as declared and the contradiction is reported rather than hidden
   * behind a budget that trades one blocker for the other.
   */
  | "floor_exceeds_ceiling";

export interface SectionWordBudgetPlan {
  sections: SectionWordBudget[];
  /**
   * The cap applied to a section that declared none — and so also the cap for a
   * key this plan does not cover at all. Carried on the plan rather than
   * recomputed by each caller: the draft prompt, the repair prompt and the
   * repair target are then one reading of one number, which is the whole point
   * of this module.
   */
  fallbackCap: number;
  /** Total of the caps as declared (with the fallback applied). */
  declaredTotal: number;
  /** Total of the caps actually stated to the model. */
  capTotal: number;
  /** The cap total required for the floor to be reachable. */
  requiredTotal: number;
  /** The cap total the blocking ceiling permits. */
  permittedTotal: number;
  basis: SectionWordBudgetBasis;
}

/**
 * The cap total a document needs for its floor to be reachable.
 *
 * Read through `sectionShareOfFloor` with a single section so the margin here
 * and the margin the repair pass budgets with are the same number by
 * construction — they were two independent literals once and that is exactly
 * how a reconciliation drifts.
 */
export function requiredCapTotalForFloor(minBodyWords: number): number {
  return sectionShareOfFloor(minBodyWords, 1);
}

/**
 * Resolve the per-section caps and repair targets for one document.
 *
 * `sections` is in document order and carries each section's own declared cap;
 * `fallbackCap` is used for a section that declared none.
 */
export function planSectionWordBudgets(input: {
  sections: readonly DeclaredSectionBudget[];
  fallbackCap: number;
  minBodyWords: number;
  /**
   * The total the quality gate BLOCKS on, not the target it advises:
   * `advisoryBandMax ?? targetBodyWordsMax`. Passing the target instead would
   * tighten every band that deliberately carries an advisory margin.
   */
  blockingCeiling: number;
}): SectionWordBudgetPlan {
  const fallbackCap = Math.max(1, Math.round(input.fallbackCap));
  const declared = input.sections.map((section) => ({
    key: section.key,
    declaredCap: section.declaredCap,
    cap:
      section.declaredCap && section.declaredCap > 0
        ? Math.max(1, Math.round(section.declaredCap))
        : fallbackCap,
  }));
  const declaredTotal = declared.reduce((sum, section) => sum + section.cap, 0);
  const requiredTotal = requiredCapTotalForFloor(input.minBodyWords);
  const permittedTotal =
    input.blockingCeiling > 0 ? input.blockingCeiling : Number.POSITIVE_INFINITY;

  // No sections to budget: there is nothing to reconcile and no instruction to
  // contradict. Reported as fitting rather than as a bar failure.
  if (declared.length === 0) {
    return {
      sections: [],
      fallbackCap,
      declaredTotal: 0,
      capTotal: 0,
      requiredTotal,
      permittedTotal,
      basis: "declared_caps_fit_the_band",
    };
  }

  // The floor cannot be covered without breaching the ceiling the gate blocks
  // on. Nothing a budget can do makes that bar satisfiable, so the declared
  // caps are left exactly as declared and the contradiction is reported rather
  // than hidden behind a budget that trades one blocker for the other.
  const ceilingBlocksTheFloor = requiredTotal > permittedTotal;

  // Mutually exclusive by construction: a total that is both above the ceiling
  // and below the required floor means the floor is above the ceiling, which is
  // the case above.
  const needsRaise = !ceilingBlocksTheFloor && declaredTotal < requiredTotal;
  const needsLower = !ceilingBlocksTheFloor && declaredTotal > permittedTotal;
  const caps = needsRaise
    ? scaleProportionally(declared, declaredTotal, requiredTotal, "up")
    : needsLower
      ? scaleProportionally(declared, declaredTotal, permittedTotal, "down")
      : declared.map((section) => section.cap);
  const capTotal = caps.reduce((sum, cap) => sum + cap, 0);

  // The repair target is each section's share of the floor IN PROPORTION to its
  // own cap. Two things follow, and both are the point: the target is at or
  // below the cap for every section (because `capTotal >= requiredTotal` once
  // the scaling above has run), and the targets total the floor, so a document
  // written to its targets clears the gate.
  const targetTotal = Math.min(capTotal, requiredTotal);
  const sections: SectionWordBudget[] = declared.map((section, index) => {
    const cap = caps[index] ?? section.cap;
    const proportional = capTotal > 0 ? (targetTotal * cap) / capTotal : cap;
    return {
      key: section.key,
      declaredCap: section.declaredCap,
      cap,
      repairTarget: Math.min(cap, Math.max(1, Math.ceil(proportional))),
    };
  });

  return {
    sections,
    fallbackCap,
    declaredTotal,
    capTotal,
    requiredTotal,
    permittedTotal,
    basis: ceilingBlocksTheFloor
      ? "floor_exceeds_ceiling"
      : needsRaise
        ? "declared_caps_raised_to_reach_floor"
        : needsLower
          ? "declared_caps_lowered_to_fit_ceiling"
          : "declared_caps_fit_the_band",
  };
}

/**
 * Scale every cap by the same factor to hit `wantedTotal`.
 *
 * The rounding DIRECTION is the whole mechanism, not a detail, because it is
 * what proves the bound rather than checking it afterwards. Rounding is
 * super/sub-additive over the terms:
 *
 *   sum(ceil(c * f))  >= ceil(sum(c) * f)  = wantedTotal   (direction "up")
 *   sum(floor(c * f)) <= floor(sum(c) * f) = wantedTotal   (direction "down")
 *
 * So a scale-up can only land on or above the floor it was asked for, and a
 * scale-down only on or below the ceiling. Settling the rounding remainder
 * afterwards was the first draft here and it was a branch no input could reach:
 * with the rounding right it never fires, and with the rounding wrong it hid
 * that fact. The direction carries the invariant on its own.
 */
function scaleProportionally(
  declared: readonly { cap: number }[],
  declaredTotal: number,
  wantedTotal: number,
  direction: "up" | "down",
): number[] {
  const round = direction === "up" ? Math.ceil : Math.floor;
  if (declaredTotal <= 0) {
    return declared.map(() =>
      Math.max(1, round(wantedTotal / declared.length)),
    );
  }
  const factor = wantedTotal / declaredTotal;
  return declared.map((section) => Math.max(1, round(section.cap * factor)));
}

/** Resolve one section's budget, or null when the plan does not cover that key. */
export function sectionWordBudgetFor(
  plan: SectionWordBudgetPlan,
  key: string | undefined,
): SectionWordBudget | null {
  if (!key) return null;
  return plan.sections.find((section) => section.key === key) ?? null;
}

// ── Sections the brief does not declare ──
//
// `sectionWordBudgetFor` answers null for a key this plan does not cover, which
// happens whenever a generated section is not one the brief declared. That is
// reachable for any brief whose structure omits `fixedStructure`: plan section
// keys are filtered to the declared set only when it is present (see
// generation-plan.ts), and two shipped structures — `business_case` (P4) and
// `evaluation_workbook` — declare no `fixedStructure` at all, while the generic
// module fallback brief invites the model to "add sections if they improve the
// artifact".
//
// Such a section still needs a cap and a repair target, and both must come from
// a DECLARED number. The cap previously fell through to a regex over the planned
// section's own `rationale` — prose the model itself authored in Pass 1 — so the
// planning pass could name the size limit the drafting pass was then held to,
// and the repair prompt's "stay under the hard cap above" could be made to
// contradict the target asked for in the sentence before it. These two helpers
// are the only way an uncovered key gets either number.

/**
 * The hard cap for one section: its reconciled cap when the plan covers the
 * key, and otherwise the plan's own fallback cap.
 */
export function sectionCapFor(
  plan: SectionWordBudgetPlan,
  key: string | undefined,
): number {
  return sectionWordBudgetFor(plan, key)?.cap ?? plan.fallbackCap;
}

/**
 * The repair target for one section, never above the cap that section will be
 * told to stay under (INV1).
 *
 * For a key the plan covers this is the reconciled target. For one it does not,
 * it is `evenShare` clamped to the fallback cap — asking a section for more
 * words than its own cap permits is the contradiction this module exists to
 * remove, and clamping cannot cost the document its floor: the declared
 * sections' targets already total it (INV2), and an undeclared section's words
 * are additive on top of them.
 */
export function sectionRepairTargetWithin(
  plan: SectionWordBudgetPlan,
  key: string | undefined,
  evenShare: number,
): number {
  const covered = sectionWordBudgetFor(plan, key);
  if (covered) return covered.repairTarget;
  return Math.max(1, Math.min(plan.fallbackCap, Math.ceil(evenShare)));
}
