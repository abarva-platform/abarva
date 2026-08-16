// Proposal Intelligence core proof: governed scoring (AI never final), honest levers
// (no fabricated savings), deterministic health scaffold, and provable vendor isolation.
import {
  applyAiSuggestion,
  applyEvaluatorScore,
  lockScore,
  unlockScore,
  computeVendorTotals,
} from "../scoring";
import { buildVendorLevers, topLevers } from "../levers";
import { buildHealthScaffold } from "../health";
import {
  checkVendorIsolation,
  isolateBundleForVendor,
  buildProposalContextTrace,
} from "../isolation";
import {
  buildVendorBafoInstructionPack,
  buildVendorChallengeIntelligence,
  buildVendorEvaluationDecisionView,
  buildVendorResponseMveProfiles,
} from "../mve-profile";
import {
  buildVendorResponseParseReport,
  buildVendorResponseParseReportsFromProfiles,
  compactVendorResponseParseReportsForRoute,
} from "../parser";
import {
  buildSourceBafoLeverageOptimizer,
  buildSourceExecutiveDecisionPack,
  buildSourceFirstPassScorecard,
  buildSourceValueRealizationProofPlan,
} from "../backlog-clearance";
import type {
  EvaluationCriterion,
  ProposalNormalizationRow,
  VendorScore,
} from "../types";

const criterion = (
  over: Partial<EvaluationCriterion> = {},
): EvaluationCriterion => ({
  criteriaId: "C1",
  category: "pricing",
  description: "Pricing competitiveness",
  weight: 30,
  scoringScale: "1-5",
  evaluatorRole: "commercial",
  requiredEvidence: [],
  scoringGuidance: "",
  redFlags: [],
  approvedBy: "client-user",
  approvedAt: "t",
  ...over,
});

const blankScore = (over: Partial<VendorScore> = {}): VendorScore => ({
  sourceEventId: "e1",
  vendorName: "Meridian Systems",
  responseVersion: 1,
  criteriaId: "C1",
  aiSuggestedScore: null,
  aiRationale: null,
  evidenceReference: null,
  aiConfidence: null,
  evaluatorScore: null,
  evaluatorComment: null,
  evaluatorId: null,
  overrideReason: null,
  finalScore: null,
  locked: false,
  lockedBy: null,
  lockedAt: null,
  ...over,
});

describe("scoring — AI suggests, human decides", () => {
  it("AI suggestion never sets the final score", () => {
    const r = applyAiSuggestion(blankScore(), {
      score: 4,
      rationale: "Strong SLA evidence",
      evidenceReference: "v1:p12",
      confidence: "high",
    });
    expect(r.ok).toBe(true);
    expect(r.score!.aiSuggestedScore).toBe(4);
    expect(r.score!.finalScore).toBeNull();
  });

  it("an AI-only score can never lock", () => {
    const withAi = applyAiSuggestion(blankScore(), {
      score: 4,
      rationale: "x",
      evidenceReference: null,
      confidence: "medium",
    }).score!;
    const r = lockScore(withAi, criterion(), "maestro", "t1");
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/AI suggestions are never final/);
  });

  it("departing from the AI suggestion requires an override reason", () => {
    const withAi = applyAiSuggestion(blankScore(), {
      score: 4,
      rationale: "x",
      evidenceReference: null,
      confidence: "medium",
    }).score!;
    const noReason = applyEvaluatorScore(withAi, {
      evaluatorId: "eva",
      score: 2,
    });
    expect(noReason.ok).toBe(false);
    const withReason = applyEvaluatorScore(withAi, {
      evaluatorId: "eva",
      score: 2,
      overrideReason: "Reference checks contradict the claim.",
    });
    expect(withReason.ok).toBe(true);
    expect(withReason.score!.finalScore).toBe(2);
    expect(withReason.score!.overrideReason).toMatch(/Reference checks/);
  });

  it("locking requires client-approved criteria and a named evaluator decision", () => {
    const scored = applyEvaluatorScore(blankScore(), {
      evaluatorId: "eva",
      score: 3,
    }).score!;
    expect(
      lockScore(scored, criterion({ approvedBy: null }), "maestro", "t").ok,
    ).toBe(false);
    const ok = lockScore(scored, criterion(), "maestro", "t");
    expect(ok.ok).toBe(true);
    expect(ok.score!.locked).toBe(true);
    // locked is immutable without an explicit unlock + reason
    expect(
      applyEvaluatorScore(ok.score!, {
        evaluatorId: "eva",
        score: 5,
        overrideReason: "x",
      }).ok,
    ).toBe(false);
    expect(unlockScore(ok.score!, "maestro", "").ok).toBe(false);
    expect(unlockScore(ok.score!, "maestro", "committee re-review").ok).toBe(
      true,
    );
  });

  it("weighted totals count only locked, evaluator-decided finals", () => {
    const c1 = criterion({ criteriaId: "C1", weight: 60 });
    const c2 = criterion({ criteriaId: "C2", weight: 40 });
    const a1 = lockScore(
      applyEvaluatorScore(blankScore({ criteriaId: "C1" }), {
        evaluatorId: "e",
        score: 4,
      }).score!,
      c1,
      "m",
      "t",
    ).score!;
    const a2 = blankScore({ criteriaId: "C2", aiSuggestedScore: 5 }); // AI-only — must not count
    const b1 = lockScore(
      applyEvaluatorScore(
        blankScore({ vendorName: "Helios", criteriaId: "C1" }),
        { evaluatorId: "e", score: 3 },
      ).score!,
      c1,
      "m",
      "t",
    ).score!;
    const b2 = lockScore(
      applyEvaluatorScore(
        blankScore({ vendorName: "Helios", criteriaId: "C2" }),
        { evaluatorId: "e", score: 5 },
      ).score!,
      c2,
      "m",
      "t",
    ).score!;
    const totals = computeVendorTotals([c1, c2], [a1, a2, b1, b2]);
    const meridian = totals.find((t) => t.vendorName === "Meridian Systems")!;
    const helios = totals.find((t) => t.vendorName === "Helios")!;
    expect(meridian.weightedTotal).toBe(4); // only C1 locked
    expect(meridian.lockedCount).toBe(1);
    expect(helios.weightedTotal).toBe(3.8); // (3*60 + 5*40)/100
  });
});

