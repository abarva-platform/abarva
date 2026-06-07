import type {
  FieldMapping,
  LoaderDimension,
  MappingProposal,
  PreservedSourceFile,
} from "@/lib/context-ingestion/loader/contract";
import {
  composeStewardValidation,
  EXEC_PLAUSIBILITY,
  IT_BUDGET_REVENUE_RATIO,
  runDeterministicChecks,
  type OrgProfile,
} from "@/lib/context-ingestion/loader/steward-validation";

function makeSource(overrides: Partial<PreservedSourceFile> = {}): PreservedSourceFile {
  return {
    tenantKey: "apex-retail",
    filename: "leadership.csv",
    container: "landing",
    objectKey: "landing/apex-retail/inbox/abc-leadership.csv",
    blobUrl: "https://blob.example/landing/apex-retail/inbox/abc-leadership.csv",
    fileHash: "deadbeef",
    bytes: 1024,
    ingestedAt: "2026-06-07T00:00:00.000Z",
    ...overrides,
  };
}

function makeProposal(overrides: Partial<MappingProposal> = {}): MappingProposal {
  const dimension: LoaderDimension = overrides.dimension ?? "leadership_org";
  const fieldMappings: FieldMapping[] = overrides.fieldMappings ?? [
    { sourceColumn: "Name", canonicalField: "person.name", confidence: 0.95 },
    { sourceColumn: "Title", canonicalField: "person.title", confidence: 0.92 },
  ];
  return {
    source: overrides.source ?? makeSource(),
    dimension,
    dimensionConfidence: overrides.dimensionConfidence ?? 0.9,
    fieldMappings,
    sampleRows: overrides.sampleRows,
    reviewRequired: overrides.reviewRequired ?? false,
  };
}

describe("runDeterministicChecks", () => {
  it("flags two people titled CFO as a conflict", () => {
    const proposal = makeProposal();
    const rows = [
      { Name: "Alice Smith", Title: "CFO" },
      { Name: "Bob Jones", Title: "CFO" },
    ];
    const findings = runDeterministicChecks({ proposal, rows });
    const conflict = findings.find((f) => f.kind === "conflict");
    expect(conflict).toBeDefined();
    expect(conflict?.severity).toBe("warn");
    expect(conflict?.message).toContain("CFO");
    expect(conflict?.source).toBe("deterministic");
  });

  it("flags an IT budget outside the 3–5% band against an orgProfile", () => {
    const proposal = makeProposal({ dimension: "financial_baseline" });
    const orgProfile: OrgProfile = {
      annualRevenueUsd: 1_000_000_000,
      itBudgetUsd: 90_000_000, // 9% -> out of band
    };
    const findings = runDeterministicChecks({ proposal, orgProfile, rows: [] });
    const realism = findings.find((f) => f.kind === "realism");
    expect(realism).toBeDefined();
    expect(realism?.severity).toBe("warn");
    expect(realism?.message).toContain("% of revenue");
    expect(realism?.message).toContain("3–5%");
    expect(realism?.source).toBe("deterministic");
  });

  it("does not flag an IT budget inside the 3–5% band", () => {
    const proposal = makeProposal({ dimension: "financial_baseline" });
    const inBand = (IT_BUDGET_REVENUE_RATIO.MIN + IT_BUDGET_REVENUE_RATIO.MAX) / 2;
    const orgProfile: OrgProfile = {
      annualRevenueUsd: 1_000_000_000,
      itBudgetUsd: 1_000_000_000 * inBand,
    };
    const findings = runDeterministicChecks({ proposal, orgProfile, rows: [] });
    expect(findings.find((f) => f.kind === "realism")).toBeUndefined();
  });

  it("flags an orphan reports_to that doesn't resolve to another row", () => {
    const proposal = makeProposal();
    const rows = [
      { Name: "Alice Smith", Title: "CFO", reports_to: "Ghost Person" },
      { Name: "Bob Jones", Title: "VP Finance", reports_to: "Alice Smith" },
    ];
    const findings = runDeterministicChecks({ proposal, rows });
    const orphans = findings.filter((f) => f.kind === "orphan");
    expect(orphans).toHaveLength(1);
    expect(orphans[0].message).toContain("Ghost Person");
    expect(orphans[0].severity).toBe("warn");
    expect(orphans[0].source).toBe("deterministic");
  });

  it("flags a duplicate canonical key", () => {
    const proposal = makeProposal();
    const rows = [
      { Name: "Alice Smith", Title: "VP Finance" },
      { Name: "Alice Smith", Title: "VP Finance" },
    ];
    const findings = runDeterministicChecks({ proposal, rows });
    const dup = findings.find((f) => f.kind === "duplicate");
    expect(dup).toBeDefined();
    expect(dup?.severity).toBe("warn");
    expect(dup?.source).toBe("deterministic");
  });

  it("flags a KPI row missing a target", () => {
    const proposal = makeProposal({ dimension: "kpis" });
    const rows = [
      { name: "Net Promoter Score", target: "" },
      { name: "Revenue Growth", target: "12%" },
    ];
    const findings = runDeterministicChecks({ proposal, rows });
    const schema = findings.find((f) => f.kind === "schema");
    expect(schema).toBeDefined();
    expect(schema?.message).toContain("Net Promoter Score");
    expect(schema?.source).toBe("deterministic");
  });

  it("flags an implausible exec count for the revenue", () => {
    const proposal = makeProposal();
    const rows = Array.from({ length: EXEC_PLAUSIBILITY.FREE_FLOOR + 5 }, (_, i) => ({
      Name: `Exec ${i}`,
      Title: "CIO",
    }));
    const orgProfile: OrgProfile = { annualRevenueUsd: 10_000_000 };
    const findings = runDeterministicChecks({ proposal, orgProfile, rows });
    const realism = findings.find(
      (f) => f.kind === "realism" && f.message.includes("executives"),
    );
    expect(realism).toBeDefined();
    expect(realism?.severity).toBe("warn");
  });

  it("falls back to proposal.sampleRows when rows arg is omitted", () => {
    const proposal = makeProposal({
      sampleRows: [
        { Name: "A", Title: "CFO" },
        { Name: "B", Title: "CFO" },
      ],
    });
    const findings = runDeterministicChecks({ proposal });
    expect(findings.some((f) => f.kind === "conflict")).toBe(true);
  });
});

