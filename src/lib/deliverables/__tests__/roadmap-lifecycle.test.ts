import {
  deriveRoadmapLifecycle,
  roadmapLifecycleSentence,
  roadmapLifecycleTag,
  type RoadmapLifecycleInput,
} from "../roadmap-lifecycle";

function input(
  over: Partial<RoadmapLifecycleInput> = {},
): RoadmapLifecycleInput {
  return {
    phase: 4,
    entryGateApproved: true,
    captureComplete: true,
    exitGateApproved: false,
    artifactGenerated: false,
    ...over,
  };
}

describe("deriveRoadmapLifecycle — one unified state", () => {
  it("entry_approved: entered but capture not complete, no artifact", () => {
    const l = deriveRoadmapLifecycle(input({ captureComplete: false }));
    expect(l.state).toBe("entry_approved");
    expect(l.isEntered).toBe(true);
    expect(l.isFinal).toBe(false);
    expect(l.isReviewDraft).toBe(false);
  });

  it("generation_eligible: entered + capture complete, no artifact yet", () => {
    const l = deriveRoadmapLifecycle(input());
    expect(l.state).toBe("generation_eligible");
  });

  it("review_draft: an artifact exists but the exit gate is not approved", () => {
    const l = deriveRoadmapLifecycle(input({ artifactGenerated: true }));
    expect(l.state).toBe("review_draft");
    expect(l.isReviewDraft).toBe(true);
    expect(l.isFinal).toBe(false);
  });

  it("exit_approved_final: the exit gate is approved (wins over a generated draft)", () => {
    const l = deriveRoadmapLifecycle(
      input({ artifactGenerated: true, exitGateApproved: true }),
    );
    expect(l.state).toBe("exit_approved_final");
    expect(l.isFinal).toBe(true);
    expect(l.isReviewDraft).toBe(false);
  });

  it("not entered: entry gate not approved", () => {
    const l = deriveRoadmapLifecycle(
      input({ entryGateApproved: false, captureComplete: false }),
    );
    expect(l.isEntered).toBe(false);
    expect(l.state).toBe("entry_approved");
  });
});

describe("roadmapLifecycleSentence — no contradiction with the artifact's existence", () => {
  it("review draft says exit approval pending, NOT 'no generation until the gate is approved'", () => {
    const s = roadmapLifecycleSentence(
      deriveRoadmapLifecycle(input({ artifactGenerated: true })),
      4,
    );
    expect(s).toMatch(
      /Review draft generated after Phase 4 entry and capture completion/i,
    );
    expect(s).toMatch(
      /exit approval and final sponsor acceptance remain pending/i,
    );
    expect(s).not.toMatch(
      /no generation until the (gate|Phase 4 gate) is approved/i,
    );
  });

  it("final says the exit gate is approved and accepted", () => {
    const s = roadmapLifecycleSentence(
      deriveRoadmapLifecycle(input({ exitGateApproved: true })),
      4,
    );
    expect(s).toMatch(/Final/i);
    expect(s).toMatch(/exit gate is approved/i);
  });

  it("tags are compact and state-specific", () => {
    expect(
      roadmapLifecycleTag(
        deriveRoadmapLifecycle(input({ artifactGenerated: true })),
      ),
    ).toBe("Review draft");
    expect(
      roadmapLifecycleTag(
        deriveRoadmapLifecycle(input({ exitGateApproved: true })),
      ),
    ).toBe("Final");
    expect(roadmapLifecycleTag(deriveRoadmapLifecycle(input()))).toBe(
      "Ready to draft",
    );
  });
});
