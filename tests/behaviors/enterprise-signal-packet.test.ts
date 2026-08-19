import {
  buildDecisionContext,
  buildContextQualityManifest,
  buildEnterpriseSignalPacket,
} from "../../scripts/data-build/enterprise-signal-packet";

/**
 * The decision-context compiler, quality manifest, and signal packet are the layer that decides
 * what an EnterpriseThesis prompt is even allowed to reason about. Nothing here calls a model —
 * every number is arithmetic over a fixture — so correctness here is testable exactly, unlike the
 * generation layer downstream of it. That is the whole reason this file exists as three separate
 * functions instead of one: each is a pure function over records, cheap to pin down.
 *
 * Two of these tests exist because the first real run against SkyHarbor data produced the right
 * number for the wrong reason — a row-counting bug that happened not to matter on this specific
 * fixture. Fixtures below are built so the bug, if reintroduced, actually shows up as a failure.
 */

function record(objectType: string, attrs: Record<string, unknown>) {
  const attributes: Record<string, { value: unknown }> = {};
  for (const [k, v] of Object.entries(attrs)) attributes[k] = { value: v };
  return { objectType, attributes };
}

describe("buildDecisionContext", () => {
  it("computes vendor concentration share from real spend, not a guess", () => {
    const records = [
      record("vendor_contract", { vendorName: "Big Vendor", annualSpendUsd: 800 }),
      record("vendor_contract", { vendorName: "Small Vendor", annualSpendUsd: 200 }),
    ];
    const dc = buildDecisionContext(records);
    expect(dc.vendors.totalSpend).toBe(1000);
    expect(dc.vendors.topByShare[0].name).toBe("Big Vendor");
    expect(dc.vendors.topByShare[0].share).toBeCloseTo(0.8);
  });

  it("infers metric direction from where the target sits relative to the baseline", () => {
    const records = [
      // target above baseline, actual moved up -> improving
      record("metric_outcome", { metricName: "Up is good", baselineValue: "70", targetValue: "80", actualValue: "75" }),
      // target above baseline, actual moved down -> worsening
      record("metric_outcome", { metricName: "Went backwards", baselineValue: "70", targetValue: "80", actualValue: "65" }),
      // missing actual -> not comparable
      record("metric_outcome", { metricName: "No actual yet", baselineValue: "70", targetValue: "80", actualValue: "" }),
    ];
    const dc = buildDecisionContext(records);
    expect(dc.performance.improving).toBe(1);
    expect(dc.performance.worsening).toBe(1);
    expect(dc.performance.notComparable).toBe(1);
  });

  it("does not fabricate a priority-to-program link when none is declared", () => {
    const records = [
      record("tenant_profile", { strategicPriorities: ["Modernize the estate"] }),
      record("program_initiative", { programName: "Estate Modernization Wave 1" }),
    ];
    const dc = buildDecisionContext(records);
    // Even though the names obviously rhyme, there is no canonical field connecting them, and the
    // compiler must not infer one -- that inference belongs only to the labeled candidate-
    // relationship engine, never to the authoritative decision context.
    expect(dc.strategy.priorityToProgramLinks).toEqual([]);
  });
});

describe("buildContextQualityManifest", () => {
  it("counts distinct linked programs, not crosswalk rows", () => {
    // Two rows naming the SAME program must count as one linked program, not two -- the exact bug
    // that shipped silently on the first real run, where the fixture happened to have no
    // duplicates and so never exposed it.
    const crosswalk = [
      { canonicalObjectType: "program", canonicalObjectName: "Same Program" },
      { canonicalObjectType: "program", canonicalObjectName: "Same Program" },
      { canonicalObjectType: "program", canonicalObjectName: "Different Program" },
      { canonicalObjectType: "no_canonical_match", canonicalObjectName: undefined },
    ];
    const manifest = buildContextQualityManifest([], crosswalk);
    expect(manifest.leadershipToPortfolioLinkage.linkedPrograms).toBe(2);
    expect(manifest.leadershipToPortfolioLinkage.resolvableRows).toBe(3);
    expect(manifest.leadershipToPortfolioLinkage.totalRows).toBe(4);
  });

  it("reports vendor document evidence as a disjoint set when names don't overlap the register", () => {
    const records = [record("vendor_contract", { vendorName: "Real Vendor A" })];
    const manifest = buildContextQualityManifest(records, [], ["Unrelated Golden Contract"]);
    expect(manifest.vendorDocumentEvidence.contractsWithExtraction).toBe(0);
    expect(manifest.vendorDocumentEvidence.interpretation).toContain("do not correspond by name");
  });

  it("matches vendor document evidence when the name genuinely overlaps", () => {
    const records = [record("vendor_contract", { vendorName: "Northgate Systems", contractName: "Northgate Cloud Platform Agreement" })];
    const manifest = buildContextQualityManifest(records, [], ["Northgate"]);
    expect(manifest.vendorDocumentEvidence.contractsWithExtraction).toBe(1);
  });

  it("always states the prohibited-comparison rules, regardless of input", () => {
    const manifest = buildContextQualityManifest([], []);
    expect(manifest.prohibitedComparisons.length).toBeGreaterThan(0);
    expect(manifest.prohibitedComparisons.join(" ")).toContain("priority-to-program");
  });
});

