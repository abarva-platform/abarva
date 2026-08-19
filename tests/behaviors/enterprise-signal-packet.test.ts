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

/**
 * Fourteen source files (workforce, infrastructure, data assets, AI use cases/realization/tool
 * usage, relationships, evidence governance, managed services, operational process evidence,
 * platform maturity, industry patterns, expert lenses) were previously never read by the
 * compiler at all -- confirmed by grepping this file for `of("...")` calls against the tenant's
 * real file list. These tests cover the extraction logic added to close that gap, including two
 * real bugs a live probe against actual meridian-health data caught before this shipped:
 * relationshipRows carrying the row's own canonical type ("relationship_source_row") instead of
 * the CSV's `from_object_type` column in the naive reading, and consent_to_attribute being
 * "named"/"anonymous"/"role_only" rather than the yes/no this file first assumed.
 */
describe("buildDecisionContext -- newly-read domains", () => {
  it("flags a workforce role only when it has a documented automation opportunity", () => {
    const records = [
      record("workforce_role", { personaOrRole: "Has opportunity", functionName: "Ops", roleCount: 10, automationOpportunity: "High" }),
      record("workforce_role", { personaOrRole: "No opportunity noted", functionName: "Ops", roleCount: 500 }),
    ];
    const dc = buildDecisionContext(records);
    expect(dc.workforce.automationOpportunityRoles).toHaveLength(1);
    expect(dc.workforce.automationOpportunityRoles[0].role).toBe("Has opportunity");
    expect(dc.workforce.totalHeadcount).toBe(510);
  });

  it("flags a tier1/tier2 platform as at-risk only when headroom is thin or DR tier is cold", () => {
    const records = [
      record("infrastructure_platform", { platformName: "Healthy tier1", criticality: "tier1", capacityHeadroomPct: 60, drTier: "tier1_hot" }),
      record("infrastructure_platform", { platformName: "Thin headroom tier1", criticality: "tier1", capacityHeadroomPct: 5, drTier: "tier1_hot" }),
      record("infrastructure_platform", { platformName: "Cold DR tier2", criticality: "tier2", capacityHeadroomPct: 60, drTier: "tier3_backup_only" }),
      record("infrastructure_platform", { platformName: "Non-critical thin", criticality: "tier3", capacityHeadroomPct: 5, drTier: "tier1_hot" }),
    ];
    const dc = buildDecisionContext(records);
    const names = dc.infrastructure.atRiskPlatforms.map((p) => p.name);
    expect(names).toEqual(expect.arrayContaining(["Thin headroom tier1", "Cold DR tier2"]));
    expect(names).not.toContain("Healthy tier1");
    expect(names).not.toContain("Non-critical thin");
  });

  it("computes AI portfolio status counts and finance-validated value separately from promised value", () => {
    const records = [
      record("ai_automation_use_case", { useCaseName: "A", currentStatus: "production_enterprise_wide" }),
      record("ai_automation_use_case", { useCaseName: "B", currentStatus: "evaluation" }),
      record("ai_value_realization_signal", { promisedValueUsd: 1000, financeValidatedValueUsd: 200 }),
      record("ai_tool_usage_observation", { toolName: "Big gap tool", adoptionGapPct: 40 }),
      record("ai_tool_usage_observation", { toolName: "Small gap tool", adoptionGapPct: 5 }),
    ];
    const dc = buildDecisionContext(records);
    expect(dc.aiPortfolio.useCaseCount).toBe(2);
    expect(dc.aiPortfolio.promisedValue).toBe(1000);
    expect(dc.aiPortfolio.financeValidatedValue).toBe(200);
    expect(dc.aiPortfolio.toolAdoptionGaps.map((t) => t.tool)).toEqual(["Big gap tool"]);
  });

  it("reads relationship hub systems from the from_object_type column, not the row's own canonical type", () => {
    // Regression test for a real bug: report.relationshipCandidates tags every row's
    // sourceObjectType as "relationship_source_row" (the row's own canonical type), never the
    // declared from_object_type column -- so this function must accept relationship rows shaped
    // like the raw CSV (sourceObjectType = the real from-entity type), not that structure.
    const relRows = [
      { relationshipType: "integrates_with", sourceObjectType: "system", sourceObjectName: "Hub System", targetObjectType: "system", targetObjectName: "A", sourcePath: "x/12_relationships.csv" },
      { relationshipType: "integrates_with", sourceObjectType: "system", sourceObjectName: "Hub System", targetObjectType: "system", targetObjectName: "B", sourcePath: "x/12_relationships.csv" },
      { relationshipType: "integrates_with", sourceObjectType: "system", sourceObjectName: "Hub System", targetObjectType: "system", targetObjectName: "C", sourcePath: "x/12_relationships.csv" },
      { relationshipType: "integrates_with", sourceObjectType: "system", sourceObjectName: "Hub System", targetObjectType: "system", targetObjectName: "D", sourcePath: "x/12_relationships.csv" },
      { relationshipType: "integrates_with", sourceObjectType: "system", sourceObjectName: "Lightly connected", targetObjectType: "system", targetObjectName: "A", sourcePath: "x/12_relationships.csv" },
    ];
    const dc = buildDecisionContext([], relRows);
    expect(dc.relationships.hubSystems).toEqual([{ system: "Hub System", integrationCount: 4 }]);
  });

  it("surfaces a declared risk-to-program impact as a real link, not a candidate relationship", () => {
    const relRows = [
      { relationshipType: "impacts", sourceObjectType: "risk_or_control", sourceObjectName: "PAM gap", targetObjectType: "program", targetObjectName: "PAM Rollout", sourcePath: "x/12_relationships.csv" },
      { relationshipType: "impacts", sourceObjectType: "risk_or_control", sourceObjectName: "Unrelated risk", targetObjectType: "function", targetObjectName: "Some function", sourcePath: "x/12_relationships.csv" },
    ];
    const dc = buildDecisionContext([], relRows);
    expect(dc.relationships.riskToProgramImpacts).toEqual([{ risk: "PAM gap", program: "PAM Rollout" }]);
  });

  it("excludes an unresolved relationship row from the declared graph", () => {
    const relRows = [
      { relationshipType: "impacts", sourceObjectType: "risk_or_control", sourceObjectName: "R", targetObjectType: "program", targetObjectName: "P", sourcePath: "x/12_relationships.csv", resolutionStatus: "unresolved" as const },
    ];
    const dc = buildDecisionContext([], relRows);
    expect(dc.relationships.riskToProgramImpacts).toEqual([]);
  });

  it("selects a real verbatim quote only when consent is named or role_only, never anonymous", () => {
    // Regression test for a real bug: this file's consent_to_attribute values are
    // "named"/"anonymous"/"role_only", not yes/no -- the first version of this check compared
    // against "yes" and silently selected zero quotes from real data.
    const records = [
      record("ai_value_interview_evidence", { stakeholderRole: "CFO", themeTags: "consensus_theme", verbatimQuote: "Named quote", consentToAttribute: "named" }),
      record("ai_value_interview_evidence", { stakeholderRole: "CFO", themeTags: "consensus_theme", verbatimQuote: "Named quote", consentToAttribute: "named" }),
      record("ai_value_interview_evidence", { stakeholderRole: "CIO", themeTags: "no_consent_theme", verbatimQuote: "Should never appear", consentToAttribute: "anonymous" }),
      record("ai_value_interview_evidence", { stakeholderRole: "CIO", themeTags: "no_consent_theme", verbatimQuote: "Should never appear", consentToAttribute: "anonymous" }),
    ];
    const dc = buildDecisionContext(records);
    const quotes = dc.leadershipVoice.testimony.map((t) => t.quote);
    expect(quotes).toContain("Named quote");
    expect(quotes).not.toContain("Should never appear");
  });

  it("flags an operational process as high-friction on error rate or on a high automation candidate with low actual automation", () => {
    const records = [
      record("operational_process_evidence", { processName: "High error", errorRatePct: 8, automationPct: 90, automationCandidate: "Low" }),
      record("operational_process_evidence", { processName: "Candidate not automated", errorRatePct: 1, automationPct: 10, automationCandidate: "High" }),
      record("operational_process_evidence", { processName: "Fine", errorRatePct: 1, automationPct: 90, automationCandidate: "Low" }),
    ];
    const dc = buildDecisionContext(records);
    const names = dc.operationalProcesses.highFrictionProcesses.map((p) => p.name);
    expect(names).toEqual(expect.arrayContaining(["High error", "Candidate not automated"]));
    expect(names).not.toContain("Fine");
  });

  it("only reports a platform maturity gap when target exceeds current by a material margin", () => {
    const records = [
      record("platform_maturity_assessment", { platformOrCapability: "Big gap", maturityDimension: "Architecture", currentLevel: 2, targetLevel: 4 }),
      record("platform_maturity_assessment", { platformOrCapability: "At target", maturityDimension: "Architecture", currentLevel: 3, targetLevel: 3 }),
    ];
    const dc = buildDecisionContext(records);
    expect(dc.platformMaturity.gaps.map((g) => g.platform)).toEqual(["Big gap"]);
  });

  it("keeps industry patterns and expert lenses structurally separate from citeable signals", () => {
    const records = [
      record("industry_context_pattern", { patternName: "Some industry pattern" }),
      record("expert_lens", { lensName: "Some expert lens" }),
    ];
    const dc = buildDecisionContext(records);
    expect(dc.analyticalLenses).toEqual([
      { kind: "industry_pattern", label: "Some industry pattern" },
      { kind: "expert_lens", label: "Some expert lens" },
    ]);
  });
});

