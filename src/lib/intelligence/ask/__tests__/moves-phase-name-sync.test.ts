import { PACKS_V2 } from "@/lib/programs/phase-packs/v2";
import type { PhaseNumber } from "@/lib/programs/phase-packs/v2";
import { PRODUCT_CAPABILITY_REGISTRY } from "@/lib/agent/product-truth/capability-registry";
import { MOVES_EXECUTION_PHASE_LABELS } from "../answer-mode-registry";

/**
 * The answer contract names Moves phases in text that reaches the user, and
 * `ensureMovesExecutionPhaseTable` injects those names deterministically when
 * the model omits the table. If they drift from the phase packs the product
 * actually runs, aVa confidently tells the client about phases that do not
 * exist on their screen -- which is what happened before this guard existed.
 *
 * The contract carries one extra trailing step ("Tower Track Outcomes"). That
 * is a narrative handoff, not a Moves phase pack, so it is allowed after the
 * product phases but nowhere else.
 */
const PRODUCT_PHASE_NAMES = Object.keys(PACKS_V2)
  .map((key) => Number(key) as PhaseNumber)
  .sort((a, b) => a - b)
  .map((phase) => PACKS_V2[phase].phase_name);

const HANDOFF_STEP = "Tower Track Outcomes";

describe("Moves phase names stay in sync with the product", () => {
  it("names every product phase exactly as the phase packs do", () => {
    const contractPhases = MOVES_EXECUTION_PHASE_LABELS.filter(
      (label) => label !== HANDOFF_STEP,
    );
    expect(contractPhases).toEqual(PRODUCT_PHASE_NAMES);
  });

  it("keeps the Tower handoff as the final step and nowhere else", () => {
    const labels = [...MOVES_EXECUTION_PHASE_LABELS];
    expect(labels[labels.length - 1]).toBe(HANDOFF_STEP);
    expect(labels.filter((l) => l === HANDOFF_STEP)).toHaveLength(1);
  });

  it("uses the product phase names in the deterministic fallback rows", () => {
    // The fallback is what users actually read when the model omits the table.
    const { ensureMovesExecutionPhaseTable } = jest.requireActual<
      typeof import("../answer-mode-registry")
    >("../answer-mode-registry");
    const rendered = ensureMovesExecutionPhaseTable("Run this as a Moves sprint.");
    for (const name of PRODUCT_PHASE_NAMES) {
      expect([name, rendered.includes(name)]).toEqual([name, true]);
    }
  });

  it("keeps every other product-truth source naming phases the same way", () => {
    // The manual is generated from several executable sources. A freshness
    // gate proves the manual matches its inputs; it cannot prove the inputs
    // agree with each other. They did not: the capability guidance named the
    // phases one way while the phase packs named them another, so the
    // generated manual contradicted itself in a single document.
    const guidance = PRODUCT_CAPABILITY_REGISTRY.filter(
      (entry) => entry.surface === "moves",
    )
      .map((entry) => `${entry.label} ${entry.claimGuidance}`)
      .join("\n");

    // Range shorthand like "P0-P5" is fine; a phase named individually is not
    // allowed to use different wording from the pack it refers to.
    for (const productName of PRODUCT_PHASE_NAMES) {
      const prefix = `${productName.split(" ")[0]} `; // e.g. "P2 "
      if (!guidance.includes(prefix)) continue;
      expect([prefix, guidance.includes(productName)]).toEqual([prefix, true]);
    }
  });
});
