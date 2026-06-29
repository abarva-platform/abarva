import { getAuditedAnthropicClient } from "@/lib/agent/stream";
import { answerHomeKnowFromV6 } from "@/lib/home/know/v6-home-ask";
import { toHomeKnowResponseFromV6 } from "@/lib/home/know/v6-home-know-response";

import {
  applyHomeV6ExecutiveSynthesis,
  HOME_V6_EXECUTIVE_SYSTEM_PROMPT,
} from "../home-v6-executive-synthesis";

jest.mock("@/lib/agent/stream", () => ({
  getAuditedAnthropicClient: jest.fn(),
}));

const mockGetAuditedAnthropicClient =
  getAuditedAnthropicClient as jest.MockedFunction<
    typeof getAuditedAnthropicClient
  >;

describe("Home V6 executive synthesis", () => {
  const originalEnv = process.env.HOME_V6_EXECUTIVE_SYNTHESIS_ENABLED;

  beforeEach(() => {
    process.env.HOME_V6_EXECUTIVE_SYNTHESIS_ENABLED = "1";
    mockGetAuditedAnthropicClient.mockReset();
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.HOME_V6_EXECUTIVE_SYNTHESIS_ENABLED;
    } else {
      process.env.HOME_V6_EXECUTIVE_SYNTHESIS_ENABLED = originalEnv;
    }
  });

  it("selects Claude executive prose while preserving V6 facts and tables", async () => {
    mockClaudeText(
      "Retail Demo has enough source support to describe the shape of the technology organization at the role and domain level, but not at the named-person level.\n\nThe business meaning is that ownership can be discussed by function, system area, and decision-right boundary. It should not be presented as a people roster or accountability chart until named-person evidence is loaded.\n\nFor executive use, the answer is ready for operating-model discussion, with a clear caveat: final decisions still need client validation of ownership freshness and source stewardship.",
    );
    const v6 = answerHomeKnowFromV6({
      tenantKey: "apexretail",
      question: "How is our IT organization structured today?",
      includeTrace: true,
    });
    const deterministic = toHomeKnowResponseFromV6(v6, {
      question: "How is our IT organization structured today?",
    });

    const result = await applyHomeV6ExecutiveSynthesis({
      response: deterministic,
      v6Result: v6,
      question: deterministic.question,
      tenantKey: v6.tenant.canonicalKey,
      includeTrace: true,
    });

    expect(result.trace.used).toBe(true);
    expect(result.response.prose).toContain("business meaning");
    expect(result.response.prose).not.toContain("V6");
    expect(result.response.prose).not.toContain("usable V6");
    expect(result.response.facts).toEqual(deterministic.facts);
    expect(result.response.tables).toEqual(deterministic.tables);
    expect(result.response.safety.composerTrace?.composer).toBe(
      "claude_text_synthesis",
    );
    expect(result.response.safety.composerTrace?.fallbackUsed).toBe(false);
    expect(result.response.safety.composerTrace?.reason).toContain(
      "answerSource=sanitized_claude",
    );
    expect(result.response.safety.composerTrace?.reason).toContain(
      "claudeInvoked=true",
    );
    expect(result.response.safety.composerTrace?.reason).toContain(
      "claudeSelected=true",
    );
    expect(
      result.response.safety.composerTrace?.anthropicTrace?.claudeRaw.text,
    ).toContain("Retail Demo");
    expect(mockGetAuditedAnthropicClient).toHaveBeenCalledWith(
      expect.objectContaining({
        workflow: "home-v6-executive-answer",
        prompt: expect.stringContaining(HOME_V6_EXECUTIVE_SYSTEM_PROMPT),
      }),
    );
  });

  it("falls back with explicit trace when Claude output exposes technical language", async () => {
    mockClaudeText(
      "Retail Demo has 50 usable V6 evidence rows from the dataset contract pack.",
    );
    const v6 = answerHomeKnowFromV6({
      tenantKey: "apexretail",
      question: "How is our IT organization structured today?",
      includeTrace: true,
    });
    const deterministic = toHomeKnowResponseFromV6(v6, {
      question: "How is our IT organization structured today?",
    });

    const result = await applyHomeV6ExecutiveSynthesis({
      response: deterministic,
      v6Result: v6,
      question: deterministic.question,
      tenantKey: v6.tenant.canonicalKey,
      includeTrace: true,
    });

    expect(result.trace.used).toBe(false);
    expect(result.trace.validationIssues).toContain("technical_language");
    expect(result.response.prose).toBe(deterministic.prose);
    expect(result.response.safety.composerTrace?.fallbackUsed).toBe(true);
    expect(result.response.safety.composerTrace?.reason).toContain(
      "claudeInvoked=true",
    );
    expect(result.response.safety.composerTrace?.reason).toContain(
      "claudeSelected=false",
    );
    expect(result.response.safety.composerTrace?.reason).toContain(
      "fallbackUsed=true",
    );
  });
});

function mockClaudeText(text: string): void {
  mockGetAuditedAnthropicClient.mockResolvedValue({
    auditId: "audit-home-v6-exec-test",
    dataClass: "confidential",
    client: {
      messages: {
        stream: jest.fn(() => asyncTextStream(text)),
      },
    } as never,
  });
}

function asyncTextStream(text: string): AsyncIterable<unknown> & {
  finalMessage: () => Promise<unknown>;
} {
  return {
    async *[Symbol.asyncIterator]() {
      yield {
        type: "content_block_delta",
        delta: { type: "text_delta", text },
      };
    },
    async finalMessage() {
      return { content: [{ type: "text", text }] };
    },
  };
}
