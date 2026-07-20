import {
  buildSourceArtifactStandardsCsv,
  buildSourceArtifactLifecycleSummary,
  buildSourceArtifactStandardsContext,
} from "../artifact-lifecycle-matrix";

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
    expect(summary.quality.hardFailCount).toBeGreaterThan(0);
    expect(summary.quality.missingRequiredCount).toBeGreaterThan(0);
    expect(summary.quality.reviewRequiredCount).toBe(0);
    expect(summary.quality.label).toBe("Hard fails present");

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
    expect(scopeMemo?.quality.state).toBe("decision_ready");
    expect(scopeMemo?.quality.score).toBeGreaterThanOrEqual(88);
    expect(ticketSynthesis?.lifecycleState).toBe("evidence_only");
    expect(ticketSynthesis?.governanceMessage).toContain(
      "not a client-approved deliverable",
    );
    expect(ticketSynthesis?.quality.state).toBe("evidence_only");
    expect(ticketSynthesis?.quality.hardFails[0]).toContain(
      "Uploaded evidence is present",
    );
    expect(rfpPack?.audienceLabel).toContain("Client-facing");
    expect(rfpPack?.structureLabel).toContain("Required exhibits");
    expect(rfpPack?.pageGuidanceLabel).toContain("No fixed page cap");
    expect(rfpPack?.controlsLabel).toContain("Missing inputs");
    expect(rfpPack?.prompt.maxTokensLabel).toBe("128k max");
    expect(rfpPack?.exportFormatsLabel).toBe("DOCX / HTML / PDF");
    expect(rfpPack?.quality.state).toBe("missing");
    expect(rfpPack?.quality.hardFails[0]).toContain("Required/gate-defining");
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
    expect(rfpPack?.quality.state).toBe("review_required");
    expect(rfpPack?.quality.hardFails[0]).toContain("AI-prepared draft");
    expect(rfpPack?.quality.warnings[0]).toContain("required exhibits");
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

  it("builds artifact standards context with audience, sections, pages, controls, and tokens", () => {
    const standards = buildSourceArtifactStandardsContext({
      artifacts: [
        {
          artifactKind: "d09_rfp_pack",
          artifactGroup: "generated",
          sourceOrigin: "generated",
          status: "approved",
        },
      ],
      prompt: "What should the RFP pack look like and how many pages or tokens?",
      stageKey: "rfp",
      limit: 3,
    });

    expect(standards[0]).toMatchObject({
      code: "d09_rfp_pack",
      title: "RFP Package",
      stageKey: "rfp",
    });
    expect(standards[0]?.excerpt).toContain("Required exhibits: 11");
    expect(standards[0]?.excerpt).toContain("No fixed page cap");
    expect(standards[0]?.excerpt).toContain("Source register");
    expect(standards[0]?.excerpt).toContain("128k max");
    expect(standards[0]?.excerpt).toContain(
      "Human review is required before external use",
    );
  });

  it("exports all phase artifact standards as a governance CSV", () => {
    const summary = buildSourceArtifactLifecycleSummary([
      {
        artifactKind: "d09_rfp_pack",
        artifactGroup: "generated",
        sourceOrigin: "generated",
        status: "approved",
      },
      {
        artifactKind: "d31_kt_evidence",
        artifactGroup: "upload",
        sourceOrigin: "uploaded",
        status: "parsed",
      },
      {
        artifactKind: "d07_ticket_synth",
        artifactGroup: "upload",
        sourceOrigin: "uploaded",
        status: "parsed",
      },
    ]);

    const csv = buildSourceArtifactStandardsCsv(summary.rows);

    expect(csv.split("\n")).toHaveLength(summary.expectedCount + 1);
    expect(csv).toContain('"Stage","Artifact code","Artifact name"');
    expect(csv).toContain('"Required exhibits / sections"');
    expect(csv).toContain('"Token budget"');
    expect(csv).toContain('"AI draft rule"');
    expect(csv).toContain('"Human final rule"');
    expect(csv).toContain('"Quality status"');
    expect(csv).toContain('"Quality score"');
    expect(csv).toContain('"Quality findings"');
    expect(csv).toContain('"Scope","d08_premortem","Pre-mortem on Scope Risk"');
    expect(csv).toContain(
      '"Transition","d31_kt_evidence","Knowledge-Transfer Evidence"',
    );
    expect(csv).toContain(
      '"AI-prepared drafts are not final and require human review before external use."',
    );
    expect(csv).toContain(
      '"A reviewed client-final version must be accepted back into Source as the authoritative artifact of record."',
    );
    expect(csv).toContain('"Claude Opus","128k max"');
    expect(csv).toContain('"Human review required","68"');
    expect(csv).toContain('"Evidence only","42"');
  });
});
