import {
  buildBafoScenarioTable,
  buildContractOptimizationAnalytics,
  buildEvidenceReadinessSummary,
  buildSourceExecutiveStoryPayload,
  buildVendorResponseAnalytics,
  assessEvaluationCriterionScoreReadiness,
  calculateChangeOrderLeakage,
  calculateEvidenceCompleteness,
  calculateFinancialExposureRange,
  calculateInvoiceLeakage,
  calculateRenewalUrgency,
  calculateResponseCompleteness,
  calculateStaffingVariance,
  calculateWeightedVendorScore,
  CONTRACT_OPTIMIZATION_REQUIRED_EVIDENCE,
  detectMissingEvidence,
  evidenceLightContractBaselineFixture,
  rankNegotiationLevers,
  rankVendors,
  skyHarborBafoLeverFixture,
  skyHarborContractOptimizationEvidencePartialFixture,
  skyHarborContractOptimizationEvidenceRichFixture,
  skyHarborVendorEvaluationFixture,
  skyHarborVendorResponseFixture,
} from "..";

describe("Source deterministic sourcing analytics", () => {
  it("assigns evidence-rich readiness when required contract evidence is present", () => {
    const fixture = skyHarborContractOptimizationEvidenceRichFixture();
    const readiness = buildEvidenceReadinessSummary({
      evidenceRefs: fixture.evidenceRefs,
      requiredEvidence: CONTRACT_OPTIMIZATION_REQUIRED_EVIDENCE,
    });

    expect(readiness.mode).toBe("evidence_rich");
    expect(readiness.completenessScore).toBe(100);
    expect(readiness.requiredEvidenceMissing).toHaveLength(0);
    expect(readiness.stageReadiness).toBe("ready");
    expect(
      calculateEvidenceCompleteness(
        fixture.evidenceRefs,
        CONTRACT_OPTIMIZATION_REQUIRED_EVIDENCE,
      ),
    ).toBe(100);
  });

  it("assigns evidence-partial readiness and explicit cannot-quantify items when invoices or staffing are missing", () => {
    const fixture = skyHarborContractOptimizationEvidencePartialFixture();
    const missing = detectMissingEvidence(
      fixture.evidenceRefs,
      CONTRACT_OPTIMIZATION_REQUIRED_EVIDENCE,
    );
    const readiness = buildEvidenceReadinessSummary({
      evidenceRefs: fixture.evidenceRefs,
      requiredEvidence: CONTRACT_OPTIMIZATION_REQUIRED_EVIDENCE,
    });

    expect(readiness.mode).toBe("evidence_partial");
    expect(missing).toEqual(
      expect.arrayContaining(["invoice_history", "staffing_model"]),
    );
    expect(readiness.cannotQuantify).toEqual(
      expect.arrayContaining(["invoice leakage", "staffing variance"]),
    );
    expect(readiness.recommendedDataRequests.join(" ")).toMatch(
      /invoice history/i,
    );
    expect(readiness.confidence).toBe("medium");
  });

  it("assigns evidence-light readiness and blocks quantified exposure for baseline-only evidence", () => {
    const analytics = buildContractOptimizationAnalytics(
      evidenceLightContractBaselineFixture(),
    );

    expect(analytics.readiness.mode).toBe("evidence_light");
    expect(analytics.exposureLowUsd).toBeNull();
    expect(analytics.exposureHighUsd).toBeNull();
    expect(analytics.exposureLabel).toBe(
      "not enough evidence to quantify exposure yet",
    );
    expect(analytics.recommendedPath.join(" ")).toMatch(
      /Do not claim savings/i,
    );
  });

  it("calculates invoice, staffing, change-order, renewal, and exposure deterministically", () => {
    const fixture = skyHarborContractOptimizationEvidenceRichFixture();
    const invoice = calculateInvoiceLeakage(fixture.invoiceLines);
    const staffing = calculateStaffingVariance(fixture.staffingCommitments);
    const changeOrder = calculateChangeOrderLeakage(fixture.changeOrders);
    const renewal = calculateRenewalUrgency(fixture.renewalNoticeDate);
    const exposure = calculateFinancialExposureRange({
      invoiceAnnualizedUsd: invoice.annualizedLeakageUsd,
      staffingAnnualizedUsd: staffing.annualizedExposureUsd,
      changeOrderAnnualizedUsd: changeOrder.annualizedLeakageUsd,
    });

    expect(invoice.sampledLeakageUsd).toBe(791_000);
    expect(invoice.annualizedLeakageUsd).toBe(1_582_000);
    expect(staffing.committedFte).toBe(114);
    expect(staffing.missingFte).toBe(12);
    expect(Math.round(staffing.variancePct * 10) / 10).toBe(10.5);
    expect(staffing.annualizedExposureUsd).toBe(2_220_000);
    expect(changeOrder.recurringExposureUsd).toBe(1_008_000);
    expect(renewal.urgency).toBe("high");
    expect(exposure.label).toBe(
      "$3.6M-$4.8M annualized, subject to vendor cure review",
    );
  });

  it("builds contract optimization analytics with the proven SkyHarbor posture", () => {
    const analytics = buildContractOptimizationAnalytics(
      skyHarborContractOptimizationEvidenceRichFixture(),
    );

    expect(analytics.readiness.mode).toBe("evidence_rich");
    expect(analytics.exposureLabel).toBe(
      "$3.6M-$4.8M annualized, subject to vendor cure review",
    );
    expect(analytics.recommendedPath).toEqual([
      "Do not renew as-is.",
      "Issue cure and reservation-of-rights notice.",
      "Renegotiate the incumbent with cure conditions.",
      "Prepare RFP fallback if cure items remain open.",
    ]);
    expect(analytics.findings.map((finding) => finding.title)).toEqual(
      expect.arrayContaining([
        "Invoice leakage",
        "Weak SLA economics",
        "Staffing variance",
        "Change-order leakage",
        "Renewal leverage window",
      ]),
    );
  });

  it("keeps vendor response analytics tied to MVE fields rather than arbitrary document browsing", () => {
    const [vendorA, vendorB] = skyHarborVendorResponseFixture();
    const vendorAAnalytics = buildVendorResponseAnalytics(vendorA);
    const vendorBAnalytics = buildVendorResponseAnalytics(vendorB);

    expect(calculateResponseCompleteness(vendorA.sections)).toBe(100);
    expect(vendorAAnalytics.readyForEvaluation).toBe("yes");
    expect(vendorBAnalytics.readyForEvaluation).toBe("conditional");
    expect(vendorBAnalytics.unsupportedClaims).toContain(
      "automation productivity by year two",
    );
    expect(vendorBAnalytics.clarificationQuestions.join(" ")).toMatch(
      /productivity credit/i,
    );
    expect(vendorBAnalytics.findings.map((finding) => finding.title)).toEqual(
      expect.arrayContaining([
        "Unsupported vendor claims",
        "Pricing is not fully comparable",
        "Transition readiness is conditional",
      ]),
    );
  });

  it("ranks all vendors and preserves the proven A/B/C sourcing posture", () => {
    const results = rankVendors(skyHarborVendorEvaluationFixture());
    const names = results.map((result) => result.vendorName);
    const vendorA = results.find((result) => result.vendorName === "Vendor A");
    const vendorB = results.find((result) => result.vendorName === "Vendor B");
    const vendorC = results.find((result) => result.vendorName === "Vendor C");

    expect(names).toEqual(
      expect.arrayContaining(["Vendor A", "Vendor B", "Vendor C"]),
    );
    expect(vendorA?.rank).toBe(1);
    expect(vendorA?.readiness).toBe("advance");
    expect(vendorB?.executiveTradeoff).toMatch(/price benchmark/i);
    expect(vendorB?.readiness).toBe("conditional");
    expect(vendorC?.executiveTradeoff).toMatch(
      /service-accountability finalist/i,
    );
    expect(vendorC?.rank).toBe(2);
    expect(
      calculateWeightedVendorScore(vendorA?.categoryScores ?? []),
    ).toBeGreaterThan(7);
  });

  it("marks evaluation criteria scoreable only when cited required evidence is present", () => {
    const [vendorA] = skyHarborVendorResponseFixture();
    const readiness = assessEvaluationCriterionScoreReadiness({
      vendorId: vendorA.vendorId,
      vendorName: vendorA.vendorName,
      category: "Transition quality",
      weight: 20,
      proposedScore: 8.4,
      rationale:
        "Transition milestones, dependencies, and exit criteria are all cited.",
      evidenceRefs: vendorA.evidenceRefs.filter((ref) =>
        ["transition_plan", "staffing_location_model"].includes(
          ref.evidenceType,
        ),
      ),
      requiredEvidence: ["transition_plan", "staffing_location_model"],
    });

    expect(readiness.eligibility).toBe("scoreable");
    expect(readiness.score).toMatchObject({
      category: "Transition quality",
      weight: 20,
      score: 8.4,
    });
    expect(readiness.nextAction).toBe(
      "Ready for named evaluator review. AI suggestion is not final.",
    );
  });

  it("blocks evaluation scoring when mandatory evidence is absent", () => {
    const readiness = assessEvaluationCriterionScoreReadiness({
      vendorId: "vendor-b",
      vendorName: "Vendor B",
      category: "Commercial model",
      weight: 20,
      proposedScore: 7.1,
      rationale: "Pricing is directionally attractive.",
      evidenceRefs: [],
      requiredEvidence: ["pricing_workbook", "commercial_exceptions_table"],
    });

    expect(readiness.eligibility).toBe("not_scoreable");
    expect(readiness.score).toBeNull();
    expect(readiness.blockers).toContain(
      "At least one cited evidence item is required before scoring.",
    );
    expect(readiness.nextAction).toMatch(/Load cited evidence/i);
  });

  it("requires clarification before scoring partial or low-confidence evidence", () => {
    const [vendorA] = skyHarborVendorResponseFixture();
    const readiness = assessEvaluationCriterionScoreReadiness({
      vendorId: vendorA.vendorId,
      vendorName: vendorA.vendorName,
      category: "SLA strength",
      weight: 15,
      proposedScore: 6.8,
      rationale: "SLA targets exist but the remedy table is not score-ready.",
      evidenceRefs: [
        {
          evidenceId: "E-SLA-DRAFT",
          evidenceType: "sla_commitment_table",
          fileName: "draft-sla-table.xlsx",
          sourceLabel: "Draft SLA exhibit",
          confidence: "low",
        },
      ],
      requiredEvidence: ["sla_commitment_table", "commercial_exceptions_table"],
      clarificationPrompt:
        "Ask the vendor for the signed remedy table and commercial exceptions.",
    });

    expect(readiness.eligibility).toBe("clarification_required");
    expect(readiness.score).toBeNull();
    expect(readiness.blockers).toEqual(
      expect.arrayContaining([
        "Missing required evidence: commercial_exceptions_table.",
        "Only low-confidence evidence is available.",
      ]),
    );
    expect(readiness.nextAction).toMatch(/signed remedy table/i);
  });

  it("builds BAFO leverage and condition-to-score scenario tables", () => {
    const levers = rankNegotiationLevers(skyHarborBafoLeverFixture());
    const table = buildBafoScenarioTable(skyHarborBafoLeverFixture());

    expect(levers[0]).toMatchObject({
      vendorName: "Vendor B",
      issue: "unsupported productivity economics",
      severity: "high",
      scoreImpact: 0.45,
    });
    expect(table).toHaveLength(3);
    expect(table.map((row) => row.vendorName)).toEqual(
      expect.arrayContaining(["Vendor A", "Vendor B", "Vendor C"]),
    );
  });

  it("builds an executive story payload without internal scaffolding language", () => {
    const contractAnalytics = buildContractOptimizationAnalytics(
      skyHarborContractOptimizationEvidenceRichFixture(),
    );
    const story = buildSourceExecutiveStoryPayload({ contractAnalytics });
    const serialized = JSON.stringify(story);

    expect(story.executiveMessage.join(" ")).toMatch(/Do not renew/i);
    expect(story.commercialOpportunityMap.map((item) => item.label)).toEqual([
      "Recover cash",
      "Reduce future spend",
      "Reduce operational risk",
      "Increase vendor accountability",
    ]);
    expect(story.doNothingScenario.join(" ")).toMatch(/Exposure persists/i);
    expect(story.decisionTimeline).toHaveLength(3);
    expect(story.businessImpactMapping.map((item) => item.impact)).toEqual(
      expect.arrayContaining(["cost", "risk", "vendor_accountability"]),
    );
    expect(story.suggestedAvaAnswerFrame.directAnswer).toMatch(
      /Do not renew as-is/i,
    );
    expect(serialized).not.toMatch(
      /raw Claude|source_events|prompt|route name|scaffold/i,
    );
  });
});
