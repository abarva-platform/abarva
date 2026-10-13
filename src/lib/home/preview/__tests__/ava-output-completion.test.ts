import { format } from "node:util";

import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";
import { getAuditedAnthropicClient } from "@/lib/agent/stream";
import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";
import { validateAvaAnswerPacket } from "@/lib/ava-answer/validateAvaAnswerPacket";

import {
  answerHomeAvaQuestion,
  homeAvaAnswerFollowUpQuestions,
} from "../ava-answer";
import type { ChapterView } from "../types";

jest.mock("@/lib/agent/stream", () => ({
  getAuditedAnthropicClient: jest.fn(),
}));

const auditedClient = jest.mocked(getAuditedAnthropicClient);
const tenantKey = CANONICAL_TENANT_KEYS[0];
const question = "What can the reporting baseline establish?";
const statement =
  "The reporting baseline requires source-owner confirmation before any discovery decision; no business outcome has been measured.";
const privateReasoning = "private-reasoning-content-not-for-display";
const evidenceLimit = "This is discovery, not measured result or savings commitment.";
const consoleMethods = ["log", "warn", "error", "info", "debug"] as const;

const chapter: ChapterView = {
  chapterId: "technology_data",
  title: "Reference context",
  guidingQuestion: question,
  headline: "Inspect the baseline before acting.",
  executive_synthesis: "Source-owner confirmation remains necessary.",
  key_insights: [
    {
      statement,
      confidence: "medium",
      evidence_ids: ["reference-evidence-1"],
      claim_type: "FACT",
    },
  ],
  tensions: [],
  what_to_watch: [],
  questions_to_ask: [],
  visual_opportunities: [],
  limitations: ["Measured outcomes are not established."],
};

function modelAnswer(status: "answered" | "partial" | "no_data" = "answered") {
  return {
    status,
    direct_answer: "Discovery needs baseline and source-owner confirmation.",
    prose: "",
    key_points: [
      "**Evidence:** The reporting baseline requires source-owner confirmation before any discovery decision, and no business outcome has been measured.",
    ],
    cited_claim_tags: ["TD-K1"],
    visual: { type: "none", dataset_ref: null, chart_kind: null },
    caveats: [evidenceLimit],
  };
}

function textMessage(payload: unknown) {
  return {
    content: [{ type: "text", text: JSON.stringify(payload) }],
    stop_reason: "end_turn",
    usage: { output_tokens: 180 },
  };
}

function thinkingOnlyMessage() {
  return {
    content: [
      { type: "thinking", thinking: privateReasoning, signature: "reference-signature" },
    ],
    stop_reason: "max_tokens",
    usage: { output_tokens: 4096 },
  };
}

function mockClient(create: jest.Mock) {
  auditedClient.mockResolvedValue({
    client: { messages: { create } },
    auditId: "reference-audit",
    dataClass: "confidential",
  } as never);
}

function answer(latestQuestion = question) {
  return answerHomeAvaQuestion({
    bundle: { chapters: [chapter] },
    tenantKey,
    question: latestQuestion,
  });
}

function consoleDiagnostics() {
  return consoleMethods.flatMap((method) => jest.mocked(console[method]).mock.calls);
}

function expectUnavailable(packet: AvaAnswerPacket) {
  expect(packet.status).toBe("no_data");
  expect(packet.gaps).toEqual([
    expect.objectContaining({
      label: "Answer unavailable",
      detail: expect.stringContaining("response could not be completed"),
    }),
  ]);
  expect(JSON.stringify(packet)).not.toMatch(/no cited Home evidence/i);
  expect(packet.citations).toEqual([]);
  expect(packet.prose).toBeUndefined();
  expect(packet.artifacts).toEqual([]);
  expect(packet.factsUsed).toEqual([]);
  expect(packet.metricsUsed).toEqual([]);
  expect(packet.relationshipsUsed).toEqual([]);
  expect(JSON.stringify(packet)).not.toContain(statement);
  expect(validateAvaAnswerPacket(packet).violations.filter(
    (violation) => violation.severity === "error",
  )).toEqual([]);
}

