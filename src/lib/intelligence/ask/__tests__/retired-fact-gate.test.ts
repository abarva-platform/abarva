import {
  buildRetiredFactError,
  filterSourcesWithRetiredFacts,
  scanRetiredFacts,
} from "../retired-fact-gate";

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

  it("hard-flags retired First Capital aliases in source packets", () => {
    const findings = scanRetiredFacts({
      tenantKey: "arcturus",
      sources: [
        {
          type: "TENANT",
          id: "first-capital:enterprise_profile",
          name: "Enterprise profile",
          detail:
            "First Capital Financial is shown as the company display name in this stale profile row.",
          confidence: 0.98,
        },
      ],
    });

    expect(findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tenantKey: "first-capital",
          factId: "retired_alias_firstcapitalfinancial",
          location: "source:first-capital:enterprise_profile:detail",
        }),
      ]),
    );
    expect(buildRetiredFactError(findings)).toContain(
      "retired_alias_firstcapitalfinancial",
    );
  });

  it("hard-flags retired First Capital aliases in model output", () => {
    const findings = scanRetiredFacts({
      tenantKey: "first-capital",
      textBlocks: [
        {
          location: "modelOutput",
          text: "First Capital Financial should not be emitted in a final advisory answer.",
        },
      ],
    });

    expect(findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          factId: "retired_alias_firstcapitalfinancial",
          location: "modelOutput",
        }),
      ]),
    );
  });

  it("filters stale source rows without suppressing clean context rows", () => {
    const result = filterSourcesWithRetiredFacts({
      tenantKey: "lakeshore-holdings",
      sources: [
        {
          type: "TENANT",
          id: "v7_01_enterprise_profile",
          name: "V7 Enterprise profile",
          detail:
            "HarborPoint Packaging Group appears in this stale source row.",
          confidence: 0.9,
        },
        {
          type: "TENANT",
          id: "v7_02_current_state",
          name: "Current state",
          detail:
            "Lakeshore Holdings uses a federated-with-center model across governed portfolio companies.",
          confidence: 0.86,
        },
      ],
    });

    expect(result.sources.map((source) => source.id)).toEqual([
      "v7_02_current_state",
    ]);
    expect(result.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          factId: "retired_alias_harborpoint",
          sourceId: "v7_01_enterprise_profile",
        }),
      ]),
    );
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
        "retired_alias_lakeshoreindustries",
        "retired_alias_harborpoint",
      ]),
    );
  });
});
