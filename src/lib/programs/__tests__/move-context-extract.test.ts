const queryContext = jest.fn();
const saveArtifact = jest.fn();
const recordEvidence = jest.fn();
const existingExtract = jest.fn();

jest.mock("@/lib/azure-search/tenant-context-retriever", () => ({
  queryTenantContext: (...args: unknown[]) => queryContext(...args),
}));

jest.mock(
  "@/lib/enterprise-data/candidate-preview-enablement/skyharbor-preview-package",
  () => ({
    findSkyHarborPreviewModule: () => ({
      sampleFacts: [
        {
          objectType: "application",
          label: "Flight operations dispatch platform",
          domain: "applications_systems",
        },
      ],
    }),
  }),
);

jest.mock("@/lib/programs/deliverables/move-artifacts", () => ({
  saveMoveArtifact: (...args: unknown[]) => saveArtifact(...args),
}));

jest.mock("@/lib/programs/evidence-ingestion", () => ({
  recordProgramEvidence: (...args: unknown[]) => recordEvidence(...args),
}));

import { createMoveContextExtract } from "../move-context-extract";

const ctx = {
  clientId: "client-uuid",
  clientKey: "skyharbor-air",
  userId: "user-1",
};

const baseInput = {
  ctx,
  moveId: "11111111-1111-1111-1111-111111111111",
  tenantKey: "skyharbor-air",
  phase: 3,
  targetPhase: 3,
  moveName: "IROPS Command Center",
  useCaseArchetype: "operations_ai",
  phaseLabel: "P3 Design",
  phasePurpose: "Create target-state solution options.",
};

describe("createMoveContextExtract", () => {
  beforeEach(() => {
    queryContext.mockReset();
    saveArtifact.mockReset();
    recordEvidence.mockReset();
    existingExtract.mockReset();
    existingExtract.mockResolvedValue(null);
    saveArtifact.mockResolvedValue({
      artifactId: "artifact-1",
      version: 1,
      blobPath: "moves/skyharbor-air/extract.md",
      blobStored: true,
    });
    recordEvidence.mockResolvedValue("evidence-1");
  });

  it("active mode reads only agent-ready tenant context and records only attached evidence", async () => {
    queryContext.mockResolvedValue([
      {
        tenantKey: "skyharbor-air",
        chunkId: "chunk-1",
        recordId: "record-1",
        sourceSegmentId: "it_landscape",
        sourceDoc: "systems.csv",
        text: "Dispatch platform is the authoritative system for disruption operations.",
        embeddingStatus: "embedded",
        classification: "internal",
        vectorScore: 0.91,
      },
    ]);

    const result = await createMoveContextExtract(baseInput, {
      queryContext,
      saveArtifact,
      recordEvidence,
      existingExtract,
    });

    expect(result.status).toBe("created");
    expect(result.sourceMode).toBe("active_home_context");
    expect(result.attachedEvidenceItems).toHaveLength(1);
    expect(result.suggestedContextItems).toHaveLength(0);
    expect(queryContext).toHaveBeenCalledWith(expect.objectContaining({
      tenantClientKey: "skyharbor-air",
      filters: expect.objectContaining({
        sensitivity: ["public", "internal"],
        extra: ["agent_readiness_status eq 'agent_ready'"],
      }),
    }));
    expect(saveArtifact).toHaveBeenCalledWith(ctx, expect.objectContaining({
      artifactType: "move_context_extract_p3",
      artifactFamily: "session_artifact",
      citationReady: true,
      metadata: expect.objectContaining({
        guardrails: expect.objectContaining({
          suggestedContextUsedForGeneration: false,
          candidatePromoted: false,
        }),
      }),
    }));
    expect(recordEvidence).toHaveBeenCalledWith(ctx, expect.objectContaining({
      evidenceType: "move_context_extract_attached",
      extractedText: expect.stringContaining("Dispatch platform"),
      extractedStructured: expect.objectContaining({
        warnings: expect.arrayContaining([
          expect.stringMatching(/Suggested Context.*excluded/i),
        ]),
      }),
    }));
  });

  it("candidate preview creates suggested context only and does not record generation evidence", async () => {
    const result = await createMoveContextExtract(
      {
        ...baseInput,
        candidatePreview: {
          enabled: true,
          candidateVersionId:
            "skyharbor-air:skyharbor-air-pr10-candidate:candidate-dry-run",
          acknowledgedNotActiveRuntimeTruth: true,
        },
      },
      {
        queryContext,
        saveArtifact,
        recordEvidence,
        existingExtract,
      },
    );

    expect(result.sourceMode).toBe("candidate_preview");
    expect(result.attachedEvidenceItems).toHaveLength(0);
    expect(result.suggestedContextItems).toHaveLength(1);
    expect(queryContext).not.toHaveBeenCalled();
    expect(saveArtifact).toHaveBeenCalledWith(ctx, expect.objectContaining({
      citationReady: false,
      metadata: expect.objectContaining({
        moveContextExtract: expect.objectContaining({
          sourceMode: "candidate_preview",
          candidateVersionId:
            "skyharbor-air:skyharbor-air-pr10-candidate:candidate-dry-run",
        }),
      }),
    }));
    expect(recordEvidence).not.toHaveBeenCalled();
  });

  it("does not silently overwrite an existing current extract", async () => {
    existingExtract.mockResolvedValue({ artifactId: "artifact-existing" });

    const result = await createMoveContextExtract(baseInput, {
      queryContext,
      saveArtifact,
      recordEvidence,
      existingExtract,
    });

    expect(result.status).toBe("skipped_existing");
    expect(result.artifactId).toBe("artifact-existing");
    expect(queryContext).not.toHaveBeenCalled();
    expect(saveArtifact).not.toHaveBeenCalled();
    expect(recordEvidence).not.toHaveBeenCalled();
  });
});
