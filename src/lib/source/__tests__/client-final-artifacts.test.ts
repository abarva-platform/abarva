import {
  buildClientFinalChangeSummary,
  CLIENT_FINAL_GOVERNANCE_MESSAGE,
  isClientFinalArtifact,
  resolveAuthoritativeArtifact,
  resolveAuthoritativeArtifactSlots,
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

  it("treats sourceOrigin=generated as a generated draft fallback", () => {
    expect(
      resolveAuthoritativeArtifact([
        {
          id: "uploaded-evidence",
          version: 2,
          lifecycleState: "current",
          sourceOrigin: "uploaded",
          updatedAt: "2026-07-04T10:00:00.000Z",
        },
        {
          id: "generated-draft",
          version: 1,
          lifecycleState: "current",
          sourceOrigin: "generated",
          updatedAt: "2026-07-03T10:00:00.000Z",
        },
      ])?.id,
    ).toBe("generated-draft");
  });

  it("resolves one authoritative artifact per lifecycle slot and demotes history", () => {
    const slots = resolveAuthoritativeArtifactSlots(
      [
        {
          id: "rfp-draft",
          version: 1,
          lifecycleState: "superseded",
          sourceOrigin: "generated",
          status: "draft",
          updatedAt: "2026-07-03T10:00:00.000Z",
          slotKey: "rfp::d09_rfp_pack",
        },
        {
          id: "rfp-client-final",
          version: 2,
          lifecycleState: "current",
          status: "client_final",
          isClientFinal: true,
          isCurrentAuthoritative: true,
          clientFinalAcceptedAt: "2026-07-04T10:00:00.000Z",
          slotKey: "rfp::d09_rfp_pack",
        },
        {
          id: "scorecard-approved",
          version: 1,
          lifecycleState: "current",
          status: "approved",
          slotKey: "evaluation::d16_scorecard",
        },
      ],
      (artifact) => artifact.slotKey,
    );

    expect(slots).toHaveLength(2);
    expect(
      slots.find((slot) => slot.slotKey === "rfp::d09_rfp_pack"),
    ).toMatchObject({
      authoritative: { id: "rfp-client-final" },
      history: [{ id: "rfp-draft" }],
    });
    expect(
      slots.find((slot) => slot.slotKey === "evaluation::d16_scorecard"),
    ).toMatchObject({
      authoritative: { id: "scorecard-approved" },
      history: [],
    });
  });

  it("resolves an active-acceptance artifact above isCurrentAuthoritative but below client-final", () => {
    // SOURCE-SHELL-004: an explicit, reasoned "accept as authoritative"
    // record is a stronger signal than the inferred isCurrentAuthoritative
    // flag, but a real client-final upload still wins.
    const withoutClientFinal = resolveAuthoritativeArtifact([
      {
        id: "inferred-authoritative",
        version: 1,
        lifecycleState: "current",
        isCurrentAuthoritative: true,
      },
      {
        id: "explicitly-accepted",
        version: 1,
        lifecycleState: "current",
        hasActiveAcceptance: true,
      },
    ]);
    expect(withoutClientFinal?.id).toBe("explicitly-accepted");

    const withClientFinal = resolveAuthoritativeArtifact([
      {
        id: "explicitly-accepted",
        version: 1,
        lifecycleState: "current",
        hasActiveAcceptance: true,
      },
      {
        id: "client-final-1",
        version: 2,
        lifecycleState: "current",
        status: "client_final",
        isClientFinal: true,
      },
    ]);
    expect(withClientFinal?.id).toBe("client-final-1");
  });

  it("leaves existing callers unaffected when hasActiveAcceptance is never populated", () => {
    // Callers that don't join acceptance data (every existing call site,
    // pre-SOURCE-SHELL-004) simply never set this field — the new pool is
    // empty and resolution falls through exactly as before.
    expect(
      resolveAuthoritativeArtifact([
        {
          id: "approved",
          version: 1,
          lifecycleState: "current",
          status: "approved",
        },
      ])?.id,
    ).toBe("approved");
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
