import {
  applyChangeSet,
  downstreamImpacts,
  gateCanAdvance,
  gateStateFor,
  buildRegenerationPrompt,
  type SolutionContextChangeSet,
  type ArtifactReviewPacket,
} from "../review-loop";
import { emptySolutionContext } from "@/lib/programs/solution-context";

function changeSet(over: Partial<SolutionContextChangeSet> = {}): SolutionContextChangeSet {
  return {
    id: "cs1",
    sourceReviewPacketId: "rp1",
    proposedUpdates: { kpis: [{ name: "HEDIS gap closure", domain: "clinical" }] },
    conflictsWithApprovedContext: [],
    approvedBy: "sponsor",
    approvedAt: "2026-06-22",
    ...over,
  };
}

describe("review-change-regenerate loop", () => {
  it("refuses to apply an UNapproved change set", () => {
    const ctx = emptySolutionContext("m1", "t");
    expect(() => applyChangeSet(ctx, changeSet({ approvedBy: undefined }))).toThrow(/not approved/i);
  });

  it("applies an approved change set into SolutionContext + records the approval", () => {
    const ctx = applyChangeSet(emptySolutionContext("m1", "t"), changeSet());
    expect(ctx.kpis?.[0].name).toBe("HEDIS gap closure");
    expect(ctx.humanApprovalNotes.join(" ")).toMatch(/approved by sponsor/);
  });

  it("computes downstream staleness (KPI change → P2/P3/P4 artifacts)", () => {
    const impacts = downstreamImpacts(changeSet());
    const arts = impacts.map((i) => i.artifact);
    expect(arts).toEqual(
      expect.arrayContaining([
        "discovery_report",
        "solution_approach_options",
        "target_state_architecture",
        "execution_roadmap",
      ]),
    );
  });

  it("a gate cannot advance while an artifact has unresolved change requests", () => {
    const withFeedback: ArtifactReviewPacket = {
      artifactId: "a1",
      artifactType: "target_state_architecture",
      phase: "P3",
      currentVersionId: "v1",
      uploadedFiles: [],
      extractedFeedback: [
        {
          id: "f1",
          sourceFileId: "u1",
          sourceLocator: "p3",
          comment: "change KPI",
          requestedChange: "use HEDIS",
          affectedSection: "KPIs",
          changeType: "decision_change",
          confidence: "high",
          requiresApproval: true,
        },
      ],
      conflicts: [],
      downstreamImpacts: [],
      reviewStatus: "needs_triage",
    };
    expect(gateCanAdvance([withFeedback]).canAdvance).toBe(false);
    expect(gateStateFor(withFeedback)).toBe("changes_requested");

    const signedOff = { ...withFeedback, reviewStatus: "signed_off" as const };
    expect(gateCanAdvance([signedOff]).canAdvance).toBe(true);
    expect(gateStateFor(signedOff)).toBe("approved");
  });

  it("builds a scoped, versioned regeneration prompt (preserve/change/don't)", () => {
    const prompt = buildRegenerationPrompt({
      artifactType: "target_state_architecture",
      nextVersion: 2,
      solutionContext: emptySolutionContext("m1", "t"),
      currentArtifactContent: "<html>v1</html>",
      approvedChangeSet: changeSet(),
    });
    expect(prompt).toMatch(/version 2/);
    expect(prompt).toMatch(/PRESERVE:/);
    expect(prompt).toMatch(/DO NOT:/);
    expect(prompt).toMatch(/Reopen the entire strategy/);
    expect(prompt).toContain("<html>v1</html>");
  });
});