const row = (
  over: Partial<ProposalNormalizationRow>,
): ProposalNormalizationRow => ({
  sourceEventId: "e1",
  vendorName: "Meridian Systems",
  responseVersion: 1,
  rfpSection: "12",
  normalizedCategory: "pricing_structure",
  vendorResponseSummary: "",
  evidenceReference: "v1:p30",
  normalizedAnswer: "ok",
  confidence: "medium",
  completeness: "complete",
  deviations: [],
  assumptions: [],
  evaluatorNotes: null,
  ...over,
});

describe("levers — honesty rules", () => {
  it("emits a quantified range ONLY with run-rate + evidence; else opportunity_to_test", () => {
    const rows = [
      row({
        normalizedCategory: "commercial_model",
        vendorResponseSummary: "Annual COLA indexation applies per CPI",
        evidenceReference: "v1:p41",
      }),
      row({
        normalizedCategory: "automation_productivity",
        deviations: ["Productivity claim is vague and not committed"],
        evidenceReference: null,
      }),
    ];
    const withRunRate = buildVendorLevers({
      vendorName: "Meridian Systems",
      rows,
      findings: [],
      annualRunRateUsd: 10_000_000,
    });
    const cola = withRunRate.find((l) => l.leverType === "cola_indexation")!;
    expect(cola.valueBasis).toBe("evidenced");
    expect(cola.expectedValueLowUsd).toBe(100_000);
    expect(cola.expectedValueHighUsd).toBe(300_000);
    const prod = withRunRate.find(
      (l) => l.leverType === "productivity_commitment",
    )!;
    expect(prod.valueBasis).toBe("opportunity_to_test"); // no evidence ref → no fabricated savings
    expect(prod.expectedValueLowUsd).toBeNull();

    const noRunRate = buildVendorLevers({
      vendorName: "Meridian Systems",
      rows,
      findings: [],
      annualRunRateUsd: null,
    });
    expect(
      noRunRate.find((l) => l.leverType === "cola_indexation")!.valueBasis,
    ).toBe("opportunity_to_test");
  });

  it("flags bundled pricing as a P0 transparency lever and ranks it first", () => {
    const rows = [
      row({
        normalizedAnswer: null,
        deviations: [
          "Infrastructure priced as bundled fixed fee — no tower breakout",
        ],
      }),
    ];
    const levers = buildVendorLevers({
      vendorName: "Helios",
      rows,
      findings: [],
      annualRunRateUsd: null,
    });
    const top = topLevers(levers, 10);
    expect(top[0].leverType).toBe("cost_transparency");
    expect(top[0].bafoPriority).toBe("P0");
    expect(top[0].negotiationAsk).toMatch(/tower-level/i);
  });
});

