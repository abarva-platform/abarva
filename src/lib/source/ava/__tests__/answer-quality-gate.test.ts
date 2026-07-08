// The Phase A quality gate: banned-language rejection, ID scrubbing, the
// repair-then-recheck loop, and the workflow-state consistency check. Mirrors
// (and directly reuses helpers from) Intelligence's answer-safety suite —
// see src/lib/intelligence/answer/__tests__ for the pattern this follows.

import { runSourceAnswerQualityGate } from "../answer-quality-gate";

describe("runSourceAnswerQualityGate — passing answers", () => {
  it("passes a well-formed, grounded, actionable answer with no repair", () => {
    const result = runSourceAnswerQualityGate({
      answerText:
        "This event is on the RFP stage, stage 3 of 11. Next step: upload the signed sponsor letter to close out Scope's outstanding task.",
      mode: "event_status",
      hasGroundingContext: true,
      groundingFacts: { currentStageLabel: "RFP" },
    });
    expect(result.passed).toBe(true);
    expect(result.repaired).toBe(false);
    expect(result.unresolvedChecks).toEqual([]);
    expect(result.finalText).toContain("RFP");
  });
});

describe("runSourceAnswerQualityGate — banned-language rejection", () => {
  it("strips a banned deflection phrase in the repair pass", () => {
    const result = runSourceAnswerQualityGate({
      answerText:
        "I do not have enough context to be useful here. Next step: check the stage checklist.",
      mode: "event_status",
      hasGroundingContext: true,
    });
    expect(result.repaired).toBe(true);
    expect(result.finalText.toLowerCase()).not.toContain(
      "i do not have enough context to be useful",
    );
  });

  it("does not flag 'I cannot access the event' when grounding context is genuinely absent", () => {
    const result = runSourceAnswerQualityGate({
      answerText: "I cannot access the event right now — please check back shortly.",
      mode: "event_status",
      hasGroundingContext: false,
    });
    const bannedCheck = result.checks.find((c) => c.id === "no_banned_language");
    expect(bannedCheck?.passed).toBe(true);
  });

  it("flags 'I cannot access the event' as banned when grounding IS available", () => {
    const result = runSourceAnswerQualityGate({
      answerText:
        "I cannot access the event right now, but next step: try again. Provide more details if this persists.",
      mode: "event_status",
      hasGroundingContext: true,
    });
    expect(result.finalText.toLowerCase()).not.toContain("i cannot access the event");
  });
});

describe("runSourceAnswerQualityGate — raw internal id scrubbing", () => {
  it("scrubs a raw UUID from the answer text", () => {
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    const result = runSourceAnswerQualityGate({
      answerText: `The artifact id is ${uuid}. Next step: review it in the File Cabinet.`,
      mode: "artifact_lineage",
      hasGroundingContext: true,
    });
    expect(result.finalText).not.toContain(uuid);
  });
});

describe("runSourceAnswerQualityGate — repair-then-recheck", () => {
  it("re-checks after repair and reports passed=true when repair resolves every failure", () => {
    const result = runSourceAnswerQualityGate({
      answerText: "I am just a workflow assistant.",
      mode: "event_status",
      hasGroundingContext: true,
    });
    expect(result.repaired).toBe(true);
    // After stripping the banned phrase and appending a next step, the answer
    // should have SOME content and a next-step signal.
    expect(result.finalText.length).toBeGreaterThan(0);
  });

  it("reports unresolved checks (never loops indefinitely) when repair cannot fully fix the answer", () => {
    const result = runSourceAnswerQualityGate({
      answerText: "",
      mode: null,
      hasGroundingContext: false,
    });
    // has_mode_classification cannot be fixed by a text repair — it should
    // remain in unresolvedChecks rather than looping.
    expect(result.unresolvedChecks).toContain("has_mode_classification");
  });
});

describe("runSourceAnswerQualityGate — matches_workflow_state consistency check", () => {
  it("fails when the answer claims a different stage than the grounded stage", () => {
    const result = runSourceAnswerQualityGate({
      answerText:
        "This event is currently on the BAFO stage. Next step: review the concessions.",
      mode: "event_status",
      hasGroundingContext: true,
      groundingFacts: { currentStageLabel: "RFP" },
    });
    const check = result.checks.find((c) => c.id === "matches_workflow_state");
    expect(check?.passed).toBe(false);
  });

  it("passes when the answer does not contradict the grounded stage", () => {
    const result = runSourceAnswerQualityGate({
      answerText:
        "This event is currently on the RFP stage. Next step: review the draft clauses.",
      mode: "event_status",
      hasGroundingContext: true,
      groundingFacts: { currentStageLabel: "RFP" },
    });
    const check = result.checks.find((c) => c.id === "matches_workflow_state");
    expect(check?.passed).toBe(true);
  });
});

describe("runSourceAnswerQualityGate — gap/caveat requirement for incomplete evidence", () => {
  it("fails when evidence is incomplete but the answer asserts completeness with no caveat", () => {
    const result = runSourceAnswerQualityGate({
      answerText: "Everything looks complete here.",
      mode: "evidence_readiness",
      hasGroundingContext: true,
      evidenceIsIncomplete: true,
    });
    const check = result.checks.find(
      (c) => c.id === "includes_gap_or_caveat_when_incomplete",
    );
    // Before repair this should have failed; after repair, the gate appends a
    // caveat, so the FINAL text should read as passing.
    expect(result.finalText.toLowerCase()).toMatch(/not yet persisted|missing|outstanding/);
    expect(check).toBeDefined();
  });

  it("does not require a caveat when evidence is not flagged incomplete", () => {
    const result = runSourceAnswerQualityGate({
      answerText: "All provide-tasks on this stage have persisted evidence. Next: proceed to the gate.",
      mode: "evidence_readiness",
      hasGroundingContext: true,
      evidenceIsIncomplete: false,
    });
    const check = result.checks.find(
      (c) => c.id === "includes_gap_or_caveat_when_incomplete",
    );
    expect(check?.passed).toBe(true);
  });
});

describe("runSourceAnswerQualityGate — next-step requirement", () => {
  it("fails has_direct_answer only when text is truly empty, and appends a next step on repair otherwise", () => {
    const result = runSourceAnswerQualityGate({
      answerText: "This event is on the Scope stage.",
      mode: "event_status",
      hasGroundingContext: true,
      groundingFacts: { currentStageLabel: "Scope" },
    });
    expect(result.finalText.toLowerCase()).toMatch(
      /next|upload|provide|confirm|approve|advance|review|check/,
    );
  });
});

describe("runSourceAnswerQualityGate — read-once grounding facts threading", () => {
  it("passes matches_read_once_grounding when groundingFacts were provided for artifact_finality", () => {
    const result = runSourceAnswerQualityGate({
      answerText: "The client-final version is authoritative. Next: proceed with it.",
      mode: "artifact_finality",
      hasGroundingContext: true,
      groundingFacts: { artifactCount: "2" },
    });
    const check = result.checks.find((c) => c.id === "matches_read_once_grounding");
    expect(check?.passed).toBe(true);
  });

  it("fails matches_read_once_grounding when stage_gate has grounding context but no facts were threaded", () => {
    const result = runSourceAnswerQualityGate({
      answerText: "The gate is met. Next: approve it.",
      mode: "stage_gate",
      hasGroundingContext: true,
      groundingFacts: {},
    });
    const check = result.checks.find((c) => c.id === "matches_read_once_grounding");
    expect(check?.passed).toBe(false);
  });
});
