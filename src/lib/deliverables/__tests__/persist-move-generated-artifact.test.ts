const mockDraftModuleDeliverable = jest.fn();
const mockSaveMoveArtifact = jest.fn();
const mockBuildDocx = jest.fn(async (input: unknown) => {
  void input;
  return Buffer.from("PK editable-docx");
});

jest.mock("@/lib/programs/nexus", () => ({
  draftModuleDeliverable: (...args: unknown[]) =>
    mockDraftModuleDeliverable(...args),
}));

jest.mock("@/lib/programs/deliverables/move-artifacts", () => ({
  saveMoveArtifact: (...args: unknown[]) => mockSaveMoveArtifact(...args),
}));

jest.mock("../phase-word-equivalent", () => ({
  buildPhaseWordEquivalentDocx: (...args: unknown[]) => mockBuildDocx(args[0]),
  phaseWordEquivalentFileName: jest.fn(
    () => "current-work-diagnostic-editable-phase-deliverable.docx",
  ),
}));

import { persistMoveGeneratedArtifact } from "../persist-move-generated-artifact";

describe("persistMoveGeneratedArtifact", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDraftModuleDeliverable.mockResolvedValue({
      deliverableId: "deliverable-1",
      versionId: "version-1",
    });
    mockSaveMoveArtifact
      .mockResolvedValueOnce({
        artifactId: "html-artifact-1",
        version: 1,
        blobStored: true,
      })
      .mockResolvedValueOnce({
        artifactId: "docx-artifact-1",
        version: 1,
        blobStored: true,
      });
  });

  it("persists the HTML review companion and a separate editable Word-equivalent record", async () => {
    const result = await persistMoveGeneratedArtifact({
      ctx: {
        clientId: "client-lakeshore",
        clientKey: "lakeshore",
        userId: "user-1",
        email: "cio@example.com",
      },
      program: {
        id: "move-1",
        name: "Lakeshore Back-office Automation",
      },
      phase: 2,
      artifact: "discovery_report",
      title: "Current Work Diagnostic",
      result: {
        status: "generated",
        html: "<html><body><svg></svg><table></table><p>Diagnostic.</p></body></html>",
        context: {
          moveId: "move-1",
          tenantKey: "lakeshore",
          useCase: "Back-office automation",
          kpis: [{ name: "Cycle time", domain: "operational" }],
          currentState: "Manual exception handling.",
          gaps: ["Sponsor approval required."],
          decisions: [],
          humanApprovalNotes: [],
        },
        goldenBar: {
          pass: true,
          hasDataGap: false,
          svgCount: 1,
          proseOnly: false,
          missingVisuals: [],
          missingTables: [],
          wordCount: 1200,
          forbiddenLanguageHits: [],
          missingExactEvidenceTerms: [],
          missingTaxonomyTerms: [],
          rawClientFacingIdHits: [],
          reasons: [],
          overMaximumWordCount: false,
          unsupportedClaimSignals: ["Cycle time improves by 40% next quarter."],
          qualityScore: 89,
        },
        generationMode: "draft",
        draftOnly: true,
        draftCaveats: [
          {
            code: "gate_not_approved",
            phase: 2,
            reason: "P2 gate not approved.",
            severity: "hard",
          },
        ],
        contextCaveats: [],
      },
    });

    expect(result).toMatchObject({
      artifactId: "html-artifact-1",
      editableArtifactId: "docx-artifact-1",
      editableArtifactBlobStored: true,
    });
    expect(mockSaveMoveArtifact).toHaveBeenCalledTimes(2);
    expect(mockSaveMoveArtifact).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({
        artifactType: "discovery_report",
        fileFormat: "html",
        // Real values carried through from the golden-bar result, not the old
        // fixed 96/null placeholder.
        qualityScore: 89,
        unsupportedClaimsCount: 1,
        metadata: expect.objectContaining({
          outputRole: "html_visual_review_companion",
          editableWordEquivalentRequired: true,
        }),
      }),
    );
    expect(mockSaveMoveArtifact).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      expect.objectContaining({
        artifactType: "discovery_report_editable_docx",
        fileFormat: "docx",
        body: expect.any(Buffer),
        metadata: expect.objectContaining({
          outputRole: "docx_editable_phase_record",
          pairedVisualCompanionArtifactId: "html-artifact-1",
          primaryEditableRecordLabel:
            "Current State Process and Diagnostic Word Document",
        }),
      }),
    );
    expect(mockBuildDocx).toHaveBeenCalledWith(
      expect.objectContaining({
        artifact: "discovery_report",
        phase: 2,
        moveName: "Lakeshore Back-office Automation",
      }),
    );
  });
});
