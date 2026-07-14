const getModuleContext = jest.fn();
const saveArtifact = jest.fn();
const recordEvidence = jest.fn();
const existingExtract = jest.fn();
const loadMoveEvidence = jest.fn();

jest.mock(
  "@/lib/enterprise-data/module-context-serving/module-context-serving",
  () => ({
    getModuleContext: (...args: unknown[]) => getModuleContext(...args),
  }),
);

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

import {
  buildMoveContextDomains,
  createMoveContextExtract,
  detectMoveContextArchetype,
  getMovePhaseContextRequirements,
} from "../move-context-extract";

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

function moduleContext(overrides: Record<string, unknown> = {}) {
  return {
    tenantKey: "skyharbor-air",
    tenantDataVersion: "active-v1",
    generatedAt: "2026-07-14T12:00:00Z",
    evidenceBoundary: {
      evidenceKeys: ["source-1"],
      excludedEvidenceKeys: [],
      staleEvidenceKeys: [],
      unsupportedClaimRisk: "medium",
    },
    facts: [],
    relationships: [],
    derivedInsights: [],
    moduleMemory: [],
    moduleKey: "moves",
    purpose: "evidence_extract",
    mode: "active",
    sourceMode: "active_tenant_access",
    activeTenantAccessVersionId: "active-access-v1",
    candidateVersionId: null,
    domains: [
      {
        domain: "applications_systems",
        canonicalDomain: "applications_systems",
        sourceRows: 2,
        acceptedRecords: 2,
        skippedRows: 0,
        duplicateNames: 0,
        readiness: "agent_ready",
      },
      {
        domain: "data_assets_integrations",
        canonicalDomain: "data_assets_integrations",
        sourceRows: 0,
        acceptedRecords: 0,
        skippedRows: 0,
        duplicateNames: 0,
        readiness: "missing_evidence",
      },
    ],
    records: [
      {
        recordId: "app-1",
        domain: "applications_systems",
        canonicalDomain: "applications_systems",
        objectType: "application",
        title: "Dispatch platform",
        summary: "Authoritative system for disruption operations.",
        fields: { owner: "Operations", status: "active" },
        sourceEvidenceIds: ["source-1"],
        citationStatus: "citable",
        agentReadiness: "agent_ready",
        relationshipReadiness: "relationship_not_validated",
        restricted: false,
        confidence: 0.91,
      },
    ],
    evidenceRefs: [{ evidenceId: "source-1", citationStatus: "citable" }],
    validatedRelationships: [],
    relationshipCandidates: [],
    gaps: [],
    caveats: [],
    lineage: {
      sourceBuildId: "build-1",
      sourceSnapshotIds: ["snapshot-1"],
    },
    readiness: {
      status: "agent_ready",
      evidenceReady: true,
      relationshipReady: false,
      profileReady: true,
      caveats: [],
      canAnswer: [],
      mustNotClaim: [],
    },
    guardrails: {
      activeByDefault: true,
      requestedMode: "active",
      resolvedMode: "active",
      candidatePreviewRequiresExplicitMode: true,
      candidatePreviewExplicitlyRequested: false,
      defaultModuleReadsCandidateData: false,
      candidateDataConsumed: false,
      activeTenantAccessLayerUpdated: false,
      productionTenantDataWritten: false,
      candidatePromoted: false,
      moduleRuntimeConsumptionChanged: false,
      moveRuntimeModified: false,
      moveEvidenceCreated: false,
      sourceRuntimeModified: false,
      towerRuntimeModified: false,
      intelligenceRuntimeModified: false,
      homeReadsCandidateByDefault: false,
    },
    contextCompleteness: {
      breadth: 50,
      depth: 40,
      relationshipCoverage: 0,
      evidenceCoverage: 100,
      answerability: 50,
      overall: "Limited",
    },
    ...overrides,
  };
}

