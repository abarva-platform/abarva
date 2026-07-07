import {
  buildDefaultModernizationPlanningEnvelope,
  computeHumanResidualPersonWeeks,
  FOUNDATION_EFFORT_PERSON_WEEKS,
  MODERNIZATION_ARCHETYPE_COEFFICIENTS,
  MODERNIZATION_ARCHETYPE_IDS,
  MODERNIZATION_COMPLEXITY_BANDS,
  MODERNIZATION_DISPOSITION_COEFFICIENTS,
  MODERNIZATION_DISPOSITIONS,
  MODERNIZATION_SOURCE_LEDGER,
  validateModernizationCoefficientLibrary,
} from "../archetype-coefficients";

describe("modernization archetype coefficients", () => {
  it("covers the six governed modernization archetypes from the spec", () => {
    expect(
      MODERNIZATION_ARCHETYPE_COEFFICIENTS.map((coefficient) => coefficient.id),
    ).toEqual([...MODERNIZATION_ARCHETYPE_IDS]);
  });

  it("keeps every heuristic sourced, dated, confidence-labelled, and rationalized", () => {
    const result = validateModernizationCoefficientLibrary();

    expect(result).toMatchObject({
      valid: true,
      errors: [],
      warnings: [],
    });
  });

  it("keeps all automation ranges broad planning ranges rather than single-point facts", () => {
    for (const archetype of MODERNIZATION_ARCHETYPE_COEFFICIENTS) {
      const automation = archetype.automationLeveragePct;

      expect(automation.low).toBeLessThan(automation.high);
      expect(automation.point).toBeGreaterThan(automation.low);
      expect(automation.point).toBeLessThan(automation.high);
      expect(automation.rationale).toContain(" ");
    }
  });

  it("marks SAS as the lowest-confidence and lowest-automation archetype", () => {
    const sas = MODERNIZATION_ARCHETYPE_COEFFICIENTS.find(
      (coefficient) => coefficient.id === "sas_program_family",
    );
    const dataStage = MODERNIZATION_ARCHETYPE_COEFFICIENTS.find(
      (coefficient) => coefficient.id === "datastage_etl_family",
    );

    expect(sas?.automationLeveragePct.confidence).toBe("low");
    expect(sas?.automationLeveragePct.high).toBeLessThan(
      dataStage?.automationLeveragePct.high ?? 0,
    );
  });

  it("computes residual human effort conservatively after automation leverage", () => {
    const estimate = computeHumanResidualPersonWeeks(
      "datastage_etl_family",
      "medium",
    );

    expect(estimate.grossPersonWeeks).toEqual({ low: 6, point: 9, high: 12 });
    expect(estimate.automationLeveragePct).toEqual({
      low: 0.4,
      point: 0.575,
      high: 0.75,
    });
    expect(estimate.humanResidualPersonWeeks).toEqual({
      low: 1.5,
      point: 3.83,
      high: 7.2,
    });
    expect(estimate.provenance.sourceIds).toEqual([
      "databricks_bladebridge_announcement_2026_06_03",
      "databricks_lakebridge_analyzer_2026_06_03",
    ]);
    expect(estimate.provenance.confidence).toBe("medium");
  });

  it("does not treat refactor or re-architect as cheaper than replatform", () => {
    const replatform = MODERNIZATION_DISPOSITION_COEFFICIENTS.find(
      (coefficient) => coefficient.disposition === "replatform",
    );
    const refactor = MODERNIZATION_DISPOSITION_COEFFICIENTS.find(
      (coefficient) => coefficient.disposition === "refactor_rearchitect",
    );

    expect(replatform?.effortMultiplier.point).toBe(1);
    expect(refactor?.effortMultiplier.low).toBeGreaterThanOrEqual(
      replatform?.effortMultiplier.point ?? 0,
    );
    expect(refactor?.effortMultiplier.high).toBe(1.5);
  });

  it("covers every 7R disposition exactly once", () => {
    expect(
      MODERNIZATION_DISPOSITION_COEFFICIENTS.map(
        (coefficient) => coefficient.disposition,
      ).sort(),
    ).toEqual([...MODERNIZATION_DISPOSITIONS].sort());
  });

  it("keeps foundation effort separate from per-workload coefficients", () => {
    expect(FOUNDATION_EFFORT_PERSON_WEEKS.platformFoundation).toMatchObject({
      sourceId: "databricks_well_architected_lakehouse_2026_06_03",
      confidence: "medium",
    });
    expect(
      FOUNDATION_EFFORT_PERSON_WEEKS.metadataDrivenIngestionFramework,
    ).toMatchObject({
      sourceId: "databricks_cicd_bundles_2026_06_03",
      confidence: "medium",
    });
    expect(buildDefaultModernizationPlanningEnvelope()).toEqual({
      low: 20,
      point: 35,
      high: 50,
    });
  });

  it("keeps source ledger entries inspectable as HTTPS citations", () => {
    expect(MODERNIZATION_SOURCE_LEDGER.length).toBeGreaterThanOrEqual(8);
    expect(
      MODERNIZATION_SOURCE_LEDGER.every(
        (entry) =>
          entry.url.startsWith("https://") &&
          entry.evidenceSummary.length > 40 &&
          entry.asOf === "2026-06-03",
      ),
    ).toBe(true);
  });

  it("keeps all complexity bands available for every archetype", () => {
    for (const archetype of MODERNIZATION_ARCHETYPE_COEFFICIENTS) {
      expect(
        Object.keys(archetype.grossPersonWeeksByComplexity).sort(),
      ).toEqual([...MODERNIZATION_COMPLEXITY_BANDS].sort());
    }
  });
});