beforeEach(() => {
  auditedClient.mockReset();
  for (const method of consoleMethods) {
    jest.spyOn(console, method).mockImplementation(() => {});
  }
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

it("uses the unchanged model with adaptive omitted thinking and a strict complete output schema", async () => {
  const create = jest.fn().mockResolvedValue(textMessage(modelAnswer()));
  mockClient(create);
  const packet = await answer();

  expect(create).toHaveBeenCalledTimes(1);
  expect(auditedClient).toHaveBeenCalledWith(expect.objectContaining({
    tenantId: tenantKey,
    model: "claude-sonnet-5",
    workflow: "home-preview-ava-answer",
  }));
  expect(create.mock.calls[0][0]).toMatchObject({
    model: "claude-sonnet-5",
    max_tokens: 4096,
    thinking: { type: "adaptive", display: "omitted" },
    output_config: { effort: "medium" },
  });
  expect(create.mock.calls[0][0].output_config.format).toEqual({
    type: "json_schema",
    schema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["answered", "partial", "no_data"] },
        direct_answer: { type: "string" },
        prose: { type: "string" },
        key_points: { type: "array", items: { type: "string" } },
        cited_claim_tags: { type: "array", items: { type: "string" } },
        visual: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["chart", "table", "none"] },
            dataset_ref: { type: ["string", "null"] },
            chart_kind: {
              anyOf: [
                { type: "string", enum: ["bar", "horizontal-bar"] },
                { type: "null" },
              ],
            },
          },
          required: ["type", "dataset_ref", "chart_kind"],
          additionalProperties: false,
        },
        caveats: { type: "array", items: { type: "string" } },
      },
      required: [
        "status", "direct_answer", "prose", "key_points", "cited_claim_tags",
        "visual", "caveats",
      ],
      additionalProperties: false,
    },
  });
  expect(packet.status).toBe("answered");
  expect(validateAvaAnswerPacket(packet).passed).toBe(true);
});

it.each(["answered", "partial"] as const)(
  "repairs thinking-only token exhaustion into a cited %s answer without exposing reasoning",
  async (status) => {
    const repaired = textMessage({
      ...modelAnswer(status),
      cited_claim_tags: ["TD-K1", "UNKNOWN-K1"],
    });
    const create = jest.fn()
      .mockResolvedValueOnce(thinkingOnlyMessage())
      .mockResolvedValueOnce({
        ...repaired,
        content: [...thinkingOnlyMessage().content, ...repaired.content],
      });
    mockClient(create);
    const packet = await answer();

    expect(create).toHaveBeenCalledTimes(2);
    expect(auditedClient).toHaveBeenCalledTimes(2);
    expect(auditedClient.mock.calls[1][0]).toMatchObject({
      tenantId: tenantKey,
      model: "claude-sonnet-5",
      metadata: { presentationRepair: true },
    });
    const primaryRequest = create.mock.calls[0][0];
    const repairRequest = create.mock.calls[1][0];
    expect(repairRequest).toMatchObject({
      model: "claude-sonnet-5",
      max_tokens: 4096,
      thinking: { type: "adaptive", display: "omitted" },
      output_config: { effort: "low", format: primaryRequest.output_config.format },
    });
    expect(repairRequest.output_config.format).toEqual(primaryRequest.output_config.format);
    expect(packet.status).toBe(status);
    expect(packet.citations).toEqual([
      expect.objectContaining({ id: "TD-K1", excerpt: statement, confidence: "medium" }),
    ]);
    expect(packet.prose).toContain("source-owner confirmation");
    expect(JSON.stringify(packet)).not.toContain(privateReasoning);
    expect(JSON.stringify(packet)).not.toContain("UNKNOWN-K1");
    expect(validateAvaAnswerPacket(packet).passed).toBe(true);
  },
);

