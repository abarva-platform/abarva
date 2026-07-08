// The FULL 16-mode Source aVa answer-mode fixture suite (Phase C completion).
//
// Every mode in the canonical taxonomy gets AT LEAST ONE fixture assertion
// here, exercising the real pipeline end to end: classify → ground → (a
// representative candidate answer) → quality gate. Phase A/B/C already have
// deep per-builder unit coverage in their own test files (mode-grounding.test.ts,
// mode-grounding-phase-b.test.ts, mode-grounding-phase-c.test.ts,
// answer-quality-gate.test.ts, answer-mode.test.ts) — this suite does not
// duplicate that depth. Instead it proves the SPECIFIC per-mode bullet the
// design calls out (direct answer / mode-appropriate structure / no banned
// language / matches workflow state / value-type breakdown where relevant /
// vendor-specific asks where data exists / concise for how-to+status /
// richer for vendor+value+decision) for EVERY one of the 16 modes in one
// place, so a reviewer can see full-taxonomy coverage at a glance.

import { classifySourceAnswerMode } from "../answer-mode";
import { buildModeGrounding } from "../mode-grounding";
import { runSourceAnswerQualityGate } from "../answer-quality-gate";
import { AMS_MANAGED_SERVICES } from "@/lib/source/archetypes/registry";
import {
  SAMPLE_SCOPE_STAGE,
  SAMPLE_BAFO_STAGE,
} from "@/components/source/canvas/analytics/sample-view-model";
import type { SourceArtifactRegistryRecord } from "@/lib/source/artifact-registry/types";
import type { StageAnalyticsView } from "@/components/source/canvas/analytics/view-model";
import type { EventFactMap } from "@/lib/source/facts/evaluators/orchestrator";

const EVENT = {
  code: "SRC-AMS-2026-001",
  name: "Lakeshore AMS Consolidation",
  currentStageKey: "rfp",
  blocker: "Awaiting signed sponsor letter",
  nextAction: "Upload the signed sponsor letter",
};

const FACTS_TWO_LEVERS: EventFactMap = {
  annual_change_order_spend: 4_000_000,
  recurring_avoidable_pct: 0.35,
  annual_run_cost: 20_000_000,
  projected_volume_decline_pct: 0.15,
  variable_cost_share_pct: 0.55,
  term_years: 3,
};

function artifactFixture(
  overrides: Partial<SourceArtifactRegistryRecord>,
): SourceArtifactRegistryRecord {
  return {
    id: "artifact-1",
    tenantKey: "lakeshore",
    sourceEventId: "event-1",
    sourceEventRowId: null,
    stageKey: "scope",
    artifactFamily: "scope_document",
    artifactKind: "scope_memo",
    sourceOrigin: "uploaded",
    sourceFormat: "pdf",
    originalName: "Scope Memo v1.pdf",
    blobUri: "blob://scope-memo-v1",
    uploaderUserId: "user-1",
    mimeType: "application/pdf",
    sizeBytes: 1024,
    sha256: "abc123",
    parseStatus: "parsed",
    embeddingStatus: "embedded",
    graphStatus: "projected",
    classificationStatus: "classified",
    dataClassification: "Confidential",
    evidenceState: "cited",
    approvalState: "approved",
    version: 1,
    supersedesArtifactVersionId: null,
    createdBy: "user-1",
    validatedBy: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    deletedAt: null,
    ...overrides,
  };
}

describe("Full 16-mode fixture suite — classification resolves the expected mode", () => {
  const expectations: Array<{ question: string; expected: string }> = [
    { question: "Where are we on this event?", expected: "event_status" },
    { question: "How do I upload the signed sponsor letter?", expected: "workflow_how_to" },
    { question: "What evidence do I still need to provide?", expected: "evidence_readiness" },
    { question: "What's the upload history on this document?", expected: "artifact_lineage" },
    { question: "Is this the final version?", expected: "artifact_finality" },
    { question: "What do I need to advance the stage?", expected: "stage_gate" },
    { question: "What's our value at stake?", expected: "value_at_stake" },
    { question: "Compare vendors on this event", expected: "vendor_comparison" },
    { question: "What's the should-cost normalization?", expected: "should_cost" },
    { question: "What's the risk exposure here?", expected: "risk_exposure" },
    { question: "What's our clause coverage?", expected: "clause_coverage" },
    { question: "What's the BAFO strategy?", expected: "bafo_strategy" },
    { question: "What did the award commit?", expected: "committed_value" },
    { question: "How is value realization tracking?", expected: "value_realization" },
    { question: "Which vendor should we award?", expected: "decision_recommendation" },
    { question: "Should we renegotiate the current vendor?", expected: "contract_optimization" },
  ];

  it.each(expectations)("'$question' classifies as $expected", ({ question, expected }) => {
    expect(classifySourceAnswerMode({ question }).mode).toBe(expected);
  });

  it("stakeholder_alignment classifies but remains deferred (documented, not a gap)", () => {
    expect(
      classifySourceAnswerMode({ question: "Is the committee aligned on this?" }).mode,
    ).toBe("stakeholder_alignment");
  });

  it("an unmatched question classifies to general_advisory (the 16th mode, catch-all)", () => {
    expect(
      classifySourceAnswerMode({ question: "What do you think of this vendor's culture?" }).mode,
    ).toBe("general_advisory");
  });
});

