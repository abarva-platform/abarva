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

  it("lets explicit trend questions beat broad AI portfolio hints", () => {
    const contract = selectTowerVisualContract({
      question:
        "Show the FY26 to FY28 value trend for the AI portfolio and explain whether confidence is improving.",
      contractKey: "tower_value_realization",
      artifactType: "portfolio",
    });

    expect(contract).toMatchObject({
      questionIntent: "trend",
      recommendedVisual: "line",
    });
    expect(
      towerProgressEventsForQuestion(
        "Show the FY26 to FY28 value trend for the AI portfolio.",
      ).map((event) => event.label),
    ).toEqual([
      "Loading metric history...",
      "Checking period confidence...",
      "Preparing trend view...",
    ]);
  });

  it("lets explicit risk and evidence-gap questions beat value-realization contract hints", () => {
    const contract = selectTowerVisualContract({
      question:
        "Which towers are unhealthy, and what evidence gaps block executive confidence?",
      contractKey: "tower_value_realization",
      artifactType: "waterfall",
    });

    expect(contract).toMatchObject({
      questionIntent: "heatmap",
      recommendedVisual: "heatmap",
    });
  });

  it("lets explicit value-bridge wording beat generic AI portfolio wording", () => {
    const contract = selectTowerVisualContract({
      question:
        "Show the promised versus claimable Tower value bridge for our AI portfolio.",
      contractKey: "tower_ai_portfolio",
      artifactType: "portfolio",
    });

    expect(contract).toMatchObject({
      questionIntent: "waterfall",
      recommendedVisual: "waterfall",
    });
  });

  it("lets explicit vendor and spend exposure wording beat incidental risk wording", () => {
    const contract = selectTowerVisualContract({
      question:
        "Which vendors or towers dominate our AI spend exposure and value risk?",
      contractKey: "tower_value_realization",
      artifactType: "risk",
    });

    expect(contract).toMatchObject({
      questionIntent: "financial",
      recommendedVisual: "treemap",
    });
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
