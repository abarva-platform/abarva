// The per-section word budget resolved over the sections the document WILL
// ACTUALLY CONTAIN, not over the ones the brief declared.
//
// section-word-budget-plan.ts reconciles the per-section hard caps with the
// document's word floor and holds three invariants (INV1/INV2/INV3). INV2 — the
// repair targets total at least the floor, so writing every section to its
// target clears the gate — is the one that makes the budget satisfiable at all.
//
// But it is stated over `brief.recommendedStructure`, the DECLARED set, and the
// document is written from `plan.sectionPlan`, the set the Pass-1 architect
// returned. Nothing requires one to cover the other:
//
//   • A declared section the plan OMITS contributes its share of the floor to
//     the total and no words to the document. `sanitizeGenerationPlan` orders
//     and filters a `fixedStructure` plan against the declared keys, but it
//     never ADDS a declared key the plan left out — `requiredOrder.map(byKey.get)
//     .filter(Boolean)` drops it — so this reaches fixed structures too, not
//     only the two that declare no `fixedStructure`.
//   • A planned section keyed OFF-BRIEF is not covered by the plan, so it gets
//     the shared fallback cap, which is unrelated to the share of the floor the
//     declared section it displaced was carrying.
//   • `validateGenerationPlan` does not stop either one. A declared key the
//     plan does not name is a WARNING on purpose (the architect keys sections
//     semantically), and the thin-plan guard compares a COUNT
//     (`sectionPlan.length < requiredSections.length`), so a plan of the right
//     size with the wrong keys passes.
//
// Measured over every registry key any phase can request on any route: with one
// declared section missing from the plan, ALL 18 keys that carry a budget fall
// below their own required total — `execution_roadmap` by 750 words, which no
// remaining section can absorb because each one is also told to stay under its
// own cap. Four fall short on substitution alone, at the same section count the
// thin-plan guard accepts.
//
// The consequence is the one section-word-budget-plan.ts was written for: P3
// enqueues its documents as a SEQUENTIAL chain and
// `blockRunsWithFailedDependencies` cascades from a blocked parent, so one
// document stuck below its floor holds every later document, the gate, and the
// phase.
//
// The repair reuses the proven arithmetic rather than adding a second one: the
// realized keys are resolved to the caps their DECLARATIONS carry (the shared
// fallback for one that declared nothing, exactly as before), and that set is
// handed to `planSectionWordBudgets`. It then raises those caps proportionally
// to cover the floor, the same mechanism and the same invariants — only now
// over the document being written. No floor is lowered and no ceiling raised.
//
// Feasibility is unchanged: `requiredTotal` and `permittedTotal` are both
// independent of the section count, so a bar that could be met with every
// declared section present can still be met with fewer, and `floor_exceeds_ceiling`
// is reached on exactly the same inputs as before.

import {
  planSectionWordBudgets,
  type DeclaredSectionBudget,
  type SectionWordBudgetPlan,
} from "./section-word-budget-plan";

/**
 * Resolve the budget over the realized section set.
 *
 * `declared` is the brief's structure with each section's own declared cap;
 * `realizedKeys` is the key of every section the document will contain, IN
 * DOCUMENT ORDER. A realized key that matches a declaration inherits its cap; a
 * key that matches none carries null and takes the shared fallback, which is
 * what an undeclared section received before this module existed.
 *
 * Duplicate realized keys are kept rather than collapsed: two planned sections
 * sharing one key are two sections in the finished document and each needs a
 * budget. They resolve to the same cap and are counted once apiece, so the
 * totals the invariants are stated over still describe the real document.
 *
 * An EMPTY realized set means the document's shape is not known yet — the
 * architect pass has not run, or its plan was emptied. Budgeting against it
 * would hand every section the fallback cap, so the declared set is used
 * instead and the answer is byte-identical to the unrealized plan.
 */
export function planRealizedSectionWordBudgets(input: {
  declared: readonly DeclaredSectionBudget[];
  realizedKeys: readonly string[];
  fallbackCap: number;
  minBodyWords: number;
  blockingCeiling: number;
}): SectionWordBudgetPlan {
  const declaredCapByKey = new Map<string, number | null>();
  for (const section of input.declared) {
    // First declaration wins, so a structure that names a key twice resolves
    // the same cap both times rather than depending on iteration order.
    if (!declaredCapByKey.has(section.key)) {
      declaredCapByKey.set(section.key, section.declaredCap);
    }
  }

  const sections: DeclaredSectionBudget[] =
    input.realizedKeys.length > 0
      ? input.realizedKeys.map((key) => ({
          key,
          declaredCap: declaredCapByKey.get(key) ?? null,
        }))
      : input.declared.map((section) => ({ ...section }));

  return planSectionWordBudgets({
    sections,
    fallbackCap: input.fallbackCap,
    minBodyWords: input.minBodyWords,
    blockingCeiling: input.blockingCeiling,
  });
}
