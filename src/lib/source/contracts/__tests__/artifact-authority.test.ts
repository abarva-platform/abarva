import {
  resolveArtifactAuthority,
  upstreamCandidateSatisfiesRequirement,
} from "../artifact-authority";

function baseInput(overrides: Partial<Parameters<typeof resolveArtifactAuthority>[0]> = {}) {
  return {
    code: "d05_scope_memo",
    status: "draft",
    lifecycleState: "current",
    approvalState: null,
    approvedBy: null,
    hasActiveAcceptance: false,
    eventStageKey: "scope" as const,
    ...overrides,
  };
}

describe("resolveArtifactAuthority", () => {
  it("a freshly-authored, never-accepted artifact is a draft, not accepted, not authoritative, not final", () => {
    const decision = resolveArtifactAuthority(baseInput());
    expect(decision.isDraft).toBe(true);
    expect(decision.isAccepted).toBe(false);
    expect(decision.isAuthoritative).toBe(false);
    expect(decision.isFinal).toBe(false);
    expect(decision.blockers.map((b) => b.code)).toEqual(
      expect.arrayContaining(["review_required", "not_accepted"]),
    );
  });

  it("an out-of-sequence human-authored draft (chat-save, stage precedes eligibility) is still just a draft — not authoritative, blocked on BOTH acceptance and stage", () => {
    const decision = resolveArtifactAuthority(
      baseInput({
        code: "d24_decision_brief", // earliestEligibleStage = executive_decision
        eventStageKey: "scope",
        status: "draft",
        hasActiveAcceptance: false,
      }),
    );
    expect(decision.isDraft).toBe(true);
    expect(decision.isAuthoritative).toBe(false);
    expect(decision.blockers.map((b) => b.code)).toEqual(
      expect.arrayContaining(["not_accepted", "stage_not_eligible"]),
    );
  });

  it("that same draft cannot satisfy an upstream requirement", () => {
    const satisfied = upstreamCandidateSatisfiesRequirement(
      baseInput({
        code: "d24_decision_brief",
        eventStageKey: "scope",
        hasActiveAcceptance: false,
      }),
    );
    expect(satisfied).toBe(false);
  });

  it("an accepted artifact, stage-eligible, becomes authoritative and satisfies upstream requirements", () => {
    const decision = resolveArtifactAuthority(
      baseInput({
        code: "d05_scope_memo", // earliestEligibleStage = scope
        eventStageKey: "scope",
        status: "approved",
        approvedBy: "user-1",
        hasActiveAcceptance: true,
      }),
    );
    expect(decision.isAccepted).toBe(true);
    expect(decision.isAuthoritative).toBe(true);
    expect(decision.blockers).toEqual([]);
    expect(
      upstreamCandidateSatisfiesRequirement(
        baseInput({
          code: "d05_scope_memo",
          eventStageKey: "scope",
          status: "approved",
          approvedBy: "user-1",
          hasActiveAcceptance: true,
        }),
      ),
    ).toBe(true);
  });

  it("accepted but stage-ineligible (event hasn't caught up yet) is accepted but NOT authoritative", () => {
    const decision = resolveArtifactAuthority(
      baseInput({
        code: "d24_decision_brief",
        eventStageKey: "scope", // event not yet at executive_decision
        hasActiveAcceptance: true,
      }),
    );
    expect(decision.isAccepted).toBe(true);
    expect(decision.isAuthoritative).toBe(false);
    // Stage ineligibility is independent of (and additional to) the fact
    // that governance-stage/finality haven't been reached either in this
    // fixture (status is still "draft", no sibling passed) — this test
    // isolates stage_not_eligible specifically, not the full blocker set.
    expect(decision.blockers.map((b) => b.code)).toContain("stage_not_eligible");
  });

  it("a review-pending artifact (human_review governance stage, not yet accepted) does not satisfy upstream", () => {
    const satisfied = upstreamCandidateSatisfiesRequirement(
      baseInput({
        status: "preliminary", // HUMAN_REVIEW_STATUSES member
        hasActiveAcceptance: false,
      }),
    );
    expect(satisfied).toBe(false);
  });

  it("a rejected artifact (status=blocked) never becomes authoritative even if accepted", () => {
    const decision = resolveArtifactAuthority(
      baseInput({
        status: "blocked",
        hasActiveAcceptance: true,
      }),
    );
    expect(decision.isAuthoritative).toBe(false);
    expect(decision.blockers.some((b) => b.code === "not_reviewable")).toBe(true);
  });

  it("a superseded artifact never becomes authoritative even if accepted", () => {
    const decision = resolveArtifactAuthority(
      baseInput({
        lifecycleState: "superseded",
        hasActiveAcceptance: true,
      }),
    );
    expect(decision.isAuthoritative).toBe(false);
    expect(
      upstreamCandidateSatisfiesRequirement(
        baseInput({ lifecycleState: "superseded", hasActiveAcceptance: true }),
      ),
    ).toBe(false);
  });

  it("a retired artifact never becomes authoritative even if accepted", () => {
    const decision = resolveArtifactAuthority(
      baseInput({ lifecycleState: "retired", hasActiveAcceptance: true }),
    );
    expect(decision.isAuthoritative).toBe(false);
  });

  // Export eligibility
  it("an internal (non-client-facing) artifact is export-eligible even at ai_draft — matching the contract's internalMinimumGovernanceStage=ai_draft", () => {
    // d03_archetype_decision: internal, audience "internal", clientFacing=false
    const decision = resolveArtifactAuthority(
      baseInput({ code: "d03_archetype_decision", status: "draft" }),
    );
    expect(decision.isExportEligible).toBe(true);
  });

  it("a client-facing artifact is NOT export-eligible at ai_draft, and IS eligible once approved_for_external_use", () => {
    // d01_strategy_memo: clientFacing=true per source-artifact-profiles.ts
    const draftDecision = resolveArtifactAuthority(
      baseInput({ code: "d01_strategy_memo", status: "draft", eventStageKey: "strategy" }),
    );
    expect(draftDecision.isExportEligible).toBe(false);
    expect(
      draftDecision.blockers.some(
        (b) => b.code === "governance_stage_below_export_minimum",
      ),
    ).toBe(true);

    const approvedDecision = resolveArtifactAuthority(
      baseInput({
        code: "d01_strategy_memo",
        eventStageKey: "strategy",
        status: "approved",
        approvedBy: "user-1",
      }),
    );
    expect(approvedDecision.isExportEligible).toBe(true);
  });

  it("a superseded artifact is never export-eligible regardless of prior governance stage", () => {
    const decision = resolveArtifactAuthority(
      baseInput({
        code: "d01_strategy_memo",
        lifecycleState: "superseded",
        status: "client_final",
      }),
    );
    expect(decision.isExportEligible).toBe(false);
  });

  // Finality
  it("d24_decision_brief cannot claim finality without d26_steward_signoff accepted, even if itself accepted and stage-eligible", () => {
    const decision = resolveArtifactAuthority(
      baseInput({
        code: "d24_decision_brief",
        eventStageKey: "executive_decision",
        status: "approved",
        approvedBy: "user-1",
        hasActiveAcceptance: true,
        siblingArtifactsAccepted: false,
      }),
    );
    expect(decision.isAuthoritative).toBe(true);
    expect(decision.isFinal).toBe(false);
    expect(decision.blockers.some((b) => b.code === "sibling_not_accepted")).toBe(
      true,
    );
  });

  it("d24_decision_brief achieves finality once accepted, stage-eligible, governance-approved, AND its sibling is accepted", () => {
    const decision = resolveArtifactAuthority(
      baseInput({
        code: "d24_decision_brief",
        eventStageKey: "executive_decision",
        status: "approved",
        approvedBy: "user-1",
        hasActiveAcceptance: true,
        siblingArtifactsAccepted: true,
      }),
    );
    expect(decision.isFinal).toBe(true);
    expect(decision.blockers).toEqual([]);
  });

  it("an artifact with no finalityConditions (e.g. d01_strategy_memo) never claims finality, regardless of state", () => {
    const decision = resolveArtifactAuthority(
      baseInput({
        code: "d01_strategy_memo",
        eventStageKey: "strategy",
        status: "approved",
        approvedBy: "user-1",
        hasActiveAcceptance: true,
      }),
    );
    expect(decision.isFinal).toBe(false);
  });

  it("throws for an unknown artifact code rather than silently allowing any decision", () => {
    expect(() =>
      resolveArtifactAuthority(baseInput({ code: "d99_does_not_exist" })),
    ).toThrow(/no contract registered/);
  });
});
