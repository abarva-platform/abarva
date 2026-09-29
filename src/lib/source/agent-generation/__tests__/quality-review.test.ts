import {
  buildMalformedSourceConsultingGradeReview,
  buildSourceConsultingGradeCompactRetryPrompt,
  buildSourceConsultingGradeReviewPrompt,
  buildSourceConsultingGradeRewritePrompt,
  buildSourceQualityGateMetadata,
  buildSourceQualitySourceContext,
  applyDeterministicSourceClaimGate,
  findDeterministicSourceClaimViolations,
  requiresSourceConsultingGradeGate,
} from "../quality-review";
import type { SourceGenerationContext } from "../types";
import { CONSULTING_GRADE_DIMENSIONS } from "@/lib/deliverables/quality/consulting-grade-rubric";

function makeContext(): SourceGenerationContext {
  return {
    tenantKey: "skyharbor",
    tenantName: "SkyHarbor Air",
    event: {
      id: "event-1",
      code: "GLOBAL_NETWORK_AIRLINE-IROPS-2026",
      name: "IT Outsourcing E2E",
      archetype: "it-outsourcing",
      rigor: "enhanced",
      currentStageKey: "rfp",
      statusLabel: "RFP",
      owner: "cover-name-only",
      triggerDescription: "Board mandate",
      scopeDescription: "Full IT outsourcing event",
      estimatedValueUsd: 300_000_000,
    },
    artifactStates: [],
    gateCriteria: [
      {
        id: "gate-1",
        sourceEventId: "event-1",
        tenantKey: "skyharbor",
        criterionId: "rfp-package-complete",
        fromStage: "rfp",
        toStage: "responses",
        state: "pending",
        reviewerUserId: null,
        reviewedAt: null,
        notes: "Must pass partner-grade review.",
        evidenceArtifactIds: [],
        waiverApprovalId: null,
        createdAt: "2026-06-12T00:00:00.000Z",
        updatedAt: "2026-06-12T00:00:00.000Z",
      },
    ],
    evidence: [
      {
        id: "evidence-1",
        sourceEventId: "event-1",
        tenantKey: "skyharbor",
        requirementId: "dc-infra-inventory",
        stage: "scope",
        currentState: "Usable Evidence",
        sourceArtifactId: "artifact-1",
        notes: "Data center and private cloud footprint loaded.",
        lastSyncedAt: "2026-06-12T00:00:00.000Z",
        createdAt: "2026-06-12T00:00:00.000Z",
        updatedAt: "2026-06-12T00:00:00.000Z",
      },
      {
        id: "evidence-2",
        sourceEventId: "event-1",
        tenantKey: "skyharbor",
        requirementId: "EVID-SRC-EVAL-WEIGHT-RATIONALE",
        stage: "rfp",
        currentState: "Not Requested",
        sourceArtifactId: null,
        notes: "Scaffold state is stale when the approved weights upload is present.",
        lastSyncedAt: "2026-06-12T00:00:00.000Z",
        createdAt: "2026-06-12T00:00:00.000Z",
        updatedAt: "2026-06-12T00:00:00.000Z",
      },
    ],
    uploadedEvidence: [
      {
        id: "artifact-1",
        originalName: "11_Data_Center_Infrastructure_Inventory.csv",
        artifactFamily: "other",
        sourceFormat: "csv",
        parseStatus: "parsed",
        evidenceState: "parsed_uncited",
        stageKey: "scope",
        chunkExcerpts: ["7 data centers with VMware Cloud Foundation footprint."],
        factSummaries: ["artifact_summary: {\"chunk_count\":1}"],
      },
      {
        id: "artifact-2",
        originalName: "09_Evaluation_Criteria_Weights_APPROVED.csv",
        artifactFamily: "other",
        sourceFormat: "csv",
        parseStatus: "parsed",
        evidenceState: "parsed_uncited",
        stageKey: "rfp",
        chunkExcerpts: ["Technical 35%, commercial 30%, transition 20%, governance 15%."],
        factSummaries: ["artifact_summary: {\"chunk_count\":1}"],
      },
    ],
  };
}

