import {
  artifactFormatLabel,
  artifactOutputRoleLabel,
  buildContextExtractReviewModel,
  isContextExtractArtifact,
} from "../FileCabinetPanel";

describe("FileCabinetPanel artifact labels", () => {
  it("distinguishes editable deliverables from visual review companions", () => {
    expect(
      artifactOutputRoleLabel({
        outputRole: "docx_editable_phase_record",
        fileFormat: "docx",
      }),
    ).toBe("Editable deliverable");
    expect(
      artifactOutputRoleLabel({
        outputRole: "html_visual_review_companion",
        fileFormat: "html",
      }),
    ).toBe("Visual review companion");
  });

  it("uses client-facing format language", () => {
    expect(artifactFormatLabel("docx")).toBe("Word-equivalent");
    expect(artifactFormatLabel("html")).toBe("HTML review view");
    expect(artifactFormatLabel("xlsx")).toBe("Excel model");
  });

  it("recognizes and summarizes Move Context Extract artifacts", () => {
    const artifact = {
      artifactId: "ctx-1",
      artifactType: "move_context_extract_p1",
      family: "session_artifact",
      title: "P1 Context Extract",
      phase: 1,
      fileFormat: "md",
      fileName: "move_context_extract_p1.md",
      version: 1,
      status: "review_required",
      lifecycleState: "current",
      qualityScore: null,
      unsupportedClaims: 0,
      generatedBy: "u1",
      createdAt: "2026-07-14T12:52:25Z",
      fileSize: 1024,
      stored: "azure_blob",
      openItems: [],
      downloadUrl: "/api/v1/programs/move-1/artifacts/ctx-1/download",
      contextExtract: {
        sourceMode: "active_home_context",
        phase: 1,
        targetPhase: 1,
        generatedAt: "2026-07-14T12:52:25Z",
        candidateVersionId: null,
        attachedEvidenceItems: [
          {
            label: "Call center metrics",
            evidenceId: "ev-1",
            evidenceFamily: "kpi_baseline",
            reason: "readiness-covered",
            whyAttached: "Same tenant, same Move, source-backed evidence.",
          },
          {
            label: "Systems inventory",
            evidenceId: "ev-2",
            evidenceFamily: "it_systems_landscape",
            reason: "readiness-covered",
          },
        ],
        suggestedContextItems: [
          { label: "Candidate benchmark", reason: "needs review" },
        ],
        excludedContextItems: [
          {
            label: "Candidate preview data",
            reason: "Never read candidate data by default.",
          },
        ],
        gapItems: [],
      },
    };

    expect(isContextExtractArtifact(artifact)).toBe(true);
    const model = buildContextExtractReviewModel(artifact);
    expect(model?.attached).toHaveLength(2);
    expect(model?.suggested).toHaveLength(1);
    expect(model?.excluded).toHaveLength(1);
    expect(model?.gaps).toHaveLength(0);
    expect(model?.gatheredMessage).toContain("Candidate preview data stayed out");
    expect(model?.nextPhaseMessage).toContain("P1 can proceed");
    expect(model?.coverageItems).toEqual([
      "it systems landscape: 1",
      "kpi baseline: 1",
    ]);
  });

  it("warns when a context extract has gaps and no attached evidence", () => {
    const model = buildContextExtractReviewModel({
      artifactId: "ctx-1",
      artifactType: "move_context_extract_p2",
      family: "session_artifact",
      title: "P2 Context Extract",
      phase: 2,
      fileFormat: "md",
      fileName: "move_context_extract_p2.md",
      version: 1,
      status: "draft",
      lifecycleState: "current",
      qualityScore: null,
      unsupportedClaims: 0,
      generatedBy: "u1",
      createdAt: "2026-07-14T12:52:25Z",
      fileSize: 1024,
      stored: "azure_blob",
      openItems: [],
      downloadUrl: "/api/v1/programs/move-1/artifacts/ctx-1/download",
      contextExtract: {
        sourceMode: "active_home_context",
        phase: 2,
        targetPhase: 3,
        attachedEvidenceItems: [],
        suggestedContextItems: [],
        excludedContextItems: [],
        gapItems: [
          { label: "Agent-ready tenant context", reason: "No attached evidence." },
        ],
      },
    });

    expect(model?.attached).toHaveLength(0);
    expect(model?.nextPhaseMessage).toContain(
      "Do not treat P3 as evidence-complete",
    );
  });
});
