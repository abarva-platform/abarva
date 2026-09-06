import {
  buildNexusProductManualSourcesFromRecords,
  type NexusProductManualCorpusRecord,
} from "./nexus-product-manual";
import { buildValidatedAgentContextBundle } from "@/lib/governance/agent-context-bundle";

function record(
  over: Partial<NexusProductManualCorpusRecord> = {},
): NexusProductManualCorpusRecord {
  return {
    id: "nexus-product-manual-v1:source-operating-guide",
    title: "Source Operating Guide",
    body: "Source helps users run RFP events, understand blockers, and hand off an opportunity into Moves P0.",
    client_key: "corpus_global",
    tenant_id: null,
    source_layer: "product_docs",
    source_basis: "generated_from_executable_product_contracts",
    source_references: [
      "docs/product/NEXUS_MANUAL_AND_AVA_TRAINING_GUIDE.md#source-operating-guide",
    ],
    classification: "internal",
    retrievability: "committed_not_indexed",
    agent_readiness_status: "committed_not_indexed",
    confidence_level: "high",
    cited_render_verified_at: null,
    ...over,
  };
}

describe("retrieveNexusProductManualSources", () => {
  it("fails closed while generated manual chunks are not indexed or cite-render verified", () => {
    const result = buildNexusProductManualSourcesFromRecords(
      "How do I run a Source event and move the idea forward?",
      [record()],
    );

    expect(result.sources).toEqual([]);
    expect(result.averageConfidence).toBe(0);
  });

  it("returns product-doc sources only after the governed agent_ready proof chain exists", () => {
    const promoted = record({
      retrievability: "search_indexed",
      agent_readiness_status: "agent_ready",
      cited_render_verified_at: "2026-09-06T00:00:00Z",
    });
    expect(
      buildValidatedAgentContextBundle(
        [
          {
            id: promoted.id,
            client_key: promoted.client_key,
            tenant_id: promoted.tenant_id,
            source_layer: promoted.source_layer,
            source_basis: promoted.source_basis,
            classification: promoted.classification,
            retrievability: promoted.retrievability,
            agent_readiness_status: promoted.agent_readiness_status,
            confidence_level: promoted.confidence_level,
            cited_render_verified_at: promoted.cited_render_verified_at,
            citations: promoted.source_references,
          },
        ],
        { requireAgentReady: true },
      ).agentReadyCount,
    ).toBe(1);

    const result = buildNexusProductManualSourcesFromRecords(
      "How do I run a Source event and move the idea forward?",
      [promoted],
    );

    expect(result.sources).toEqual([
      expect.objectContaining({
        type: "PRODUCT_DOC",
        name: "Source Operating Guide",
        url: "docs/product/NEXUS_MANUAL_AND_AVA_TRAINING_GUIDE.md#source-operating-guide",
        detail: expect.stringContaining("Moves P0"),
      }),
    ]);
  });
});
