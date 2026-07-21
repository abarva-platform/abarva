import {
  HOME_DIMENSION_VISUALIZATION_CONTRACT,
  dimensionRowsSupportPrimaryVisual,
  homeDimensionVisualizationContractSchema,
  resolveHomeDimensionVisualContract,
} from "../home-dimension-visualization-contract";

describe("HOME_DIMENSION_VISUALIZATION_CONTRACT", () => {
  it("validates against its own Zod schema", () => {
    expect(() =>
      homeDimensionVisualizationContractSchema.parse(
        HOME_DIMENSION_VISUALIZATION_CONTRACT,
      ),
    ).not.toThrow();
  });

  it("covers all 19 canonical Home Knowledge dimension keys", () => {
    const keys = [
      "profile",
      "functions",
      "org",
      "workforce",
      "apps",
      "data",
      "infra",
      "vendors",
      "budget",
      "programs",
      "ai",
      "risks",
      "rel",
      "evidence",
      "metrics",
      "industry",
      "lenses",
      "ms",
      "opev",
    ];
    for (const key of keys) {
      expect(HOME_DIMENSION_VISUALIZATION_CONTRACT[key]).toBeDefined();
      expect(HOME_DIMENSION_VISUALIZATION_CONTRACT[key].dimensionId).toBe(key);
    }
  });

  it("never assigns quantitative precision unless the field is a real numeric field", () => {
    // budget's amount_usd/realized_value_usd are string placeholders
    // ("Needs evidence") in the shipped Meridian pack — this contract entry
    // must stay qualitative until a tenant pack proves otherwise.
    expect(HOME_DIMENSION_VISUALIZATION_CONTRACT.budget.precisionMode).toBe(
      "qualitative",
    );
  });
});

describe("resolveHomeDimensionVisualContract", () => {
  it("resolves a known dimension key", () => {
    const contract = resolveHomeDimensionVisualContract("apps");
    expect(contract.primaryVisual).toBe("estate_bubble_matrix");
    expect(contract.requiredFields).toEqual([
      "criticality",
      "lifecycle_status",
    ]);
  });

  it("falls back to the plain bar visual for an unknown key", () => {
    const contract = resolveHomeDimensionVisualContract("not-a-real-dimension");
    expect(contract.primaryVisual).toBe("bar");
    expect(contract.requiredFields).toEqual([]);
  });

  it("falls back to the plain bar visual for null/undefined", () => {
    expect(resolveHomeDimensionVisualContract(null).primaryVisual).toBe("bar");
    expect(resolveHomeDimensionVisualContract(undefined).primaryVisual).toBe(
      "bar",
    );
  });
});

describe("dimensionRowsSupportPrimaryVisual", () => {
  const appsContract = resolveHomeDimensionVisualContract("apps");

  it("returns true when rows carry every required field", () => {
    const rows = [
      { criticality: "critical", lifecycle_status: "current_core" },
      { criticality: "Needs evidence", lifecycle_status: "Needs evidence" },
    ];
    expect(dimensionRowsSupportPrimaryVisual(appsContract, rows)).toBe(true);
  });

  it("returns false when rows are missing a required field entirely", () => {
    const rows = [{ criticality: "critical" }];
    expect(dimensionRowsSupportPrimaryVisual(appsContract, rows)).toBe(false);
  });

  it("returns false for an empty row set", () => {
    expect(dimensionRowsSupportPrimaryVisual(appsContract, [])).toBe(false);
  });

  it("returns false for the bar fallback contract (no required fields)", () => {
    const fallback = resolveHomeDimensionVisualContract("unknown");
    const rows = [{ anything: "x" }];
    expect(dimensionRowsSupportPrimaryVisual(fallback, rows)).toBe(false);
  });
});