describe("health scaffold", () => {
  it("computes completeness, missing sections, file gaps, and an honest readiness verdict", () => {
    const health = buildHealthScaffold({
      sourceEventId: "e1",
      vendorName: "Helios",
      responseVersion: 1,
      requiredSections: ["scope", "sla", "pricing", "transition"],
      answeredSections: ["scope", "sla"],
      files: [
        {
          role: "response_package",
          fileName: "helios.pdf",
          artifactId: "a1",
          blobPath: "p",
        },
      ], // pricing workbook missing
      rows: [
        row({
          vendorName: "Helios",
          normalizedAnswer: null,
          deviations: ["Bundled fixed fee — no breakout"],
        }),
      ],
    });
    expect(health.completeness).toBe(0.5);
    expect(health.missingSections).toEqual(["pricing", "transition"]);
    expect(
      health.findings.some((f) =>
        f.finding.match(/pricing workbook not received/i),
      ),
    ).toBe(true);
    expect(health.scoreReadiness).toBe("not_ready"); // >2 reds
    expect(health.clarificationQuestions.length).toBeGreaterThanOrEqual(3);
  });

  it("ready_to_score when complete with no red findings", () => {
    const health = buildHealthScaffold({
      sourceEventId: "e1",
      vendorName: "Meridian Systems",
      responseVersion: 1,
      requiredSections: ["scope"],
      answeredSections: ["scope"],
      files: [
        {
          role: "response_package",
          fileName: "r.pdf",
          artifactId: "a1",
          blobPath: "p",
        },
        {
          role: "pricing_workbook",
          fileName: "p.xlsx",
          artifactId: "a2",
          blobPath: "p2",
        },
      ],
      rows: [row({})],
    });
    expect(health.scoreReadiness).toBe("ready_to_score");
    expect(health.completeness).toBe(1);
  });
});

