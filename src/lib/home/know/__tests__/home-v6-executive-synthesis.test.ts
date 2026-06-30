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

  it("marks a visual ask with deterministic artifact payload as rendered", async () => {
    mockClaudeText(
      "Retail Demo can be shown as an executive table because the available business facts support a structured view by context area and readiness.\n\n| Context area | Executive use |\n|---|---|\n| Enterprise profile | Frames the business model and investment context |\n| Source collection | Shows where supporting evidence is strongest |\n\nFor a leadership chart, use a bar view comparing context areas by readiness so the decision risk is visible without inventing new numbers.",
    );
    const question =
      "Show the answer as an executive table and describe what chart would best explain it.";
    const v6 = answerHomeKnowFromV6({
      tenantKey: "apexretail",
      question,
      includeTrace: true,
    });
    const deterministic = toHomeKnowResponseFromV6(v6, { question });

    const result = await applyHomeV6ExecutiveSynthesis({
      response: deterministic,
      v6Result: v6,
      question,
      tenantKey: v6.tenant.canonicalKey,
      includeTrace: true,
    });

    expect(result.trace.used).toBe(true);
    expect(result.response.artifactStatus).toBe("rendered");
    expect(result.response.safety.composerTrace?.fallbackUsed).toBe(false);
    expect(result.response.safety.composerTrace?.reason).toContain(
      "artifactStatus=rendered",
    );
  });

  it("preserves a good visual recommendation when no artifact payload exists", async () => {
    mockClaudeText(
      "Retail Demo does not have enough structured visual payload to render the chart directly, but the available business facts still support a useful executive view.\n\nThe right chart would be a grouped bar chart comparing context areas by readiness and evidence strength. It would show where the business can rely on the current context and where the next evidence to validate is ownership, freshness, and measurement support.",
    );
    const question =
      "What chart or graph would best explain this context to executives?";
    const v6 = answerHomeKnowFromV6({
      tenantKey: "apexretail",
      question,
      includeTrace: true,
    });
    const deterministic = {
      ...toHomeKnowResponseFromV6(v6, { question }),
      intent: "chart" as const,
      tables: [],
      charts: [],
      graphs: [],
      gaps: [],
    };

    const result = await applyHomeV6ExecutiveSynthesis({
      response: deterministic,
      v6Result: v6,
      question,
      tenantKey: v6.tenant.canonicalKey,
      includeTrace: true,
    });

    expect(result.trace.used).toBe(true);
    expect(result.response.artifactStatus).toBe("recommended_not_rendered");
    expect(result.response.answerStatus).not.toBe("blocked");
    expect(result.response.safety.composerTrace?.fallbackUsed).toBe(false);
  });

  it("still blocks a visual ask when Claude invents unsupported value action", async () => {
    mockClaudeText(
      "Retail Demo should invest $40M immediately and scale this because the value is proven.",
    );
    const question =
      "Show the AI value opportunity as a chart and tell me what to do.";
    const v6 = answerHomeKnowFromV6({
      tenantKey: "apexretail",
      question,
      includeTrace: true,
    });
    const deterministic = toHomeKnowResponseFromV6(v6, { question });

    const result = await applyHomeV6ExecutiveSynthesis({
      response: deterministic,
      v6Result: v6,
      question,
      tenantKey: v6.tenant.canonicalKey,
      includeTrace: true,
    });

    expect(result.trace.used).toBe(false);
    expect(result.trace.validationIssues).toContain(
      "unsupported_recommendation",
    );
    expect(result.response.safety.composerTrace?.fallbackUsed).toBe(true);
  });

  it("treats missing demo tenant name as a warning, not a hard block", async () => {
    mockClaudeText(
      "The business context is strong enough for leadership to understand ownership, readiness, and decision risk, but not enough to claim named-person accountability.\n\nThe next evidence to validate is source freshness and owner confirmation before this becomes decision-ready.",
    );
    const question = "What business context is available for this tenant?";
    const v6 = answerHomeKnowFromV6({
      tenantKey: "apexretail",
      question,
      includeTrace: true,
    });
    const deterministic = toHomeKnowResponseFromV6(v6, { question });

    const result = await applyHomeV6ExecutiveSynthesis({
      response: deterministic,
      v6Result: v6,
      question,
      tenantKey: v6.tenant.canonicalKey,
      includeTrace: true,
    });

    expect(result.trace.used).toBe(true);
    expect(result.response.safety.composerTrace?.fallbackUsed).toBe(false);
    expect(result.response.safety.composerTrace?.reason).toContain(
      "softWarnings=missing_tenant_name",
    );
  });

  it("preserves the Healthcare Demo VISUAL-001 answer with artifact status", async () => {
    mockClaudeText(
      "Healthcare Demo's readiness evidence is concentrated in source signals, which is where confidence is strongest today. Most source signals register at a high readiness level, with a smaller set at medium, while the broader enterprise profile sits at medium. In practical terms, the foundation for trusting your source landscape is solid, but the surrounding business context is less mature and warrants attention before it carries executive decisions.\n\nA table-ready view of the most important context follows:\n\n| Business context area | Readiness signal |\n|---|---|\n| Enterprise profile | Medium |\n| Source collection | High |\n| Source collection | High |\n| Source collection | Medium |\n\nThe clearest way to present this to an executive audience is a grouped bar chart showing the count of high versus medium readiness signals by business context area. This makes the contrast immediate: source collections cluster at high confidence, while enterprise profile lags at medium, so leaders can see where readiness is proven and where it is thin.\n\nThe next evidence to validate is ownership and freshness of the underlying sources, and a deeper view of why enterprise profile remains at medium.",
    );
    const question =
      "Give me a table-ready view of the most important context and say what graph would help an executive understand it.";
    const v6 = answerHomeKnowFromV6({
      tenantKey: "meridian",
      question,
      includeTrace: true,
    });
    const deterministic = toHomeKnowResponseFromV6(v6, { question });

    const result = await applyHomeV6ExecutiveSynthesis({
      response: deterministic,
      v6Result: v6,
      question,
      tenantKey: v6.tenant.canonicalKey,
      includeTrace: true,
    });

    expect(result.trace.used).toBe(true);
    expect(result.response.answerStatus).toBe("answered");
    expect(result.response.artifactStatus).toBe("rendered");
    expect(result.response.prose).toContain("Healthcare Demo");
    expect(result.response.prose).toContain("source evidence");
    expect(result.response.prose).not.toContain("source signals");
    expect(result.response.safety.composerTrace?.composer).toBe(
      "claude_text_synthesis",
    );
    expect(result.response.safety.composerTrace?.fallbackUsed).toBe(false);
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