describe("buildEnterpriseSignalPacket", () => {
  it("only flags a vendor concentration when it clears the materiality threshold", () => {
    const records = [
      record("vendor_contract", { vendorName: "Dominant Vendor", annualSpendUsd: 900 }),
      record("vendor_contract", { vendorName: "Minor Vendor A", annualSpendUsd: 50 }),
      record("vendor_contract", { vendorName: "Minor Vendor B", annualSpendUsd: 50 }),
    ];
    const dc = buildDecisionContext(records);
    const quality = buildContextQualityManifest(records, []);
    const packet = buildEnterpriseSignalPacket(dc, quality);
    const concentrations = packet.signals.filter((s) => s.kind === "concentration" && s.domains.includes("vendor_contract"));
    expect(concentrations.length).toBe(1);
    expect(concentrations[0].statement).toContain("Dominant Vendor");
    expect(concentrations[0].statement).not.toContain("Minor Vendor");
  });

  it("every signal carries evidence a reader could actually go check", () => {
    const records = [
      record("vendor_contract", { vendorName: "Concentrated Vendor", annualSpendUsd: 1000 }),
      record("risk_or_control", { riskOrControlName: "A named risk", severity: "high", systemsImpacted: ["Core System"] }),
    ];
    const dc = buildDecisionContext(records);
    const quality = buildContextQualityManifest(records, []);
    const packet = buildEnterpriseSignalPacket(dc, quality);
    const risk = packet.signals.find((s) => s.kind === "risk");
    expect(risk?.evidenceRefs).toContain("A named risk");
  });

  it("classifies a theme raised by every leader as consensus and a theme raised by one as dissent", () => {
    const records = [
      record("ai_value_interview_evidence", { stakeholderRole: "CFO", themeTags: "shared_theme" }),
      record("ai_value_interview_evidence", { stakeholderRole: "CIO", themeTags: "shared_theme" }),
      record("ai_value_interview_evidence", { stakeholderRole: "CFO", themeTags: "lone_theme" }),
    ];
    const dc = buildDecisionContext(records);
    const quality = buildContextQualityManifest(records, []);
    const packet = buildEnterpriseSignalPacket(dc, quality);
    expect(packet.signals.some((s) => s.kind === "consensus" && s.statement.includes("shared_theme"))).toBe(true);
    expect(packet.signals.some((s) => s.kind === "dissent" && s.statement.includes("lone_theme"))).toBe(true);
  });

  it("gives enterprise identity and declared priorities a stable, citeable ctx_* id", () => {
    // Before contextItems existed, a claim about revenue or a declared priority had nothing real
    // to cite -- the model fell back to bare, unresolvable references like "(enterpriseIdentity)".
    const records = [
      record("tenant_profile", { revenueUsd: 5000, strategicPriorities: ["Modernize the estate"], customerSegments: ["Enterprise buyers"] }),
    ];
    const dc = buildDecisionContext(records);
    const quality = buildContextQualityManifest(records, []);
    const packet = buildEnterpriseSignalPacket(dc, quality);
    expect(packet.contextItems.every((c) => c.id.startsWith("ctx_"))).toBe(true);
    expect(packet.contextItems.some((c) => c.statement.includes("$5,000"))).toBe(true);
    expect(packet.contextItems.some((c) => c.statement.includes("Modernize the estate"))).toBe(true);
    expect(packet.contextItems.some((c) => c.statement.includes("Enterprise buyers"))).toBe(true);
  });

  it("does not emit a context item for a fact that was never declared", () => {
    const dc = buildDecisionContext([]);
    const quality = buildContextQualityManifest([], []);
    const packet = buildEnterpriseSignalPacket(dc, quality);
    expect(packet.contextItems).toEqual([]);
  });

  it("only exposes a visual dataset when the underlying figures actually exist", () => {
    const noVendorRecords = [record("program_initiative", { programName: "Only Program", budgetUsd: 100, expectedValueUsd: 120 })];
    const dc = buildDecisionContext(noVendorRecords);
    const quality = buildContextQualityManifest(noVendorRecords, []);
    const packet = buildEnterpriseSignalPacket(dc, quality);
    expect(packet.visualDatasets.vendor_spend_concentration).toBeUndefined();
    expect(packet.visualDatasets.program_investment_distribution).toBeDefined();
    expect(packet.visualDatasets.program_investment_distribution[0]).toMatchObject({ program: "Only Program", expectedValue: 120 });
  });

  it("computes the technology spend mix as real numbers a chart could render directly", () => {
    const records = [
      record("vendor_contract", { vendorName: "Vendor A", annualSpendUsd: 400 }),
      record("spend_value_fact", { annualSpendUsd: 1000 }),
    ];
    const dc = buildDecisionContext(records);
    const quality = buildContextQualityManifest(records, []);
    const packet = buildEnterpriseSignalPacket(dc, quality);
    const mix = packet.visualDatasets.technology_spend_mix;
    expect(mix).toEqual([
      { category: "Third-party contracted", amount: 400 },
      { category: "Other technology spend", amount: 600 },
    ]);
  });
});