describe("vendor response parser contract", () => {
  it("turns a long response package into section citations, missing inputs, and scoring holdbacks", () => {
    const report = buildVendorResponseParseReport({
      sourceEventId: "source-event-1",
      tenantKey: "tenant-a",
      vendorName: "Vendor Alpha",
      responseVersion: 1,
      requiredSections: [
        "Scope confirmation",
        "Pricing template",
        "SLA response",
        "Staffing model",
        "Transition plan",
        "Security and compliance response",
        "Solution architecture",
        "Automation / productivity roadmap",
      ],
      documents: [
        {
          fileName: "vendor-alpha-main-response.pdf",
          role: "response_package",
          text: [
            "Scope: Vendor Alpha confirms in-scope application support and retained-client handoffs.",
            "SLA response: P1 incidents carry service credits, but credits are capped at four percent.",
            "Staffing model: Follow-the-sun staffing is provided by named FTE bands and locations.",
            "Transition plan: Knowledge transfer is dependent on client SMEs and the fee is front-loaded.",
            "Security and compliance response: SOC 2 bridge letter and incident notice terms are included.",
            "Solution architecture: Private lakehouse integration, service-management workflow, and controlled AI assistant pattern are described with ownership boundaries.",
            "Automation productivity roadmap: Vendor targets productivity opportunity, not committed price-down.",
          ].join("\n\n"),
        },
        {
          fileName: "vendor-alpha-pricing.xlsx",
          role: "pricing_workbook",
          text: "Pricing: Year one run-rate, transition, tooling, optional costs, and TCO are broken out by tower.",
        },
      ],
    });

    expect(report.vendorIsolationStatus).toBe("isolated");
    expect(report.status).toBe("parsed_with_gaps");
    expect(report.citationCount).toBeGreaterThanOrEqual(7);
    expect(
      report.fileRoleReadiness.find((row) => row.role === "pricing_workbook"),
    ).toMatchObject({ uploaded: true, parsed: true, required: true });
    expect(
      report.sectionFindings.find((row) => row.section === "Pricing template"),
    ).toMatchObject({ status: "answered" });
    expect(
      report.sectionFindings.find((row) => row.section === "SLA response"),
    ).toMatchObject({ status: "weak" });
    expect(
      report.sectionFindings.find(
        (row) => row.section === "Solution architecture",
      ),
    ).toMatchObject({
      status: "answered",
      normalizedCategory: "solution_architecture",
    });
    expect(
      report.missingInputs.some((missing) =>
        /Automation \/ productivity roadmap/.test(missing.request),
      ),
    ).toBe(true);
    expect(report.health.scoreReadiness).not.toBe("ready_to_score");
    expect(report.nextAction).toMatch(/Clarify weak evidence|Ask vendor/);
  });

  it("blocks parsing when a rival vendor document enters the package", () => {
    const report = buildVendorResponseParseReport({
      sourceEventId: "source-event-1",
      tenantKey: "tenant-a",
      vendorName: "Vendor Alpha",
      responseVersion: 1,
      requiredSections: ["Scope confirmation"],
      documents: [
        {
          fileName: "vendor-alpha-main-response.pdf",
          role: "response_package",
          vendorName: "Vendor Alpha",
          text: "Scope: Vendor Alpha confirms the work.",
        },
        {
          fileName: "vendor-beta-main-response.pdf",
          role: "response_package",
          vendorName: "Vendor Beta",
          text: "Scope: Vendor Beta confirms different work.",
        },
      ],
    });

    expect(report.status).toBe("isolation_blocked");
    expect(report.vendorIsolationStatus).toBe("violation_detected");
    expect(report.parsedDocumentCount).toBe(1);
    expect(
      report.citations.every(
        (citation) => citation.vendorName === "Vendor Alpha",
      ),
    ).toBe(true);
    expect(report.nextAction).toMatch(/Remove rival-vendor documents/);
  });

  it("keeps pricing workbook mandatory and proof exhibits optional", () => {
    const report = buildVendorResponseParseReport({
      sourceEventId: "source-event-1",
      tenantKey: "tenant-a",
      vendorName: "Vendor Alpha",
      responseVersion: 1,
      requiredSections: ["Scope confirmation"],
      documents: [
        {
          fileName: "vendor-alpha-main-response.pdf",
          role: "response_package",
          text: "Scope: Vendor Alpha confirms in-scope support.",
        },
      ],
    });

    expect(
      report.fileRoleReadiness.find((row) => row.role === "pricing_workbook"),
    ).toMatchObject({
      required: true,
      uploaded: false,
      nextAction: "Upload pricing workbook.",
    });
    expect(
      report.fileRoleReadiness.find((row) => row.role === "exhibits"),
    ).toMatchObject({
      required: false,
      uploaded: false,
      nextAction: "Use only if it strengthens leverage or proof.",
    });
    expect(report.missingInputs[0]).toMatchObject({
      severity: "blocker",
      ownerRole: "Commercial lead",
    });
  });

  it("compacts route parse reports while preserving scoring and leverage inputs", () => {
    const profileSet = buildVendorResponseMveProfiles({
      id: "skyh-test-event",
      code: "SKYH-SKYHARBOR-AMS-OUTSOURCING-2026",
      name: "Managed services sourcing event",
      accountName: "Demo account",
    });
    const fullReports = buildVendorResponseParseReportsFromProfiles(profileSet);
    const compactReports = compactVendorResponseParseReportsForRoute(fullReports);

    expect(Buffer.byteLength(JSON.stringify(compactReports))).toBeLessThan(
      Buffer.byteLength(JSON.stringify(fullReports)) * 0.75,
    );
    expect(compactReports).toHaveLength(fullReports.length);
    expect(compactReports[0]?.sectionFindings.length).toBe(
      fullReports[0]?.sectionFindings.length,
    );
    expect(compactReports[0]?.missingInputs.length).toBe(
      fullReports[0]?.missingInputs.length,
    );
    expect(compactReports[0]?.citations.length).toBeLessThanOrEqual(
      fullReports[0]?.citations.length ?? 0,
    );

    const scorecard = buildSourceFirstPassScorecard(compactReports);
    const optimizer = buildSourceBafoLeverageOptimizer(compactReports);
    const decisionPack = buildSourceExecutiveDecisionPack(
      scorecard,
      optimizer,
    );
    const valuePlan = buildSourceValueRealizationProofPlan(optimizer);

    expect(scorecard.totalVendorCount).toBe(fullReports.length);
    expect(scorecard.holdbacks.length).toBeGreaterThan(0);
    expect(optimizer.levers.length).toBeGreaterThan(0);
    expect(decisionPack.decisionConditions.length).toBeGreaterThan(0);
    expect(valuePlan.guardrail).toMatch(/not realized savings/i);
  });
});

