import {
  chartKindForTowerVisualContract,
  selectTowerVisualContract,
  towerProgressEventsForQuestion,
} from "../visual-contract";

describe("Tower visual contract", () => {
  it("selects a 2x2 contract for portfolio prioritization questions", () => {
    const contract = selectTowerVisualContract({
      question:
        "Which AI programs deserve more funding? Show a 2x2 by value and complexity.",
      contractKey: "tower_value_realization",
      artifactType: "portfolio",
    });

    expect(contract).toMatchObject({
      questionIntent: "quadrant",
      recommendedVisual: "2x2",
      axes: { x: "Execution complexity or readiness", y: "Business value" },
    });
    expect(chartKindForTowerVisualContract(contract)).toBe("quadrant-matrix");
  });

  it("selects a value bridge contract for value leakage questions", () => {
    const contract = selectTowerVisualContract({
      question: "Where are we losing AI value from promised to claimable?",
      contractKey: "tower_value_realization",
      artifactType: "waterfall",
    });

    expect(contract.questionIntent).toBe("waterfall");
    expect(contract.recommendedVisual).toBe("waterfall");
    expect(contract.sourceBoundary).toContain("forecast");
    expect(chartKindForTowerVisualContract(contract)).toBe("horizontal-bar");
  });

  it("streams business-readable progress labels without implementation language", () => {
    const labels = towerProgressEventsForQuestion(
      "Create a 2x2 matrix of AI programs by value and execution confidence.",
    ).map((event) => event.label);

    expect(labels).toEqual([
      "Loading AI portfolio...",
      "Comparing value and readiness...",
      "Preparing 2x2 decision view...",
    ]);
    expect(labels.join(" ")).not.toMatch(/governed|packet|semantic|context/i);
  });
});
