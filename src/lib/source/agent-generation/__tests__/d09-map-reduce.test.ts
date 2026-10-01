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

  it("keeps the private value brief and decision-owner identity out of vendor section context", async () => {
    const calls: Array<{ system: string; messages: Array<{ content: string }> }> = [];
    const stream = jest.fn((params: { system: string; messages: Array<{ content: string }> }) => {
      calls.push(params);
      return makeStream("## §1 · Executive summary and decision context\n\nVendor instructions.");
    });
    const client = { messages: { stream } } as unknown as AnthropicDirectClient;

    await generateD09ViaMapReduce({
      ctx: makeContext(),
      upstreamBound: {
        d01_strategy_memo: "Scope is managed services.",
        d02_value_target: "Buyer-private 12–15% run-rate improvement target.",
        d05_scope_memo: "Seven service towers are in scope.",
      },
      client,
    });

    expect(calls).toHaveLength(11);
    for (const call of calls) {
      expect(call.messages[0]?.content).not.toContain("Buyer-private 12–15%");
      expect(call.messages[0]?.content).not.toContain("Decision owner: CIO and Procurement Lead");
      expect(call.system).toMatch(/vendor-facing|vendor package/i);
      expect(call.system).toMatch(/internal.*(?:target|planning|metadata)/i);
      expect(call.system).not.toContain("writing for a CIO and their leadership team");
    }
    const commercialCall = calls.find((call) => call.system.includes("§7 ·"));
    expect(commercialCall?.messages[0]?.content).not.toContain("Reference the value-target range");
    const transitionCall = calls.find((call) => call.system.includes("§6 ·"));
    expect(transitionCall?.messages[0]?.content).not.toContain("Use gate-relative target dates");
    const responseCall = calls.find((call) => call.system.includes("§8 ·"));
    expect(responseCall?.messages[0]?.content).not.toContain("Use gate-relative target dates");
    const riskCall = calls.find((call) => call.system.includes("§10 ·"));
    expect(riskCall?.messages[0]?.content).not.toContain("Blocking Gate");
    const registerCall = calls.find((call) => call.system.includes("§11 ·"));
    expect(registerCall?.messages[0]?.content).not.toContain("Gap closure register");
  });

  it("does not send internal scope holds or evidence workflow fields to bidder section calls", async () => {
    const calls: Array<{ messages: Array<{ content: string }> }> = [];
    const stream = jest.fn((params: { messages: Array<{ content: string }> }) => {
      calls.push(params);
      return makeStream("## §1 · Executive summary and decision context\n\nVendor instructions.");
    });
    const ctx = makeContext();
    ctx.event.name = "Internal workflow test with private owner note";
    ctx.evidence = [{
      id: "evidence-1",
      sourceEventId: ctx.event.id,
      tenantKey: ctx.tenantKey,
      stage: "rfp",
      requirementId: "EVID-SRC-RFP-LEGAL-TEMPLATE",
      currentState: "Not Requested",
      sourceArtifactId: null,
      notes: "Release-Hold RH-05: counsel has not approved this package.",
      lastSyncedAt: null,
      createdAt: "2026-09-30T00:00:00Z",
      updatedAt: "2026-09-30T00:00:00Z",
    }];
    ctx.uploadedEvidence = [{
      id: "upload-1",
      originalName: "buyer_private_release_register.csv",
      artifactFamily: "other",
      sourceFormat: "csv",
      parseStatus: "parsed",
      evidenceState: "parsed_uncited",
      stageKey: "rfp",
      chunkExcerpts: ["Internal negotiation target: 12-15%."],
      factSummaries: [],
    }];

    await generateD09ViaMapReduce({
      ctx,
      upstreamBound: {
        d05_scope_memo: "# Scope\n\nRelease-Hold Governing Table\n\nRH-05 blocks external distribution.",
        d04_app_inv: "Internal application owner map.",
      },
      client: { messages: { stream } } as unknown as AnthropicDirectClient,
    });

    expect(calls).toHaveLength(11);
    for (const call of calls) {
      const prompt = call.messages[0]?.content ?? "";
      expect(prompt).not.toMatch(/Release-Hold|RH-05|internal negotiation target/i);
      expect(prompt).not.toContain("buyer_private_release_register.csv");
      expect(prompt).not.toContain("Internal application owner map");
      expect(prompt).not.toContain(ctx.event.name);
      expect(prompt).toContain(ctx.tenantName);
    }
  });

  it("instructs section writers not to infer clinical or compliance scope from a buyer name", async () => {
    const calls: Array<{ system: string; messages: Array<{ content: string }> }> = [];
    const stream = jest.fn((params: { system: string; messages: Array<{ content: string }> }) => {
      calls.push(params);
      return makeStream("## §1 · Executive summary and decision context\n\nNot issued.");
    });
    const ctx = makeContext();
    ctx.tenantName = "Example Health";

    await generateD09ViaMapReduce({
      ctx,
      upstreamBound: {},
      client: { messages: { stream } } as unknown as AnthropicDirectClient,
    });

    expect(calls).toHaveLength(11);
    for (const call of calls) {
      expect(call.system).toMatch(/buyer name.*(?:clinical|patient-facing)/i);
    }
    for (const section of ["§5 ·", "§10 ·"]) {
      const call = calls.find((item) => item.system.includes(section));
      expect(call?.messages[0]?.content).toMatch(/(?:security|compliance|risk).*not issued/i);
    }
  });
});
