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

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: jest.fn(() => ({
    from: (table: string) => {
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
  })),
}));

const storageUpload = jest.fn(async () => undefined);
const storageRemove = jest.fn(async () => undefined);
jest.mock("@/lib/data-plane/objectStorage", () => ({
  getObjectStorageAdapter: jest.fn(() => ({
    upload: storageUpload,
    remove: storageRemove,
  })),
}));

const registerSourceArtifactUpload = jest.fn(async (input: unknown) => ({
  id: "artifact-1",
  originalName: (input as { originalName: string }).originalName,
}));
jest.mock("@/lib/source/artifact-registry", () => ({
  isAllowedSourceArtifactMimeType: (mime: string) =>
    ["text/plain", "text/markdown"].includes(mime),
  isWithinSourceArtifactSizeLimit: (size: number) => size <= 50_000_000,
  MAX_SOURCE_ARTIFACT_SIZE_BYTES: 50_000_000,
  buildSourceArtifactBlobPath: (args: { artifactId: string }) =>
    `apexretail/event-1/${args.artifactId}/proposal.txt`,
  registerSourceArtifactUpload: (input: unknown) =>
    registerSourceArtifactUpload(input),
}));

jest.mock("@/lib/source/artifact-registry/upload-contract", () => ({
  sourceArtifactFormatFromMime: () => "txt",
}));

const extractSourceUploadText = jest.fn(async (input: unknown) => {
  void input;
  return {
    text: "Price: $120,000/year\nSLA: 99.9% uptime",
    method: "text",
    warnings: [] as string[],
  };
});
jest.mock("@/lib/source/artifact-registry/upload-text-extraction", () => ({
  extractSourceUploadText: (input: unknown) => extractSourceUploadText(input),
}));

const insertVendorProposalFacts = jest.fn(
  async (identity: unknown, inputs: unknown[]) => ({
    ok: true,
    records: inputs.map((input, index) => ({
      id: `fact-${index + 1}`,
      ...(input as Record<string, unknown>),
    })),
  }),
);
const getAuthoritativeVendorProposalFacts = jest.fn<
  Promise<unknown[]>,
  [unknown, unknown]
>(async () => []);
jest.mock("@/lib/source/vendor-proposals/vendor-proposal-facts", () => ({
  insertVendorProposalFacts: (identity: unknown, inputs: unknown[]) =>
    insertVendorProposalFacts(identity, inputs),
  getAuthoritativeVendorProposalFacts: (identity: unknown, input: unknown) =>
    getAuthoritativeVendorProposalFacts(identity, input),
}));

import { POST } from "../route";

function fakeFile(
  name: string,
  type: string,
  content: string,
  size?: number,
): File {
  const bytes = new Uint8Array(Buffer.from(content, "utf8"));
  return {
    name,
    type,
    size: size ?? bytes.length,
    arrayBuffer: async () => bytes.buffer,
  } as unknown as File;
}

function requestWithFormData(entries: Record<string, unknown>): Request {
  return {
    formData: async () => ({
      get: (key: string) => entries[key] ?? null,
    }),
  } as unknown as Request;
}

const ctx = {
  params: Promise.resolve({
    eventId: "11111111-1111-1111-1111-111111111111",
    vendorKey: "vendor-a",
  }),
};

beforeEach(() => {
  jest.clearAllMocks();
  extractSourceUploadText.mockResolvedValue({
    text: "Price: $120,000/year\nSLA: 99.9% uptime",
    method: "text",
    warnings: [],
  });
  getAuthoritativeVendorProposalFacts.mockResolvedValue([]);
  insertVendorProposalFacts.mockImplementation(async (_identity, inputs) => ({
    ok: true,
    records: (inputs as unknown[]).map((input, index) => ({
      id: `fact-${index + 1}`,
      ...(input as Record<string, unknown>),
    })),
  }));
  registerSourceArtifactUpload.mockImplementation(async (input) => ({
    id: "artifact-1",
    originalName: (input as { originalName: string }).originalName,
  }));
});