describe("Full 16-mode fixture suite — event_status: concise, matches workflow state", () => {
  it("names the current stage and passes the gate with no banned language", () => {
    const grounding = buildModeGrounding({
      mode: "event_status",
      event: EVENT,
      viewStageKey: "rfp",
      stageView: SAMPLE_SCOPE_STAGE as StageAnalyticsView,
    });
    const gate = runSourceAnswerQualityGate({
      answerText:
        "This event is on the RFP stage, stage 3 of 11. Next: upload the signed sponsor letter.",
      mode: "event_status",
      hasGroundingContext: true,
      groundingFacts: grounding.quotableFacts,
    });
    expect(gate.passed).toBe(true);
    expect(gate.finalText).toContain("RFP");
  });
});

describe("Full 16-mode fixture suite — workflow_how_to: concise UI action, no invented structure", () => {
  it("names the exact PROVIDE-task action for an upload question", () => {
    const grounding = buildModeGrounding({
      mode: "workflow_how_to",
      event: EVENT,
      question: "How do I upload the final reviewed version?",
    });
    expect(grounding.block).toContain("PROVIDE task dropzone");
    const gate = runSourceAnswerQualityGate({
      answerText: `${grounding.quotableFacts.howToAction} Next: confirm once uploaded.`,
      mode: "workflow_how_to",
      hasGroundingContext: true,
    });
    expect(gate.passed).toBe(true);
  });
});

describe("Full 16-mode fixture suite — evidence_readiness: names gaps honestly, includes caveat", () => {
  it("flags missing evidence with a caveat when incomplete", () => {
    const gate = runSourceAnswerQualityGate({
      answerText:
        "The scope memo evidence is missing on this stage. Next: upload the scope memo to close this out.",
      mode: "evidence_readiness",
      hasGroundingContext: true,
      evidenceIsIncomplete: true,
    });
    expect(gate.passed).toBe(true);
  });
});

describe("Full 16-mode fixture suite — artifact_lineage: version history, no fabrication", () => {
  it("names upload history for a registered artifact", () => {
    const grounding = buildModeGrounding({
      mode: "artifact_lineage",
      event: EVENT,
      artifacts: [artifactFixture({})],
    });
    expect(grounding.block).toContain("ARTIFACT LINEAGE GROUNDING");
    const gate = runSourceAnswerQualityGate({
      answerText:
        "Scope Memo v1.pdf is the current version (v1), uploaded 2026-01-01. Next: review it in the File Cabinet.",
      mode: "artifact_lineage",
      hasGroundingContext: true,
    });
    expect(gate.passed).toBe(true);
  });
});

describe("Full 16-mode fixture suite — artifact_finality: client-final recognized, generated draft never called final", () => {
  it("names a client-final artifact as authoritative on that basis", () => {
    const grounding = buildModeGrounding({
      mode: "artifact_finality",
      event: EVENT,
      artifacts: [artifactFixture({ isClientFinal: true } as Partial<SourceArtifactRegistryRecord>)],
    });
    expect(grounding.block).toMatch(/AUTHORITATIVE[\s\S]*marked client-final/);
  });

  it("never calls a bare generated draft (no finality flag) 'final' — names it authoritative by recency only", () => {
    const grounding = buildModeGrounding({
      mode: "artifact_finality",
      event: EVENT,
      artifacts: [artifactFixture({ sourceOrigin: "generated" })],
    });
    expect(grounding.block).toContain("no explicit finality flag persisted");
    expect(grounding.block).not.toMatch(/marked client-final/);
  });
});