describe("source backlog clearance engines", () => {
  const reports = [
    buildVendorResponseParseReport({
      sourceEventId: "source-event-1",
      tenantKey: "tenant-a",
      vendorName: "Vendor Alpha",
      responseVersion: 1,
      requiredSections: [
        "Scope confirmation",
        "Pricing template",
        "SLA response",
        "Staffing model",
        "Transition plan",
        "Security and compliance response",
        "Automation / productivity roadmap",
      ],
      documents: [
        {
          fileName: "vendor-alpha-main-response.pdf",
          role: "response_package",
          text: [
            "Scope: Vendor Alpha confirms all in-scope work.",
            "SLA response: Service credits apply, but the earn-back is easy.",
            "Staffing model: Named FTE locations and shift coverage are provided.",
            "Transition plan: Transition fee is not at risk and is not milestone-gated.",
            "Security and compliance response: SOC 2 bridge letter is included.",
            "Automation productivity roadmap: Productivity is not committed in price.",
          ].join("\n\n"),
        },
        {
          fileName: "vendor-alpha-pricing.xlsx",
          role: "pricing_workbook",
          text: "Pricing: year one run-rate 10000000 with tower breakout and uncapped pass-through tooling.",
        },
      ],
    }),
    buildVendorResponseParseReport({
      sourceEventId: "source-event-1",
      tenantKey: "tenant-a",
      vendorName: "Vendor Beta",
      responseVersion: 1,
      requiredSections: [
        "Scope confirmation",
        "Pricing template",
        "SLA response",
      ],
      documents: [
        {
          fileName: "vendor-beta-main-response.pdf",
          role: "response_package",
          text: "Scope: Vendor Beta confirms the work.\n\nSLA response: Best effort only.",
        },
      ],
    }),
  ];

  it("builds first-pass scoring suggestions without final scores", () => {
    const scorecard = buildSourceFirstPassScorecard(reports);

    expect(scorecard.totalVendorCount).toBe(2);
    expect(scorecard.scores.length).toBeGreaterThan(0);
    expect(scorecard.scores.every((score) => score.finalScore === null)).toBe(
      true,
    );
    expect(
      scorecard.scores.every((score) => score.evaluatorScore === null),
    ).toBe(true);
    expect(scorecard.holdbacks.length).toBeGreaterThan(0);
    expect(scorecard.nextAction).toMatch(/holdbacks/i);
  });

  it("optimizes BAFO leverage while separating evidenced value from opportunity to test", () => {
    const optimizer = buildSourceBafoLeverageOptimizer(reports);

    expect(optimizer.levers.length).toBeGreaterThan(0);
    expect(optimizer.guardrail).toMatch(/not booked savings/i);
    expect(
      optimizer.levers.some((lever) => lever.valueBasis === "evidenced"),
    ).toBe(true);
    expect(
      optimizer.levers.some(
        (lever) => lever.valueBasis === "opportunity_to_test",
      ),
    ).toBe(true);
    expect(optimizer.evidencedValueLowUsd).not.toBeNull();
  });

  it("builds a CXO decision pack and value proof plan without booking unproven savings", () => {
    const scorecard = buildSourceFirstPassScorecard(reports);
    const optimizer = buildSourceBafoLeverageOptimizer(reports);
    const executivePack = buildSourceExecutiveDecisionPack(
      scorecard,
      optimizer,
    );
    const valuePlan = buildSourceValueRealizationProofPlan(optimizer);

    expect(executivePack.posture).not.toBe("ready_for_cxo_review");
    expect(executivePack.decisionConditions.length).toBeGreaterThan(0);
    expect(executivePack.evidenceUsed.length).toBeGreaterThan(0);
    expect(executivePack.recommendation).toMatch(/Hold|Run BAFO/i);
    expect(valuePlan.guardrail).toMatch(/realized savings/i);
    expect(valuePlan.bookedValueLowUsd).toBe(optimizer.evidencedValueLowUsd);
    expect(valuePlan.missingProof.length).toBeGreaterThan(0);
  });
});

describe("vendor isolation — structural + provable", () => {
  const objects = [
    { ref: "rfp:req-1", vendorName: null },
    { ref: "meridian:proposal:p1", vendorName: "Meridian Systems" },
    { ref: "helios:proposal:p9", vendorName: "Helios" },
  ];

  it("detects a rival object in the bundle", () => {
    const check = checkVendorIsolation("Meridian Systems", objects);
    expect(check.status).toBe("violation_detected");
    expect(check.violations).toEqual(["helios:proposal:p9"]);
  });

  it("isolateBundleForVendor strips rival objects, keeps shared RFP objects", () => {
    const { bundle, excludedCount } = isolateBundleForVendor(
      "Meridian Systems",
      objects,
    );
    expect(bundle.map((o) => o.ref)).toEqual([
      "rfp:req-1",
      "meridian:proposal:p1",
    ]);
    expect(excludedCount).toBe(1);
  });

  it("trace asserts isolation status + claim support honestly", () => {
    const clean = buildProposalContextTrace({
      sourceEventId: "e1",
      vendorName: "Meridian Systems",
      proposalVersion: 1,
      tenantId: "t",
      archetype: "AMS_IT_OUTSOURCING",
      evaluationStage: "evaluation",
      rfpRequirementsRetrieved: 12,
      vendorFiles: ["r.pdf"],
      normalizedCategories: ["pricing_structure"],
      evidenceUsed: ["v1:p30"],
      pricingInputsUsed: ["d19:meridian"],
      excludedByReason: {},
      scoringCriteriaUsed: ["C1"],
      assumptions: [],
      missingInputs: [],
      claims: [
        { text: "Run cost $10M", citation: "v1:p30" },
        { text: "Uncited claim" },
      ],
      citations: ["v1:p30"],
      bundleObjects: [
        { ref: "meridian:p1", vendorName: "Meridian Systems" },
        { ref: "rfp:1", vendorName: null },
      ],
    });
    expect(clean.vendor_isolation_status).toBe("isolated");
    expect(clean.claims_supported).toBe(1);
    expect(clean.claims_unsupported).toBe(1);

    const dirty = buildProposalContextTrace({
      sourceEventId: "e1",
      vendorName: "Meridian Systems",
      proposalVersion: 1,
      tenantId: "t",
      archetype: "AMS",
      evaluationStage: "evaluation",
      rfpRequirementsRetrieved: 0,
      vendorFiles: [],
      normalizedCategories: [],
      evidenceUsed: [],
      pricingInputsUsed: [],
      excludedByReason: {},
      scoringCriteriaUsed: [],
      assumptions: [],
      missingInputs: [],
      claims: [],
      citations: [],
      bundleObjects: [{ ref: "helios:p9", vendorName: "Helios" }],
    });
    expect(dirty.vendor_isolation_status).toBe("violation_detected");
    expect(dirty.excluded_objects_by_reason.vendor_isolation_excluded).toBe(1);
  });
});

