const requireTenancy = jest.fn();
const tenancyErrorResponse = jest.fn();
const loadUserSourceAccessPolicy = jest.fn();
const loadUserProgramAccessPolicy = jest.fn();
const getSourceArtifactRegistryRecord = jest.fn();
const getMoveArtifactForTenant = jest.fn();
const getGeneratedArtifactById = jest.fn();

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy,
  tenancyErrorResponse,
}));

jest.mock("@/lib/auth/source-access-policy", () => ({
  loadUserSourceAccessPolicy,
}));

jest.mock("@/lib/auth/program-access-policy", () => ({
  loadUserProgramAccessPolicy,
}));

jest.mock("@/lib/source/artifact-registry", () => ({
  getSourceArtifactRegistryRecord,
}));

jest.mock("@/lib/programs/deliverables/move-artifacts", () => ({
  getMoveArtifactForTenant,
}));

jest.mock("@/lib/artifacts/repository", () => ({
  getGeneratedArtifactById,
}));

jest.mock("@/lib/agent/tools/intelligence/_shared", () => ({
  clientKeyToInventorySubstrateKey: jest.fn((key: string) =>
    key === "skyharbor" ? "skyharbor-air" : key,
  ),
}));

function request() {
  return new Request("http://localhost/api/setup/files/source/a1/download");
}

function params(scope: string, artifactId: string) {
  return { params: Promise.resolve({ scope, artifactId }) };
}

describe("GET /api/setup/files/[scope]/[artifactId]/download", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireTenancy.mockResolvedValue({
      clientId: "client_1",
      clientKey: "skyharbor",
      userId: "user_1",
    });
    tenancyErrorResponse.mockImplementation((err: unknown) => {
      throw err;
    });
    loadUserSourceAccessPolicy.mockResolvedValue({
      sourceEventIdsAllowed: null,
      allowedDataClasses: ["public", "internal", "confidential"],
    });
    loadUserProgramAccessPolicy.mockResolvedValue({
      programIdsAllowed: null,
      allowedDataClasses: ["public", "internal", "confidential"],
    });
    getSourceArtifactRegistryRecord.mockResolvedValue(null);
    getMoveArtifactForTenant.mockResolvedValue(null);
    getGeneratedArtifactById.mockResolvedValue(null);
  });

  it("blocks restricted Source artifacts for users without that data class", async () => {
    getSourceArtifactRegistryRecord.mockResolvedValue({
      id: "a1",
      tenantKey: "skyharbor-air",
      sourceEventId: "source_event_1",
      dataClassification: "Restricted",
      deletedAt: null,
    });

    const { GET } =
      await import("@/app/api/setup/files/[scope]/[artifactId]/download/route");
    const res = await GET(request() as never, params("source", "a1"));

    expect(res.status).toBe(403);
  });

  it("redirects allowed Source artifacts to the existing Source download route", async () => {
    getSourceArtifactRegistryRecord.mockResolvedValue({
      id: "a1",
      tenantKey: "skyharbor-air",
      sourceEventId: "source_event_1",
      dataClassification: "Confidential",
      deletedAt: null,
    });

    const { GET } =
      await import("@/app/api/setup/files/[scope]/[artifactId]/download/route");
    const res = await GET(request() as never, params("source", "a1"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "http://localhost/api/v1/source/artifacts/a1/download",
    );
  });

  it("blocks Moves artifacts outside assigned program scope", async () => {
    getMoveArtifactForTenant.mockResolvedValue({
      artifact_id: "m1",
      move_id: "move_2",
      metadata: {},
    });
    loadUserProgramAccessPolicy.mockResolvedValue({
      programIdsAllowed: ["move_1"],
      allowedDataClasses: ["public", "internal", "confidential"],
    });

    const { GET } =
      await import("@/app/api/setup/files/[scope]/[artifactId]/download/route");
    const res = await GET(
      new Request("http://localhost/api/setup/files/move/m1/download") as never,
      params("move", "m1"),
    );

    expect(res.status).toBe(403);
  });
});