describe("composeStewardValidation", () => {
  it("derives a ClarificationQuestion from a single low-confidence field", () => {
    const proposal = makeProposal({
      fieldMappings: [
        { sourceColumn: "Name", canonicalField: "person.name", confidence: 0.95 },
        { sourceColumn: "Misc", canonicalField: "person.title", confidence: 0.3 },
      ],
    });
    const result = composeStewardValidation({ proposal, deterministic: [] });
    expect(result.questions).toHaveLength(1);
    const q = result.questions[0];
    expect(q.field).toBe("person.title");
    expect(q.fileObjectKey).toBe(proposal.source.objectKey);
    expect(q.bestGuessIndex).toBe(0);
    expect(q.options.length).toBeGreaterThan(0);
    // one 'ask' alone does not escalate
    expect(result.escalateToConversation).toBe(false);
  });

  it("escalates when dimension is unknown", () => {
    const proposal = makeProposal({ dimension: "unknown" });
    const result = composeStewardValidation({ proposal, deterministic: [] });
    expect(result.escalateToConversation).toBe(true);
  });

  it("escalates when there is a block-severity finding", () => {
    const proposal = makeProposal();
    const result = composeStewardValidation({
      proposal,
      deterministic: [
        {
          kind: "schema",
          severity: "block",
          message: "Required field missing.",
          source: "deterministic",
        },
      ],
    });
    expect(result.escalateToConversation).toBe(true);
  });

  it("escalates when more than one field scores 'ask'", () => {
    const proposal = makeProposal({
      fieldMappings: [
        { sourceColumn: "A", canonicalField: "x", confidence: 0.2 },
        { sourceColumn: "B", canonicalField: "y", confidence: 0.3 },
      ],
    });
    const result = composeStewardValidation({ proposal, deterministic: [] });
    expect(result.questions).toHaveLength(2);
    expect(result.escalateToConversation).toBe(true);
  });

  it("merges deterministic and agent findings into flags", () => {
    const proposal = makeProposal();
    const result = composeStewardValidation({
      proposal,
      deterministic: [
        { kind: "duplicate", severity: "warn", message: "dup", source: "deterministic" },
      ],
      agent: [
        { kind: "implied_gap", severity: "info", message: "gap", source: "agent" },
      ],
    });
    expect(result.flags).toHaveLength(2);
    expect(result.flags.map((f) => f.source).sort()).toEqual(["agent", "deterministic"]);
  });
});
