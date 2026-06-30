import type { AnthropicDirectClient } from "@/lib/integrations/ai-egress";
import { generateD09ViaMapReduce } from "../d09-map-reduce";
import type { SourceGenerationContext } from "../types";

function makeContext(): SourceGenerationContext {
  return {
    tenantKey: "lakeshore",
    tenantName: "Lakeshore Holdings",
    event: {
      id: "event-1",
      code: "LAKE-IT-OUTSOURCING-RESPONSE-2026",
      name: "IT Outsourcing Response Control Demo",
      archetype: "managed_service",
      rigor: "strategic",
      currentStageKey: "rfp",
      statusLabel: "Active",
      owner: "CIO and Procurement Lead",
      triggerDescription: "Prepare an IT outsourcing RFP.",
      scopeDescription: "Managed services response control.",
      estimatedValueUsd: 75_000_000,
    },
    artifactStates: [],
    gateCriteria: [],
    evidence: [],
    uploadedEvidence: [],
  };
}

function makeStream(text: string, outputTokens = 42) {
  return {
    async *[Symbol.asyncIterator]() {
      yield {
        type: "content_block_delta",
        delta: { type: "text_delta", text },
      };
    },
    finalMessage: jest.fn(async () => ({
      usage: { output_tokens: outputTokens },
    })),
  };
}

describe("D09 RFP map-reduce generation", () => {
  it("streams every Anthropic section and assembly call instead of using long non-streaming requests", async () => {
    const create = jest.fn(() => {
      throw new Error("messages.create must not be used for D09 map-reduce");
    });
    const stream = jest.fn((params: { system?: string }) => {
      if (params.system?.includes("single section")) {
        const heading =
          params.system.match(/heading: ## ([^\n]+)/)?.[1] ??
          "§X · Missing heading";
        return makeStream(`## ${heading}\n\nGenerated section.`);
      }
      return makeStream(
        "## §1 · Executive summary and decision context\n\nGenerated executive summary.",
      );
    });
    const client = {
      messages: {
        create,
        stream,
      },
    } as unknown as AnthropicDirectClient;

    const result = await generateD09ViaMapReduce({
      ctx: makeContext(),
      upstreamBound: {
        d01_strategy_memo: "# Strategy\n\nApproved strategy.",
        d05_scope_memo: "# Scope\n\nApproved scope.",
      },
      client,
    });

    expect(create).not.toHaveBeenCalled();
    expect(stream).toHaveBeenCalledTimes(11);
    expect(result.failedSections).toEqual([]);
    expect(result.body).toContain(
      "## §1 · Executive summary and decision context",
    );
    expect(result.body).toContain(
      "## §8 · Vendor response instructions and mandatory submission tables",
    );
    expect(result.tokensTotal).toBe(11 * 42);
  });
});