describe("vendor response MVE profiles", () => {
  it("builds three SkyHarbor synthetic vendor profiles from long response packages plus exhibits", () => {
    const set = buildVendorResponseMveProfiles({
      id: "49c77bca-471d-4398-8b13-fa8ed1487597",
      code: "SKYH-SKYHARBOR-AMS-OUTSOURCING-2026",
      name: "SkyHarbor AMS Outsourcing RFP",
      accountName: "SkyHarbor Air",
    });

    expect(set).toBeTruthy();
    expect(set!.profiles).toHaveLength(3);
    expect(set!.profiles.every((profile) => profile.syntheticDemo)).toBe(true);
    expect(set!.profiles.every((profile) => profile.sectionMap.length)).toBe(
      true,
    );
    expect(set!.profiles.every((profile) => profile.exhibits.length >= 9)).toBe(
      true,
    );
    expect(
      set!.profiles.every((profile) => profile.extractionCards.length >= 3),
    ).toBe(true);
  });

  it("flags narrative/exhibit mismatches as unsupported claims and conditional readiness", () => {
    const set = buildVendorResponseMveProfiles({
      id: "skyh-test-event",
      code: "SKYH-SKYHARBOR-AMS-OUTSOURCING-2026",
      name: "SkyHarbor AMS Outsourcing RFP",
    })!;
    const scaleProfile = set.profiles.find((profile) =>
      profile.vendorId.includes("scale"),
    )!;

    expect(scaleProfile.readyForEvaluation).toBe("conditional");
    expect(scaleProfile.unsupportedClaims).toEqual(
      expect.arrayContaining([
        "Automation claim is unsupported commercially",
        "24x7 coverage is not staffed",
      ]),
    );
    expect(scaleProfile.clarificationQuestions.join(" ")).toMatch(
      /baseline|pricing credit|FTE|location/i,
    );
    expect(scaleProfile.pricingSummary.fiveYearTcoUsd).toBe(91_800_000);
  });

  it("does not bind SkyHarbor synthetic profiles to a non-SkyHarbor event", () => {
    expect(
      buildVendorResponseMveProfiles({
        id: "apex-retail-ams-outsourcing-2026",
        code: "APEX-AMS-2026",
        name: "Apex AMS Outsourcing",
        accountName: "Apex Retail",
      }),
    ).toBeNull();
  });

  it("builds shared-services AMS profiles for Lakeshore without airline language", () => {
    const set = buildVendorResponseMveProfiles({
      id: "18439aee-9889-4e97-a444-4d9e43a85bd5",
      code: "LAKE-SHARED-SERVICES-AMS-2026",
      name: "Lakeshore Shared Services AMS",
      accountName: "Lakeshore Holdings",
    });

    expect(set).toBeTruthy();
    expect(set!.tenantKey).toBe("lakeshore");
    expect(set!.eventName).toBe("Lakeshore Shared Services AMS");
    expect(set!.profiles).toHaveLength(3);
    const profileText = JSON.stringify(set);
    expect(profileText).toMatch(/Corporate Shared Services Support/);
    expect(profileText).toMatch(
      /Finance, HR, Legal, Procurement, Treasury, and Compliance coverage/,
    );
    expect(profileText).not.toMatch(
      /Airline Operations Support|IROPS|airport operations|airline-critical/i,
    );
  });
});