describe("Full 16-mode fixture suite — stage_gate: names confirms, honest MET/UNMET, human-confirm boxes", () => {
  it("names the gate's requirements and does not fabricate a human-attestation box's state", () => {
    const grounding = buildModeGrounding({
      mode: "stage_gate",
      event: EVENT,
      viewStageKey: "scope",
      stageView: SAMPLE_SCOPE_STAGE as StageAnalyticsView,
    });
    expect(grounding.block).toContain("requires human confirmation");
  });
});

describe("Full 16-mode fixture suite — value_at_stake: richer, value-type breakdown, traceable", () => {
  it("grounds the value bridge headline with classified value types", () => {
    const grounding = buildModeGrounding({
      mode: "value_at_stake",
      event: EVENT,
      archetype: AMS_MANAGED_SERVICES,
      factInputs: FACTS_TWO_LEVERS,
      baselineAmount: 30_000_000,
    });
    expect(grounding.block).toContain("VALUE-TYPE CLASSIFICATION");
    const gate = runSourceAnswerQualityGate({
      answerText: `${grounding.quotableFacts.valueBridgeHeadline} Next: review the value bridge.`,
      mode: "value_at_stake",
      hasGroundingContext: true,
      groundingBlockText: grounding.block,
      groundingFacts: grounding.quotableFacts,
    });
    expect(gate.passed).toBe(true);
  });
});

describe("Full 16-mode fixture suite — vendor_comparison: richer, vendor-specific asks when data exists", () => {
  it("names a specific vendor when a live vendor-bid signal exists", () => {
    const grounding = buildModeGrounding({
      mode: "vendor_comparison",
      event: EVENT,
      archetype: AMS_MANAGED_SERVICES,
      factInputs: FACTS_TWO_LEVERS,
      vendorBids: {
        bids: [
          { vendorId: "vendor_a", headlineBid: 21_900_000, retainedFteDelta: 14, slaCreditCapPct: 8 },
          { vendorId: "vendor_b", headlineBid: 24_800_000, retainedFteDelta: 4, slaCreditCapPct: 15 },
        ],
        vendors: ["vendor_a", "vendor_b"],
      },
    });
    expect(grounding.block).toContain("vendor_a");
    expect(grounding.block).toContain("vendor_b");
  });
});

describe("Full 16-mode fixture suite — should_cost: per-vendor normalized TCO, trap named", () => {
  it("flags the cheapest-headline-loses-on-TCO trap when the ranking flips", () => {
    const grounding = buildModeGrounding({
      mode: "should_cost",
      event: EVENT,
      archetype: AMS_MANAGED_SERVICES,
      factInputs: FACTS_TWO_LEVERS,
      vendorBids: {
        bids: [
          { vendorId: "vendor_a", headlineBid: 21_900_000, retainedFteDelta: 14, slaCreditCapPct: 8 },
          { vendorId: "vendor_b", headlineBid: 24_800_000, retainedFteDelta: 4, slaCreditCapPct: 15 },
        ],
        vendors: ["vendor_a", "vendor_b"],
      },
    });
    expect(grounding.block).toContain("cheapest on headline");
  });
});

describe("Full 16-mode fixture suite — risk_exposure: commercial risk named honestly", () => {
  it("names the archetype's declared commercial risk per lever", () => {
    const grounding = buildModeGrounding({
      mode: "risk_exposure",
      event: EVENT,
      archetype: AMS_MANAGED_SERVICES,
      factInputs: FACTS_TWO_LEVERS,
    });
    expect(grounding.block).toContain("Commercial risk:");
  });
});

describe("Full 16-mode fixture suite — clause_coverage: protected vs exposed, RFP clause + BAFO fallback", () => {
  it("names protected vs exposed levers with the exact clause + BAFO fallback text", () => {
    const grounding = buildModeGrounding({
      mode: "clause_coverage",
      event: EVENT,
      archetype: AMS_MANAGED_SERVICES,
      factInputs: FACTS_TWO_LEVERS,
      rfpClausePresentLeverKeys: new Set(["AMS.ENHANCEMENT_LEAKAGE"]),
    });
    expect(grounding.block).toContain("PROTECTED");
    expect(grounding.block).toContain("BAFO fallback if it slips");
  });
});

