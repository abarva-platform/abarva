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
    canApproveSourceStages: true,
    canUploadSourceArtifacts: true,
  })),
}));

jest.mock("@/lib/source/queries", () => ({
  scaffoldNewEventSubstrate: jest.fn(async () => undefined),
}));

// PR 4C: preserve the REAL SOURCE_ARTIFACT_SPECS export via requireActual —
// the accept route now also resolves a SourceArtifactContract for the
// artifact code, which (src/lib/source/contracts/build-registry.ts) needs
// the real spec catalog to build at module load. Only specByCode's return
// value is overridden, matching this test's original intent.
jest.mock("@/lib/source/canonical-specs/artifact-specs", () => ({
  ...jest.requireActual("@/lib/source/canonical-specs/artifact-specs"),
  specByCode: jest.fn((code: string) => ({
    gateDefining: code === "d04_app_inventory",
  })),
}));

const insertArtifactAcceptance = jest.fn(
  async (
    input: unknown,
  ): Promise<
    { ok: true; record: Record<string, unknown> } | { ok: false; error: string }
  > => ({
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
            return {
              data: {
                id: "11111111-1111-1111-1111-111111111111",
                client_key: "skyharbor-air",
              },
              error: null,
            };
          }
          if (table === "source_event_artifact_states") {
            return {
              data:
                filters.artifact_code === "d11_response_checklist"
                  ? artifactStateRow
                  : null,
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
  return {
    json: async () => body,
  } as unknown as import("next/server").NextRequest;
}

const ctx = {
  params: Promise.resolve({
    eventId: "11111111-1111-1111-1111-111111111111",
    artifactCode: "d11_response_checklist",
  }),
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

  // PR 4C (ADR-0015): the accept route's authority is now contract-driven
  // and includes the resulting ArtifactAuthorityDecision in the response.
  it("returns the resulting authority decision on successful acceptance — accepted AND authoritative", async () => {
    const res = await POST(
      request({ approvalRationale: "Reviewed and complete." }),
      ctx,
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      authority?: { isAccepted: boolean; isAuthoritative: boolean };
    };
    expect(json.authority?.isAccepted).toBe(true);
    expect(json.authority?.isAuthoritative).toBe(true);
  });

  it("returns 409 stage_not_eligible when accepting before the artifact's earliest eligible stage — new in PR 4C, acceptance is not exempt from stage eligibility the way chat-save is", async () => {
    const originalStageKey = artifactStateRow.stage_key;
    artifactStateRow.stage_key = "strategy"; // before "rfp", d11's own stage
    try {
      const res = await POST(
        request({ approvalRationale: "Too early." }),
        ctx,
      );
      expect(res.status).toBe(409);
      const json = (await res.json()) as { error?: string };
      expect(json.error).toBe("stage_not_eligible");
      expect(insertArtifactAcceptance).not.toHaveBeenCalled();
    } finally {
      artifactStateRow.stage_key = originalStageKey;
    }
  });

  it("rejects an unregistered artifact code with a contract-not-found 404, before any DB lookups", async () => {
    const res = await POST(request({ approvalRationale: "x" }), {
      params: Promise.resolve({
        eventId: "11111111-1111-1111-1111-111111111111",
        artifactCode: "not_a_real_code",
      }),
    });
    expect(res.status).toBe(404);
    const json = (await res.json()) as { error?: string };
    expect(json.error).toBe("unsupported_artifact");
    expect(insertArtifactAcceptance).not.toHaveBeenCalled();
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
    const res = await POST(request({ approvalRationale: "x" }), {
      params: Promise.resolve({
        eventId: "11111111-1111-1111-1111-111111111111",
        artifactCode: "d99_unlinked",
      }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 403 when the user lacks stage-approval rights", async () => {
    const { loadUserSourceAccessPolicy } = jest.requireMock(
      "@/lib/auth/source-access-policy",
    ) as { loadUserSourceAccessPolicy: jest.Mock };
    loadUserSourceAccessPolicy.mockResolvedValueOnce({
      canApproveSourceStages: false,
      canUploadSourceArtifacts: true,
    });
    const res = await POST(request({ approvalRationale: "x" }), ctx);
    expect(res.status).toBe(403);
    expect(insertArtifactAcceptance).not.toHaveBeenCalled();
  });

  it("returns 403 for a user with upload rights but no approval rights — accept is a stronger claim than upload", async () => {
    // Source integrity fix, 2026-07-23: acceptance previously only checked
    // canUploadSourceArtifacts, the same broad permission as a plain file
    // upload. This proves upload-only rights are no longer sufficient.
    const { loadUserSourceAccessPolicy } = jest.requireMock(
      "@/lib/auth/source-access-policy",
    ) as { loadUserSourceAccessPolicy: jest.Mock };
    loadUserSourceAccessPolicy.mockResolvedValueOnce({
      canApproveSourceStages: false,
      canUploadSourceArtifacts: true,
    });
    const res = await POST(request({ approvalRationale: "x" }), ctx);
    expect(res.status).toBe(403);
    const json = (await res.json()) as { detail?: string };
    expect(json.detail).toMatch(/upload rights alone are not sufficient/i);
    expect(insertArtifactAcceptance).not.toHaveBeenCalled();
  });

  it("surfaces an insert failure as a 500", async () => {
    insertArtifactAcceptance.mockResolvedValueOnce({
      ok: false,
      error: "db down",
    });
    const res = await POST(request({ approvalRationale: "x" }), ctx);
    expect(res.status).toBe(500);
    const json = (await res.json()) as { error?: string; detail?: string };
    expect(json.error).toBe("insert_failed");
    expect(json.detail).toBe("db down");
  });
});
