/**
 * Provider audit regression — production reasoning must be Anthropic/Claude,
 * never OpenAI (Context/Corpus → Agent Visibility audit, hard constraint #4).
 *
 * Wiring audit over the synthesis source files: Nexus, Sentinel Ask, the Ask
 * Anthropic runtime, and Source Sentinel chat must all route reasoning through
 * the audited Anthropic Claude client and must not reference the OpenAI
 * synthesis path.
 */

import { readFileSync } from "node:fs";
import path from "node:path";

import {
  createIntelligenceAskAnthropicText,
  INTELLIGENCE_ASK_ANTHROPIC_SYNTHESIS_MODEL,
} from "@/lib/intelligence/ask/anthropic-runtime";

jest.mock("@/lib/agent/stream", () => ({
  getAuditedAnthropicClient: jest.fn(),
}));

const { getAuditedAnthropicClient } = jest.requireMock(
  "@/lib/agent/stream",
) as {
  getAuditedAnthropicClient: jest.Mock;
};

const ASK_DIR = path.join(process.cwd(), "src/lib/intelligence/ask");
const PROGRAMS_DIR = path.join(process.cwd(), "src/lib/programs");
const SOURCE_DIR = path.join(process.cwd(), "src/lib/source");
const INTEGRATIONS_DIR = path.join(
  process.cwd(),
  "src/lib/integrations/ai-egress",
);

function read(rel: string, base = ASK_DIR): string {
  return readFileSync(path.join(base, rel), "utf8");
}

describe("provider audit — reasoning must be Anthropic, not OpenAI", () => {
  beforeEach(() => {
    getAuditedAnthropicClient.mockReset();
  });

  it("Nexus free-text synthesis uses an audited Anthropic Claude client", () => {
    const src = read("nexus-free-text.ts", PROGRAMS_DIR);
    expect(src).toMatch(/getAuditedAnthropicClient/);
    expect(src).toMatch(/claude/i);
    expect(src).not.toMatch(
      /createIntelligenceAskOpenAIText|chat\.completions|gpt-/,
    );
  });

  it("Sentinel Ask synthesis uses the Anthropic runtime, not OpenAI", () => {
    const src = read("synthesizer.ts");
    expect(src).toMatch(/createIntelligenceAskAnthropicText/);
    expect(src).toMatch(/anthropic-runtime/);
    expect(src).not.toMatch(/createIntelligenceAskOpenAIText/);
    expect(src).not.toMatch(/openai-runtime/);
  });

  it("the Sentinel Ask Anthropic runtime routes through the audited Claude client", () => {
    const src = read("anthropic-runtime.ts");
    expect(src).toMatch(/getAuditedAnthropicClient/);
    expect(src).toMatch(/claude/i);
    expect(src).not.toMatch(/openai|gpt-/i);
  });

  it("Source Sentinel chat synthesis uses an audited Anthropic Claude client", () => {
    const src = read("sentinel-chat-llm.ts", SOURCE_DIR);
    expect(src).toMatch(/getAuditedAnthropicClient/);
    expect(src).toMatch(/claude/i);
    expect(src).not.toMatch(
      /preflightOpenAIDirectClient|responses\.create|gpt-/,
    );
  });

  it("Sentinel Ask runtime passes the required audit identity envelope", async () => {
    const messagesCreate = jest.fn(async () => ({
      model: INTELLIGENCE_ASK_ANTHROPIC_SYNTHESIS_MODEL,
      content: [{ type: "text", text: "Claude answer" }],
    }));
    getAuditedAnthropicClient.mockResolvedValue({
      auditId: "audit-sentinel-ask-1",
      dataClass: "confidential",
      client: { messages: { create: messagesCreate } },
    });

    await expect(
      createIntelligenceAskAnthropicText({
        tenantId: "tenant-meridian",
        userId: "user-cdio",
        workflow: "intelligence-ask-synthesis",
        model: INTELLIGENCE_ASK_ANTHROPIC_SYNTHESIS_MODEL,
        instructions: "System instructions",
        input: "What is our analytics stack?",
        maxOutputTokens: 900,
        dataClass: "confidential",
        metadata: { intent: "current_state" },
      }),
    ).resolves.toBe("Claude answer");

    expect(getAuditedAnthropicClient).toHaveBeenCalledWith({
      tenantId: "tenant-meridian",
      userId: "user-cdio",
      workflow: "intelligence-ask-synthesis",
      model: INTELLIGENCE_ASK_ANTHROPIC_SYNTHESIS_MODEL,
      prompt: "System instructions\n\nWhat is our analytics stack?",
      dataClass: "confidential",
      metadata: {
        workflow: "intelligence-ask-synthesis",
        intent: "current_state",
      },
    });
    expect(messagesCreate).toHaveBeenCalledWith({
      model: INTELLIGENCE_ASK_ANTHROPIC_SYNTHESIS_MODEL,
      max_tokens: 900,
      system: "System instructions",
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: "What is our analytics stack?" }],
        },
      ],
    });
  });

  it("the audited Anthropic preflight writes the expected provider audit fields", () => {
    const src = read("anthropic-direct.ts", INTEGRATIONS_DIR);
    expect(src).toMatch(/preflightModelEgress\(\{\s*tenantId,/);
    expect(src).toMatch(/userId: args\.userId/);
    expect(src).toMatch(/workflow: args\.workflow/);
    expect(src).toMatch(/provider: ['"]anthropic['"]/);
    expect(src).toMatch(/route: ['"]anthropic-direct['"]/);
    expect(src).toMatch(/model: args\.model/);
    expect(src).toMatch(/intendedTenantKey: args\.tenantId/);
    expect(src).toMatch(/resolvedTenantKey: tenantId/);
    expect(src).not.toMatch(/openai-direct|provider: ['"]openai['"]/i);
  });
});