describe("vendor challenge log and commercial leverage seeds", () => {
  const set = buildVendorResponseMveProfiles({
    id: "skyh-test-event",
    code: "SKYH-SKYHARBOR-AMS-OUTSOURCING-2026",
    name: "SkyHarbor AMS Outsourcing RFP",
    accountName: "SkyHarbor Air",
  })!;

  it("derives vendor-specific challenge records from MVE profile issues", () => {
    const intelligence = buildVendorChallengeIntelligence(set)!;

    expect(intelligence.challengeLog.length).toBeGreaterThanOrEqual(5);
    expect(
      new Set(intelligence.challengeLog.map((entry) => entry.vendorName)).size,
    ).toBe(3);
    expect(
      intelligence.challengeLog.some(
        (entry) =>
          entry.vendorName.includes("Vendor B") &&
          entry.issueCategory === "productivity_gap" &&
          /pricing credit|baseline/i.test(entry.clarificationQuestion),
      ),
    ).toBe(true);
    expect(
      intelligence.challengeLog.every(
        (entry) =>
          entry.finding.length > 20 &&
          entry.evidenceLabel.length > 5 &&
          entry.scoringImplication.length > 20,
      ),
    ).toBe(true);
  });

  it("turns challenge rows into BAFO-ready leverage seeds without inventing vendors", () => {
    const intelligence = buildVendorChallengeIntelligence(set)!;

    expect(intelligence.leverageSeeds.length).toBe(
      intelligence.challengeLog.length,
    );
    expect(
      intelligence.leverageSeeds.some(
        (seed) =>
          seed.vendorName.includes("Vendor A") &&
          seed.leverType === "productivity_not_priced_back" &&
          /year-by-year productivity credit/i.test(seed.bafoLanguage),
      ),
    ).toBe(true);
    expect(
      intelligence.leverageSeeds.some(
        (seed) =>
          seed.vendorName.includes("Vendor C") &&
          seed.leverType === "commercial_exception_buyer_risk",
      ),
    ).toBe(true);
    expect(
      intelligence.leverageSeeds.map((seed) => seed.vendorName).join(" "),
    ).not.toMatch(
      /Northstar|TitanTech|CloudBridge|DataPeak|BlueMaster|ArcVault/i,
    );
  });

  it("does not create challenge intelligence without a profile set", () => {
    expect(buildVendorChallengeIntelligence(null)).toBeNull();
  });
});

describe("vendor BAFO instruction pack", () => {
  const set = buildVendorResponseMveProfiles({
    id: "skyh-test-event",
    code: "SKYH-SKYHARBOR-AMS-OUTSOURCING-2026",
    name: "SkyHarbor AMS Outsourcing RFP",
    accountName: "SkyHarbor Air",
  })!;
  const intelligence = buildVendorChallengeIntelligence(set)!;

  it("turns leverage seeds into a vendor-specific BAFO instruction pack", () => {
    const pack = buildVendorBafoInstructionPack(intelligence)!;

    expect(pack.vendorInstructions).toHaveLength(3);
    expect(pack.questionCount).toBeGreaterThanOrEqual(5);
    expect(pack.commonResponseRequirements.join(" ")).toMatch(
      /structured response|commercial change|productivity/i,
    );
    expect(pack.completenessCriteria.join(" ")).toMatch(
      /must-resolve|scoring credit|buyer-risk/i,
    );
    expect(
      pack.vendorInstructions.every(
        (instruction) => instruction.questions.length >= 1,
      ),
    ).toBe(true);
  });

  it("keeps Vendor B BAFO asks specific to profile-derived gaps", () => {
    const pack = buildVendorBafoInstructionPack(intelligence)!;
    const vendorB = pack.vendorInstructions.find((instruction) =>
      instruction.vendorName.includes("Vendor B"),
    )!;
    const text = vendorB.questions
      .map((question) =>
        [
          question.question,
          question.requiredResponseFormat,
          question.scoringDisposition,
        ].join(" "),
      )
      .join(" ");

    expect(vendorB.priority).toBe("high");
    expect(text).toMatch(
      /baseline volume|price-down|gainshare|pricing credit/i,
    );
    expect(text).toMatch(/shift|location|FTE|24x7/i);
    expect(text).not.toMatch(/Northstar|TitanTech|CloudBridge|DataPeak/i);
  });

  it("does not create a BAFO pack without challenge intelligence", () => {
    expect(buildVendorBafoInstructionPack(null)).toBeNull();
  });
});

