import {
  packEvidence,
  resolveContextBudget,
  estimateEvidenceItemTokens,
} from "../context-budget";
import { buildContextCoverage } from "../context-coverage";
import type { GovernedEvidenceItem } from "../types";

function evidence(
  id: number,
  statement: string,
): GovernedEvidenceItem {
  return {
    citationNumber: id,
    label: `Evidence ${id}`,
    statement,
    evidenceFamily: "test_family",
    confidence: "high",
    disclosureTier: "internal_only",
    provenanceRef: `p-${id}`,
  };
}

describe("context budget", () => {
  it("keeps fixed overhead, output reserve, and evidence within the window", () => {
    const budget = resolveContextBudget({
      windowTokens: 1000,
      outputReserveTokens: 250,
      fixedOverheadTokens: 400,
      safetyMarginTokens: 50,
    });

    expect(budget.evidenceTokens).toBe(300);
    expect(
      budget.outputReserveTokens +
        budget.fixedOverheadTokens +
        budget.evidenceTokens,
    ).toBeLessThanOrEqual(budget.windowTokens);
  });

  it("packs whole items in priority order and reports the dropped count", () => {
    const items = [
      evidence(1, "a".repeat(80)),
      evidence(2, "b".repeat(80)),
      evidence(3, "c".repeat(2000)),
      evidence(4, "d".repeat(80)),
    ];
    const firstTwoTokens =
      estimateEvidenceItemTokens(items[0]) +
      estimateEvidenceItemTokens(items[1]);
    const budget = resolveContextBudget({
      windowTokens: firstTwoTokens + 10,
      outputReserveTokens: 0,
      fixedOverheadTokens: 0,
      safetyMarginTokens: 0,
    });

    const packed = packEvidence(items, budget);

    expect(packed.packed.map((item) => item.citationNumber)).toEqual([1, 2]);
    expect(packed.droppedCount).toBe(2);
    expect(packed.usedTokens).toBe(firstTwoTokens);
  });

  it("returns an empty pack instead of throwing when no evidence exists", () => {
    const budget = resolveContextBudget({
      windowTokens: 1000,
      outputReserveTokens: 100,
      fixedOverheadTokens: 100,
      safetyMarginTokens: 0,
    });

    const packed = packEvidence([], budget);

    expect(packed.packed).toEqual([]);
    expect(packed.droppedCount).toBe(0);
    expect(packed.usedTokens).toBe(0);
  });

  it("distinguishes no approved evidence from approved evidence that never reached the prompt", () => {
    expect(
      buildContextCoverage({
        approvedAvailable: 0,
        retrieved: 0,
        packed: 0,
      }),
    ).toMatchObject({
      coverageRatio: null,
      coverageState: "no_approved_evidence",
      requiresAttention: false,
    });

    expect(
      buildContextCoverage({
        approvedAvailable: 10,
        retrieved: 10,
        packed: 0,
      }),
    ).toMatchObject({
      coverageRatio: 0,
      coverageState: "empty_prompt",
      requiresAttention: true,
    });
  });
});
