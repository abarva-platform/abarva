const tenancy = {
  clientId: "client-1",
  clientKey: "skyharbor-air",
  userId: "clerk-user-1",
  role: "maestro",
};

const currentUser = {
  personId: "person-1",
  clerkUserId: "clerk-user-1",
  email: "anand.sundaram+skyharbor@thesundaram.com",
  name: "Anand Sundaram",
  primaryRole: "maestro",
  metadataClientKey: "skyharbor-air",
};

const artifactStateRow = {
  id: "state-row-1",
  source_event_id: "11111111-1111-1111-1111-111111111111",
  artifact_code: "d11_response_checklist",
  stage_key: "responses",
  linked_artifact_id: "artifact-1",
};

const sourceArtifactRow = {
  id: "artifact-1",
  status: "approved",
  lifecycle_state: "current",
  approval_state: null,
  approved_by: "person-1",
};

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: jest.fn(async () => tenancy),
  tenancyErrorResponse: jest.fn(() => {
    throw new Error("tenancy error");
  }),
}));

jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: jest.fn(async () => ({ key: "skyharbor-air" })),
}));

jest.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: jest.fn(async () => currentUser),
}));

jest.mock("@/lib/auth/source-access-policy", () => ({
  loadUserSourceAccessPolicy: jest.fn(async () => ({
    canUploadSourceArtifacts: true,
  })),
}));

jest.mock("@/lib/source/queries", () => ({
  scaffoldNewEventSubstrate: jest.fn(async () => undefined),
}));

jest.mock("@/lib/source/canonical-specs/artifact-specs", () => ({
  specByCode: jest.fn((code: string) => ({ gateDefining: code === "d04_app_inventory" })),
}));

const insertArtifactAcceptance = jest.fn(
  async (input: unknown): Promise<{ ok: true; record: Record<string, unknown> } | { ok: false; error: string }> => ({
    ok: true,
    record: {
      id: "acceptance-1",
      ...(input as Record<string, unknown>),
    },
  }),
);

jest.mock("@/lib/source/artifact-acceptances", () => ({
  insertArtifactAcceptance: (input: unknown) => insertArtifactAcceptance(input),
}));

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: jest.fn(() => fakeFluentClient()),
}));

import { POST } from "../route";

function fakeFluentClient() {
  return {
    from(table: string) {
      const filters: Record<string, unknown> = {};
      const chain: Record<string, unknown> = {
        select: () => chain,
        eq: (key: string, value: unknown) => {
          filters[key] = value;
          return chain;
        },
        maybeSingle: async () => {
          if (table === "source_events") {
            return { data: { id: "11111111-1111-1111-1111-111111111111", client_key: "skyharbor-air" }, error: null };
          }
          if (table === "source_event_artifact_states") {
            return {
              data: filters.artifact_code === "d11_response_checklist" ? artifactStateRow : null,
              error: null,
            };
          }
          if (table === "source_artifacts") {
            return {
              data: filters.id === "artifact-1" ? sourceArtifactRow : null,
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

function request(body: unknown): import("next/server").NextRequest {
  return { json: async () => body } as unknown as import("next/server").NextRequest;
}

const ctx = {
  params: Promise.resolve({ eventId: "11111111-1111-1111-1111-111111111111", artifactCode: "d11_response_checklist" }),
};

beforeEach(() => {
  jest.clearAllMocks();
  insertArtifactAcceptance.mockImplementation(async (input) => ({
    ok: true,
    record: { id: "acceptance-1", ...(input as Record<string, unknown>) },
  }));
});

describe("POST /api/v1/source/:eventId/artifacts/:artifactCode/accept", () => {
  it("rejects a missing rationale", async () => {
    const res = await POST(request({}), ctx);
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error?: string };
    expect(json.error).toBe("bad_request");
    expect(insertArtifactAcceptance).not.toHaveBeenCalled();
  });

  it("computes artifactState/artifactRole server-side, never trusts the client", async () => {
    const res = await POST(
      request({
        approvalRationale: "Vendor coverage matrix reviewed and complete.",
        // A caller-supplied artifactState/artifactRole must be ignored —
        // these fields aren't even read from the body.
        artifactState: "client_final",
        artifactRole: "authoritative",
      }),
      ctx,
    );
    expect(res.status).toBe(200);
    expect(insertArtifactAcceptance).toHaveBeenCalledWith(
      expect.objectContaining({
        artifactId: "artifact-1",
        eventId: "11111111-1111-1111-1111-111111111111",
        stageKey: "responses",
        // status: approved + approvedBy set -> approved_for_external_use,
        // derived from the real source_artifacts row, not the request body.
        artifactState: "approved_for_external_use",
        // specByCode("d11_response_checklist").gateDefining is false in the
        // mock -> evidence, not the client-claimed "authoritative".
        artifactRole: "evidence",
        approvalRationale: "Vendor coverage matrix reviewed and complete.",
        acceptedBy: "clerk-user-1",
      }),
    );
  });

  it("defaults optional enum fields when omitted", async () => {
    await POST(request({ approvalRationale: "Reviewed." }), ctx);
    expect(insertArtifactAcceptance).toHaveBeenCalledWith(
      expect.objectContaining({
        contentDriftStatus: "unknown",
        gatePreconditionStatus: "not_ready",
        downstreamContextPolicy: "restricted",
        diffSummary: null,
      }),
    );
  });

  it("rejects an artifact code with no linked content yet", async () => {
    const res = await POST(
      request({ approvalRationale: "x" }),
      { params: Promise.resolve({ eventId: "11111111-1111-1111-1111-111111111111", artifactCode: "d99_unlinked" }) },
    );
    expect(res.status).toBe(404);
  });

  it("returns 403 when the user lacks upload rights", async () => {
    const { loadUserSourceAccessPolicy } = jest.requireMock(
      "@/lib/auth/source-access-policy",
    ) as { loadUserSourceAccessPolicy: jest.Mock };
    loadUserSourceAccessPolicy.mockResolvedValueOnce({ canUploadSourceArtifacts: false });
    const res = await POST(request({ approvalRationale: "x" }), ctx);
    expect(res.status).toBe(403);
    expect(insertArtifactAcceptance).not.toHaveBeenCalled();
  });

  it("surfaces an insert failure as a 500", async () => {
    insertArtifactAcceptance.mockResolvedValueOnce({ ok: false, error: "db down" });
    const res = await POST(request({ approvalRationale: "x" }), ctx);
    expect(res.status).toBe(500);
    const json = (await res.json()) as { error?: string; detail?: string };
    expect(json.error).toBe("insert_failed");
    expect(json.detail).toBe("db down");
  });
});
