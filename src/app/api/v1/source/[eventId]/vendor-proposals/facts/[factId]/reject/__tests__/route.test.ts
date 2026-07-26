const tenancy = {
  clientId: "client-1",
  clientKey: "apexretail",
  userId: "clerk-user-1",
  role: "maestro",
};

const currentUser = {
  personId: "person-1",
  clerkUserId: "clerk-user-1",
  email: "anand.sundaram+apex@thesundaram.com",
  name: "Anand Sundaram",
  primaryRole: "maestro",
  metadataClientKey: "apexretail",
};

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: jest.fn(async () => tenancy),
  tenancyErrorResponse: jest.fn(() => {
    throw new Error("tenancy error");
  }),
}));

jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: jest.fn(async () => ({ key: "apexretail" })),
}));

jest.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: jest.fn(async () => currentUser),
}));

jest.mock("@/lib/auth/source-access-policy", () => ({
  loadUserSourceAccessPolicy: jest.fn(async () => ({
    canApproveSourceStages: true,
    canUploadSourceArtifacts: true,
  })),
}));

type RejectResult =
  | {
      ok: true;
      record: {
        id: string;
        factId: string;
        reviewStatus: string;
        rationale: string;
        reviewedBy: string;
        reviewedAt: string;
      };
    }
  | { ok: false; error: string };

const rejectVendorProposalFact = jest.fn(
  async (identity: unknown, input: unknown): Promise<RejectResult> => ({
    ok: true,
    record: {
      id: "review-1",
      factId: (input as { factId: string }).factId,
      reviewStatus: "rejected",
      rationale: (input as { rationale: string }).rationale,
      reviewedBy: (input as { reviewedBy: string }).reviewedBy,
      reviewedAt: "2026-07-25T00:00:00.000Z",
    },
  }),
);

jest.mock("@/lib/source/vendor-proposals/vendor-proposal-facts", () => ({
  rejectVendorProposalFact: (identity: unknown, input: unknown) =>
    rejectVendorProposalFact(identity, input),
}));

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: jest.fn(() => fakeFluentClient()),
}));

import { POST } from "../route";

function fakeFluentClient() {
  return {
    from(table: string) {
      const chain: Record<string, unknown> = {
        select: () => chain,
        eq: () => chain,
        maybeSingle: async () => {
          if (table === "source_events") {
            return {
              data: {
                id: "11111111-1111-1111-1111-111111111111",
                client_key: "apexretail",
              },
              error: null,
            };
          }
          return { data: null, error: null };
        },
      };
      return chain;
    },
  };
}

function request(body: unknown): Request {
  return { json: async () => body } as unknown as Request;
}

const ctx = {
  params: Promise.resolve({
    eventId: "11111111-1111-1111-1111-111111111111",
    factId: "fact-1",
  }),
};

beforeEach(() => {
  jest.clearAllMocks();
  rejectVendorProposalFact.mockImplementation(async (_identity, input) => ({
    ok: true,
    record: {
      id: "review-1",
      factId: (input as { factId: string }).factId,
      reviewStatus: "rejected",
      rationale: (input as { rationale: string }).rationale,
      reviewedBy: (input as { reviewedBy: string }).reviewedBy,
      reviewedAt: "2026-07-25T00:00:00.000Z",
    },
  }));
});

describe("POST /api/v1/source/:eventId/vendor-proposals/facts/:factId/reject", () => {
  it("rejects a missing rationale", async () => {
    const res = await POST(request({}), ctx);
    expect(res.status).toBe(400);
    expect(rejectVendorProposalFact).not.toHaveBeenCalled();
  });

  it("rejects a fact with a rationale, scoping the call to the resolved tenant+event", async () => {
    const res = await POST(
      request({ rationale: "Not corroborated by the proposal document." }),
      ctx,
    );
    expect(res.status).toBe(200);
    expect(rejectVendorProposalFact).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantKey: "apexretail",
        role: "maestro",
        userId: "clerk-user-1",
      }),
      expect.objectContaining({
        factId: "fact-1",
        eventId: "11111111-1111-1111-1111-111111111111",
        rationale: "Not corroborated by the proposal document.",
        reviewedBy: "clerk-user-1",
      }),
    );
  });

  it("returns 403 when the user lacks stage-approval rights", async () => {
    const { loadUserSourceAccessPolicy } = jest.requireMock(
      "@/lib/auth/source-access-policy",
    ) as { loadUserSourceAccessPolicy: jest.Mock };
    loadUserSourceAccessPolicy.mockResolvedValueOnce({
      canApproveSourceStages: false,
      canUploadSourceArtifacts: true,
    });
    const res = await POST(request({ rationale: "x" }), ctx);
    expect(res.status).toBe(403);
    expect(rejectVendorProposalFact).not.toHaveBeenCalled();
  });

  it("returns 404 when the repository reports fact_not_found (cross-tenant/cross-event)", async () => {
    rejectVendorProposalFact.mockResolvedValueOnce({
      ok: false,
      error: "fact_not_found",
    });
    const res = await POST(request({ rationale: "x" }), ctx);
    expect(res.status).toBe(404);
  });

  // RLS/tenant-isolation workstream, PR C — same denial as the accept route
  // when no tenant context can be established at all.
  it("returns 401 when no tenant context can be established at all (missing/unauthenticated)", async () => {
    const { requireTenancy, tenancyErrorResponse } = jest.requireMock(
      "@/lib/auth/tenancy",
    ) as { requireTenancy: jest.Mock; tenancyErrorResponse: jest.Mock };
    const { getActiveClientRow } = jest.requireMock("@/lib/active-client") as {
      getActiveClientRow: jest.Mock;
    };
    const { getCurrentUser } = jest.requireMock("@/lib/auth/current-user") as {
      getCurrentUser: jest.Mock;
    };

    requireTenancy.mockRejectedValueOnce(new Error("unauthenticated"));
    getActiveClientRow.mockResolvedValueOnce(null);
    getCurrentUser.mockResolvedValueOnce(null);
    tenancyErrorResponse.mockReturnValueOnce(
      Response.json({ error: "unauthenticated" }, { status: 401 }),
    );

    const res = await POST(request({ rationale: "x" }), ctx);
    expect(res.status).toBe(401);
    expect(rejectVendorProposalFact).not.toHaveBeenCalled();
  });
});
