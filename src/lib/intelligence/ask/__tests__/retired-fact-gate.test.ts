import { buildRetiredFactError, scanRetiredFacts } from "../retired-fact-gate";

describe("retired fact gate", () => {
  it("hard-flags retired Lakeshore facts before they can reach synthesis", () => {
    const findings = scanRetiredFacts({
      tenantKey: "lakeshore-holdings",
      sources: [
        {
          type: "TENANT",
          id: "lakeshore-holdings:enterprise_profile",
          name: "Enterprise profile",
          detail:
            "The company profile shows $54.2B in FY2025 revenue, 72,000 FTEs, 89 manufacturing plants, and a $1.8B annual technology budget.",
          confidence: 0.98,
        },
      ],
    });

    expect(findings.map((finding) => finding.factId)).toEqual(
      expect.arrayContaining([
        "old_revenue_54_2b",
        "old_employee_count_72000",
        "old_plant_count_89",
        "old_tech_budget_1_8b",
      ]),
    );
    expect(buildRetiredFactError(findings)).toContain(
      "retired_fact_violation",
    );
  });

  it("does not apply Lakeshore retired-fact numbers to other tenants", () => {
    const findings = scanRetiredFacts({
      tenantKey: "apex-retail",
      sources: [
        {
          type: "TENANT",
          id: "apex-profile",
          name: "Apex profile",
          detail:
            "Apex has 72,000 employees and a $1.8B technology budget in this synthetic fixture.",
          confidence: 0.9,
        },
      ],
    });

    expect(findings).toEqual([]);
  });

  it("flags retired Lakeshore facts in model output and followups", () => {
    const findings = scanRetiredFacts({
      tenantKey: "lakeshore",
      textBlocks: [
        {
          location: "modelOutput",
          text: "A rival firm would point to the $54M AI/data budget and Lakeshore Industries branding.",
        },
        {
          location: "followups",
          text: JSON.stringify([
            "Which HarborPoint systems support this claim?",
          ]),
        },
      ],
    });

    expect(findings.map((finding) => finding.factId)).toEqual(
      expect.arrayContaining([
        "old_ai_budget_54m",
        "old_alias_lakeshore_industries",
        "old_opco_harborpoint",
      ]),
    );
  });
});
