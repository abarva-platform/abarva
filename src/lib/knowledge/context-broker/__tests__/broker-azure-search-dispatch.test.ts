/**
 * Broker dispatch test — `retrieval_azure_search` flag routes the
 * vector-retrieval call between pgvector (default) and Azure AI Search.
 *
 * The dispatch decision lives inside `DefaultContextBroker.assemble`;
 * this test pins both branches by mocking `isFeatureEnabled` and the
 * Azure retriever seam directly. The pgvector path stays first-class —
 * flag-off means the broker behaves exactly as before.
 */

import {
  DefaultContextBroker,
  azureSearchRetrievalInfoTag,
  vectorRetrievalInfoTag,
  type AzureSearchTenantContextRetriever,
} from "..";
import type { OpenAIEmbeddingsLike } from "../embedding-client";
import type { TenantDataAdapter } from "@/lib/knowledge/tenant-data";
import type { ContextChunk } from "@/lib/knowledge/tenant-data/types";

jest.mock("server-only", () => ({}));

// Mock the flag module so we can flip the dispatch decision per-test
// without mutating the registry's frozen const exports.
jest.mock("@/lib/features/is-feature-enabled", () => ({
  isFeatureEnabled: jest.fn().mockReturnValue(false),
}));

import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";

const flagMock = isFeatureEnabled as unknown as jest.MockedFunction<
  typeof isFeatureEnabled
>;

const EMBED_DIM = 1536;

function fakeOpenAI(): OpenAIEmbeddingsLike {
  return {
    embeddings: {
      create: jest.fn(async () => ({
        data: [
          { embedding: new Array<number>(EMBED_DIM).fill(0.001), index: 0 },
        ],
        usage: { prompt_tokens: 1, total_tokens: 1 },
      })),
    },
  };
}

function fakeAdapter(
  opts: {
    onVector?: jest.Mock;
    onKeyword?: jest.Mock;
  } = {},
): TenantDataAdapter {
  const adapter = {
    listSegments: jest.fn(async () => []),
    listRecords: jest.fn(async () => []),
    getRecord: jest.fn(async () => null),
    listGraphNodes: jest.fn(async () => []),
    listGraphEdgesForNode: jest.fn(async () => []),
    getGraphNeighborhood: jest.fn(async () => ({
      rootId: "x",
      nodes: [],
      edges: [],
      depth: 0,
    })),
    pathBetween: jest.fn(async () => null),
    listContextChunks: jest.fn(async () => []),
    chunksByRecord: jest.fn(async () => []),
    chunksByKeyword: opts.onKeyword ?? jest.fn(async () => []),
    chunksByVector: opts.onVector ?? jest.fn(async () => []),
    getEvidence: jest.fn(async () => null),
    hasPersistedData: jest.fn(async () => true),
  };
  return adapter as unknown as TenantDataAdapter;
}

describe("Broker · Azure AI Search dispatch", () => {
  beforeEach(() => {
    flagMock.mockReset();
  });

  it("routes through Azure when the flag is on; pgvector is not called", async () => {
    flagMock.mockReturnValue(true);

    const azureRetriever = jest.fn<
      ReturnType<AzureSearchTenantContextRetriever>,
      Parameters<AzureSearchTenantContextRetriever>
    >(async (args) => [
      {
        tenantKey: args.tenantClientKey,
        chunkId: "azure-chunk-1",
        text: "azure result",
        embeddingStatus: "embedded",
        vectorScore: 0.83,
      },
    ]);

    const onVector = jest.fn(async () => []);
    const adapter = fakeAdapter({ onVector });

    const broker = new DefaultContextBroker(
      adapter,
      fakeOpenAI(),
      undefined,
      azureRetriever as unknown as AzureSearchTenantContextRetriever,
    );
    const bundle = await broker.assemble({
      query: "forecast accuracy",
      tenantKey: "apex-retail",
      mode: "tenant",
    });

    expect(azureRetriever).toHaveBeenCalledTimes(1);
    expect(azureRetriever.mock.calls[0]?.[0]).toMatchObject({
      tenantClientKey: "apex-retail",
    });
    expect(onVector).not.toHaveBeenCalled();
    expect(bundle.semanticChunks).toHaveLength(1);
    expect(bundle.semanticChunks[0]?.chunk.chunkId).toBe("azure-chunk-1");
    expect(bundle.infoTags).toContain(azureSearchRetrievalInfoTag(8));
    // The pgvector info tag must NOT be set when Azure handled retrieval.
    expect(bundle.infoTags).not.toContain(vectorRetrievalInfoTag(8));
  });

  it("routes through pgvector when the flag is off; Azure is not called", async () => {
    flagMock.mockReturnValue(false);

    const azureRetriever = jest.fn(async () => []);
    const onVector = jest.fn(async () => []);
    const adapter = fakeAdapter({ onVector });

    const broker = new DefaultContextBroker(
      adapter,
      fakeOpenAI(),
      undefined,
      azureRetriever as unknown as AzureSearchTenantContextRetriever,
    );
    await broker.assemble({
      query: "forecast accuracy",
      tenantKey: "apex-retail",
      mode: "tenant",
    });

    expect(azureRetriever).not.toHaveBeenCalled();
    expect(onVector).toHaveBeenCalledTimes(1);
  });

  it("falls back to pgvector when the Azure retriever throws (rollout safety)", async () => {
    flagMock.mockReturnValue(true);

    const azureRetriever = jest.fn(async () => {
      throw new Error("azure_search_unreachable");
    });
    const vectorChunk: ContextChunk = {
      tenantKey: "apex-retail",
      chunkId: "pgvector-chunk-1",
      text: "pgvector result",
      embeddingStatus: "embedded",
      vectorScore: 0.79,
    };
    const onVector = jest.fn(async () => [vectorChunk]);
    const adapter = fakeAdapter({ onVector });

    const broker = new DefaultContextBroker(
      adapter,
      fakeOpenAI(),
      undefined,
      azureRetriever as unknown as AzureSearchTenantContextRetriever,
    );
    const bundle = await broker.assemble({
      query: "forecast accuracy",
      tenantKey: "apex-retail",
      mode: "tenant",
    });

    expect(azureRetriever).toHaveBeenCalledTimes(1);
    expect(onVector).toHaveBeenCalledTimes(1);
    expect(bundle.semanticChunks).toHaveLength(1);
    expect(bundle.semanticChunks[0]?.chunk.chunkId).toBe("pgvector-chunk-1");
    // The pgvector tag is what surfaces, not the Azure tag.
    expect(bundle.infoTags).toContain(vectorRetrievalInfoTag(8));
    expect(bundle.infoTags).not.toContain(azureSearchRetrievalInfoTag(8));
  });
});
