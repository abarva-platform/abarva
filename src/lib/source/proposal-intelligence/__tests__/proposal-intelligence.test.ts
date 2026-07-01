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
import { buildVendorResponseMveProfiles } from "../mve-profile";
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
});