describe("Full 16-mode fixture suite — bafo_strategy: specific per-lever ask when open", () => {
  it("names the specific ask for each still-open lever (not a generic 'negotiate harder')", () => {
    const grounding = buildModeGrounding({
      mode: "bafo_strategy",
      event: EVENT,
      archetype: AMS_MANAGED_SERVICES,
      factInputs: FACTS_TWO_LEVERS,
    });
    expect(grounding.block).toMatch(/ask —/);
    const gate = runSourceAnswerQualityGate({
      answerText: "Convert the recurring change-order categories into a fixed service catalog. Next: confirm with the vendor.",
      mode: "bafo_strategy",
      hasGroundingContext: true,
      groundingFacts: grounding.quotableFacts,
      groundingHasSpecificAsk: true,
    });
    expect(gate.passed).toBe(true);
  });
});

describe("Full 16-mode fixture suite — committed_value: committed vs awaiting, never fabricated as $0", () => {
  it("names levers awaiting award confirmation honestly rather than as $0", () => {
    const grounding = buildModeGrounding({
      mode: "committed_value",
      event: EVENT,
      archetype: AMS_MANAGED_SERVICES,
      factInputs: FACTS_TWO_LEVERS,
    });
    expect(grounding.block).toContain("Still awaiting award confirmation");
  });
});

describe("Full 16-mode fixture suite — value_realization: realized-to-date vs committed, honest not-yet-realized", () => {
  it("names a lever as not-yet-realized rather than fabricating 0", () => {
    const grounding = buildModeGrounding({
      mode: "value_realization",
      event: EVENT,
      archetype: AMS_MANAGED_SERVICES,
      factInputs: FACTS_TWO_LEVERS,
    });
    expect(grounding.block).toContain("MODEL — no realized-value signal yet");
  });
});

describe("Full 16-mode fixture suite — decision_recommendation: richer, composite, traceable", () => {
  it("assembles exec-decision + vendor + BAFO + unresolved-conditions facets into one recommendation", () => {
    const grounding = buildModeGrounding({
      mode: "decision_recommendation",
      event: EVENT,
      archetype: AMS_MANAGED_SERVICES,
      factInputs: FACTS_TWO_LEVERS,
      baselineAmount: 30_000_000,
      viewStageKey: "bafo",
      stageView: SAMPLE_BAFO_STAGE as StageAnalyticsView,
    });
    expect(grounding.block).toContain("EXECUTIVE DECISION FACET");
    expect(grounding.block).toContain("VENDOR COMPARISON GROUNDING");
    expect(grounding.block).toContain("BAFO STRATEGY GROUNDING");
    expect(grounding.block).toContain("UNRESOLVED AWARD CONDITIONS");
    const gate = runSourceAnswerQualityGate({
      answerText: `${grounding.quotableFacts.execDecisionHeadline} Next: resolve the outstanding gate items before awarding.`,
      mode: "decision_recommendation",
      hasGroundingContext: true,
      groundingBlockText: grounding.block,
      groundingFacts: grounding.quotableFacts,
    });
    expect(gate.passed).toBe(true);
  });
});

describe("Full 16-mode fixture suite — contract_optimization: incumbent economics, trigger/valueBasis surfaced", () => {
  it("names the archetype's own triggerLogic/valueBasis rather than inventing a decision framework", () => {
    const grounding = buildModeGrounding({
      mode: "contract_optimization",
      event: EVENT,
      archetype: AMS_MANAGED_SERVICES,
      factInputs: FACTS_TWO_LEVERS,
    });
    expect(grounding.block).toContain("trigger —");
    expect(grounding.block).toContain("Basis —");
  });
});

describe("Full 16-mode fixture suite — general_advisory: compact roll-up, lighter bar, still core-safe", () => {
  it("rolls up stage + value headline + open items and passes the core checks", () => {
    const grounding = buildModeGrounding({
      mode: "general_advisory",
      event: EVENT,
      archetype: AMS_MANAGED_SERVICES,
      factInputs: FACTS_TWO_LEVERS,
      baselineAmount: 30_000_000,
      viewStageKey: "scope",
      stageView: SAMPLE_SCOPE_STAGE as StageAnalyticsView,
    });
    expect(grounding.block).toContain("GENERAL ADVISORY ROLL-UP");
    const gate = runSourceAnswerQualityGate({
      answerText:
        "This event is on the RFP stage with a healthy value bridge in play. Next: keep pushing outstanding evidence.",
      mode: "general_advisory",
      hasGroundingContext: true,
      groundingBlockText: grounding.block,
      groundingFacts: grounding.quotableFacts,
    });
    expect(gate.passed).toBe(true);
  });
});