describe("vendor evaluation decision view", () => {
  const set = buildVendorResponseMveProfiles({
    id: "skyh-test-event",
    code: "SKYH-SKYHARBOR-AMS-OUTSOURCING-2026",
    name: "SkyHarbor AMS Outsourcing RFP",
    accountName: "SkyHarbor Air",
  })!;
  const intelligence = buildVendorChallengeIntelligence(set)!;
  const bafoPack = buildVendorBafoInstructionPack(intelligence)!;

  it("builds normalized comparison, scorecard, and executive tradeoffs for every vendor", () => {
    const view = buildVendorEvaluationDecisionView(
      set,
      intelligence,
      bafoPack,
    )!;

    expect(view.vendorCount).toBe(3);
    expect(view.vendorSummaries.map((summary) => summary.vendorName)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Vendor A"),
        expect.stringContaining("Vendor B"),
        expect.stringContaining("Vendor C"),
      ]),
    );
    expect(view.comparisonRows.map((row) => row.label)).toEqual(
      expect.arrayContaining([
        "Normalized 5-year TCO",
        "Transition risk",
        "Automation/productivity credibility",
        "Evaluation readiness",
      ]),
    );
    expect(view.scorecardRows.length).toBeGreaterThanOrEqual(8);
    const scoreEligibilityStates = view.scorecardRows.flatMap((row) =>
      row.scores.map((score) => score.scoreEligibility),
    );
    expect(scoreEligibilityStates).toContain("scoreable");
    expect(scoreEligibilityStates).toContain("clarification_required");
    expect(view.scoringTransparency.join(" ")).toMatch(/weights total 100/i);
    expect(view.finalistRecommendation).toMatch(/Vendor A|Vendor C|Vendor B/);
    expect(view.scoreImprovementScenarios).toHaveLength(3);
    expect(
      view.scoreImprovementScenarios.find((scenario) =>
        scenario.vendorName.includes("Vendor B"),
      )?.potentialScore,
    ).toBeGreaterThan(7);
    // The leader is whichever vendor the evidence ranks first, not a fixed
    // vendor. Assert the invariant so the scorecard can never be tuned to a
    // predetermined winner.
    const rankedSummaries = [...view.vendorSummaries].sort(
      (a, b) => b.weightedScore - a.weightedScore,
    );
    expect(view.leadingVendorId).toBe(rankedSummaries[0].vendorId);
    expect(rankedSummaries[0].weightedScore).toBeGreaterThanOrEqual(
      rankedSummaries[rankedSummaries.length - 1].weightedScore,
    );
    expect(view.cheapestVendorId).toContain("vendor-b");
    // Highest transition risk is the lowest transition-readiness score, not a
    // fixed vendor.
    const transitionScores = view.scorecardRows.find(
      (row) => row.criterionId === "transition-readiness",
    )?.scores;
    const weakestTransition = [...(transitionScores ?? [])].sort(
      (a, b) => a.score - b.score,
    )[0];
    expect(view.highestTransitionRiskVendorId).toBe(
      weakestTransition?.vendorId,
    );
    expect(view.executiveTradeoffs.join(" ")).toMatch(
      /Vendor A|Vendor B|Vendor C/,
    );
    expect(JSON.stringify(view)).not.toMatch(
      /Northstar|TitanTech|CloudBridge|DataPeak|BlueMaster|ArcVault/i,
    );
  });

  it("keeps scorecard weights deterministic and recommendations conditional", () => {
    const view = buildVendorEvaluationDecisionView(
      set,
      intelligence,
      bafoPack,
    )!;
    const weightTotal = view.scorecardRows.reduce(
      (sum, row) => sum + row.weight,
      0,
    );
    const vendorB = view.vendorSummaries.find((summary) =>
      summary.vendorName.includes("Vendor B"),
    )!;
    const vendorC = view.vendorSummaries.find((summary) =>
      summary.vendorName.includes("Vendor C"),
    )!;

    expect(weightTotal).toBe(100);
    expect(
      view.scorecardRows.flatMap((row) =>
        row.scores.map((score) => score.scoreReadinessAction),
      ),
    ).toEqual(
      expect.arrayContaining([
        "Ready for named evaluator review. AI suggestion is not final.",
        "Resolve the cited evidence gap before final scoring.",
      ]),
    );
    expect(vendorB.recommendation).toBe("hold_until_clarified");
    // Posture is derived from the vendor's own evidence gaps, not from an
    // assumed vendor archetype.
    expect(vendorB.finalistPosture).toMatch(/hold/i);
    expect(vendorB.conditions.join(" ")).toMatch(/coverage|staffing|retained/i);
    expect(vendorC.tradeoffs.join(" ")).toMatch(/SLA|scope|transition/i);
  });
});
