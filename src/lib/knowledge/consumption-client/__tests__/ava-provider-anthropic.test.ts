/**
 * AnthropicAvaReasoningProvider — the thin client for the real Claude-backed
 * fixture aVa path. This class deliberately contains NO model-calling code
 * (see ava-provider.ts's module header for why); it only fetches
 * /api/knowledge/fixture-ava and shapes the response. These tests mock
 * `fetch` (via the injectable `fetchImpl` option) and verify: the client-side
 * pre-refusal on empty scope (no network call at all), correct request
 * shaping, pass-through of answered/refused responses, and graceful
 * conversion of network/HTTP failures into a clean refusal rather than a
 * throw.
 *
 * The real grounding + Claude-calling discipline (evidence-ref scoping,
 * citation verification, refusal-on-empty-scope) lives server-side in
 * consumption-server/fixture-ava.ts and is covered by a live, real-API smoke
 * run documented in the task report (not part of the CI-safe suite here,
 * since it costs real API calls).
 */

import type {
  AvaAnswer,
  AvaKnowledgePacket,
} from "../../consumption-contracts";
import {
  AnthropicAvaReasoningProvider,
  DeterministicAvaReasoningProvider,
  NullAvaReasoningProvider,
} from "../ava-provider";
import { createFixtureRuntime } from "../factory";

