import {
  evaluateEstimateModel,
  formatEstimateModelForPrompt,
  type EstimateModel,
} from "../estimate-model";

function model(overrides: Partial<EstimateModel> = {}): EstimateModel {
  const shared = {
    pairId: "pair-1",
    workPackage: "Reporting foundation",
    role: "Data engineer",
    lowHours: 10,
    baseHours: 20,
    highHours: 30,
    rateSource: "Approved planning rate card",
    inputBasis: "assumption" as const,
    evidenceReference: "",
    assumption: "One bounded reporting release",
    confidence: "medium" as const,
    aiEligiblePct: 10,
    aiToolAssumption: "Claude Code assists tests and scaffolding; engineer reviews all output",
    humanReviewHours: 2,
  };
  return {
    currency: "USD",
    reviewer: "Finance reviewer",
    reviewConfirmed: true,
    sourceNotes: "",
    rows: [
      { ...shared, deliveryModel: "internal", ratePerHour: 100 },
      { ...shared, deliveryModel: "vendor", ratePerHour: 150 },
    ],
    ...overrides,
  };
}

describe("deterministic Moves estimate model", () => {
  it("calculates low/base/high effort and cost from editable inputs", () => {
    const result = evaluateEstimateModel(JSON.stringify(model()));

    expect(result.readyForApproval).toBe(true);
    expect(result.calculations).toEqual([
      expect.objectContaining({
        deliveryModel: "internal",
        lowHours: 11,
        baseHours: 20,
        highHours: 29,
        aiHoursSavedAtBase: 2,
        lowCost: 1100,
        baseCost: 2000,
        highCost: 2900,
      }),
      expect.objectContaining({
        deliveryModel: "vendor",
        lowHours: 11,
        baseHours: 20,
        highHours: 29,
        lowCost: 1650,
        baseCost: 3000,
        highCost: 4350,
      }),
    ]);
  });

  it("blocks until the reviewer attests and paired scenarios cover the same role", () => {
    const unreviewed = evaluateEstimateModel(
      JSON.stringify(model({ reviewConfirmed: false })),
    );
    expect(unreviewed.readyForApproval).toBe(false);
    expect(unreviewed.errors.join(" ")).toMatch(/reviewer must confirm/);

    const unpaired = evaluateEstimateModel(
      JSON.stringify(model({ rows: model().rows.slice(0, 1) })),
    );
    expect(unpaired.readyForApproval).toBe(false);
    expect(unpaired.errors.join(" ")).toMatch(/internal and vendor rows/);
  });

  it("fails closed on reversed ranges, unsupported AI savings and missing source basis", () => {
    const invalid = model();
    invalid.rows[0] = {
      ...invalid.rows[0],
      lowHours: 25,
      highHours: 5,
      aiEligiblePct: 101,
      assumption: "",
      rateSource: "",
    };
    const result = evaluateEstimateModel(JSON.stringify(invalid));
    expect(result.readyForApproval).toBe(false);
    expect(result.errors.join(" ")).toMatch(/low ≤ base ≤ high/);
    expect(result.errors.join(" ")).toMatch(/0 to 100%/);
    expect(result.errors.join(" ")).toMatch(/rate source is required/);
    expect(result.errors.join(" ")).toMatch(/assumptions need an explanation/);
  });

  it("fails closed on malformed persisted field types without throwing", () => {
    const invalid = model();
    invalid.rows[0] = { ...invalid.rows[0], role: 42 as unknown as string };
    const result = evaluateEstimateModel(JSON.stringify(invalid));
    expect(result.readyForApproval).toBe(false);
    expect(result.model).toBeNull();
    expect(result.errors).toContain(
      "The estimate model could not be read. Rebuild it from the editor.",
    );
  });

  it("passes row-level calculations and evidence/assumption labels to the build prompt", () => {
    const prompt = formatEstimateModelForPrompt(JSON.stringify(model()));
    expect(prompt).toContain("DETERMINISTIC ROADMAP ESTIMATE MODEL");
    expect(prompt).toContain("Reporting foundation / Data engineer / internal");
    expect(prompt).toContain("Reporting foundation / Data engineer / vendor");
    expect(prompt).toContain("assumption One bounded reporting release");
    expect(prompt).toContain("$2,000");
    expect(prompt).toContain("Claude Code assists tests and scaffolding");
    expect(formatEstimateModelForPrompt(JSON.stringify(model({ reviewConfirmed: false })))).toBeNull();
  });
});
