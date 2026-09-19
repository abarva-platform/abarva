const maybeSingle = jest.fn();
const select = jest.fn();

jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: {
    maybeSingle: (...args: unknown[]) => maybeSingle(...args),
    select: (...args: unknown[]) => select(...args),
  },
}));

jest.mock("@/lib/atlas/composition/compose", () => ({
  composeAtlasIacAnswer: jest.fn().mockResolvedValue(null),
}));

import { assembleRetrievalContext } from "@/lib/agent/retrieval";

describe("assembleRetrievalContext Azure context reads", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("resolves the tenant and classifies governed chunks into retrieval lanes", async () => {
    maybeSingle.mockResolvedValue({
      tenant_key: "tenant-example",
      slug: "tenant-example",
    });
    select.mockResolvedValue([
      {
        chunk_text: "Renewal evidence for the vendor agreement.",
        source_doc: "contract-register",
        source_segment_id: "vendor_contracts",
        chunk_index: 2,
        chunk_metadata: { license_class: "internal" },
        provenance: { publisher: "Contract operations" },
        embedded_at: "2026-09-01T00:00:00.000Z",
      },
      {
        chunk_text: "Industry renewal practices and negotiation patterns.",
        source_doc: "industry-brief",
        source_segment_id: "industry_context",
        chunk_index: 0,
        chunk_metadata: {},
        provenance: { attribution: "Published benchmark brief" },
        embedded_at: "2026-09-02T00:00:00.000Z",
      },
      {
        chunk_text: "Compliance review required before renewal approval.",
        source_doc: "control-register",
        source_segment_id: "compliance",
        chunk_index: 4,
        chunk_metadata: {},
        provenance: {},
        embedded_at: "2026-09-03T00:00:00.000Z",
      },
    ]);

    const context = await assembleRetrievalContext({
      clientId: "client-123",
      industry: "GENERAL",
      userQuery: "What renewal evidence supports the vendor decision?",
    });

    expect(maybeSingle).toHaveBeenCalledWith({
      table: "clients",
      columns: ["tenant_key", "slug"],
      where: { id: "client-123" },
      missingTable: "empty",
    });
    expect(select).toHaveBeenCalledWith(
      expect.objectContaining({
        table: "enterprise_context_chunks",
        where: expect.objectContaining({ tenant_key: "tenant-example" }),
        missingTable: "empty",
      }),
    );
    expect(context.clientChunks.map((chunk) => chunk.sourceKey)).toEqual([
      "contract-register",
    ]);
    expect(context.industryChunks.map((chunk) => chunk.sourceKey)).toEqual([
      "industry-brief",
    ]);
    expect(context.topicChunks.map((chunk) => chunk.sourceKey)).toEqual([
      "control-register",
    ]);
  });

  it("fails closed to empty chunks when the governed chunk read is unavailable", async () => {
    maybeSingle.mockResolvedValue({
      tenant_key: "tenant-example",
      slug: "tenant-example",
    });
    select.mockRejectedValue(new Error("context store unavailable"));

    await expect(
      assembleRetrievalContext({
        clientId: "client-123",
        userQuery: "Show supporting evidence",
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        clientChunks: [],
        industryChunks: [],
        topicChunks: [],
      }),
    );
  });

  it("does not query tenant chunks when no client identity is supplied", async () => {
    const context = await assembleRetrievalContext({
      userQuery: "Show supporting evidence",
    });

    expect(maybeSingle).not.toHaveBeenCalled();
    expect(select).not.toHaveBeenCalled();
    expect(context.clientChunks).toEqual([]);
    expect(context.industryChunks).toEqual([]);
    expect(context.topicChunks).toEqual([]);
  });
});
