/**
 * @jest-environment node
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";

const requireTenancyMock = jest.fn();
const tenancyErrorResponseMock = jest.fn((err: unknown) =>
  Response.json(
    { error: err instanceof Error ? err.message : "tenancy_error" },
    { status: 403 },
  ),
);

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: () => requireTenancyMock(),
  tenancyErrorResponse: (err: unknown) => tenancyErrorResponseMock(err),
}));

const getCurrentPersonMock = jest.fn();
jest.mock("@/lib/auth/maestro", () => ({
  getCurrentPerson: () => getCurrentPersonMock(),
}));

const loadUserProgramAccessPolicyMock = jest.fn();
jest.mock("@/lib/auth/program-access-policy", () => ({
  loadUserProgramAccessPolicy: (...args: unknown[]) =>
    loadUserProgramAccessPolicyMock(...args),
}));

const storageUploadMock = jest.fn<
  Promise<void>,
  [string, string, Uint8Array, unknown]
>(async () => undefined);
jest.mock("@/lib/data-plane/objectStorage", () => ({
  getObjectStorageAdapter: () => ({
    upload: (
      bucket: string,
      key: string,
      bytes: Uint8Array,
      options: unknown,
    ) => storageUploadMock(bucket, key, bytes, options),
  }),
}));

const insertUploadedFileMock = jest.fn();
const updateUploadedFileMock = jest.fn();
jest.mock("@/lib/data-plane/write-adapters/uploadsWriteAdapter", () => ({
  selectUploadsWriteAdapter: () => ({
    insertUploadedFile: (...args: unknown[]) => insertUploadedFileMock(...args),
    updateUploadedFile: (...args: unknown[]) => updateUploadedFileMock(...args),
  }),
}));

const evaluateSensitiveUploadMock = jest.fn();
jest.mock("@/lib/security/sensitive-upload-guard", () => ({
  evaluateSensitiveUpload: (...args: unknown[]) =>
    evaluateSensitiveUploadMock(...args),
  sensitiveUploadRejectedResponse: (decision: unknown) =>
    Response.json({ error: "quarantined", decision }, { status: 422 }),
}));

const classifyUploadContentMock = jest.fn();
jest.mock("@/lib/tower/classify", () => ({
  classifyUploadContent: (...args: unknown[]) =>
    classifyUploadContentMock(...args),
}));

const ingestPortfolioCsvMock = jest.fn();
jest.mock("@/lib/tower/ingest-portfolio", () => ({
  ingestPortfolioCsv: (...args: unknown[]) => ingestPortfolioCsvMock(...args),
}));

import { POST } from "@/app/api/tower/upload/route";

function makeTowerUploadRequest(
  fields: Record<string, string> = {},
): NextRequest {
  const form = new FormData();
  form.append(
    "file",
    new File(["name,stage\nRevenue assistant,review\n"], "portfolio.csv", {
      type: "text/csv",
    }),
  );
  form.append("clientId", "client-1");
  form.append("dataClassification", "confidential_business");
  for (const [key, value] of Object.entries(fields)) {
    form.append(key, value);
  }
  return new NextRequest("http://localhost/api/tower/upload", {
    method: "POST",
    body: form,
  });
}

function readRepo(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function markdownTableColumns(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((column) => column.trim());
}

beforeEach(() => {
  jest.clearAllMocks();
  requireTenancyMock.mockResolvedValue({
    clientId: "client-1",
    userId: "user-1",
    role: "admin",
  });
  getCurrentPersonMock.mockResolvedValue({ id: "person-1" });
  loadUserProgramAccessPolicyMock.mockResolvedValue({
    canUploadArtifacts: true,
  });
  evaluateSensitiveUploadMock.mockReturnValue({
    decision: "allow",
    classification: "confidential_business",
    findings: [],
  });
  insertUploadedFileMock.mockResolvedValue({ id: "file-1" });
  updateUploadedFileMock.mockResolvedValue({ id: "file-1" });
  classifyUploadContentMock.mockResolvedValue({
    data_type: "portfolio",
    confidence: 0.94,
    detected_columns: ["name", "stage"],
    period_hint: null,
    reasoning: "Portfolio-shaped CSV.",
  });
  ingestPortfolioCsvMock.mockResolvedValue({
    rows_total: 1,
    rows_ingested: 1,
    rows_failed: 0,
    notes: [],
  });
});

describe("POST /api/tower/upload · portfolio ingest decision boundary", () => {
  it("parses a portfolio upload without a human decision approval packet today", async () => {
    const res = await POST(makeTowerUploadRequest());

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      data_type: "portfolio",
      status: "parsed",
      rows_ingested: 1,
    });
    expect(ingestPortfolioCsvMock).toHaveBeenCalledWith({
      clientId: "client-1",
      fileId: "file-1",
      csvText: "name,stage\nRevenue assistant,review\n",
    });
    expect(updateUploadedFileMock).toHaveBeenCalledWith(
      "file-1",
      expect.objectContaining({
        ingestion_status: "parsed",
        classification_confidence: 0.94,
      }),
    );
  });

  it("does not let access and quarantine controls masquerade as cataloged approval coverage", () => {
    const legalCatalog = readRepo(
      "docs/legal/AI_CONSEQUENTIAL_ACTION_CATALOG.md",
    );
    const towerRow = legalCatalog
      .split("\n")
      .map(markdownTableColumns)
      .find(
        ([module, surface]) =>
          module === "Tower" && surface === "Portfolio data upload/ingest",
      );
    expect(towerRow?.[3]).toContain("Partial:");
    expect(towerRow?.[3]).toContain("No completed human decision owner");
    expect(towerRow?.[3]).not.toContain("Covered");

    const controlCatalog = JSON.parse(
      readRepo("docs/security/ai-surface-control-catalog.json"),
    ) as {
      catalogClaimCoverage?: Array<{ key: string }>;
    };
    expect(controlCatalog.catalogClaimCoverage ?? []).not.toContainEqual(
      expect.objectContaining({
        key: "consequential|Tower|Portfolio data upload/ingest|human-approval-gate",
      }),
    );
  });
});