describe("buildEnterpriseSignalPacket -- newly-read domains", () => {
  it("carries analyticalLenses through to the packet without ids, so they can never be cited as evidence", () => {
    const records = [record("industry_context_pattern", { patternName: "A pattern" })];
    const dc = buildDecisionContext(records);
    const quality = buildContextQualityManifest(records, []);
    const packet = buildEnterpriseSignalPacket(dc, quality);
    expect(packet.analyticalLenses).toEqual([{ kind: "industry_pattern", label: "A pattern" }]);
    // No `id` field anywhere on a lens entry -- structurally impossible to reference one the same
    // way a claim references sig_* or ctx_*.
    expect(packet.analyticalLenses[0]).not.toHaveProperty("id");
  });

  it("emits a real quote as a testimony signal, not just a theme-frequency count", () => {
    const records = [
      record("ai_value_interview_evidence", { stakeholderRole: "CFO", themeTags: "shared_theme", verbatimQuote: "A real quote about the enterprise.", consentToAttribute: "named" }),
      record("ai_value_interview_evidence", { stakeholderRole: "CIO", themeTags: "shared_theme", verbatimQuote: "Another quote.", consentToAttribute: "named" }),
    ];
    const dc = buildDecisionContext(records);
    const quality = buildContextQualityManifest(records, []);
    const packet = buildEnterpriseSignalPacket(dc, quality);
    const testimonySignals = packet.signals.filter((s) => s.kind === "testimony");
    expect(testimonySignals.length).toBeGreaterThan(0);
    expect(testimonySignals[0].statement).toContain("A real quote about the enterprise.");
  });
});
