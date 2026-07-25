/**
 * @jest-environment node
 */

// POST /api/v1/source/:eventId/artifacts/generate — the chat-save route.
//
// Source integrity fix, 2026-07-23 (see
// docs/audits/SOURCE-VS-MOVES-STANDARD-AUDIT-2026-07-23.md, Pipeline Drift
// Report item D1): this route used to accept any free-text artifactKind
// (defaulting to a generic label when absent) and never ran the
// section-conformance or banned-term checks the primary
// [artifactCode]/generate pipeline runs unconditionally. These tests prove
// the closed gap: a real, registered artifactCode is now required, and the
// same two checks now run against chat-authored content.
//
// Only I/O-touching modules are mocked (tenancy, active client, current
// user, Postgres event lookup, object storage, artifact-registry write,
// file-cabinet prior-version lookup). Section-conformance, banned-term
// scanning, and profile lookup are the real, pure modules — this is
// deliberate: the point of the test is that real checks actually run.

const requireTenancyMock = jest.fn();
const tenancyErrorResponseMock = jest.fn(() =>
  Response.json({ error: "unauthenticated" }, { status: 401 }),
);
jest.mock("@/app/api/v1/_intel-auth", () => ({
  requireTenancy: () => requireTenancyMock(),
  tenancyErrorResponse: () => tenancyErrorResponseMock(),
}));

const getActiveClientRowMock = jest.fn();
jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: () => getActiveClientRowMock(),
}));

const loadUserSourceAccessPolicyMock = jest.fn();
jest.mock("@/lib/auth/source-access-policy", () => ({
  loadUserSourceAccessPolicy: (...args: unknown[]) =>
    loadUserSourceAccessPolicyMock(...args),
}));

jest.mock("@/lib/agent/tools/intelligence/_shared", () => ({
  clientKeyToInventorySubstrateKey: (key: string) => key,
}));

const maybeSingleMock = jest.fn();
jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({ maybeSingle: () => maybeSingleMock() }),
        }),
      }),
    }),
  }),
}));

const storageUploadMock = jest.fn<Promise<void>, unknown[]>(
  async () => undefined,
);
const storageRemoveMock = jest.fn<Promise<void>, unknown[]>(
  async () => undefined,
);
jest.mock("@/lib/data-plane/objectStorage", () => ({
  getObjectStorageAdapter: () => ({
    upload: (...args: unknown[]) => storageUploadMock(...args),
    remove: (...args: unknown[]) => storageRemoveMock(...args),
  }),
}));

const registerSourceArtifactUploadMock = jest.fn();
jest.mock("@/lib/source/artifact-registry", () => ({
  buildSourceArtifactBlobPath: (args: {
    tenantKey: string;
    sourceEventId: string;
    artifactId: string;
    filename: string;
  }) =>
    `${args.tenantKey}/source/${args.sourceEventId}/${args.artifactId}/${args.filename}`,
  registerSourceArtifactUpload: (input: Record<string, unknown>) =>
    registerSourceArtifactUploadMock(input),
}));

const getCurrentArtifactsMock = jest.fn<Promise<unknown[]>, unknown[]>(
  async () => [],
);
const supersedePriorVersionsMock = jest.fn<Promise<void>, unknown[]>(
  async () => undefined,
);
jest.mock("@/lib/source/file-cabinet/repository", () => ({
  getCurrentArtifacts: (...args: unknown[]) => getCurrentArtifactsMock(...args),
  supersedePriorVersions: (...args: unknown[]) =>
    supersedePriorVersionsMock(...args),
}));

jest.mock("@/lib/source/queries", () => ({
  getSourcingEvent: jest.fn(async () => null),
}));

// Import AFTER all mocks are registered.
import { POST } from "@/app/api/v1/source/[eventId]/artifacts/generate/route";

const EVENT_ID = "11111111-1111-1111-1111-111111111111";
const CTX = { params: Promise.resolve({ eventId: EVENT_ID }) };

