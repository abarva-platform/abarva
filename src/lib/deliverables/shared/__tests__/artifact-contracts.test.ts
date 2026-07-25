import {
  CHARTER_CONTRACT,
  CHARTER_PLACEHOLDER_LABELS,
  getArtifactContract,
  sectionWordCapTotal,
} from "../artifact-contracts";

describe("shared artifact contracts", () => {
  it("returns the charter contract by deliverable type", () => {
    expect(getArtifactContract("charter")).toBe(CHARTER_CONTRACT);
    expect(getArtifactContract("business_case")).toBeNull();
  });

  it("keeps the charter's per-section word caps under the hard word ceiling", () => {
    expect(sectionWordCapTotal(CHARTER_CONTRACT)).toBeLessThanOrEqual(
      CHARTER_CONTRACT.wordBudget.hardMaxWords,
    );
  });

  it("keeps the word budget internally consistent (min <= target min <= target max <= hard max)", () => {
    const wb = CHARTER_CONTRACT.wordBudget;
    expect(wb.minWords).toBeLessThanOrEqual(wb.targetWords.min);
    expect(wb.targetWords.min).toBeLessThanOrEqual(wb.targetWords.max);
    expect(wb.targetWords.max).toBeLessThanOrEqual(wb.hardMaxWords);
  });

  it("exposes the three exact placeholder labels the P1 prompt must use verbatim", () => {
    expect(CHARTER_PLACEHOLDER_LABELS.clientDecisionRequired).toBe(
      "Client decision required",
    );
    expect(CHARTER_PLACEHOLDER_LABELS.hypothesisToTestInP2).toBe(
      "Hypothesis to test in P2",
    );
    expect(CHARTER_PLACEHOLDER_LABELS.evidenceRequiredForP2).toBe(
      "Evidence required for P2",
    );
  });

  it("requires exactly 7 sections, matching both pipelines' required-section count", () => {
    expect(CHARTER_CONTRACT.sections).toHaveLength(7);
  });
});