it("reports incomplete output after one empty repair without widening raw-claim recovery", async () => {
  const create = jest.fn()
    .mockResolvedValueOnce(thinkingOnlyMessage())
    .mockResolvedValueOnce({ content: [], stop_reason: "max_tokens", usage: { output_tokens: 4096 } });
  mockClient(create);
  const packet = await answer();

  expect(create).toHaveBeenCalledTimes(2);
  expect(auditedClient).toHaveBeenCalledTimes(2);
  expectUnavailable(packet);
  expect(JSON.stringify(packet)).not.toContain(privateReasoning);
});

it("gives the single repair only the remaining time in the original total deadline", async () => {
  jest.useFakeTimers();
  const create = jest.fn()
    .mockImplementationOnce(() => new Promise((resolve) => {
      setTimeout(() => resolve(thinkingOnlyMessage()), 30_000);
    }))
    .mockImplementationOnce(() => new Promise(() => {}));
  mockClient(create);
  const settled = jest.fn();
  const pending = answer().then((packet) => {
    settled(packet);
    return packet;
  });

  await jest.advanceTimersByTimeAsync(30_000);
  expect(create).toHaveBeenCalledTimes(2);
  await jest.advanceTimersByTimeAsync(14_999);
  expect(settled).not.toHaveBeenCalled();
  await jest.advanceTimersByTimeAsync(1);
  expect(settled).toHaveBeenCalledTimes(1);
  expectUnavailable(await pending);
  expect(create).toHaveBeenCalledTimes(2);
  expect(jest.getTimerCount()).toBe(0);
});

it("keeps a genuine parsed no_data response an evidence limit without an engine-failure repair", async () => {
  const create = jest.fn().mockResolvedValue(textMessage({
    ...modelAnswer("no_data"),
    direct_answer: "No measured outcome is established by this baseline.",
    key_points: [],
    cited_claim_tags: [],
    caveats: ["Measured outcomes remain unknown."],
  }));
  mockClient(create);
  const packet = await answer("What measured outcome does the baseline establish?");

  expect(create).toHaveBeenCalledTimes(1);
  expect(auditedClient).toHaveBeenCalledTimes(1);
  expect(packet.status).toBe("no_data");
  expect(packet.gaps).toEqual([expect.objectContaining({ label: "Evidence limit" })]);
  expect(JSON.stringify(packet)).not.toMatch(/Answer unavailable|response could not be completed/);
  expect(packet.citations).toEqual([]);
  expect(validateAvaAnswerPacket(packet).passed).toBe(true);
});

it("logs only completion metadata when both model responses contain private malformed text", async () => {
  const privateText = `private-model-content:${tenantKey}:not-for-diagnostics`;
  const create = jest.fn().mockResolvedValue({
    content: [{ type: "text", text: privateText }],
    stop_reason: "max_tokens",
    usage: { output_tokens: 4096 },
  });
  mockClient(create);
  expectUnavailable(await answer());

  const diagnostics = consoleDiagnostics();
  expect(diagnostics).toHaveLength(2);
  for (const [entry] of diagnostics) {
    expect(JSON.parse(String(entry))).toEqual({
      event: "home_ava.answer_incomplete",
      phase: expect.stringMatching(/^home-preview-ava-/),
      textLength: privateText.length,
      stopReason: "max_tokens",
      outputTokens: 4096,
    });
  }
  const logged = diagnostics.map((args) => format(...args)).join("\n");
  expect(logged).not.toContain("private-model-content");
  expect(logged).not.toContain(tenantKey);
  expect(logged).not.toContain(statement);
  expect(logged).not.toContain(question);
});

it("does not echo private failure messages into packet caveats or console diagnostics", async () => {
  const privateFailure = `private-failure-content:${tenantKey}:not-for-display`;
  const create = jest.fn().mockRejectedValue(new Error(privateFailure));
  mockClient(create);
  const packet = await answer();

  expectUnavailable(packet);
  expect(create).toHaveBeenCalledTimes(1);
  expect(packet.caveats).toEqual([]);
  expect(JSON.stringify(packet)).not.toContain(privateFailure);
  const logged = consoleDiagnostics().map((args) => format(...args)).join("\n");
  expect(logged).not.toContain("private-failure-content");
  expect(logged).not.toContain(tenantKey);
});

