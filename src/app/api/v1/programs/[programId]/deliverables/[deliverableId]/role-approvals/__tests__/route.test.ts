const mockRequireTenancy = jest.fn();
const mockGetProgramById = jest.fn();
const mockFrom = jest.fn();

jest.mock("../../../../../_auth", () => ({
  requireTenancy: () => mockRequireTenancy(),
  tenancyErrorResponse: jest.fn(() => Response.json({ error: "tenancy" }, { status: 401 })),
}));

jest.mock("@/lib/programs/queries", () => ({
  getProgramById: (...args: unknown[]) => mockGetProgramById(...args),
}));

jest.mock("@/lib/programs/programs-auth-mode-server", () => ({
  getProgramsRouteSupabase: jest.fn(async () => ({
    supabase: {
      from: (...args: unknown[]) => mockFrom(...args),
    },
  })),
}));

jest.mock("@/lib/programs/deliverable-role-approvals", () => ({
  getRoleApprovalSummary: jest.fn(),
  recordRoleApprovalDecision: jest.fn(),
}));

describe("POST role-approvals", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockRequireTenancy.mockResolvedValue({
      clientId: "client-1",
      userId: "user-1",
      role: "client_admin",
    });
    mockGetProgramById.mockResolvedValue({ id: "program-1" });
    mockFrom.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn(async () => ({
              data: { deliverable_type_key: "charter" },
              error: null,
            })),
          })),
        })),
      })),
    });
  });

  it("retires role-specific sign-off without writing a second approval", async () => {
    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role: "finance", status: "approved" }),
      }),
      { params: Promise.resolve({ programId: "program-1", deliverableId: "d-1" }) },
    );

    expect(response.status).toBe(410);
    await expect(response.json()).resolves.toMatchObject({
      error: "role_approvals_retired",
    });
    const { recordRoleApprovalDecision } = await import(
      "@/lib/programs/deliverable-role-approvals"
    );
    expect(recordRoleApprovalDecision).not.toHaveBeenCalled();
  });
});