describe("Source consulting-grade quality gate helpers", () => {
  it("requires Gate B for flagship narrative, decision, and vendor-pack artifacts", () => {
    expect(requiresSourceConsultingGradeGate("d09_rfp_pack")).toBe(true);
    expect(requiresSourceConsultingGradeGate("d01_strategy_memo")).toBe(true);
    expect(requiresSourceConsultingGradeGate("d02_value_target")).toBe(true);
    expect(requiresSourceConsultingGradeGate("d05_scope_memo")).toBe(true);
    expect(requiresSourceConsultingGradeGate("d24_decision_brief")).toBe(true);
    expect(requiresSourceConsultingGradeGate("d27_selection_memo")).toBe(true);
    // Untouched artifact types stay ungated.
    expect(requiresSourceConsultingGradeGate("d04_app_inv")).toBe(false);
  });

  it("summarizes evidence, upstream bodies, and gate states for the reviewer", () => {
    const context = buildSourceQualitySourceContext({
      ctx: makeContext(),
      upstreamBound: {
        d01_strategy_memo: "Strategy memo with $300M baseline.",
      },
      artifactCode: "d09_rfp_pack",
    });

    expect(context).toContain("SkyHarbor Air");
    expect(context).toContain("Estimated value: $300,000,000");
    expect(context).toContain("Approved event trigger / why-now: Board mandate");
    expect(context).toContain(
      "Approved event scope and intake facts: Full IT outsourcing event",
    );
    expect(context).toContain("dc-infra-inventory");
    expect(context).toContain("11_Data_Center_Infrastructure_Inventory.csv");
    expect(context).toContain("D09 RFP evidence coverage semantics");
    expect(context).toContain("Exhibit 09 — Approved evaluation criteria");
    expect(context).toContain("satisfies=EVID-SRC-EVAL-WEIGHT-RATIONALE");
    expect(context).toContain(
      "Available parsed evidence — citation review pending (normalized from uploaded D09 coverage map)",
    );
    expect(context).not.toContain("EVID-SRC-EVAL-WEIGHT-RATIONALE; state=Not Requested");
    expect(context).toContain(
      "Blocking gaps are only items still missing after this coverage map",
    );
    expect(context).toContain("rfp-package-complete");
    expect(context).toContain("Artifact-specific requirements (from source-artifact-profiles.ts)");
    expect(context).toContain("Decision purpose:");
    expect(context).toContain("source=linked evidence record");
    expect(context).not.toContain("artifact=artifact-1");
  });

  it("does not leak D09 RFP evidence-coverage language into other artifact codes", () => {
    const context = buildSourceQualitySourceContext({
      ctx: makeContext(),
      upstreamBound: {},
      artifactCode: "d01_strategy_memo",
    });

    expect(context).not.toContain("D09 RFP evidence coverage semantics");
    expect(context).not.toContain("normalized from uploaded D09 coverage map");
    // Stale scaffold rows are reported as-is when the D09 override doesn't apply.
    expect(context).toContain("EVID-SRC-EVAL-WEIGHT-RATIONALE; state=Not Requested");
    // Profile-derived context still shows up for a recognized short code.
    expect(context).toContain("Approve the sourcing event and authorize scope and RFP preparation work.");
  });

  it("falls back gracefully for an unregistered artifact code", () => {
    const context = buildSourceQualitySourceContext({
      ctx: makeContext(),
      upstreamBound: {},
      artifactCode: "dz99_unregistered",
    });

    expect(context).toContain("No registered profile for this artifact code.");
  });

  it("deterministically rejects unbound percentages and market assertions", () => {
    const violations = findDeterministicSourceClaimViolations({
      artifactCode: "d01_strategy_memo",
      sourceContext:
        "Candidate target: $2,000,000. Contract run rate: $7,850,000.",
      body: [
        "The $2M candidate target sits against a $7.85M run rate.",
        "Change orders frequently represent 10 to 25 percent of loaded cost.",
        "The market is active and receptive.",
      ].join(" "),
    });

    expect(violations.map((item) => item.claim)).toEqual(
      expect.arrayContaining(["10 percent", "25 percent"]),
    );
    expect(violations.some((item) => /market is active/i.test(item.claim))).toBe(
      true,
    );
    expect(violations.some((item) => item.claim === "$2M")).toBe(false);
    expect(violations.some((item) => item.claim === "$7.85M")).toBe(false);
  });

  it.each(["d01_strategy_memo", "d02_value_target"])(
    "rejects unbound category rankings and routine outcomes in %s",
    (artifactCode) => {
      const body = [
        "Service desk is among the highest-volume infrastructure services a health system operates.",
        "These services are among the most commonly assessed for managed-service delivery.",
        "Managed-service models routinely generate operational efficiency.",
      ].join("\n");
      const violations = findDeterministicSourceClaimViolations({
        artifactCode,
        sourceContext: "The synthetic trigger names a service desk and endpoint scope only.",
        body,
      });

      expect(violations).toEqual(expect.arrayContaining([
        expect.objectContaining({ claim: expect.stringContaining("highest-volume") }),
        expect.objectContaining({ claim: expect.stringContaining("most commonly assessed") }),
        expect.objectContaining({ claim: expect.stringContaining("routinely generate") }),
      ]));
    },
  );

  it("keeps equivalent category assertions when the bound source establishes them", () => {
    const body = [
      "Service desk is among the highest-volume infrastructure services a health system operates.",
      "These services are among the most commonly assessed for managed-service delivery.",
      "Managed-service models routinely generate operational efficiency.",
    ].join("\n");
    expect(findDeterministicSourceClaimViolations({
      artifactCode: "d01_strategy_memo",
      sourceContext: body,
      body,
    })).toEqual([]);
  });

  it("rejects invented calendars, unsupported durations, comparisons, and internal ids", () => {
    const violations = findDeterministicSourceClaimViolations({
      artifactCode: "d01_strategy_memo",
      sourceContext:
        "The agreement expires 14 July 2027 and carries a 120-day notice requirement.",
      body: [
        "The agreement expires 14 July 2027 and carries a 120-day notice requirement.",
        "A four to six months sourcing event means the RFP must issue by Q3 2025.",
        "A 90-day drafting period is required.",
        "It is uncommon to have parsed exhibits at an equivalent stage.",
        "See artifact fab64527 for support.",
      ].join(" "),
    });

    expect(violations.some((item) => item.claim === "four to six months")).toBe(
      true,
    );
    expect(violations.some((item) => item.claim === "Q3 2025")).toBe(true);
    expect(violations.some((item) => item.claim === "90-day")).toBe(true);
    expect(violations.some((item) => /uncommon to have/i.test(item.claim))).toBe(
      true,
    );
    expect(violations.some((item) => item.claim === "artifact fab64527")).toBe(
      true,
    );
    expect(violations.some((item) => item.claim === "14 July 2027")).toBe(
      false,
    );
    expect(violations.some((item) => item.claim === "120-day")).toBe(false);
  });

  it("treats equivalent source-bound date, quarter, and duration formats as the same claim", () => {
    const violations = findDeterministicSourceClaimViolations({
      artifactCode: "d01_strategy_memo",
      sourceContext:
        "Term end 2027-07-31; notice deadline 2027-04-30; QBR period 2025-Q3; notice period 90 days.",
      body:
        "The term ends 31 July 2027, the deadline is April 30, 2027, the QBR covers Q3 2025, and the agreement has a 90-day notice period.",
    });

    expect(violations).toEqual([]);
  });

  it("reconciles structured financial facts and avoids reading monthly as million", () => {
    const violations = findDeterministicSourceClaimViolations({
      artifactCode: "d01_strategy_memo",
      sourceContext: [
        'fact: invoice/monthly_cost: {"base_run":540000,"governance":35000,"tooling":25000}',
        "Loaded base invoice: $635,000.",
      ].join("\n"),
      body:
        "Monthly cost includes $540,000 base run, $35,000 governance, $25,000 tooling, and a $635,000 monthly invoice.",
    });

    expect(violations).toEqual([]);
  });

  it("reconciles month precision and equivalent month/year durations", () => {
    const violations = findDeterministicSourceClaimViolations({
      artifactCode: "d01_strategy_memo",
      sourceContext:
        "Invoice period 2025-08; notice deadline 2027-04-30; initial term 36 months.",
      body:
        "The invoice period is August 2025, the notice month is April 2027, and the initial term is three-year.",
    });

    expect(violations).toEqual([]);
  });

  it("rejects an unbound post-go-live quarter horizon even when model review passes", () => {
    const violations = findDeterministicSourceClaimViolations({
      artifactCode: "d02_value_target",
      sourceContext: "The measurement window and start date are client-set.",
      body: "The Event Owner will track measurement criteria through the first two post-go-live quarters.",
    });

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          claim: "two post-go-live quarters",
          reason: expect.stringContaining("Date or duration claim"),
        }),
      ]),
    );
    const review = applyDeterministicSourceClaimGate({
      standardId: "partner-grade-consulting-deliverable-v1" as const,
      minRequiredScore: 8,
      artifactCode: "d02_value_target",
      artifactName: "Value Target Brief",
      pass: true,
      overallScore: 9,
      dimensionScores: CONSULTING_GRADE_DIMENSIONS.map((dimension) => ({
        id: dimension.id,
        score: 9,
        rationale: "Model review passed.",
        requiredFixes: [],
      })),
      unsupportedClaims: [],
      missingEvidence: [],
      rewriteGuidance: [],
    }, violations);
    expect(review.pass).toBe(false);
    expect(review.unsupportedClaims.join(" ")).toContain("two post-go-live quarters");
    expect(findDeterministicSourceClaimViolations({
      artifactCode: "d02_value_target",
      sourceContext: "The measurement window and start date are client-set.",
      body: "The measurement window and start date will be set by the client.",
    })).toEqual([]);
  });

  it("accepts a quarter-length horizon when an equivalent duration is bound", () => {
    const violations = findDeterministicSourceClaimViolations({
      artifactCode: "d02_value_target",
      sourceContext: "The approved measurement period is six months after go-live.",
      body: "The approved measurement period covers two post-go-live quarters.",
    });

    expect(violations).toEqual([]);
  });

  it("accepts an explicit refusal to invent a missing benchmark", () => {
    const violations = findDeterministicSourceClaimViolations({
      artifactCode: "d01_strategy_memo",
      sourceContext: "No market benchmark dataset is loaded.",
      body:
        "No external market benchmark is available in the bound evidence, so no benchmark value is asserted.",
    });

    expect(violations).toEqual([]);
  });

  it("rejects Strategy drafts that contradict audited applicability, SELF policy, or a pending gate", () => {
    const ctx = makeContext();
    ctx.event.currentStageKey = "strategy";
    ctx.event.approvalPolicyCode = "self_v1";
    ctx.evidence = [{
      ...ctx.evidence[0],
      requirementId: "EVID-SRC-STR-INCUMBENT",
      stage: "strategy",
      currentState: "Not Requested",
      applicabilityStatus: "not_applicable",
    }];
    ctx.gateCriteria = [{ ...ctx.gateCriteria[0], fromStage: "strategy", state: "pending" }];
    const violations = findDeterministicSourceClaimViolations({
      artifactCode: "d01_strategy_memo",
      sourceContext: "",
      ctx,
      body: [
        "EVID-SRC-STR-INCUMBENT — Not Requested; request the incumbent contract.",
        "EVID-SRC-STR-SPONSOR-COMMIT is required before release.",
        "The event is ready to advance. Approve at the Strategy Gate.",
      ].join("\n"),
    });
    expect(violations.map((item) => item.reason)).toEqual(expect.arrayContaining([
      expect.stringContaining("audited not-applicable"),
      expect.stringContaining("SELF policy"),
      expect.stringContaining("pending Strategy gate"),
    ]));
  });

  it("rejects a recommendation to approve or advance while Strategy criteria are pending", () => {
    const ctx = makeContext();
    ctx.event.currentStageKey = "strategy";
    ctx.gateCriteria = [{ ...ctx.gateCriteria[0], fromStage: "strategy", state: "pending" }];

    for (const artifactCode of ["d01_strategy_memo", "d02_value_target"]) {
      const violations = findDeterministicSourceClaimViolations({
        artifactCode,
        sourceContext: "",
        ctx,
        body: "Recommendation | **Approve to advance** — scope is bounded and the event is ready for the next phase.",
      });
      expect(violations.some((item) => item.reason.includes("pending Strategy gate"))).toBe(true);
    }

    const refusal = findDeterministicSourceClaimViolations({
      artifactCode: "d01_strategy_memo",
      sourceContext: "",
      ctx,
      body: "Do not approve to advance yet; Strategy criteria are pending review.",
    });
    expect(refusal).toEqual([]);

    const qualifiedRefusal = findDeterministicSourceClaimViolations({
      artifactCode: "d01_strategy_memo",
      sourceContext: "",
      ctx,
      body: "Do not recommend approval to advance while the Strategy gate is pending.",
    });
    expect(qualifiedRefusal).toEqual([]);

    const mixed = findDeterministicSourceClaimViolations({
      artifactCode: "d01_strategy_memo",
      sourceContext: "",
      ctx,
      body: "Do not approve yet; Recommendation | Approve to advance into the next phase.",
    });
    expect(mixed.some((item) => item.reason.includes("pending Strategy gate"))).toBe(true);

    ctx.gateCriteria = [{ ...ctx.gateCriteria[0], fromStage: "strategy", state: "met" }];
    const cleared = findDeterministicSourceClaimViolations({
      artifactCode: "d01_strategy_memo",
      sourceContext: "",
      ctx,
      body: "Recommend approval to advance after the recorded review.",
    });
    expect(cleared).toEqual([]);
  });

  it("rejects positive approval instructions in a pending Strategy draft", () => {
    const ctx = makeContext();
    ctx.event.currentStageKey = "strategy";
    ctx.gateCriteria = [{ ...ctx.gateCriteria[0], fromStage: "strategy", state: "pending" }];

    for (const artifactCode of ["d01_strategy_memo", "d02_value_target"]) {
      for (const body of [
        "My recommendation: conduct the Strategy Gate Review session and record approval.",
        "Advance this event.",
        "There are no blocking gaps. The pending criteria are ready to be closed in the review.",
      ]) {
        const violations = findDeterministicSourceClaimViolations({
          artifactCode,
          sourceContext: "",
          ctx,
          body,
        });
        expect(violations.some((item) => item.reason.includes("pending Strategy gate"))).toBe(true);
      }
    }

    for (const body of [
      "Do not record approval or advance this event while criteria are pending.",
      "Conduct the gate review and record a decision; approval only if each criterion is met.",
      "After all criteria are met, record approval.",
      "Record approval only if each criterion is met.",
      "The review may determine whether the criteria can be closed; no approval is recorded yet.",
    ]) {
      expect(findDeterministicSourceClaimViolations({
        artifactCode: "d01_strategy_memo",
        sourceContext: "",
        ctx,
        body,
      })).toEqual([]);
    }

    const mixed = findDeterministicSourceClaimViolations({
      artifactCode: "d01_strategy_memo",
      sourceContext: "",
      ctx,
      body: "Do not record approval yet; Advance this event.",
    });
    expect(mixed.some((item) => item.reason.includes("pending Strategy gate"))).toBe(true);
  });

  it("rejects a direct Strategy-to-RFP transition without blocking later-stage discussion", () => {
    const ctx = makeContext();
    ctx.event.currentStageKey = "strategy";
    ctx.gateCriteria = [{ ...ctx.gateCriteria[0], fromStage: "strategy", state: "met" }];

    for (const artifactCode of ["d01_strategy_memo", "d02_value_target"]) {
      for (const body of [
        "Approve the event to advance into RFP preparation.",
        "After approval, the event advances to the Market package.",
      ]) {
        const violations = findDeterministicSourceClaimViolations({
          artifactCode,
          sourceContext: "",
          ctx,
          body,
        });
        expect(violations.some((item) => item.reason.includes("Define/Scope"))).toBe(true);
      }
    }

    for (const body of [
      "Approval moves the event to Define/Scope; RFP release has its own later gate.",
      "After Strategy approval, Define/Scope work may begin preparing the later RFP.",
      "Strategy approval does not authorize advancement to RFP.",
      "Strategy approval should not advance the event to RFP.",
      "The RFP package will be considered only after Scope is approved.",
    ]) {
      expect(findDeterministicSourceClaimViolations({
        artifactCode: "d01_strategy_memo",
        sourceContext: "",
        ctx,
        body,
      })).toEqual([]);
    }

    const mixed = findDeterministicSourceClaimViolations({
      artifactCode: "d01_strategy_memo",
      sourceContext: "",
      ctx,
      body: "Do not advance now, but after approval the event advances to RFP.",
    });
    expect(mixed.some((item) => item.reason.includes("Define/Scope"))).toBe(true);

    ctx.event.currentStageKey = "rfp";
    expect(findDeterministicSourceClaimViolations({
      artifactCode: "d01_strategy_memo",
      sourceContext: "",
      ctx,
      body: "The RFP stage may now authorize market release after its own gate.",
    })).toEqual([]);
  });

  it("allows accurate absence and policy language while refusing unsupported vendor-pricing lore", () => {
    const ctx = makeContext();
    ctx.event.currentStageKey = "strategy";
    ctx.event.approvalPolicyCode = "self_v1";
    ctx.evidence = [{
      ...ctx.evidence[0],
      requirementId: "EVID-SRC-STR-INCUMBENT",
      stage: "strategy",
      applicabilityStatus: "not_applicable",
    }];
    ctx.gateCriteria = [{ ...ctx.gateCriteria[0], fromStage: "strategy", state: "pending" }];
    const accurate = findDeterministicSourceClaimViolations({
      artifactCode: "d02_value_target",
      sourceContext: "",
      ctx,
      body: "EVID-SRC-STR-INCUMBENT is not applicable by audited decision. A separate sponsor commitment is not required under SELF policy. The Strategy gate is pending.",
    });
    expect(accurate).toEqual([]);

    ctx.event.approvalPolicyCode = "legacy_signed_scope_v1";
    const legacy = findDeterministicSourceClaimViolations({
      artifactCode: "d01_strategy_memo",
      sourceContext: "",
      ctx,
      body: "EVID-SRC-STR-SPONSOR-COMMIT is required before release.",
    });
    expect(legacy).toEqual([]);

    const unsupported = findDeterministicSourceClaimViolations({
      artifactCode: "d02_value_target",
      sourceContext: "No market evidence is loaded.",
      body: "Vendors in this managed-service market price aggressively and recover margin through change orders.",
    });
    expect(unsupported.some((item) => /vendor-pricing/i.test(item.reason))).toBe(true);
  });

  it("rejects request-or-waive gate prerequisites for optional or SELF-excluded Strategy evidence", () => {
    const ctx = makeContext();
    ctx.event.currentStageKey = "strategy";
    ctx.event.approvalPolicyCode = "self_v1";
    ctx.evidence = [
      {
        ...ctx.evidence[0],
        requirementId: "EVID-SRC-STR-MARKET-BENCHMARK",
        stage: "strategy",
        currentState: "Not Requested",
      },
      {
        ...ctx.evidence[0],
        id: "sponsor-evidence",
        requirementId: "EVID-SRC-STR-SPONSOR-COMMIT",
        stage: "strategy",
        currentState: "Not Requested",
      },
    ];
    const violations = findDeterministicSourceClaimViolations({
      artifactCode: "d01_strategy_memo",
      sourceContext: "",
      ctx,
      body: [
        "Market benchmark (EVID-SRC-STR-MARKET-BENCHMARK): request-or-waive decision required at gate.",
        "Sponsor commitment (EVID-SRC-STR-SPONSOR-COMMIT): request-or-waive decision required at gate.",
      ].join("\n"),
    });
    expect(violations.map((item) => item.reason)).toEqual(expect.arrayContaining([
      expect.stringContaining("Recommended evidence"),
      expect.stringContaining("SELF policy"),
    ]));

    const contradictory = findDeterministicSourceClaimViolations({
      artifactCode: "d01_strategy_memo",
      sourceContext: "",
      ctx,
      body: "EVID-SRC-STR-MARKET-BENCHMARK is optional, but a request-or-waive decision is required before the gate closes.",
    });
    expect(contradictory.some((item) => item.reason.includes("Recommended evidence"))).toBe(true);

    const policyContradiction = findDeterministicSourceClaimViolations({
      artifactCode: "d01_strategy_memo",
      sourceContext: "",
      ctx,
      body: "EVID-SRC-STR-SPONSOR-COMMIT: request-or-waive decision before gate close.",
    });
    expect(policyContradiction.some((item) => item.reason.includes("SELF policy"))).toBe(true);

    const accurate = findDeterministicSourceClaimViolations({
      artifactCode: "d02_value_target",
      sourceContext: "",
      ctx,
      body: "The market scan is optional and not required for the Strategy gate. A separate sponsor commitment is not required under SELF policy.",
    });
    expect(accurate).toEqual([]);

    const statusOnly = findDeterministicSourceClaimViolations({
      artifactCode: "d01_strategy_memo",
      sourceContext: "",
      ctx,
      body: "Market benchmark (EVID-SRC-STR-MARKET-BENCHMARK): Not Requested; this scan is optional and does not block Strategy.",
    });
    expect(statusOnly).toEqual([]);

    ctx.event.approvalPolicyCode = "legacy_signed_scope_v1";
    const strict = findDeterministicSourceClaimViolations({
      artifactCode: "d01_strategy_memo",
      sourceContext: "",
      ctx,
      body: "EVID-SRC-STR-SPONSOR-COMMIT is required before the Strategy gate closes.",
    });
    expect(strict).toEqual([]);
  });

  it("binds effective Strategy evidence roles into the model quality review packet", () => {
    const ctx = makeContext();
    ctx.event.approvalPolicyCode = "self_v1";
    ctx.evidence = [
      { ...ctx.evidence[0], requirementId: "EVID-SRC-STR-MARKET-BENCHMARK", stage: "strategy" },
      { ...ctx.evidence[0], id: "sponsor-evidence", requirementId: "EVID-SRC-STR-SPONSOR-COMMIT", stage: "strategy" },
    ];
    const packet = buildSourceQualitySourceContext({
      ctx,
      upstreamBound: {},
      artifactCode: "d01_strategy_memo",
    });
    expect(packet).toMatch(/EVID-SRC-STR-MARKET-BENCHMARK;[^\n]*level=recommended;[^\n]*gate_blocking=false/);
    expect(packet).toMatch(/EVID-SRC-STR-SPONSOR-COMMIT;[^\n]*policy_applies=false;[^\n]*gate_blocking=false/);
  });

  it("forces evidence and source-discipline dimensions below the release bar", () => {
    const baseReview = {
      standardId: "partner-grade-consulting-deliverable-v1" as const,
      minRequiredScore: 8,
      artifactCode: "d01_strategy_memo",
      artifactName: "Sourcing Strategy Memo",
      pass: true,
      overallScore: 9,
      dimensionScores: CONSULTING_GRADE_DIMENSIONS.map((dimension) => ({
        id: dimension.id,
        score: 9,
        rationale: "Strong.",
        requiredFixes: [],
      })),
      unsupportedClaims: [],
      missingEvidence: [],
      rewriteGuidance: [],
    };

    const gated = applyDeterministicSourceClaimGate(baseReview, [
      { claim: "25%", reason: "Absent from bound evidence." },
    ]);
    expect(gated.pass).toBe(false);
    expect(
      gated.dimensionScores.find((score) => score.id === "evidence_grounding")
        ?.score,
    ).toBe(5);
    expect(gated.unsupportedClaims.join(" ")).toContain("25%");
  });

  it("marks the quality gate failed when any review dimension is below threshold", () => {
    const gate = buildSourceQualityGateMetadata({
      rewriteAttempted: true,
      reviews: [
        {
          standardId: "partner-grade-consulting-deliverable-v1",
          minRequiredScore: 8,
          artifactCode: "d09_rfp_pack",
          artifactName: "RFP Package",
          pass: false,
          overallScore: 7,
          dimensionScores: CONSULTING_GRADE_DIMENSIONS.map((dimension) => ({
            id: dimension.id,
            score: dimension.id === "evidence_grounding" ? 7 : 8,
            rationale: "Needs stronger support.",
            requiredFixes: ["Bind source evidence."],
          })),
          unsupportedClaims: ["Uncited scale claim."],
          missingEvidence: [],
          rewriteGuidance: ["Add evidence table."],
        },
      ],
    });

    expect(gate.passed).toBe(false);
    expect(gate.finalSummary).toContain("evidence_grounding");
  });

  it("keeps compact reviewer retries source-aware and dimension-complete", () => {
    const context = buildSourceQualitySourceContext({
      ctx: makeContext(),
      upstreamBound: {
        d01_strategy_memo: "Strategy memo with $300M baseline.",
      },
      artifactCode: "d09_rfp_pack",
    });
    const prompt = buildSourceConsultingGradeCompactRetryPrompt({
      artifactCode: "d09_rfp_pack",
      artifactName: "RFP Package",
      bodyMarkdown: "# RFP Package\n\n## Source register\n\nEvidence-backed body.",
      sourceContext: context,
      previousError: "Quality review is missing dimensionScores array.",
    });

    expect(prompt).toContain("SkyHarbor Air");
    expect(prompt).toContain("d09_rfp_pack");
    for (const dimension of CONSULTING_GRADE_DIMENSIONS) {
      expect(prompt).toContain(dimension.id);
    }
  });

  it("keeps review and rewrite guidance within the bound commercial evidence", () => {
    const sourceContext = [
      "Estimated value: not recorded",
      "EVID-SRC-STR-SPEND-BASELINE; state=Not Applicable; applicability=not_applicable",
      "EVID-SRC-STR-MARKET-BENCHMARK; state=Not Requested; level=recommended; gate_blocking=false",
    ].join("\n");
    const args = {
      artifactCode: "d01_strategy_memo",
      artifactName: "Sourcing Strategy Memo",
      bodyMarkdown: "No spend baseline exists. Dollar sizing remains client-to-complete with Finance as owner.",
      sourceContext,
    };
    const unsafeFix = "Add a sector-typical illustrative $5m-$20m annual range.";
    const unboundProxyFix = "Add an illustrative proxy dollar range for the market.";
    const review = {
      standardId: "partner-grade-consulting-deliverable-v1" as const,
      minRequiredScore: 8,
      artifactCode: args.artifactCode,
      artifactName: args.artifactName,
      pass: false,
      overallScore: 7,
      dimensionScores: CONSULTING_GRADE_DIMENSIONS.map((dimension) => ({
        id: dimension.id,
        score: dimension.id === "commercial_specificity" ? 7 : 8,
        rationale: "Commercial scale is unbound.",
        requiredFixes: dimension.id === "commercial_specificity" ? [unsafeFix, unboundProxyFix] : [],
      })),
      unsupportedClaims: [],
      missingEvidence: ["Finance baseline"],
      rewriteGuidance: [unsafeFix, unboundProxyFix],
    };

    for (const prompt of [
      buildSourceConsultingGradeReviewPrompt(args),
      buildSourceConsultingGradeCompactRetryPrompt({ ...args, previousError: "Malformed review" }),
      buildSourceConsultingGradeRewritePrompt({ ...args, review }),
    ]) {
      expect(prompt).toContain("Do not request or add illustrative, proxy, or sector-typical financial amounts");
      expect(prompt).toContain("Commercial specificity can be shown through named levers, an unquantified range, and the evidence needed to size it");
      expect(prompt).toContain("Do not turn recommended evidence into a gate requirement or invent a collection date");
      expect(prompt).toContain(sourceContext);
    }
    const rewritePrompt = buildSourceConsultingGradeRewritePrompt({ ...args, review });
    expect(rewritePrompt).toContain(
      "Ignore review fixes that conflict with these evidence limits",
    );
    expect(rewritePrompt).not.toContain(unsafeFix);
    expect(rewritePrompt).not.toContain(unboundProxyFix);
    expect(rewritePrompt).toContain("Keep the financial scale unquantified until bound evidence supplies its values.");

    const supportedReview = {
      ...review,
      rewriteGuidance: ["Reconcile the cited $12M Finance baseline with the value table."],
      dimensionScores: review.dimensionScores.map((dimension) => ({
        ...dimension,
        requiredFixes: dimension.id === "commercial_specificity"
          ? ["Reconcile the cited $12M Finance baseline with the value table."]
          : [],
      })),
    };
    expect(buildSourceConsultingGradeRewritePrompt({
      ...args,
      sourceContext: `${sourceContext}\nFinance approved baseline: $12M.`,
      review: supportedReview,
    })).toContain("Reconcile the cited $12M Finance baseline with the value table.");

    const timingPrompt = buildSourceConsultingGradeRewritePrompt({
      ...args,
      review: { ...review, rewriteGuidance: ["Set a 30-day collection deadline."] },
    });
    expect(timingPrompt).not.toContain("Set a 30-day collection deadline.");
    expect(timingPrompt).toContain("Leave timing client-to-set until a bound source supplies the date or duration.");
  });

  it("records malformed reviewer output as a failed Gate B review", () => {
    const gate = buildSourceQualityGateMetadata({
      rewriteAttempted: false,
      reviews: [
        buildMalformedSourceConsultingGradeReview({
          artifactCode: "d09_rfp_pack",
          artifactName: "RFP Package",
          reason: "missing dimensionScores",
        }),
      ],
    });

    expect(gate.passed).toBe(false);
    expect(gate.finalSummary).toContain("Failed");
    expect(gate.reviews[0]?.dimensionScores).toHaveLength(
      CONSULTING_GRADE_DIMENSIONS.length,
    );
  });
});