function basePacket(
  overrides: Partial<AvaKnowledgePacket> = {},
): AvaKnowledgePacket {
  return {
    tenantKey: "fixture-airline-demo-new",
    knowledgeBaselineRef: "kb-test",
    domainPublicationVersions: {},
    consumptionProjectionVersions: {},
    cubeSemanticModelVersion: null,
    mode: "explore",
    lens: "none",
    depth: "analytical",
    currentTargetScope: "current",
    focalEntityRefs: [],
    activeFilters: {},
    permissionBoundaryRef: "tenant:fixture-airline-demo-new",
    executivePerspectiveRefs: [],
    acceptedFactRefs: [],
    relationshipEdgeRefs: [],
    metricQueryHashes: [],
    evidenceRefs: [],
    knownGapRefs: [],
    blockedSourceRefs: [],
    ...overrides,
  };
}

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe("AnthropicAvaReasoningProvider (thin fetch client)", () => {
  it("isAvailable() is optimistically true (real availability is resolved server-side per-call)", () => {
    const provider = new AnthropicAvaReasoningProvider(
      "fixture-airline-demo-new",
      "normal",
    );
    expect(provider.isAvailable()).toBe(true);
  });

  it("refuses without any network call when the packet scope is empty", async () => {
    const fetchImpl = jest.fn();
    const provider = new AnthropicAvaReasoningProvider(
      "fixture-airline-demo-new",
      "normal",
      {
        fetchImpl,
      },
    );
    const answer = await provider.ask({
      intent: "explain",
      question: "Tell me anything.",
      packet: basePacket(),
    });
    expect(answer.outcome).toBe("refused");
    expect(answer.refusalReason).toMatch(/does not estimate/i);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("POSTs the expected shape to /api/knowledge/fixture-ava and returns the parsed answer", async () => {
    const serverAnswer: AvaAnswer = {
      outcome: "answered",
      sections: [
        {
          heading: "Vendor spend",
          body: "Vendor A spends $10M.",
          evidenceRefs: ["ev-1"],
        },
      ],
      evidenceRefs: ["ev-1"],
      limitations: [],
      whatWouldChangeIt: [],
      refusalReason: null,
      promoted: false,
    };
    const fetchImpl = jest
      .fn()
      .mockResolvedValue(jsonResponse(200, serverAnswer));
    const provider = new AnthropicAvaReasoningProvider(
      "fixture-airline-demo-new",
      "normal",
      {
        fetchImpl,
      },
    );
    const packet = basePacket({
      acceptedFactRefs: ["vendor-a"],
      evidenceRefs: ["ev-1"],
    });
    const answer = await provider.ask({
      intent: "investigate",
      question: "What is Vendor A's spend?",
      packet,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("/api/knowledge/fixture-ava");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body);
    expect(body).toEqual({
      action: "ask",
      tenantKey: "fixture-airline-demo-new",
      intent: "investigate",
      question: "What is Vendor A's spend?",
      packet,
    });

    expect(answer.outcome).toBe("answered");
    expect(answer.sections).toEqual(serverAnswer.sections);
    expect(answer.evidenceRefs).toEqual(["ev-1"]);
  });

  it("passes through a server-issued refusal unchanged", async () => {
    const refused: AvaAnswer = {
      outcome: "refused",
      sections: [],
      evidenceRefs: [],
      limitations: ["No usable data."],
      whatWouldChangeIt: [],
      refusalReason: "Nothing in scope supports this question.",
      promoted: false,
    };
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse(200, refused));
    const provider = new AnthropicAvaReasoningProvider(
      "fixture-airline-demo-new",
      "normal",
      {
        fetchImpl,
      },
    );
    const answer = await provider.ask({
      intent: "explain",
      question: "What is Vendor A's headcount?",
      packet: basePacket({
        acceptedFactRefs: ["vendor-a"],
        evidenceRefs: ["ev-1"],
      }),
    });
    expect(answer).toEqual(refused);
  });

  it("converts a non-2xx HTTP response into a clean refusal, not a throw", async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValue(jsonResponse(403, { error: "forbidden" }));
    const provider = new AnthropicAvaReasoningProvider(
      "fixture-airline-demo-new",
      "normal",
      {
        fetchImpl,
      },
    );
    const answer = await provider.ask({
      intent: "explain",
      question: "Anything?",
      packet: basePacket({
        acceptedFactRefs: ["vendor-a"],
        evidenceRefs: ["ev-1"],
      }),
    });
    expect(answer.outcome).toBe("refused");
    expect(answer.refusalReason).toMatch(/403/);
  });

  it("converts a network failure into a clean refusal, not a throw", async () => {
    const fetchImpl = jest.fn().mockRejectedValue(new Error("network down"));
    const provider = new AnthropicAvaReasoningProvider(
      "fixture-airline-demo-new",
      "normal",
      {
        fetchImpl,
      },
    );
    const answer = await provider.ask({
      intent: "explain",
      question: "Anything?",
      packet: basePacket({
        acceptedFactRefs: ["vendor-a"],
        evidenceRefs: ["ev-1"],
      }),
    });
    expect(answer.outcome).toBe("refused");
    expect(answer.refusalReason).toMatch(/network down/);
  });

  it("draftInterpretation POSTs the draftInterpretation action and returns the parsed draft", async () => {
    const draft = {
      drafted: true,
      headline: "Vendor A dominates spend in scope.",
      body: "Vendor A accounts for the only spend figure available.",
      evidenceRefs: ["ev-1"],
      pinnedBaselineRef: "kb-test",
    };
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse(200, draft));
    const provider = new AnthropicAvaReasoningProvider(
      "fixture-airline-demo-new",
      "normal",
      {
        fetchImpl,
      },
    );
    const result = await provider.draftInterpretation({
      packet: basePacket({ evidenceRefs: ["ev-1"] }),
    });
    expect(result).toEqual(draft);
    const [, init] = fetchImpl.mock.calls[0];
    expect(JSON.parse(init.body).action).toBe("draftInterpretation");
  });

  it("draftIndustryContext POSTs the draftIndustryContext action and returns the parsed (refused) draft", async () => {
    const draft = {
      drafted: false,
      refusalReason: "No external peer dataset in the fixture corpus.",
    };
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse(200, draft));
    const provider = new AnthropicAvaReasoningProvider(
      "fixture-airline-demo-new",
      "normal",
      {
        fetchImpl,
      },
    );
    const result = await provider.draftIndustryContext({
      packet: basePacket({ evidenceRefs: ["ev-bench"] }),
      question: "How do we compare to competitors?",
    });
    expect(result).toEqual(draft);
    const [, init] = fetchImpl.mock.calls[0];
    expect(JSON.parse(init.body).action).toBe("draftIndustryContext");
  });
});

describe("createFixtureRuntime aiProvider option", () => {
  it("defaults to the deterministic provider (no behavior change for existing callers)", () => {
    const runtime = createFixtureRuntime("fixture-airline-demo-new", "normal");
    expect(runtime.ava).toBeInstanceOf(DeterministicAvaReasoningProvider);
  });

  it("aiProvider:'real' returns the thin AnthropicAvaReasoningProvider client", () => {
    const runtime = createFixtureRuntime("fixture-airline-demo-new", "normal", {
      aiProvider: "real",
    });
    expect(runtime.ava).toBeInstanceOf(AnthropicAvaReasoningProvider);
  });

  it("models_disabled scenario yields NullAvaReasoningProvider regardless of aiProvider", () => {
    const runtime = createFixtureRuntime(
      "fixture-airline-demo-new",
      "models_disabled",
      {
        aiProvider: "real",
      },
    );
    expect(runtime.ava).toBeInstanceOf(NullAvaReasoningProvider);
    expect(runtime.modelsEnabled).toBe(false);
  });
});
