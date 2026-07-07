import { NextRequest } from "next/server";
import type { ApprovalRequest } from "@/lib/programs/approval";

const mockRequireAdminAuth = jest.fn();
const mockListApprovalAuditForTenant = jest.fn();

jest.mock("@/app/api/admin/programs/approvals/_auth", () => ({
  requireAdminAuth: () => mockRequireAdminAuth(),
  adminAuthErrorResponse: (err: unknown) => {
    const e = err as { status?: number; code?: string };
    if (e && typeof e.status === "number" && typeof e.code === "string") {
      return Response.json({ error: e.code }, { status: e.status });
    }
    throw err;
  },
}));

jest.mock("@/lib/programs/approval", () => ({
  listApprovalAuditForTenant: (input: unknown) =>
    mockListApprovalAuditForTenant(input),
}));

function request(url: string): NextRequest {
  return new NextRequest(url);
}

function approvalFixture(
  overrides: Partial<ApprovalRequest> = {},
): ApprovalRequest {
  return {
    id: "approval-1",
    tenantKey: "apexretail",
    programId: "program-1",
    requestedByUserId: "user-requester",
    requestedAt: "2026-06-01T12:00:00.000Z",
    requestStatus: "approved",
    decidedByUserId: "user-admin",
    decidedAt: "2026-06-01T12:30:00.000Z",
    decisionRationale: "Reviewed evidence and accepted responsibility.",
    briefSnapshot: { name: "Apex AMS consolidation", formula: "=unsafe" },
    createdAt: "2026-06-01T12:00:00.000Z",
    updatedAt: "2026-06-01T12:30:00.000Z",
    escalationLevel: 0,
    lastNotifiedAt: null,
    notifyCount: 0,
    escalatedToUserId: null,
    ...overrides,
  };
}

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  mockRequireAdminAuth.mockResolvedValue({
    userId: "user-admin",
    tenantKey: "apexretail",
    isAdmin: true,
  });
  mockListApprovalAuditForTenant.mockResolvedValue([approvalFixture()]);
});

describe("GET /api/admin/programs/approvals/export", () => {
  it("returns a tenant-scoped JSON approval audit export", async () => {
    const { GET } = await import("../route");
    const res = await GET(
      request(
        "http://test/api/admin/programs/approvals/export?from=2026-06-01&to=2026-06-30&status=approved",
      ),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(res.headers.get("content-disposition")).toContain(
      "approval-audit-apexretail",
    );
    expect(res.headers.get("x-abarva-audit-export")).toBe(
      "client-approval-audit",
    );
    expect(mockListApprovalAuditForTenant).toHaveBeenCalledWith({
      tenantKey: "apexretail",
      fromIso: "2026-06-01T00:00:00.000Z",
      toIso: "2026-06-30T00:00:00.000Z",
      status: "approved",
      limit: null,
    });
    const body = await res.json();
    expect(body).toMatchObject({
      schemaVersion: "abarva.client-approval-audit-export.v1",
      tenantKey: "apexretail",
      recordCount: 1,
    });
    expect(body.records[0]).toMatchObject({
      approvalId: "approval-1",
      sourceSystem: "program_approval_requests",
      evidenceRefs: ["program_approval_requests:approval-1"],
    });
  });

  it("returns spreadsheet-safe CSV when requested", async () => {
    mockListApprovalAuditForTenant.mockResolvedValue([
      approvalFixture({ decisionRationale: "=unsafe formula" }),
    ]);
    const { GET } = await import("../route");
    const res = await GET(
      request("http://test/api/admin/programs/approvals/export?format=csv"),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/csv");
    const csv = await res.text();
    expect(csv).toContain("tenantKey,approvalId,programId");
    expect(csv).toContain('"program_approval_requests:approval-1"');
    expect(csv).toContain('"\'=unsafe formula"');
  });

  it("rejects invalid status and does not query audit rows", async () => {
    const { GET } = await import("../route");
    const res = await GET(
      request("http://test/api/admin/programs/approvals/export?status=other"),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      error: "invalid_status",
    });
    expect(mockListApprovalAuditForTenant).not.toHaveBeenCalled();
  });

  it("preserves auth failure behavior", async () => {
    mockRequireAdminAuth.mockRejectedValue({
      status: 401,
      code: "unauthenticated",
    });

    const { GET } = await import("../route");
    const res = await GET(
      request("http://test/api/admin/programs/approvals/export"),
    );

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "unauthenticated" });
  });
});