it("logs only numeric request failure metadata for a provider rejection", async () => {
  const create = jest.fn().mockRejectedValue(Object.assign(
    new Error(`private-provider-error:${tenantKey}:${question}`),
    { status: 400, headers: { authorization: "private-credential" } },
  ));
  mockClient(create);
  expectUnavailable(await answer());
  const diagnostics = consoleDiagnostics();
  expect(diagnostics).toHaveLength(1);
  expect(JSON.parse(String(diagnostics[0][0]))).toEqual({
    event: "home_ava.request_failed",
    status: 400,
    elapsedMs: expect.any(Number),
  });
  expect(JSON.stringify(diagnostics)).not.toMatch(/private-provider-error|private-credential/);
  expect(JSON.stringify(diagnostics)).not.toContain(tenantKey);
});

it.each([
  ["self-service and Agent Assist", true],
  ["deflection and Agent Assist", true],
  ["self-service", false],
  ["Agent Assist", false],
  ["the reporting baseline", false],
] as const)(
  "keeps discovery follow-ups on priorities and baseline evidence for %s despite negated savings language",
  async (scope, separateWorkflows) => {
    mockClient(jest.fn().mockResolvedValue(textMessage(modelAnswer("partial"))));
    const packet = await answer(
      `Should we charter discovery for ${scope}? This is not measured result or savings commitment.`,
    );
    const original = JSON.stringify(packet);
    const questions = homeAvaAnswerFollowUpQuestions(packet);

    expect(packet.caveats[0].detail).toBe(evidenceLimit);
    expect(questions).toHaveLength(3);
    expect(questions[0]).toMatch(/business priorities.*what could change its priority/i);
    expect(questions[1]).toMatch(/baseline and evidence.*before chartering discovery/i);
    expect(questions[2]).toMatch(separateWorkflows
      ? /self-service resolution and Agent Assist separately/i
      : /accountable owners and dependencies/i);
    expect(questions.join(" ")).not.toMatch(/financial value|CFO|Finance|\d|%|\$/i);
    expect(new Set(questions).size).toBe(3);
    expect(JSON.stringify(packet)).toBe(original);
  },
);

it("does not introduce user-proposed discovery targets into follow-ups or cited evidence", async () => {
  mockClient(jest.fn().mockResolvedValue(textMessage(modelAnswer("partial"))));
  const packet = await answer(
    "Should we charter discovery with proposed 35% self-service resolution and 12% Agent Assist uplift? This is not measured result or savings commitment.",
  );
  const questions = homeAvaAnswerFollowUpQuestions(packet);

  expect(questions).toHaveLength(3);
  expect(questions.join(" ")).not.toMatch(/35|12|%|target|measured result|savings commitment/i);
  expect(packet.citations).toEqual([expect.objectContaining({ id: "TD-K1", excerpt: statement })]);
  expect(packet.metricsUsed).toEqual([]);
  expect(packet.relationshipsUsed).toEqual([]);
  expect(packet.artifacts).toEqual([]);
});

it("gives typed graph gaps precedence over discovery and charter follow-ups", async () => {
  const packet = await answer(
    "Show me the graph of how risks, vendors, applications, data and programs connect before chartering discovery for self-service and Agent Assist.",
  );
  const questions = homeAvaAnswerFollowUpQuestions(packet);

  expect(packet.gaps.some((gap) => /typed relationship/i.test(gap.detail))).toBe(true);
  expect(questions).toHaveLength(3);
  expect(questions[0]).toContain("risk-to-application");
  expect(questions[0]).toContain("program-to-application");
  expect(questions[1]).toContain("endpoint IDs and declared relationship types");
  expect(questions[2]).toContain("connections remain unverified");
  expect(questions.join(" ")).not.toMatch(/business priorities|chartering discovery|financial value/i);
  expect(auditedClient).not.toHaveBeenCalled();
});
