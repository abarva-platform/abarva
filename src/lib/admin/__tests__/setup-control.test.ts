import { buildAdminSetupControlReadModel } from "@/lib/admin/setup-control";
import type { SetupInventorySnapshot } from "@/lib/admin/setup-acts-registry";

function snapshot(overrides: Partial<SetupInventorySnapshot> = {}): SetupInventorySnapshot {
  return {
    tenantKey: "skyharbor-air",
    totalRecords: 42,
    totalChunks: 84,
    totalNodes: 20,
    totalEdges: 15,
    lastIngestedAt: "2026-07-12T12:00:00.000Z",
    recentActivity: [],
    segments: [
      {
        segmentId: "enterprise_profile",
        segmentName: "Enterprise Profile",
        familyNumber: 1,
        recordCount: 10,
        coverageScore: 80,
        staleCount: 0,
        missingCount: 2,
        healthState: "partial",
        lastReviewedAt: null,
        lastIngestedAt: "2026-07-12T12:00:00.000Z",
      },
    ],
    ...overrides,
  };
}

describe("Admin setup-control read model", () => {
  it("returns active, candidate, promotion, guardrail, and module readiness sections", () => {
    const model = buildAdminSetupControlReadModel({
      tenantKey: "skyharbor",
      displayName: "Airline Demo",
      snapshot: snapshot(),
      sourceFiles: [
        {
          source_doc: "airline-context.csv",
          chunk_count: 12,
          first_loaded_at: "2026-07-12T12:00:00.000Z",
          sample_chunk_id: "chunk-1",
        },
      ],
    });

    expect(model.tenant.tenantKey).toBe("skyharbor");
    expect(model.activeTenantAccess).toBeDefined();
    expect(model.candidateTenantDataVersion).toBeDefined();
    expect(model.promotionControl).toBeDefined();
    expect(model.moduleReadiness).toEqual(
      expect.objectContaining({
        home: expect.any(Object),
        intelligence: expect.any(Object),
        moves: expect.any(Object),
        source: expect.any(Object),
        tower: expect.any(Object),
      }),
    );
    expect(model.guardrails).toEqual(
      expect.objectContaining({
        activeTenantAccessLayerUpdated: false,
        candidatePromoted: false,
        moduleRuntimeConsumptionChanged: false,
        candidateReadByDefault: false,
      }),
    );
  });

  it("does not treat uploaded files as active facts or promoted candidate data", () => {
    const model = buildAdminSetupControlReadModel({
      tenantKey: "skyharbor",
      displayName: "Airline Demo",
      snapshot: null,
      sourceFiles: [
        {
          source_doc: "context-a.csv",
          chunk_count: 5,
          first_loaded_at: "2026-07-12T12:00:00.000Z",
          sample_chunk_id: "chunk-1",
        },
        {
          source_doc: "context-b.csv",
          chunk_count: 7,
          first_loaded_at: "2026-07-12T12:00:00.000Z",
          sample_chunk_id: "chunk-2",
        },
      ],
    });

    expect(model.uploadState.uploadedFiles).toBe(2);
    expect(model.canonicalFacts.canonicalObjects).toBe(0);
    expect(model.candidateTenantDataVersion.candidateVersionId).toBeNull();
    expect(model.candidateTenantDataVersion.status).toBe("not-created");
    expect(model.guardrails.candidatePromoted).toBe(false);
    expect(model.guardrails.activeTenantAccessLayerUpdated).toBe(false);
    expect(model.moduleReadiness.home.status).not.toBe("ready");
    expect(model.moduleReadiness.intelligence.status).not.toBe("ready");
  });

  it("labels legacy direct import paths with candidate-runway warnings", () => {
    const model = buildAdminSetupControlReadModel({
      tenantKey: "lakeshore",
      displayName: "Lakeshore Holdings",
    });

    expect(model.legacyImportPaths.length).toBeGreaterThanOrEqual(4);
    expect(model.legacyImportPaths).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "/api/admin/context-layer/csv-upload",
          legacyControlledImport: true,
          directActiveMutationPossible: true,
          candidateRunwayBypassed: true,
          warning: "Legacy controlled import - not candidate-version promoted.",
        }),
      ]),
    );
  });
});