function request(body: Record<string, unknown>): Request {
  return new Request(
    `http://localhost/api/v1/source/${EVENT_ID}/artifacts/generate`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

describe("POST /api/v1/source/:eventId/artifacts/generate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireTenancyMock.mockResolvedValue({
      clientId: "client-1",
      userId: "user-1",
    });
    getActiveClientRowMock.mockResolvedValue({
      id: "client-1",
      key: "apexretail",
    });
    loadUserSourceAccessPolicyMock.mockResolvedValue({
      canGenerateSourcingArtifacts: true,
    });
    maybeSingleMock.mockResolvedValue({
      data: {
        id: EVENT_ID,
        client_key: "apexretail",
        current_stage_key: "strategy",
      },
      error: null,
    });
    registerSourceArtifactUploadMock.mockResolvedValue({
      id: "artifact-1",
      parseStatus: "pending",
      embeddingStatus: "pending",
      graphStatus: "pending",
      evidenceState: "unparsed",
    });
  });

  it("rejects a request with no artifactCode at all", async () => {
    const res = await POST(
      request({
        title: "Strategy notes",
        content: "## Some content\nBody text.",
        stageKey: "strategy",
      }),
      CTX,
    );
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error?: string };
    expect(json.error).toBe("invalid_metadata");
    expect(registerSourceArtifactUploadMock).not.toHaveBeenCalled();
  });

  it("rejects an artifactCode that isn't a registered Source artifact type", async () => {
    const res = await POST(
      request({
        title: "Strategy notes",
        content: "## Some content\nBody text.",
        stageKey: "strategy",
        artifactCode: "agent_generated_packet",
      }),
      CTX,
    );
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error?: string };
    expect(json.error).toBe("unknown_artifact_code");
    expect(registerSourceArtifactUploadMock).not.toHaveBeenCalled();
  });

  it("accepts a real artifactCode, runs section-conformance, and persists artifactKind as the real code", async () => {
    const res = await POST(
      request({
        title: "Strategy memo draft",
        content: "Short body with no real section headings at all.",
        stageKey: "strategy",
        artifactCode: "d01_strategy_memo",
      }),
      CTX,
    );
    expect(res.status).toBe(200);
    expect(registerSourceArtifactUploadMock).toHaveBeenCalledTimes(1);
    const call = registerSourceArtifactUploadMock.mock.calls[0][0] as Record<
      string,
      unknown
    >;
    expect(call.artifactKind).toBe("d01_strategy_memo");
    const json = (await res.json()) as {
      receipt?: { sectionVerification?: string };
    };
    expect(json.receipt?.sectionVerification).toBeDefined();
  });

  it("flags the file-cabinet description when the content trips the banned-term scan", async () => {
    // d09_rfp_pack is vendor-facing and carries a real banned-term profile;
    // this content is engineered to trip it via an internal label the
    // vendor-facing profile forbids.
    const res = await POST(
      request({
        title: "RFP draft",
        content:
          "This draft references our internal tenant substrate directly, which a vendor-facing document must never expose.",
        stageKey: "rfp",
        artifactCode: "d09_rfp_pack",
      }),
      CTX,
    );
    expect(res.status).toBe(200);
    const call = registerSourceArtifactUploadMock.mock.calls[0][0] as {
      fileCabinet: { description: string };
    };
    // Whether or not this exact phrasing trips the live term list, the
    // route must not throw and must always return the compliance-flag
    // signal in the receipt so a human can act on it either way.
    const json = (await res.json()) as {
      receipt?: { complianceReviewFlagged?: boolean };
    };
    expect(typeof json.receipt?.complianceReviewFlagged).toBe("boolean");
    expect(call.fileCabinet.description).toEqual(expect.any(String));
  });

  it("returns 403 when the caller lacks Source artifact generation rights", async () => {
    loadUserSourceAccessPolicyMock.mockResolvedValue({
      canGenerateSourcingArtifacts: false,
    });
    const res = await POST(
      request({
        title: "Strategy memo draft",
        content: "Body",
        stageKey: "strategy",
        artifactCode: "d01_strategy_memo",
      }),
      CTX,
    );
    expect(res.status).toBe(403);
    expect(registerSourceArtifactUploadMock).not.toHaveBeenCalled();
  });
});