describe("createMoveContextExtract", () => {
  beforeEach(() => {
    getModuleContext.mockReset();
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
    getModuleContext.mockResolvedValue(moduleContext());
  });

  it("exposes phase requirements and detects Agent Assist broad-domain needs", () => {
    expect(getMovePhaseContextRequirements(2)).toMatchObject({
      output: "P2 Discovery / Current-State Context Pack",
    });
    const agentInput = {
      ...baseInput,
      phase: 2,
      moveName: "Member Service Agent Assist",
      useCaseArchetype: "Contact Center Agent Assist",
      phasePurpose: "Diagnose member service contact center current state.",
    };
    expect(detectMoveContextArchetype(agentInput)).toBe(
      "agent_assist_contact_center_ai",
    );
    expect(buildMoveContextDomains(agentInput)).toEqual(
      expect.arrayContaining([
        "ai_automation_use_cases",
        "operational_process_evidence",
        "applications_systems",
        "data_assets_integrations",
        "infrastructure_platforms",
        "org_ownership",
        "workforce_roles",
        "metrics_outcomes",
        "risks_controls",
        "relationships",
        "evidence_sources",
      ]),
    );
  });

  it("active mode reads Module Context Serving and keeps data-layer context suggested, not attached", async () => {
    getModuleContext.mockResolvedValue(moduleContext());

    const result = await createMoveContextExtract(baseInput, {
      getModuleContext,
      saveArtifact,
      recordEvidence,
      loadMoveEvidence,
      existingExtract,
    });

    expect(result.status).toBe("created");
    expect(result.sourceMode).toBe("active_tenant_access");
    expect(result.attachedEvidenceItems).toHaveLength(0);
    expect(result.suggestedContextItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: "suggested_context",
          label: "Applications & Systems: Dispatch platform",
          sourceLayer: "Module Context Serving Contract",
          sourceType: "active_tenant_context",
        }),
      ]),
    );
    expect(getModuleContext).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantKey: "skyharbor-air",
        moduleKey: "moves",
        purpose: "evidence_extract",
        mode: "active",
        evidencePolicy: "lineage_required",
        relationshipPolicy: "validated_and_candidates",
        requestedDomains: expect.arrayContaining([
          "applications_systems",
          "data_assets_integrations",
          "risks_controls",
        ]),
      }),
      expect.objectContaining({ repoRoot: expect.any(String) }),
    );
    expect(saveArtifact).toHaveBeenCalledWith(
      ctx,
      expect.objectContaining({
        artifactType: "move_context_extract_p3",
        artifactFamily: "session_artifact",
        citationReady: false,
        metadata: expect.objectContaining({
          moveContextExtract: expect.objectContaining({
            sourceLayersScanned: expect.arrayContaining([
              "Active Tenant Access",
              "Module Context Serving Contract",
            ]),
            domainsRequested: expect.arrayContaining(["applications_systems"]),
            uploadRequests: expect.any(Array),
          }),
          guardrails: expect.objectContaining({
            suggestedContextUsedForGeneration: false,
            candidatePromoted: false,
          }),
        }),
      }),
    );
    expect(recordEvidence).not.toHaveBeenCalled();
    const savedBody = saveArtifact.mock.calls[0]?.[1]?.body as string;
    expect(savedBody).toContain("## What AbarVa Scanned");
    expect(savedBody).toContain("Suggested Data-Layer Context");
    expect(savedBody).toContain("Applications & Systems: Dispatch platform");
    expect(savedBody).not.toMatch(/V[467]_[0-9]{2}_/);
  });

  it("attaches Move-scoped uploaded evidence rows that readiness and generation can use", async () => {
    loadMoveEvidence.mockResolvedValue([
      {
        id: "ev-process",
        tenantKey: "skyharbor-air",
        programId: baseInput.moveId,
        attachmentId: "att-process",
        phase: 1,
        evidenceType: "baseline_evidence",
        title: "current-state-process-operating-documentation-smoke.txt",
        summary:
          "Current state process and operating workflow with service queues.",
        extractedText:
          "Current state process, workflow, operating documentation, and success criteria.",
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
        summary:
          "Systems landscape, application inventory, integration, architecture, and data flow.",
        extractedText:
          "Application inventory, integration, architecture, data flow, platform systems.",
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
        summary:
          "KPI metric baseline and target placeholders for readiness proof.",
        extractedText: "KPI metric baseline target success criteria.",
        extractedStructured: {
          source_type: "real_upload",
          citation: "kpi-metric-baseline-target-smoke.txt",
          baseline_candidates: [
            "first-contact resolution",
            "average handle time",
          ],
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
        extractedText:
          "Cost baseline finance budget run-rate evidence for business case input.",
        extractedStructured: {
          source_type: "real_upload",
          citation: "cost-finance-budget-run-rate-baseline-smoke.txt",
        },
        confidence: 0.76,
        createdAt: "2026-07-14T11:03:00Z",
      },
    ]);

    const result = await createMoveContextExtract(baseInput, {
      getModuleContext,
      saveArtifact,
      recordEvidence,
      loadMoveEvidence,
      existingExtract,
    });

    expect(result.attachedEvidenceItems).toHaveLength(4);
    expect(result.attachedEvidenceItems.map((item) => item.evidenceId)).toEqual(
      ["ev-process", "ev-systems", "ev-kpi", "ev-cost"],
    );
    expect(result.attachedEvidenceItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          moveId: baseInput.moveId,
          tenantKey: "skyharbor-air",
          sourceType: "real_upload",
          sourceFileRef:
            "current-state-process-operating-documentation-smoke.txt",
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
    expect(recordEvidence).toHaveBeenCalledWith(
      ctx,
      expect.objectContaining({
        evidenceType: "move_context_extract_attached",
        extractedText: expect.stringContaining("ev-process"),
      }),
    );
    const evidencePayload = recordEvidence.mock.calls[0]?.[1] as {
      extractedText: string;
      extractedStructured: {
        warnings: string[];
        domains_requested: string[];
      };
    };
    expect(evidencePayload.extractedText).toContain(
      "current-state-process-operating-documentation-smoke.txt",
    );
    expect(evidencePayload.extractedText).not.toContain("Dispatch platform");
    expect(evidencePayload.extractedStructured.domains_requested).toEqual(
      expect.arrayContaining(["applications_systems"]),
    );
    expect(evidencePayload.extractedStructured.warnings).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/Suggested Context.*excluded/i),
      ]),
    );
  });

  it("does not attach candidate-only or generated context-extract rows as approved evidence", async () => {
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
      getModuleContext,
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
        getModuleContext,
        saveArtifact,
        recordEvidence,
        loadMoveEvidence,
        existingExtract,
      },
    );

    expect(result.sourceMode).toBe("candidate_preview");
    expect(result.attachedEvidenceItems).toHaveLength(0);
    expect(result.suggestedContextItems).toHaveLength(1);
    expect(getModuleContext).not.toHaveBeenCalled();
    expect(loadMoveEvidence).not.toHaveBeenCalled();
    expect(saveArtifact).toHaveBeenCalledWith(
      ctx,
      expect.objectContaining({
        citationReady: false,
        metadata: expect.objectContaining({
          moveContextExtract: expect.objectContaining({
            sourceMode: "candidate_preview",
            candidateVersionId:
              "skyharbor-air:skyharbor-air-pr10-candidate:candidate-dry-run",
          }),
        }),
      }),
    );
    expect(recordEvidence).not.toHaveBeenCalled();
  });

  it("does not silently overwrite an existing current extract", async () => {
    existingExtract.mockResolvedValue({ artifactId: "artifact-existing" });

    const result = await createMoveContextExtract(baseInput, {
      getModuleContext,
      saveArtifact,
      recordEvidence,
      loadMoveEvidence,
      existingExtract,
    });

    expect(result.status).toBe("skipped_existing");
    expect(result.artifactId).toBe("artifact-existing");
    expect(getModuleContext).not.toHaveBeenCalled();
    expect(loadMoveEvidence).not.toHaveBeenCalled();
    expect(saveArtifact).not.toHaveBeenCalled();
    expect(recordEvidence).not.toHaveBeenCalled();
  });
});
