// The Phase A quality gate: banned-language rejection, ID scrubbing, the
// repair-then-recheck loop, and the workflow-state consistency check. Mirrors
// (and directly reuses helpers from) Intelligence's answer-safety suite —
// see src/lib/intelligence/answer/__tests__ for the pattern this follows.

import { runSourceAnswerQualityGate } from "../answer-quality-gate";
import {
  enforceSourceExistingEventWriteTruth,
  SOURCE_CHAT_UNSAVED_FACT_NOTICE,
} from "../answer-quality-gate";

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

  it("repairs Source record write claims into explicit chat-only wording", () => {
    const result = runSourceAnswerQualityGate({
      answerText:
        "Got it — Jack Ma as decision owner. I'll register it in the intake record. Next question: what changed now?",
      mode: "general_advisory",
      hasGroundingContext: true,
    });

    expect(result.repaired).toBe(true);
    expect(result.finalText).toContain(SOURCE_CHAT_UNSAVED_FACT_NOTICE);
    expect(result.finalText.toLowerCase()).not.toContain("register it in the intake record");
  });

  it("guards legacy Source ask text even outside the streaming quality gate", () => {
    const guarded = enforceSourceExistingEventWriteTruth(
      "I have captured that owner in the Source record. Next: confirm the trigger.",
    );

    expect(guarded).toContain(SOURCE_CHAT_UNSAVED_FACT_NOTICE);
    expect(guarded.toLowerCase()).not.toContain("captured that owner");
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

  // REGRESSION: live invariant violation — aVa answered "0 of 1 tasks
  // complete" / gate unmet for a question about the RFP stage's finality
  // while the grounding block (built from the SAME read-once facts as the
  // canvas) actually showed "1 of 1" / gate met. Even with a CORRECT
  // grounding block in hand, a model could still ignore it and restate a
  // stale/invented count — this hardens the gate to catch that specific
  // numeric-contradiction class and repair it before shipping, independent
  // of whether the root cause is a bad grounding builder or a model that
  // ignored a good one.
  it("detects the contradiction (triggers repair) when the answer states a task-count that contradicts the grounding block's own count", () => {
    // This is the EXACT text from the live bug report. The gate's FIRST pass
    // must detect the contradiction (proven here via `repaired === true` and
    // the corrected final text) — asserting on `result.checks` directly would
    // only show the POST-repair (already-corrected, passing) state, since
    // `runSourceAnswerQualityGate` returns the repaired checks once a repair
    // pass runs successfully.
    const result = runSourceAnswerQualityGate({
      answerText:
        "The current stage gate shows 0 of 1 tasks complete. Right now all 6 are still exposed. Next step: confirm RFP clause coverage across all 6 value levers before the stage gate clears.",
      mode: "general_advisory",
      hasGroundingContext: true,
      groundingFacts: {
        currentStageLabel: "RFP",
        taskChecklistDone: "1",
        taskChecklistTotal: "1",
      },
    });
    expect(result.repaired).toBe(true);
    expect(result.finalText).toContain("1 of 1 tasks complete");
    expect(result.finalText).not.toContain("0 of 1 tasks complete");
    expect(result.unresolvedChecks).not.toContain("matches_workflow_state");
    // The final (post-repair) check now legitimately passes, because the
    // repair corrected the contradiction rather than leaving it in place.
    const check = result.checks.find((c) => c.id === "matches_workflow_state");
    expect(check?.passed).toBe(true);
  });

  it("repairs a contradicting task-count claim to the grounding block's own count", () => {
    const result = runSourceAnswerQualityGate({
      answerText: "The current stage gate shows 0 of 1 tasks complete.",
      mode: "general_advisory",
      hasGroundingContext: true,
      groundingFacts: {
        currentStageLabel: "RFP",
        taskChecklistDone: "1",
        taskChecklistTotal: "1",
      },
    });
    expect(result.repaired).toBe(true);
    expect(result.finalText).toContain("1 of 1 tasks complete");
    expect(result.finalText).not.toContain("0 of 1 tasks complete");
  });

  it("passes when the answer's task-count matches the grounding block's own count", () => {
    const result = runSourceAnswerQualityGate({
      answerText:
        "The current stage gate shows 1 of 1 tasks complete. Next step: review the gate confirms.",
      mode: "general_advisory",
      hasGroundingContext: true,
      groundingFacts: {
        currentStageLabel: "RFP",
        taskChecklistDone: "1",
        taskChecklistTotal: "1",
      },
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

// ─────────────────────────────────────────────────────────────────────────────
// Phase B — the 3 additional checks scoped to the 8 vendor/value/commercial
// modes: traceability (numbers only from the grounding block), value-type
// breakdown presence (never a blended savings figure), and generic-ask
// rejection (BAFO/vendor modes must use the specific data when it exists).
// The existing 9 Phase A checks above stay green — these are additive checks
// in the SAME gate function, same one-pass repair discipline.
// ─────────────────────────────────────────────────────────────────────────────

describe("runSourceAnswerQualityGate — Phase B traceability (traceable_to_grounding)", () => {
  const GROUNDING_BLOCK = [
    "VALUE-AT-STAKE GROUNDING (authoritative):",
    "Headline: $46M–$65M of classified value across 3 bands.",
  ].join("\n");

  it("passes when every $ figure in the answer appears verbatim in the grounding block", () => {
    const result = runSourceAnswerQualityGate({
      answerText:
        "Your value at stake is $46M–$65M of classified value. Next: review the value bridge for details.",
      mode: "value_at_stake",
      hasGroundingContext: true,
      groundingBlockText: GROUNDING_BLOCK,
    });
    const check = result.checks.find((c) => c.id === "traceable_to_grounding");
    expect(check?.passed).toBe(true);
  });

  it("fails and repairs when the answer states a $ figure NOT in the grounding block (self-computed)", () => {
    const result = runSourceAnswerQualityGate({
      answerText:
        "Your value at stake is $78M once you annualize it. Next: review the value bridge for details.",
      mode: "value_at_stake",
      hasGroundingContext: true,
      groundingBlockText: GROUNDING_BLOCK,
    });
    expect(result.repaired).toBe(true);
    expect(result.finalText).not.toContain("$78M");
    expect(result.finalText.toLowerCase()).toContain("grounding record");
  });

  it("does not apply to non-value Phase A modes (vacuous pass)", () => {
    const result = runSourceAnswerQualityGate({
      answerText: "This event is on the RFP stage. Next: check the gate panel.",
      mode: "event_status",
      hasGroundingContext: true,
      groundingFacts: { currentStageLabel: "RFP" },
    });
    const check = result.checks.find((c) => c.id === "traceable_to_grounding");
    expect(check?.passed).toBe(true);
    expect(check?.detail).toMatch(/not a value\/pricing mode/i);
  });
});

describe("runSourceAnswerQualityGate — Phase B value-type breakdown (includes_value_type_breakdown)", () => {
  const GROUNDING_WITH_CLASSIFICATION = [
    "COMMITTED VALUE GROUNDING (authoritative):",
    "Headline: The executed award locks $5M across 2 levers.",
    "VALUE-TYPE CLASSIFICATION (never claim these as one blended savings figure):",
    "  protected value (risk hedge): Enhancement / change-order leakage.",
    "  incremental negotiated value: Volume-band price flex-down.",
  ].join("\n");

  it("passes when the answer names at least one value-type label", () => {
    const result = runSourceAnswerQualityGate({
      answerText:
        "The award locks $5M, mostly protected value from the change-order leakage lever. Next: confirm the contract language.",
      mode: "committed_value",
      hasGroundingContext: true,
      groundingBlockText: GROUNDING_WITH_CLASSIFICATION,
    });
    const check = result.checks.find((c) => c.id === "includes_value_type_breakdown");
    expect(check?.passed).toBe(true);
  });

  it("fails and repairs by appending the grounding's own classification when the answer blends the value into one figure", () => {
    const result = runSourceAnswerQualityGate({
      answerText: "You're locking in $5M of savings. Next: confirm the contract language.",
      mode: "committed_value",
      hasGroundingContext: true,
      groundingBlockText: GROUNDING_WITH_CLASSIFICATION,
    });
    expect(result.repaired).toBe(true);
    expect(result.finalText.toLowerCase()).toMatch(
      /protected value|incremental negotiated/,
    );
  });

  it("does not require a breakdown when the grounding carries none", () => {
    const result = runSourceAnswerQualityGate({
      answerText: "The award locks $5M. Next: confirm the contract language.",
      mode: "committed_value",
      hasGroundingContext: true,
      groundingBlockText: "COMMITTED VALUE GROUNDING: Headline: The executed award locks $5M.",
    });
    const check = result.checks.find((c) => c.id === "includes_value_type_breakdown");
    expect(check?.passed).toBe(true);
    expect(check?.detail).toMatch(/no breakdown required/i);
  });
});

describe("runSourceAnswerQualityGate — Phase B generic-ask rejection (uses_specific_ask_when_available)", () => {
  it("fails and repairs a generic negotiation answer by appending the specific-ask pointer (append, not strip — stripping would mangle the sentence)", () => {
    const result = runSourceAnswerQualityGate({
      answerText: "You should negotiate harder in BAFO. Next: press the vendor.",
      mode: "bafo_strategy",
      hasGroundingContext: true,
      groundingFacts: { bafoOpenLeverCount: "2" },
      groundingHasSpecificAsk: true,
    });
    expect(result.repaired).toBe(true);
    expect(result.finalText.toLowerCase()).toContain("grounding above");
    expect(result.finalText.toLowerCase()).toContain("named concession");
  });

  it("passes when the answer already uses the specific ask", () => {
    const result = runSourceAnswerQualityGate({
      answerText:
        "Press for the fixed service catalog conversion on the enhancement-leakage lever. Next: confirm with the vendor.",
      mode: "bafo_strategy",
      hasGroundingContext: true,
      groundingFacts: { bafoOpenLeverCount: "1" },
      groundingHasSpecificAsk: true,
    });
    const check = result.checks.find((c) => c.id === "uses_specific_ask_when_available");
    expect(check?.passed).toBe(true);
  });

  it("does not require specificity when the grounding has no specific ask to point to (honest MODEL)", () => {
    const result = runSourceAnswerQualityGate({
      answerText: "You should negotiate harder in BAFO. Next: press the vendor.",
      mode: "bafo_strategy",
      hasGroundingContext: true,
      groundingHasSpecificAsk: false,
    });
    const check = result.checks.find((c) => c.id === "uses_specific_ask_when_available");
    expect(check?.passed).toBe(true);
  });

  it("does not apply outside BAFO/vendor modes", () => {
    const result = runSourceAnswerQualityGate({
      answerText: "You should negotiate harder. Next: press the vendor.",
      mode: "committed_value",
      hasGroundingContext: true,
      groundingHasSpecificAsk: true,
    });
    const check = result.checks.find((c) => c.id === "uses_specific_ask_when_available");
    expect(check?.passed).toBe(true);
    expect(check?.detail).toMatch(/not a bafo\/vendor mode/i);
  });
});

describe("runSourceAnswerQualityGate — Phase B checks never regress a passing Phase A turn", () => {
  it("a well-formed event_status answer still passes with zero Phase B interference", () => {
    const result = runSourceAnswerQualityGate({
      answerText:
        "This event is on the RFP stage, stage 3 of 11. Next step: upload the signed sponsor letter.",
      mode: "event_status",
      hasGroundingContext: true,
      groundingFacts: { currentStageLabel: "RFP" },
    });
    expect(result.passed).toBe(true);
    expect(result.repaired).toBe(false);
  });
});

describe("runSourceAnswerQualityGate — Phase C: decision_recommendation / contract_optimization extend the value-mode checks", () => {
  const DECISION_GROUNDING = [
    "DECISION RECOMMENDATION GROUNDING (composite):",
    "EXECUTIVE DECISION FACET: Net negotiable value $4.2M–$6.5M.",
    "VALUE-TYPE CLASSIFICATION (never claim these as one blended savings figure):",
    "  incremental negotiated value: Volume-band price flex-down.",
  ].join("\n");

  it("traceable_to_grounding applies to decision_recommendation (composite $ figures must be quoted)", () => {
    const result = runSourceAnswerQualityGate({
      answerText:
        "Net negotiable value is $4.2M–$6.5M. Next: confirm with the vendor before award.",
      mode: "decision_recommendation",
      hasGroundingContext: true,
      groundingBlockText: DECISION_GROUNDING,
    });
    const check = result.checks.find((c) => c.id === "traceable_to_grounding");
    expect(check?.passed).toBe(true);
  });

  it("fails and repairs decision_recommendation when a $ figure is not in the composed grounding", () => {
    const result = runSourceAnswerQualityGate({
      answerText: "Net negotiable value is $9.9M. Next: confirm with the vendor before award.",
      mode: "decision_recommendation",
      hasGroundingContext: true,
      groundingBlockText: DECISION_GROUNDING,
    });
    expect(result.repaired).toBe(true);
    expect(result.finalText).not.toContain("$9.9M");
  });

  it("includes_value_type_breakdown applies to decision_recommendation", () => {
    const result = runSourceAnswerQualityGate({
      answerText: "You're locking in $4.2M–$6.5M. Next: confirm with the vendor before award.",
      mode: "decision_recommendation",
      hasGroundingContext: true,
      groundingBlockText: DECISION_GROUNDING,
    });
    expect(result.repaired).toBe(true);
    expect(result.finalText.toLowerCase()).toContain("incremental negotiated");
  });

  it("uses_specific_ask_when_available applies to decision_recommendation (composited BAFO facet)", () => {
    const result = runSourceAnswerQualityGate({
      answerText: "You should negotiate harder before awarding. Next: confirm with the vendor.",
      mode: "decision_recommendation",
      hasGroundingContext: true,
      groundingHasSpecificAsk: true,
    });
    expect(result.repaired).toBe(true);
    expect(result.finalText.toLowerCase()).toContain("grounding above");
  });

  it("traceable_to_grounding applies to contract_optimization", () => {
    const CONTRACT_OPT_GROUNDING = [
      "CONTRACT OPTIMIZATION GROUNDING (authoritative):",
      "Leakage / opportunity pool: $2.1M–$3.4M across 1 lever.",
    ].join("\n");
    const result = runSourceAnswerQualityGate({
      answerText: "The leakage pool is $2.1M–$3.4M. Next: review the scope memo.",
      mode: "contract_optimization",
      hasGroundingContext: true,
      groundingBlockText: CONTRACT_OPT_GROUNDING,
    });
    const check = result.checks.find((c) => c.id === "traceable_to_grounding");
    expect(check?.passed).toBe(true);
  });

  it("accepts Source four-ledger language as the contract_optimization value-type breakdown", () => {
    const CONTRACT_OPT_GROUNDING = [
      "AUTHORITATIVE SOURCE CONTRACT GROUNDING:",
      "Opportunity rows:",
      "- SLA credits · recoverable leakage · $755K · stage quantified · amount can be reproduced",
      "- Scope reduction · avoided cost · $2.4M · stage quantified · amount can be reproduced",
      "- Rate relief · negotiated improvement · $1.3M · stage quantified · amount can be reproduced",
      "Finance-confirmed realized value: $940K.",
    ].join("\n");
    const result = runSourceAnswerQualityGate({
      answerText:
        "Recoverable leakage is $755K, avoided cost is $2.4M, negotiated improvement is $1.3M, and realized value is $940K. Next: keep Finance/Tower as the realized-value gate.",
      mode: "contract_optimization",
      hasGroundingContext: true,
      groundingBlockText: CONTRACT_OPT_GROUNDING,
    });
    const check = result.checks.find(
      (c) => c.id === "includes_value_type_breakdown",
    );
    expect(check?.passed).toBe(true);
  });

  it("repairs pending Finance/Tower evidence that is overstated as confirmed realized value", () => {
    const CONTRACT_OPT_GROUNDING = [
      "AUTHORITATIVE SOURCE CONTRACT GROUNDING:",
      "Workflow lifecycle state: strategy approval approved; vendor outcome agreed; Finance/Tower confirmation request pending; value-proof gate open.",
      "Finance/Tower evidence pending approval: $940K. Approved realized value: $0 until the Finance/Tower confirmation request is approved.",
      "Rules for these numbers: If the value-proof gate is open, do not say Finance has confirmed, do not say realized value to date, do not call the pending evidence booked, claimable, confirmed, or approved.",
    ].join("\n");
    const result = runSourceAnswerQualityGate({
      answerText:
        "Finance has confirmed $940K in realized value, but the Finance/Tower confirmation request is still pending approval. Next: wait for approval.",
      mode: "contract_optimization",
      hasGroundingContext: true,
      groundingBlockText: CONTRACT_OPT_GROUNDING,
    });

    expect(result.repaired).toBe(true);
    expect(result.passed).toBe(true);
    expect(result.finalText).toContain(
      "Finance/Tower evidence is loaded but still pending approval",
    );
    expect(result.finalText).toContain("approved realized value remains $0");
    expect(result.finalText).not.toMatch(/Finance has confirmed \$940K/i);
  });

  it("repairs pending Finance/Tower evidence that is described as automatically becoming realized value", () => {
    const CONTRACT_OPT_GROUNDING = [
      "AUTHORITATIVE SOURCE CONTRACT GROUNDING:",
      "Workflow lifecycle state: strategy approval approved; vendor outcome agreed; Finance/Tower confirmation request pending; value-proof gate open.",
      "Finance/Tower evidence pending approval: $940K. Approved realized value: $0 until the Finance/Tower confirmation request is approved.",
      "Rules for these numbers: If the value-proof gate is open, do not say Finance has confirmed, do not say realized value to date, do not call the pending evidence booked, claimable, confirmed, or approved. Do not say the pending amount will automatically become realized value.",
    ].join("\n");
    const result = runSourceAnswerQualityGate({
      answerText:
        "Approved realized value is $0 today. The moment Finance approves, that $940K moves into confirmed realized value. Next: wait for Finance/Tower approval.",
      mode: "contract_optimization",
      hasGroundingContext: true,
      groundingBlockText: CONTRACT_OPT_GROUNDING,
    });

    expect(result.repaired).toBe(true);
    expect(result.passed).toBe(true);
    expect(result.finalText).toContain("becomes eligible");
    expect(result.finalText).toContain("approved realized value remains $0");
    expect(result.finalText).not.toMatch(/moves into confirmed realized value/i);
  });
});

describe("runSourceAnswerQualityGate — Phase C: general_advisory has a lighter bar", () => {
  it("passes without a value-type breakdown or specific ask even when the grounding carries one (lighter bar by design)", () => {
    const result = runSourceAnswerQualityGate({
      answerText:
        "This event is on the RFP stage with $4.2M at stake overall. Next: keep pushing evidence uploads.",
      mode: "general_advisory",
      hasGroundingContext: true,
      groundingBlockText: [
        "GENERAL ADVISORY ROLL-UP (compact):",
        "VALUE-TYPE CLASSIFICATION (never claim these as one blended savings figure):",
        "  protected value (risk hedge): Enhancement leakage.",
      ].join("\n"),
    });
    // general_advisory is excluded from PHASE_C_VALUE_MODES / ask-mode sets —
    // these checks vacuously pass regardless of the grounding's content.
    const valueTypeCheck = result.checks.find((c) => c.id === "includes_value_type_breakdown");
    const askCheck = result.checks.find((c) => c.id === "uses_specific_ask_when_available");
    expect(valueTypeCheck?.passed).toBe(true);
    expect(askCheck?.passed).toBe(true);
    expect(result.passed).toBe(true);
  });

  it("still enforces the core Phase A checks (no banned language, has a next step)", () => {
    const result = runSourceAnswerQualityGate({
      answerText: "I am just a workflow assistant.",
      mode: "general_advisory",
      hasGroundingContext: true,
    });
    expect(result.repaired).toBe(true);
    expect(result.finalText.toLowerCase()).not.toContain("i am just a workflow assistant");
  });
});
