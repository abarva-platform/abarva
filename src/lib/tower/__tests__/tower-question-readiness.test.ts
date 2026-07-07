import {
  getTowerDatasetReadiness,
  isTowerDatasetReady,
  TOWER_DATASET_READINESS,
} from "../tower-question-readiness";

describe("Tower question readiness map", () => {
  it("marks organization leadership as the only ready Tower dataset", () => {
    expect(isTowerDatasetReady("organization_leadership")).toBe(true);

    const readyDatasets = TOWER_DATASET_READINESS.filter(
      (entry) => entry.readyForAuthoritativeAnswer,
    ).map((entry) => entry.dataset);

    expect(readyDatasets).toEqual(["organization_leadership"]);
  });

  it("marks budget, vendor, and AI-value surfaces as pending with precise missing fields", () => {
    for (const dataset of [
      "budget_lines",
      "vendors_contracts",
      "ai_investments",
    ]) {
      const readiness = getTowerDatasetReadiness(dataset);
      expect(readiness.readyForAuthoritativeAnswer).toBe(false);
      expect(readiness.state).toBe("pending");
      expect(readiness.missingFields.length).toBeGreaterThan(0);
      expect(readiness.expectedBehavior).toContain("precise gap");
    }
  });

  it("treats undeclared datasets as pending instead of silently green", () => {
    const readiness = getTowerDatasetReadiness("future_dataset");

    expect(readiness.readyForAuthoritativeAnswer).toBe(false);
    expect(readiness.missingFields).toEqual(["readiness_not_declared"]);
  });
});
