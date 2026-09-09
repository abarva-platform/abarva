const updateArtifactBody = jest.fn(async (input: unknown) => ({
  ok: true,
  data: {
    id: "state-1",
    source_event_id: "11111111-1111-1111-1111-111111111111",
    tenant_key: "meridian-health",
    artifact_code: "d13_vendor_responses",
    stage_key: "responses",
    status: "approved",
    ...(input as { columns?: Record<string, unknown> }).columns,
  },
}));

jest.mock("@/app/api/v1/_intel-auth", () => ({
  requireTenancy: jest.fn(async () => ({
    clientId: "client-1",
    clientKey: "meridian-health",
    userId: "user-1",
  })),
  tenancyErrorResponse: jest.fn(() => Response.json({}, { status: 500 })),
}));

jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: jest.fn(async () => ({
    id: "client-1",
    key: "meridian-health",
  })),
}));

jest.mock("@/lib/agent/tools/intelligence/_shared", () => ({
  clientKeyToInventorySubstrateKey: jest.fn((value: string) => value),
}));

jest.mock("@/lib/data-plane/objectStorage", () => ({
  getObjectStorageAdapter: jest.fn(() => ({
    upload: jest.fn(async () => undefined),
    remove: jest.fn(async () => undefined),
  })),
}));

function fluentClient() {
  return {
    from(table: string) {
      const filters: Record<string, unknown> = {};
      const chain: Record<string, unknown> = {
        select: () => chain,
        update: () => chain,
        eq: (key: string, value: unknown) => {
          filters[key] = value;
          return chain;
        },
        neq: () => chain,
        maybeSingle: async () => {
          if (table === "source_events") {
            return {
              data: {
                id: "11111111-1111-1111-1111-111111111111",
                client_key: "meridian-health",
              },
              error: null,
            };
          }
          if (table === "source_event_artifact_states") {
            return {
              data: {
                id: "state-1",
                source_event_id: "11111111-1111-1111-1111-111111111111",
                tenant_key: "meridian-health",
                artifact_code: "d13_vendor_responses",
                artifact_family: "proposal",
                stage_key: "responses",
                status: "draft",
                tier: "outline",
                body: "stale generated body",
                body_generation_metadata: {},
                linked_artifact_id: "generated-1",
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

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: jest.fn(() => fluentClient()),
  getAzureWriteFluentClient: jest.fn(() => fluentClient()),
}));

jest.mock("@/lib/data-plane/write-adapters/sourceWriteAdapter", () => ({
  selectSourceWriteAdapter: jest.fn(() => ({
    updateArtifactBody,
    insertActivityLog: jest.fn(async () => ({ ok: true })),
  })),
}));

jest.mock("@/lib/source/artifact-registry", () => ({
  buildSourceArtifactBlobPath: jest.fn(() => "meridian/final.html"),
  isAllowedSourceArtifactMimeType: jest.fn(() => true),
  isWithinSourceArtifactSizeLimit: jest.fn(() => true),
  MAX_SOURCE_ARTIFACT_SIZE_BYTES: 1000000,
  registerSourceArtifactUpload: jest.fn(async () => ({
    id: "final-1",
    originalName: "response-pack.html",
    version: 2,
  })),
}));

jest.mock("@/lib/source/artifact-registry/upload-contract", () => ({
  sourceArtifactFormatFromMime: jest.fn(() => "html"),
}));

jest.mock("@/lib/source/artifact-registry/upload-text-extraction", () => ({
  extractSourceUploadText: jest.fn(async () => ({
    text: "Authoritative client-final response evidence",
    method: "text",
    warnings: [],
  })),
}));

jest.mock("@/lib/source/file-cabinet/repository", () => ({
  listSourceArtifacts: jest.fn(async () => [
    {
      id: "generated-1",
      artifactType: "d13_vendor_responses",
      artifactGroup: "generated",
      originalName: "generated.docx",
      version: 1,
    },
  ]),
  supersedePriorVersions: jest.fn(async () => undefined),
}));

jest.mock("@/lib/source/client-final-artifacts", () => ({
  CLIENT_FINAL_GOVERNANCE_MESSAGE: "Client final is authoritative.",
  buildClientFinalChangeSummary: jest.fn(() => "Client final accepted."),
  resolveAuthoritativeArtifact: jest.fn((rows: unknown[]) => rows[0] ?? null),
}));

jest.mock("@/lib/source/canonical-specs", () => ({
  specByCode: jest.fn(() => ({ name: "Vendor Response Pack" })),
}));

jest.mock("@/lib/security/sensitive-upload-guard", () => ({
  evaluateSensitiveUpload: jest.fn(() => ({ decision: "allow" })),
  sensitiveUploadRejectedResponse: jest.fn(),
}));

import { POST } from "../route";

describe("client-final artifact body landing", () => {
  beforeEach(() => jest.clearAllMocks());

  it("replaces the generated body with text extracted from the authoritative client final", async () => {
    const form = new FormData();
    form.set(
      "file",
      new File(["<h1>Final</h1>"], "response-pack.html", {
        type: "text/html",
      }),
    );
    const response = await POST(new Request("http://localhost", {
      method: "POST",
      body: form,
    }), {
      params: Promise.resolve({
        eventId: "11111111-1111-1111-1111-111111111111",
        artifactCode: "d13_vendor_responses",
      }),
    });

    expect(response.status).toBe(200);
    expect(updateArtifactBody).toHaveBeenCalledWith({
      artifactRowId: "state-1",
      columns: expect.objectContaining({
        body: "Authoritative client-final response evidence",
        body_format: "markdown",
        body_authored_by: "user-1",
        status: "approved",
      }),
    });
  });
});