describe("POST /api/v1/source/:eventId/vendor-proposals/:vendorKey/ingest", () => {
  it("rejects a missing vendorKey", async () => {
    const res = await POST(requestWithFormData({}), {
      params: Promise.resolve({
        eventId: "11111111-1111-1111-1111-111111111111",
        vendorKey: "",
      }),
    });
    expect(res.status).toBe(400);
  });

  it("rejects a missing file", async () => {
    const res = await POST(requestWithFormData({}), ctx);
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error?: string };
    expect(json.error).toBe("missing_file");
  });

  it("rejects an unsupported mime type — malformed/unsupported content", async () => {
    const res = await POST(
      requestWithFormData({
        file: fakeFile("proposal.exe", "application/x-msdownload", "junk"),
      }),
      ctx,
    );
    expect(res.status).toBe(415);
    expect(insertVendorProposalFacts).not.toHaveBeenCalled();
  });

  it("ingests a proposal and extracts real candidate facts, tagged with the real vendorKey", async () => {
    const res = await POST(
      requestWithFormData({
        file: fakeFile(
          "proposal.txt",
          "text/plain",
          "Price: $120,000/year\nSLA: 99.9% uptime",
        ),
      }),
      ctx,
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      ok: boolean;
      candidateFactsInserted: number;
    };
    expect(json.ok).toBe(true);
    expect(json.candidateFactsInserted).toBe(2);
    expect(insertVendorProposalFacts).toHaveBeenCalledWith(
      expect.objectContaining({ tenantKey: "apexretail" }),
      expect.arrayContaining([
        expect.objectContaining({
          vendorKey: "vendor-a",
          factKey: "price",
          valueNumeric: 120000,
          sourceEventId: "11111111-1111-1111-1111-111111111111",
          supersedesFactId: null,
        }),
      ]),
    );
  });

  it("persists rich proposal dimensions from a long-form response package", async () => {
    extractSourceUploadText.mockResolvedValueOnce({
      text: [
        "Page 12 - Scope: Manage data-platform run operations, reporting marts, and production support.",
        "Page 18 - Solution architecture: Private lakehouse pattern with API gateway, dbt semantic layer, observability, and controlled AI assistant support.",
        "Page 22 - AI automation: AIOps triage accelerator targets 15% ticket deflection after a measured baseline.",
        "Page 29 - Accelerators: Reusable migration factory, data-quality rule pack, and KPI starter mart.",
        "Page 41 - SLA: 99.7% availability with service credits capped at 5%.",
        "Page 55 - Transition: 120-day plan with milestone holdbacks and runbook acceptance.",
        "Page 63 - Exceptions: Vendor excludes legacy mainframe feed remediation from fixed fee.",
        "Page 70 - Price: USD 14,800,000 annual run-rate.",
      ].join("\n"),
      method: "text",
      warnings: [],
    });

    const res = await POST(
      requestWithFormData({
        file: fakeFile("vendor-alpha-92-page-response.txt", "text/plain", ""),
      }),
      ctx,
    );

    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      ok: boolean;
      candidateFactsInserted: number;
    };
    expect(json.ok).toBe(true);
    expect(json.candidateFactsInserted).toBeGreaterThanOrEqual(8);
    expect(insertVendorProposalFacts).toHaveBeenCalledWith(
      expect.objectContaining({ tenantKey: "apexretail" }),
      expect.arrayContaining([
        expect.objectContaining({
          vendorKey: "vendor-a",
          factKey: "solution_architecture",
          sectionKey: "solution_architecture",
          sourceQuote: expect.stringMatching(/Private lakehouse pattern/i),
        }),
        expect.objectContaining({
          vendorKey: "vendor-a",
          factKey: "automation_productivity",
          sectionKey: "automation_productivity",
          valueNumeric: 15,
          unit: "percent",
        }),
        expect.objectContaining({
          vendorKey: "vendor-a",
          factKey: "accelerator",
          sectionKey: "innovation_value_add",
        }),
        expect.objectContaining({
          vendorKey: "vendor-a",
          factKey: "exception",
          sectionKey: "exceptions_redlines",
        }),
      ]),
    );
  });

  it("registers zero candidates for garbled/empty extracted text — never crashes", async () => {
    extractSourceUploadText.mockResolvedValueOnce({
      text: "",
      method: "unsupported",
      warnings: ["no text extracted"],
    });
    const res = await POST(
      requestWithFormData({
        file: fakeFile("blank.txt", "text/plain", ""),
      }),
      ctx,
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { candidateFactsInserted: number };
    expect(json.candidateFactsInserted).toBe(0);
  });

  it("stamps supersedesFactId on a re-upload that conflicts with an already-accepted fact — duplicate/re-upload behavior", async () => {
    getAuthoritativeVendorProposalFacts.mockResolvedValueOnce([
      {
        id: "fact-old",
        clientKey: "apexretail",
        sourceEventId: "11111111-1111-1111-1111-111111111111",
        vendorKey: "vendor-a",
        proposalArtifactId: "artifact-old",
        factKey: "price",
        sectionKey: null,
        pageOrLocation: "line 1",
        valueNumeric: 100000,
        valueText: null,
        unit: "year",
        currency: "USD",
        effectivePeriodStart: null,
        effectivePeriodEnd: null,
        sourceQuote: "Price: $100,000/year",
        sourcePointer: null,
        confidence: "low",
        extractionMethod: "parsed_text",
        supersedesFactId: null,
        createdBy: "clerk-user-1",
        createdAt: "2026-07-20T00:00:00.000Z",
      },
    ]);
    const res = await POST(
      requestWithFormData({
        file: fakeFile(
          "proposal-revised.txt",
          "text/plain",
          "Price: $120,000/year",
        ),
      }),
      ctx,
    );
    expect(res.status).toBe(200);
    expect(insertVendorProposalFacts).toHaveBeenCalledWith(
      expect.objectContaining({ tenantKey: "apexretail" }),
      expect.arrayContaining([
        expect.objectContaining({
          factKey: "price",
          supersedesFactId: "fact-old",
        }),
      ]),
    );
  });

  it("returns 403 when the user lacks upload rights", async () => {
    const { loadUserSourceAccessPolicy } = jest.requireMock(
      "@/lib/auth/source-access-policy",
    ) as { loadUserSourceAccessPolicy: jest.Mock };
    loadUserSourceAccessPolicy.mockResolvedValueOnce({
      canApproveSourceStages: false,
      canUploadSourceArtifacts: false,
    });
    const res = await POST(
      requestWithFormData({
        file: fakeFile("proposal.txt", "text/plain", "Price: $1/year"),
      }),
      ctx,
    );
    expect(res.status).toBe(403);
    expect(registerSourceArtifactUpload).not.toHaveBeenCalled();
  });

  it("returns 404 when the event does not resolve for this tenant — cross-tenant denial", async () => {
    const { getActiveClientRow } = jest.requireMock("@/lib/active-client") as {
      getActiveClientRow: jest.Mock;
    };
    getActiveClientRow.mockResolvedValueOnce({ key: "meridian" });
    const res = await POST(
      requestWithFormData({
        file: fakeFile("proposal.txt", "text/plain", "Price: $1/year"),
      }),
      ctx,
    );
    expect(res.status).toBe(404);
    expect(registerSourceArtifactUpload).not.toHaveBeenCalled();
  });
});
