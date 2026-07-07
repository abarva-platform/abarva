import { NextRequest } from "next/server";

import { GET } from "../route";

const mockRequireTenancy = jest.fn();
const mockDownload = jest.fn();

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: (...args: unknown[]) => mockRequireTenancy(...args),
  tenancyErrorResponse: () =>
    new Response(JSON.stringify({ error: "unauthenticated" }), { status: 401 }),
}));

jest.mock("@/lib/data-plane/objectStorage", () => ({
  getObjectStorageAdapter: jest.fn(() => ({
    upload: jest.fn(),
    remove: jest.fn(),
    download: (...args: unknown[]) => mockDownload(...args),
    createSignedUrl: jest.fn(),
  })),
}));

function statusRequest(query: string) {
  return new NextRequest(
    `http://localhost/api/admin/context-layer/bulk-upload/status?${query}`,
    { method: "GET" },
  );
}

describe("/api/admin/context-layer/bulk-upload/status", () => {
  beforeEach(() => {
    mockRequireTenancy.mockResolvedValue({
      clientId: "client-meridian",
      clientKey: "meridian-health",
      userId: "user-meridian",
    });
    mockDownload.mockResolvedValue(
      Buffer.from(
        JSON.stringify({
          schema: "abarva.context-bulk-upload.job-status.v1",
          jobId: "bulk-0123456789abcdef",
          clientId: "client-meridian",
          tenantKey: "meridian-health",
          loadName: "meridian-phase-0",
          mode: "stage_and_enqueue",
          status: "waiting_for_private_worker",
          summary: "Files are staged and queued.",
          updatedAt: "2026-06-06T13:00:00.000Z",
          workflow: {
            jobId: "bulk-0123456789abcdef",
            summary: "Files are staged and queued.",
            status: {
              persisted: true,
              bucket: "context-uploads",
              path: "meridian-health/_jobs/bulk-0123456789abcdef.json",
              pollable: true,
            },
            steps: [
              {
                id: "private_worker",
                label: "Private worker processing",
                status: "active",
                detail: "Waiting for Azure worker.",
              },
            ],
          },
          files: [],
          counts: {
            filesProcessed: 1,
            rowsParsed: 0,
            chunksQueued: 0,
          },
        }),
      ),
    );
  });

  afterEach(() => {
    mockRequireTenancy.mockReset();
    mockDownload.mockReset();
  });

  it("returns the tenant-scoped upload job status", async () => {
    const response = await GET(
      statusRequest("clientId=client-meridian&jobId=bulk-0123456789abcdef"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockDownload).toHaveBeenCalledWith(
      "context-uploads",
      "meridian-health/_jobs/bulk-0123456789abcdef.json",
    );
    expect(body).toMatchObject({
      ok: true,
      status: {
        jobId: "bulk-0123456789abcdef",
        status: "waiting_for_private_worker",
        tenantKey: "meridian-health",
      },
    });
  });

  it("rejects cross-tenant status reads before touching storage", async () => {
    const response = await GET(
      statusRequest("clientId=client-other&jobId=bulk-0123456789abcdef"),
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: "forbidden_cross_tenant" });
    expect(mockDownload).not.toHaveBeenCalled();
  });
});
