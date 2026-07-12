const mockResolveAdminTenant = jest.fn();
const mockGetSetupInventorySnapshot = jest.fn();
const mockGetTenantSourceFiles = jest.fn();

jest.mock("@/lib/admin/admin-tenant", () => ({
  resolveAdminTenant: (...args: unknown[]) => mockResolveAdminTenant(...args),
}));

jest.mock("@/lib/admin/setup-data-broker", () => ({
  getSetupInventorySnapshot: (...args: unknown[]) =>
    mockGetSetupInventorySnapshot(...args),
}));

jest.mock("@/lib/context-ingestion/tenant-context-read-model", () => ({
  getTenantSourceFiles: (...args: unknown[]) => mockGetTenantSourceFiles(...args),
}));

jest.mock("@/lib/agent/tools/intelligence/_shared", () => ({
  clientKeyToInventorySubstrateKey: (clientKey: string) =>
    clientKey === "skyharbor" ? "skyharbor-air" : clientKey,
}));

import { GET } from "../route";

describe("GET /api/admin/setup-control", () => {
  beforeEach(() => {
    mockResolveAdminTenant.mockResolvedValue({
      clientId: "client-skyharbor",
      clientKey: "skyharbor",
      tenantSlug: "skyharbor-air",
      tenantName: "Airline Demo",
    });
    mockGetSetupInventorySnapshot.mockResolvedValue({
      tenantKey: "skyharbor-air",
      totalRecords: 100,
      totalChunks: 200,
      totalNodes: 30,
      totalEdges: 25,
      recentActivity: [],
      lastIngestedAt: "2026-07-12T12:00:00.000Z",
      segments: [
        {
          segmentId: "enterprise_profile",
          segmentName: "Enterprise Profile",
          familyNumber: 1,
          recordCount: 100,
          coverageScore: 80,
          staleCount: 0,
          missingCount: 4,
          healthState: "partial",
          lastReviewedAt: null,
          lastIngestedAt: "2026-07-12T12:00:00.000Z",
        },
      ],
    });
    mockGetTenantSourceFiles.mockResolvedValue([
      {
        source_doc: "skyharbor-context.csv",
        chunk_count: 20,
        first_loaded_at: "2026-07-12T12:00:00.000Z",
        sample_chunk_id: "chunk-1",
      },
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns the setup-control contract without promoting candidate or active tenant data", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();

    expect(mockGetSetupInventorySnapshot).toHaveBeenCalledWith("skyharbor-air");
    expect(mockGetTenantSourceFiles).toHaveBeenCalledWith("client-skyharbor");
    expect(body).toEqual(
      expect.objectContaining({
        tenant: expect.objectContaining({
          tenantKey: "skyharbor",
          displayName: "Airline Demo",
        }),
        activeTenantAccess: expect.any(Object),
        candidateTenantDataVersion: expect.objectContaining({
          candidateVersionId: null,
          promotionEnabled: false,
          activeTenantAccessLayerUpdated: false,
        }),
        uploadState: expect.objectContaining({
          uploadedFiles: 1,
        }),
        promotionControl: expect.objectContaining({
          promotionEnabled: false,
          operatorApprovalRequired: true,
        }),
        guardrails: expect.objectContaining({
          productionTenantDataWritten: false,
          activeTenantAccessLayerUpdated: false,
          candidatePromoted: false,
          moduleRuntimeConsumptionChanged: false,
          candidateReadByDefault: false,
          directActivePromotionBlocked: true,
        }),
      }),
    );
    expect(body.moduleReadiness.home.status).not.toBe("ready");
    expect(body.legacyImportPaths[0]).toEqual(
      expect.objectContaining({
        legacyControlledImport: true,
        warning: "Legacy controlled import - not candidate-version promoted.",
      }),
    );
  });
});
