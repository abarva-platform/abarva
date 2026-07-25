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

type AcceptResult =
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

const acceptVendorProposalFact = jest.fn(
  async (identity: unknown, input: unknown): Promise<AcceptResult> => ({
    ok: true,
    record: {
      id: "review-1",
      factId: (input as { factId: string }).factId,
      reviewStatus: "accepted",
      rationale: (input as { rationale: string }).rationale,
      reviewedBy: (input as { reviewedBy: string }).reviewedBy,
      reviewedAt: "2026-07-25T00:00:00.000Z",
    },
  }),
);

jest.mock("@/lib/source/vendor-proposals/vendor-proposal-facts", () => ({
  acceptVendorProposalFact: (identity: unknown, input: unknown) =>
    acceptVendorProposalFact(identity, input),
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
  acceptVendorProposalFact.mockImplementation(async (_identity, input) => ({
    ok: true,
    record: {
      id: "review-1",
      factId: (input as { factId: string }).factId,
      reviewStatus: "accepted",
      rationale: (input as { rationale: string }).rationale,
      reviewedBy: (input as { reviewedBy: string }).reviewedBy,
      reviewedAt: "2026-07-25T00:00:00.000Z",
    },
  }));
});

describe("POST /api/v1/source/:eventId/vendor-proposals/facts/:factId/accept", () => {
  it("rejects a missing rationale", async () => {
    const res = await POST(request({}), ctx);
    expect(res.status).toBe(400);
    expect(acceptVendorProposalFact).not.toHaveBeenCalled();
  });

  it("accepts with a rationale, scoping the call to the resolved tenant+event", async () => {
    const res = await POST(
      request({ rationale: "Matches proposal page 4." }),
      ctx,
    );
    expect(res.status).toBe(200);
    expect(acceptVendorProposalFact).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantKey: "apexretail",
        role: "maestro",
        userId: "clerk-user-1",
      }),
      expect.objectContaining({
        factId: "fact-1",
        eventId: "11111111-1111-1111-1111-111111111111",
        rationale: "Matches proposal page 4.",
        reviewedBy: "clerk-user-1",
      }),
    );
  });

  it("returns 403 when the user lacks stage-approval rights — accept is a stronger claim than upload", async () => {
    const { loadUserSourceAccessPolicy } = jest.requireMock(
      "@/lib/auth/source-access-policy",
    ) as { loadUserSourceAccessPolicy: jest.Mock };
    loadUserSourceAccessPolicy.mockResolvedValueOnce({
      canApproveSourceStages: false,
      canUploadSourceArtifacts: true,
    });
    const res = await POST(request({ rationale: "x" }), ctx);
    expect(res.status).toBe(403);
    expect(acceptVendorProposalFact).not.toHaveBeenCalled();
  });

  it("returns 404 when the repository reports fact_not_found (cross-tenant/cross-event)", async () => {
    acceptVendorProposalFact.mockResolvedValueOnce({
      ok: false,
      error: "fact_not_found",
    });
    const res = await POST(request({ rationale: "x" }), ctx);
    expect(res.status).toBe(404);
  });

  it("returns 404 when the event does not resolve for this tenant", async () => {
    const { getActiveClientRow } = jest.requireMock("@/lib/active-client") as {
      getActiveClientRow: jest.Mock;
    };
    getActiveClientRow.mockResolvedValueOnce({ key: "meridian" });
    const res = await POST(request({ rationale: "x" }), ctx);
    expect(res.status).toBe(404);
    expect(acceptVendorProposalFact).not.toHaveBeenCalled();
  });
});
