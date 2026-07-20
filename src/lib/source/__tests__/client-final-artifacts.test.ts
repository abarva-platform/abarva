import {
  buildClientFinalChangeSummary,
  CLIENT_FINAL_GOVERNANCE_MESSAGE,
  isClientFinalArtifact,
  resolveAuthoritativeArtifact,
} from "../client-final-artifacts";
import { SOURCE_AI_DRAFT_GOVERNANCE_MESSAGE } from "../artifact-governance";

describe("client-final artifact governance", () => {
  it("keeps draft and final governance language distinct", () => {
    expect(SOURCE_AI_DRAFT_GOVERNANCE_MESSAGE).toBe(
      "AI-prepared draft. Human review is required before external use.",
    );
    expect(CLIENT_FINAL_GOVERNANCE_MESSAGE).toContain(
      "client-final artifact is now the authoritative deliverable of record",
    );
  });

  it("recognizes client-final artifacts by status or flag", () => {
    expect(isClientFinalArtifact({ status: "client_final" })).toBe(true);
    expect(isClientFinalArtifact({ isClientFinal: true })).toBe(true);
    expect(isClientFinalArtifact({ status: "approved" })).toBe(false);
  });

  it("resolves client-final above approved and generated versions", () => {
    const winner = resolveAuthoritativeArtifact([
      {
        id: "generated-2",
        version: 2,
        lifecycleState: "current",
        artifactGroup: "generated",
        status: "draft",
        updatedAt: "2026-07-03T10:00:00.000Z",
      },
      {
        id: "approved-1",
        version: 3,
        lifecycleState: "current",
        status: "approved",
        updatedAt: "2026-07-03T11:00:00.000Z",
      },
      {
        id: "client-final-1",
        version: 4,
        lifecycleState: "current",
        status: "client_final",
        isClientFinal: true,
        clientFinalAcceptedAt: "2026-07-03T09:00:00.000Z",
      },
    ]);

    expect(winner?.id).toBe("client-final-1");
  });

  it("falls back to approved, then generated when no client-final exists", () => {
    expect(
      resolveAuthoritativeArtifact([
        {
          id: "generated",
          version: 2,
          lifecycleState: "current",
          artifactGroup: "generated",
          status: "draft",
        },
        {
          id: "approved",
          version: 1,
          lifecycleState: "current",
          status: "approved",
        },
      ])?.id,
    ).toBe("approved");

    expect(
      resolveAuthoritativeArtifact([
        {
          id: "generated",
          version: 2,
          lifecycleState: "current",
          artifactGroup: "generated",
          status: "draft",
        },
      ])?.id,
    ).toBe("generated");
  });

  it("builds a metadata-only change summary with the client ownership language", () => {
    const summary = buildClientFinalChangeSummary({
      previousGeneratedArtifactId: "draft-1",
      previousGeneratedVersion: 1,
      clientFinalArtifactId: "final-1",
      clientFinalVersion: 2,
      note: "Approved after legal review.",
      reviewMeetingDate: "2026-07-03",
      stakeholderGroup: "CPO steering committee",
    });

    expect(summary.summary).toBe(CLIENT_FINAL_GOVERNANCE_MESSAGE);
    expect(summary.changeAnalysisCompleted).toBe(false);
    expect(summary.previousGeneratedArtifactId).toBe("draft-1");
    expect(summary.clientFinalVersion).toBe(2);
    expect(summary.note).toBe("Approved after legal review.");
  });
});
