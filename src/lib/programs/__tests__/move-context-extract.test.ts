const queryContext = jest.fn();
const saveArtifact = jest.fn();
const recordEvidence = jest.fn();
const existingExtract = jest.fn();
const loadMoveEvidence = jest.fn();

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
    loadMoveEvidence.mockReset();
    existingExtract.mockResolvedValue(null);
    loadMoveEvidence.mockResolvedValue([]);
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
      loadMoveEvidence,
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

  it("attaches Move-scoped uploaded evidence rows that readiness and generation can use", async () => {
    queryContext.mockResolvedValue([]);
    loadMoveEvidence.mockResolvedValue([
      {
        id: "ev-process",
        tenantKey: "skyharbor-air",
        programId: baseInput.moveId,
        attachmentId: "att-process",
        phase: 1,
        evidenceType: "baseline_evidence",
        title: "current-state-process-operating-documentation-smoke.txt",
        summary: "Current state process and operating workflow with service queues.",
        extractedText: "Current state process, workflow, operating documentation, and success criteria.",
        extractedStructured: {
          source_type: "real_upload",
          citation: "current-state-process-operating-documentation-smoke.txt",
          baseline_candidates: ["current state workflow documented"],
        },
        confidence: 0.78,
        createdAt: "2026-07-14T11:00:00Z",
      },
      {
        id: "ev-systems",
        tenantKey: "skyharbor-air",
        programId: baseInput.moveId,
        attachmentId: "att-systems",
        phase: 1,
        evidenceType: "architecture_inventory",
        title: "systems-landscape-application-integration-smoke.txt",
        summary: "Systems landscape, application inventory, integration, architecture, and data flow.",
        extractedText: "Application inventory, integration, architecture, data flow, platform systems.",
        extractedStructured: {
          source_type: "real_upload",
          citation: "systems-landscape-application-integration-smoke.txt",
        },
        confidence: 0.8,
        createdAt: "2026-07-14T11:01:00Z",
      },
      {
        id: "ev-kpi",
        tenantKey: "skyharbor-air",
        programId: baseInput.moveId,
        attachmentId: "att-kpi",
        phase: 1,
        evidenceType: "baseline_evidence",
        title: "kpi-metric-baseline-target-smoke.txt",
        summary: "KPI metric baseline and target placeholders for readiness proof.",
        extractedText: "KPI metric baseline target success criteria.",
        extractedStructured: {
          source_type: "real_upload",
          citation: "kpi-metric-baseline-target-smoke.txt",
          baseline_candidates: ["first-contact resolution", "average handle time"],
        },
        confidence: 0.79,
        createdAt: "2026-07-14T11:02:00Z",
      },
      {
        id: "ev-cost",
        tenantKey: "skyharbor-air",
        programId: baseInput.moveId,
        attachmentId: "att-cost",
        phase: 1,
        evidenceType: "baseline_evidence",
        title: "cost-finance-budget-run-rate-baseline-smoke.txt",
        summary: "Cost baseline, finance, budget, and run-rate context.",
        extractedText: "Cost baseline finance budget run-rate evidence for business case input.",
        extractedStructured: {
          source_type: "real_upload",
          citation: "cost-finance-budget-run-rate-baseline-smoke.txt",
        },
        confidence: 0.76,
        createdAt: "2026-07-14T11:03:00Z",
      },
    ]);

    const result = await createMoveContextExtract(baseInput, {
      queryContext,
      saveArtifact,
      recordEvidence,
      loadMoveEvidence,
      existingExtract,
    });

    expect(result.attachedEvidenceItems).toHaveLength(4);
    expect(result.attachedEvidenceItems.map((item) => item.evidenceId)).toEqual([
      "ev-process",
      "ev-systems",
      "ev-kpi",
      "ev-cost",
    ]);
    expect(result.attachedEvidenceItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          moveId: baseInput.moveId,
          tenantKey: "skyharbor-air",
          sourceType: "real_upload",
          sourceFileRef: "current-state-process-operating-documentation-smoke.txt",
          readinessStatus: "covered",
          whyAttached: expect.stringMatching(/readiness-covered/i),
        }),
      ]),
    );
    const savedBody = saveArtifact.mock.calls[0]?.[1]?.body as string;
    expect(saveArtifact.mock.calls[0]?.[1]).toMatchObject({
      status: "review_required",
    });
    expect(savedBody).toContain("- Attached Evidence count: 4");
    expect(savedBody).toContain("Evidence ID: ev-process");
    expect(savedBody).toContain("Evidence Family Coverage");
    expect(savedBody).not.toMatch(/## Attached Evidence\nNone\./);
    expect(recordEvidence).toHaveBeenCalledWith(ctx, expect.objectContaining({
      evidenceType: "move_context_extract_attached",
      extractedText: expect.stringContaining("ev-process"),
    }));
    const evidencePayload = recordEvidence.mock.calls[0]?.[1] as {
      extractedText: string;
      extractedStructured: { warnings: string[] };
    };
    expect(evidencePayload.extractedText).toContain("current-state-process-operating-documentation-smoke.txt");
    expect(evidencePayload.extractedStructured.warnings).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/Suggested Context.*excluded/i),
      ]),
    );
  });

  it("does not attach candidate-only or generated context-extract rows as approved evidence", async () => {
    queryContext.mockResolvedValue([]);
    loadMoveEvidence.mockResolvedValue([
      {
        id: "ev-candidate",
        tenantKey: "skyharbor-air",
        programId: baseInput.moveId,
        attachmentId: "att-candidate",
        phase: 1,
        evidenceType: "uploaded_artifact",
        title: "candidate-preview.txt",
        summary: "Candidate preview material.",
        extractedText: "Candidate preview material.",
        extractedStructured: { source_type: "candidate_preview" },
        confidence: 0.9,
        createdAt: "2026-07-14T11:00:00Z",
      },
      {
        id: "ev-extract",
        tenantKey: "skyharbor-air",
        programId: baseInput.moveId,
        attachmentId: null,
        phase: 1,
        evidenceType: "move_context_extract_attached",
        title: "Prior context extract",
        summary: "Prior context extract.",
        extractedText: "Prior context extract.",
        extractedStructured: { source_type: "program_evidence" },
        confidence: 0.82,
        createdAt: "2026-07-14T11:01:00Z",
      },
    ]);

    const result = await createMoveContextExtract(baseInput, {
      queryContext,
      saveArtifact,
      recordEvidence,
      loadMoveEvidence,
      existingExtract,
    });

    expect(result.attachedEvidenceItems).toHaveLength(0);
    expect(result.excludedContextItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Candidate preview data" }),
      ]),
    );
    expect(recordEvidence).not.toHaveBeenCalled();
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
        loadMoveEvidence,
        existingExtract,
      },
    );

    expect(result.sourceMode).toBe("candidate_preview");
    expect(result.attachedEvidenceItems).toHaveLength(0);
    expect(result.suggestedContextItems).toHaveLength(1);
    expect(queryContext).not.toHaveBeenCalled();
    expect(loadMoveEvidence).not.toHaveBeenCalled();
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
      loadMoveEvidence,
      existingExtract,
    });

    expect(result.status).toBe("skipped_existing");
    expect(result.artifactId).toBe("artifact-existing");
    expect(queryContext).not.toHaveBeenCalled();
    expect(loadMoveEvidence).not.toHaveBeenCalled();
    expect(saveArtifact).not.toHaveBeenCalled();
    expect(recordEvidence).not.toHaveBeenCalled();
  });
});
