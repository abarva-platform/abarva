import {
  artifactFinalDownloadUrl,
  artifactFormatLabel,
  artifactInlinePreviewUrl,
  artifactOutputRoleLabel,
  artifactStatusLabel,
  buildContextExtractReviewModel,
  fileCabinetDownloadSummary,
  isGeneratedExportArtifact,
  isContextExtractArtifact,
  supportsGeneratedClientApproval,
  supportsSponsorReviewDecisionArtifact,
} from "../FileCabinetPanel";

describe("FileCabinetPanel artifact labels", () => {
  it("distinguishes editable deliverables from visual review companions", () => {
    expect(
      artifactOutputRoleLabel({
        outputRole: "docx_editable_phase_record",
        fileFormat: "docx",
      }),
    ).toBe("Editable final");
    expect(
      artifactOutputRoleLabel({
        outputRole: "html_visual_review_companion",
        fileFormat: "html",
      }),
    ).toBe("Preview only");
  });

  it("uses client-facing format language", () => {
    expect(artifactFormatLabel("docx")).toBe("Word-equivalent");
    expect(artifactFormatLabel("pptx")).toBe("PPTX final");
    expect(artifactFormatLabel("html")).toBe("HTML preview");
    expect(artifactFormatLabel("xlsx")).toBe("Excel model");
  });

  it("translates quarantined artifacts into client-facing review language", () => {
    expect(artifactStatusLabel("quarantined")).toBe("needs review");
    expect(artifactStatusLabel("board_ready")).toBe("ready");
  });

  it("summarizes review-ready and review-state files without over-claiming every download is final", () => {
    expect(
      fileCabinetDownloadSummary([
        {
          downloadUrl: "/api/v1/artifacts/generated-charter-1",
          family: "generated_deliverable",
          fileFormat: "docx",
          lifecycleState: "current",
          outputRole: "docx_editable_phase_record",
          provenanceCategory: "abarva_generated_deliverable",
          status: "board_ready",
        },
        {
          downloadUrl: "/api/v1/artifacts/generated-deck-1",
          family: "generated_deliverable",
          fileFormat: "pptx",
          lifecycleState: "current",
          outputRole: "pptx_final",
          provenanceCategory: "abarva_generated_deliverable",
          status: "approved",
        },
        {
          downloadUrl: "/api/v1/artifacts/generated-report-1",
          family: "generated_deliverable",
          fileFormat: "docx",
          lifecycleState: "current",
          outputRole: "docx_editable_phase_record",
          provenanceCategory: "abarva_generated_deliverable",
          status: "review_required",
        },
        {
          downloadUrl: "/api/v1/artifacts/generated-model-1",
          family: "generated_deliverable",
          fileFormat: "xlsx",
          lifecycleState: "current",
          outputRole: "xlsx_model",
          provenanceCategory: "abarva_generated_deliverable",
          status: "board_ready",
        },
        {
          downloadUrl: "/api/v1/programs/move-1/artifacts/evidence-1/download",
          family: "uploaded_evidence",
          fileFormat: "csv",
          lifecycleState: "current",
          outputRole: null,
          provenanceCategory: null,
          status: "aligned",
        },
        {
          downloadUrl: "/api/v1/artifacts/generated-old-1",
          family: "generated_deliverable",
          fileFormat: "docx",
          lifecycleState: "superseded",
          outputRole: "docx_editable_phase_record",
          provenanceCategory: "abarva_generated_deliverable",
          status: "review_required",
        },
      ]),
    ).toBe(
      "5 current files · 2 review-ready DOCX/PPTX exports · 1 deliverable needs review · 1 model.",
    );
  });

  it("does not count uploaded aggregate packets as generated exports", () => {
    expect(
      isGeneratedExportArtifact({
        family: "generated_deliverable",
        outputRole: "docx_editable_phase_record",
        provenanceCategory: "abarva_generated_deliverable",
        downloadUrl: "/api/v1/artifacts/generated-charter-1",
      }),
    ).toBe(true);
    expect(
      isGeneratedExportArtifact({
        family: "generated_deliverable",
        outputRole: null,
        provenanceCategory: null,
        downloadUrl:
          "/api/v1/programs/move-1/artifacts/uploaded-approved-packet/download",
      }),
    ).toBe(false);
    expect(
      fileCabinetDownloadSummary([
        {
          downloadUrl: "/api/v1/artifacts/generated-charter-1",
          family: "generated_deliverable",
          fileFormat: "docx",
          lifecycleState: "current",
          outputRole: "docx_editable_phase_record",
          provenanceCategory: "abarva_generated_deliverable",
          status: "board_ready",
        },
        {
          downloadUrl:
            "/api/v1/programs/move-1/artifacts/client-approved-packet/download",
          family: "generated_deliverable",
          fileFormat: "docx",
          lifecycleState: "current",
          outputRole: null,
          provenanceCategory: null,
          status: "board_ready",
        },
      ]),
    ).toBe("2 current files · 1 review-ready DOCX/PPTX exports.");
  });

  it("does not load P2 sponsor review packets for direct generated artifacts", () => {
    expect(
      supportsSponsorReviewDecisionArtifact(
        {
          artifactType: "charter",
          family: "generated_deliverable",
          lifecycleState: "current",
          phase: null,
          downloadUrl: "/api/v1/artifacts/generated-charter-1",
        },
        "move-1",
      ),
    ).toBe(false);
  });

  it("recognizes generated artifacts that need client approval", () => {
    expect(
      supportsGeneratedClientApproval({
        family: "generated_deliverable",
        fileFormat: "docx",
        lifecycleState: "current",
        outputRole: null,
        status: "board_ready",
        downloadUrl: "/api/v1/artifacts/generated-charter-1",
      }),
    ).toBe(true);
    expect(
      supportsGeneratedClientApproval({
        family: "generated_deliverable",
        fileFormat: "html",
        lifecycleState: "current",
        outputRole: "html_visual_review_companion",
        status: "board_ready",
        downloadUrl: "/api/v1/artifacts/generated-charter-preview",
      }),
    ).toBe(false);
    expect(
      supportsSponsorReviewDecisionArtifact(
        {
          artifactType: "current_state_diagnostic",
          family: "approval_artifact",
          lifecycleState: "current",
          phase: 2,
          downloadUrl: "/api/v1/programs/move-1/artifacts/review-1/download",
        },
        "move-1",
      ),
    ).toBe(true);
  });

  it("requests editable downloads for generated artifacts instead of their HTML default", () => {
    expect(
      artifactFinalDownloadUrl({
        downloadUrl: "/api/v1/artifacts/generated-charter-1",
        fileFormat: "docx",
        outputRole: "docx_editable_phase_record",
      }),
    ).toBe("/api/v1/artifacts/generated-charter-1?format=docx");
    expect(
      artifactFinalDownloadUrl({
        downloadUrl: "/api/v1/artifacts/generated-deck-1?source=vault",
        fileFormat: "pptx",
        outputRole: "pptx_final",
      }),
    ).toBe("/api/v1/artifacts/generated-deck-1?source=vault&format=pptx");
    expect(
      artifactInlinePreviewUrl({
        downloadUrl: "/api/v1/artifacts/generated-charter-1",
      }),
    ).toBe("/api/v1/artifacts/generated-charter-1?format=html&inline=1");
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
    expect(model?.gatheredMessage).toContain(
      "Candidate preview data stayed out",
    );
    expect(model?.nextPhaseMessage).toContain(
      "P1 has usable attached evidence",
    );
    expect(model?.nextPhaseMessage).toContain(
      "phase advancement still requires the governed Approve & Build gate",
    );
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
          {
            label: "Agent-ready tenant context",
            reason: "No attached evidence.",
          },
        ],
      },
    });

    expect(model?.attached).toHaveLength(0);
    expect(model?.nextPhaseMessage).toContain(
      "Do not treat P3 as evidence-complete",
    );
  });
});
