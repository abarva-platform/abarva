import { buildSourceArtifactLifecycleSummary } from "../artifact-lifecycle-matrix";

describe("Source artifact lifecycle matrix", () => {
  it("summarizes canonical Source artifacts and governance coverage", () => {
    const summary = buildSourceArtifactLifecycleSummary([
      {
        artifactType: "d05_scope_memo",
        sourceOrigin: "generated",
        artifactGroup: "generated",
        status: "draft",
      },
      {
        artifactType: "d05_scope_memo",
        sourceOrigin: "reuploaded",
        status: "client_final",
        isClientFinal: true,
      },
      {
        artifactType: "d07_ticket_synth",
        artifactGroup: "upload",
        evidenceState: "parsed",
      },
    ]);

    expect(summary.expectedCount).toBe(33);
    expect(summary.requiredCount).toBeGreaterThan(20);
    expect(summary.promptBackedCount).toBeGreaterThan(5);
    expect(summary.renderableCount).toBeGreaterThan(10);
    expect(summary.clientFinalCount).toBe(1);
    expect(summary.evidenceOnlyCount).toBe(1);

    const scopeMemo = summary.rows.find((row) => row.code === "d05_scope_memo");
    const ticketSynthesis = summary.rows.find(
      (row) => row.code === "d07_ticket_synth",
    );
    const rfpPack = summary.rows.find((row) => row.code === "d09_rfp_pack");

    expect(scopeMemo?.lifecycleState).toBe("client_final");
    expect(scopeMemo?.approvalLabel).toBe("Human accepted");
    expect(scopeMemo?.governanceMessage).toContain(
      "client-final artifact is now the authoritative deliverable of record",
    );
    expect(ticketSynthesis?.lifecycleState).toBe("evidence_only");
    expect(ticketSynthesis?.governanceMessage).toContain(
      "not a client-approved deliverable",
    );
    expect(rfpPack?.prompt.maxTokensLabel).toBe("128k max");
    expect(rfpPack?.exportFormatsLabel).toBe("DOCX / HTML / PDF");
  });

  it("keeps AI-generated drafts in review-required state until client final is accepted", () => {
    const summary = buildSourceArtifactLifecycleSummary([
      {
        artifactKind: "d09_rfp_pack",
        artifactGroup: "generated",
        sourceOrigin: "generated",
        status: "approved",
      },
    ]);

    const rfpPack = summary.rows.find((row) => row.code === "d09_rfp_pack");

    expect(summary.aiDraftCount).toBe(1);
    expect(summary.clientFinalCount).toBe(0);
    expect(rfpPack?.lifecycleState).toBe("ai_draft");
    expect(rfpPack?.approvalLabel).toBe("Human review required");
    expect(rfpPack?.governanceMessage).toContain(
      "Human review is required before external use",
    );
  });

  it("matches production registry records by artifactKind", () => {
    const summary = buildSourceArtifactLifecycleSummary([
      {
        artifactKind: "d05_scope_memo",
        sourceOrigin: "generated",
        status: "approved",
      },
    ]);

    const scopeMemo = summary.rows.find((row) => row.code === "d05_scope_memo");

    expect(summary.aiDraftCount).toBe(1);
    expect(scopeMemo?.lifecycleState).toBe("ai_draft");
    expect(scopeMemo?.approvalLabel).toBe("Human review required");
  });
});
