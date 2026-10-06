import { NextRequest } from "next/server";

import { POST } from "../route";

const mockRequireTenancy = jest.fn();
const mockRequireTenantAdmin = jest.fn();
const mockReadFile = jest.fn();
const mockGetAzureWriteFluentClient = jest.fn(() => ({}));
const mockStageFileToBlob = jest.fn();

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: (...args: unknown[]) => mockRequireTenancy(...args),
  tenancyErrorResponse: () => new Response(null, { status: 401 }),
}));
jest.mock("@/lib/auth/tenant-roles", () => ({
  requireTenantAdmin: (...args: unknown[]) => mockRequireTenantAdmin(...args),
}));

jest.mock("node:fs/promises", () => ({
  __esModule: true,
  default: { readFile: (...args: unknown[]) => mockReadFile(...args) },
}));

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureWriteFluentClient: () => mockGetAzureWriteFluentClient(),
}));

jest.mock("@/lib/context-ingestion/blob-stager", () => ({ stageFileToBlob: (...args: unknown[]) => mockStageFileToBlob(...args) }));
jest.mock("@/lib/context-ingestion/context-commit", () => ({ commitContextBatch: jest.fn() }));
jest.mock("@/lib/context-ingestion/csv-upload-connector", () => ({ loadCsvUploadToTenantContext: jest.fn() }));
jest.mock("@/lib/context-ingestion/jsonl-graph-loader", () => ({ loadJsonlGraphEdges: jest.fn() }));
jest.mock("@/lib/context-ingestion/yaml-loader", () => ({ loadYamlToContext: jest.fn() }));

function request(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/admin/context-layer/manifest-load", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("context manifest load", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireTenancy.mockResolvedValue({
      clientKey: "test-tenant",
      clientId: "test-client",
      userId: "test-user",
      clerkUserId: "clerk-test-user",
    });
    mockRequireTenantAdmin.mockResolvedValue(undefined);
  });

  it("rejects a non-admin before reading an explicit manifest", async () => {
    mockRequireTenantAdmin.mockRejectedValue(new Error("forbidden_tenant_admin_required"));

    const response = await POST(request({
      tenantKey: "test-tenant",
      datasetPath: "datasets/test-fixture",
      dryRun: true,
    }));

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: "forbidden_tenant_admin_required" });
    expect(mockRequireTenantAdmin).toHaveBeenCalledWith({
      userId: "clerk-test-user",
      tenantKey: "test-tenant",
    });
    expect(mockReadFile).not.toHaveBeenCalled();
    expect(mockStageFileToBlob).not.toHaveBeenCalled();
    expect(mockGetAzureWriteFluentClient).not.toHaveBeenCalled();
  });

  it("fails closed without a verified Clerk user id", async () => {
    mockRequireTenancy.mockResolvedValue({
      clientKey: "test-tenant",
      clientId: "test-client",
      userId: "test-user",
    });

    const response = await POST(request({
      tenantKey: "test-tenant",
      datasetPath: "datasets/test-fixture",
      dryRun: true,
    }));

    expect(response.status).toBe(403);
    expect(mockRequireTenantAdmin).not.toHaveBeenCalled();
    expect(mockReadFile).not.toHaveBeenCalled();
  });

  it("rejects a web mutation even for an admin before any I/O", async () => {
    const response = await POST(request({
      tenantKey: "test-tenant",
      datasetPath: "datasets/test-fixture",
      dryRun: false,
    }));

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: "manifest_load_aca_job_required" });
    expect(mockReadFile).not.toHaveBeenCalled();
    expect(mockStageFileToBlob).not.toHaveBeenCalled();
    expect(mockGetAzureWriteFluentClient).not.toHaveBeenCalled();
  });

  it("requires an explicit dataset path before reading files or opening a write client", async () => {
    const response = await POST(request({ tenantKey: "test-tenant", dryRun: true }));

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: "manifest_load_dataset_path_required" });
    expect(mockReadFile).not.toHaveBeenCalled();
    expect(mockGetAzureWriteFluentClient).not.toHaveBeenCalled();
  });

  it("dry-runs only entries declared by the supplied manifest", async () => {
    mockReadFile.mockImplementation(async (file: string) => {
      if (file.endsWith("/manifest.yaml")) {
        return [
          "tenant_key: test-tenant",
          "client_id: test-client",
          "load_order:",
          "  - order: 1",
          "    family: technology_estate",
          "    dimension: applications_systems",
          "    file: inventory.csv",
          "    template_id: applications-systems",
        ].join("\n");
      }
      if (file.endsWith("/inventory.csv")) return Buffer.from("app_id,name\nAPP-1,Example\n");
      throw new Error(`unexpected_file:${file}`);
    });

    const response = await POST(request({
      tenantKey: "test-tenant",
      datasetPath: "datasets/test-fixture",
      dryRun: true,
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      ok: true,
      dryRun: true,
      totalRecords: 1,
      phases: [{ file: "inventory.csv", status: "validated", records: 1 }],
    });
    expect(mockReadFile).toHaveBeenCalledTimes(2);
  });

  it("rejects an opposite-tenant manifest before reading entries or opening a write client", async () => {
    mockReadFile.mockImplementation(async (file: string) => {
      if (file.endsWith("/manifest.yaml")) {
        return [
          "tenant_key: other-tenant",
          "client_id: other-client",
          "load_order:",
          "  - order: 1",
          "    family: technology_estate",
          "    dimension: applications_systems",
          "    file: inventory.csv",
          "    template_id: applications-systems",
        ].join("\n");
      }
      throw new Error(`unexpected_file:${file}`);
    });

    const response = await POST(request({
      tenantKey: "test-tenant",
      datasetPath: "datasets/test-fixture",
      dryRun: true,
    }));

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: "manifest_load_tenant_mismatch" });
    expect(mockReadFile).toHaveBeenCalledTimes(1);
    expect(mockGetAzureWriteFluentClient).not.toHaveBeenCalled();
  });

  it("fails closed when an explicit manifest names an unregistered template", async () => {
    mockReadFile.mockImplementation(async (file: string) => {
      if (file.endsWith("/manifest.yaml")) {
        return [
          "tenant_key: test-tenant",
          "client_id: test-client",
          "load_order:",
          "  - order: 1",
          "    family: technology_estate",
          "    dimension: applications_systems",
          "    file: inventory.csv",
          "    template_id: retired-template",
        ].join("\n");
      }
      if (file.endsWith("/inventory.csv")) return Buffer.from("app_id,name\nAPP-1,Example\n");
      throw new Error(`unexpected_file:${file}`);
    });

    const response = await POST(request({
      tenantKey: "test-tenant",
      datasetPath: "datasets/test-fixture",
      dryRun: true,
    }));

    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({
      ok: false,
      error: "manifest_load_failed",
      detail: "manifest_load_unknown_template:retired-template",
    });
  });
});
