jest.mock("server-only", () => ({}));
const create = jest.fn();
const getAuditedAnthropicClient = jest.fn();
jest.mock("@/lib/agent/stream", () => ({
  getAuditedAnthropicClient: (...args: unknown[]) =>
    getAuditedAnthropicClient(...args),
}));

import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";
import { synthesizeStream } from "../synthesizer";

const originalAnswer = "Validate the recorded opportunity first.\n\nKeep this original text, including [S1], unchanged.";

async function generate(modelAuthoredOutput: boolean) {
  const previous = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = "test";
  create.mockClear();
  create.mockImplementation(async () => ({
    async *[Symbol.asyncIterator]() {
      yield {
        type: "content_block_delta",
        delta: { type: "thinking_delta", thinking: "PRIVATE_REASONING_MARKER" },
      };
      yield {
        type: "content_block_delta",
        delta: { type: "signature_delta", signature: "OPAQUE_SIGNATURE" },
      };
      yield {
        type: "content_block_delta",
        delta: { type: "text_delta", text: originalAnswer },
      };
    },
  }));
  getAuditedAnthropicClient.mockResolvedValue({
    auditId: "test",
    client: { messages: { create } },
  });
  try {
    let output = "";
    for await (const delta of synthesizeStream({
      tenantId: "test-tenant",
      tenantClientKey: CANONICAL_TENANT_KEYS[0],
      intent: "general_synthesis",
      query: "Give a brief executive recommendation.",
      modelAuthoredOutput,
      answerOnlyStreaming: true,
      richText: true,
      sources: [],
    })) output += delta;
    return { output, request: create.mock.calls[0][0] };
  } finally {
    if (previous === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = previous;
  }
}

it("reasons before executive answers without changing canonical answer text", async () => {
  const { output, request } = await generate(true);
  expect(request.model).toBe("claude-sonnet-4-6");
  expect(request.thinking).toEqual({ type: "adaptive", display: "omitted" });
  expect(request.output_config).toEqual({ effort: "medium" });
  expect(request.max_tokens).toBe(8192);
  expect(output).toBe(originalAnswer);
  expect(output).not.toContain("PRIVATE_REASONING_MARKER");
});

it("gives a multi-part discovery request enough output room and a dynamic format", async () => {
  const previous = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = "test";
  create.mockClear();
  create.mockImplementation(async () => ({
    async *[Symbol.asyncIterator]() {
      yield {
        type: "content_block_delta",
        delta: { type: "text_delta", text: originalAnswer },
      };
    },
  }));
  getAuditedAnthropicClient.mockResolvedValue({
    auditId: "test",
    client: { messages: { create } },
  });
  try {
    let output = "";
    for await (const delta of synthesizeStream({
      tenantId: "test-tenant",
      tenantClientKey: CANONICAL_TENANT_KEYS[0],
      intent: "general_synthesis",
      query:
        "Explore the opportunity:\n1. BUSINESS FIT\n2. CURRENT JOURNEY\n3. DISCOVERY PLAN\nFinish with a concise brief.",
      modelAuthoredOutput: true,
      answerOnlyStreaming: true,
      richText: true,
      sources: [],
    })) output += delta;
    expect(output).toBe(originalAnswer);
    const request = create.mock.calls[0][0];
    expect(request.model).toBe("claude-sonnet-4-6");
    expect(request.max_tokens).toBe(12000);
    expect(request.system).toContain("roughly 300 words of prose");
    expect(request.messages[0].content).toContain("Answer every requested area");
  } finally {
    if (previous === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = previous;
  }
});

it("retries once at lower effort when private thinking consumes the first answer", async () => {
  const previous = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = "test";
  create.mockClear();
  create.mockImplementationOnce(async () => ({
    async *[Symbol.asyncIterator]() {
      yield {
        type: "content_block_delta",
        delta: { type: "thinking_delta", thinking: "PRIVATE_REASONING_MARKER" },
      };
      yield {
        type: "message_delta",
        delta: { stop_reason: "max_tokens" },
        usage: { output_tokens: 8192 },
      };
    },
  })).mockImplementationOnce(async () => ({
    async *[Symbol.asyncIterator]() {
      yield {
        type: "content_block_delta",
        delta: { type: "text_delta", text: originalAnswer },
      };
    },
  }));
  getAuditedAnthropicClient.mockResolvedValue({
    auditId: "test",
    client: { messages: { create } },
  });
  try {
    let output = "";
    for await (const delta of synthesizeStream({
      tenantId: "test-tenant",
      tenantClientKey: CANONICAL_TENANT_KEYS[0],
      intent: "general_synthesis",
      query: "Give a brief executive recommendation.",
      modelAuthoredOutput: true,
      answerOnlyStreaming: true,
      richText: true,
      sources: [],
    })) output += delta;
    expect(output).toBe(originalAnswer);
    expect(create).toHaveBeenCalledTimes(2);
    expect(create.mock.calls[0][0].output_config).toEqual({ effort: "medium" });
    expect(create.mock.calls[1][0].output_config).toEqual({ effort: "low" });
  } finally {
    if (previous === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = previous;
  }
});

it("retains the legacy answer-only model and generation configuration", async () => {
  const { request } = await generate(false);
  expect(request.model).toBe("claude-haiku-4-5-20251001");
  expect(request.thinking).toBeUndefined();
  expect(request.output_config).toBeUndefined();
  expect(request.max_tokens).toBe(5000);
  expect(request.system).not.toContain("EVIDENCE RULE FOR THIS ANSWER");
});
