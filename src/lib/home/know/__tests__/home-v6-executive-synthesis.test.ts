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
  const originalRequiredEnv =
    process.env.HOME_V6_EXECUTIVE_SYNTHESIS_REQUIRED;

  beforeEach(() => {
    process.env.HOME_V6_EXECUTIVE_SYNTHESIS_ENABLED = "1";
    delete process.env.HOME_V6_EXECUTIVE_SYNTHESIS_REQUIRED;
    mockGetAuditedAnthropicClient.mockReset();
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.HOME_V6_EXECUTIVE_SYNTHESIS_ENABLED;
    } else {
      process.env.HOME_V6_EXECUTIVE_SYNTHESIS_ENABLED = originalEnv;
    }
    if (originalRequiredEnv === undefined) {
      delete process.env.HOME_V6_EXECUTIVE_SYNTHESIS_REQUIRED;
    } else {
      process.env.HOME_V6_EXECUTIVE_SYNTHESIS_REQUIRED = originalRequiredEnv;
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
    expect(result.response.safety.composerTrace?.reason).toContain(
      "rawClaudePreserved=false",
    );
    expect(result.response.safety.composerTrace?.reason).toContain(
      "traceRawClaudeExposed=true",
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
    expect(mockGetAuditedAnthropicClient).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining("Answerability:"),
      }),
    );
    expect(mockGetAuditedAnthropicClient).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining("Context quality:"),
      }),
    );
    expect(result.response.answerability).toBe(deterministic.answerability);
    expect(result.response.contextQuality).toEqual(
      deterministic.contextQuality,
    );
  });

  it("marks raw Claude preserved even when trace exposure is disabled", async () => {
    mockClaudeText(
      "For Retail Demo, the loaded business context is strong enough to describe ownership, readiness, and decision risk, but not enough to claim named-person accountability.\n\nThe next evidence to validate is source freshness and owner confirmation before this becomes decision-ready.",
    );
    const question = "What business context is available for this tenant?";
    const v6 = answerHomeKnowFromV6({
      tenantKey: "apexretail",
      question,
      includeTrace: false,
    });
    const deterministic = toHomeKnowResponseFromV6(v6, { question });

    const result = await applyHomeV6ExecutiveSynthesis({
      response: deterministic,
      v6Result: v6,
      question,
      tenantKey: v6.tenant.canonicalKey,
      includeTrace: false,
    });

    expect(result.trace.used).toBe(true);
    expect(result.response.prose).toBe(
      "For Retail Demo, the loaded business context is strong enough to describe ownership, readiness, and decision risk, but not enough to claim named-person accountability.\n\nThe next evidence to validate is source freshness and owner confirmation before this becomes decision-ready.",
    );
    expect(result.response.safety.composerTrace?.reason).toContain(
      "answerSource=claude_text",
    );
    expect(result.response.safety.composerTrace?.reason).toContain(
      "rawClaudePreserved=true",
    );
    expect(result.response.safety.composerTrace?.reason).toContain(
      "traceRawClaudeExposed=false",
    );
    expect(
      result.response.safety.composerTrace?.anthropicTrace,
    ).toBeUndefined();
  });

  it("preserves Claude markdown emphasis as part of the visible answer contract", async () => {
    mockClaudeText(
      [
        "For Industrial Demo:",
        "- **What this means:** finance modernization is the strongest current story, but the value claim still needs proof.",
        "- **Why it matters:** SAP feeds, treasury controls, and payment evidence decide whether this is board-ready.",
        "- **Where to go next:** use Tower for spend and value, Source for renewals, and Moves for execution sequencing.",
        "",
        "Caveat: named ownership and period-specific value evidence still need validation before leadership treats the case as proven.",
      ].join("\n"),
    );
    const question =
      "What is the AI footprint, including initiatives, adoption, usage, and value evidence?";
    const v6 = answerHomeKnowFromV6({
      tenantKey: "lakeshore",
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
    expect(result.response.prose).toContain("**What this means:**");
    expect(result.response.prose).toContain("**Why it matters:**");
    expect(result.response.safety.composerTrace?.reason).toContain(
      "answerSource=claude_text",
    );
    expect(result.response.safety.composerTrace?.reason).toContain(
      "rawClaudePreserved=true",
    );
    expect(
      result.response.safety.composerTrace?.anthropicTrace?.claudeRaw.text,
    ).toBe(result.response.prose);
  });

  it("treats whitespace-only list formatting as preserved Claude text", async () => {
    mockClaudeText(
      [
        "For Industrial Demo, the dependency story is clear enough for leadership.",
        "",
        "- **What this means:** cash positioning, bank connectivity, and payment approval form the critical path.",
        "- **Why it matters:** trust weakens where lineage and quality are least mature.",
        "- **Where to branch:** Tower for value, Source for vendor dependencies, Intelligence for tradeoffs, and Moves for sequencing.",
        "",
        "Where next:",
        "- Tower for value and priority.",
        "- Source for vendor dependencies.",
      ].join("\n"),
    );
    const question =
      "Describe the integration and dependency graph across systems, vendors, data, and risks.";
    const v6 = answerHomeKnowFromV6({
      tenantKey: "lakeshore",
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
    expect(result.response.prose).toContain("**What this means:**");
    expect(result.response.prose).toContain("Where next:");
    expect(result.response.safety.composerTrace?.reason).toContain(
      "answerSource=claude_text",
    );
    expect(result.response.safety.composerTrace?.reason).toContain(
      "rawClaudePreserved=true",
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

  it("adds the demo tenant name to the answer opening when Claude omits it", async () => {
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
    expect(result.response.prose.startsWith("For Retail Demo,")).toBe(true);
    expect(result.response.prose).toContain("the business context");
    expect(result.response.safety.composerTrace?.fallbackUsed).toBe(false);
    expect(result.response.safety.composerTrace?.reason).toContain(
      "softWarnings=none",
    );
  });

  it("collapses duplicate demo tenant openings from Claude", async () => {
    mockClaudeText(
      "For Airline Demo, For Airline Demo, the enterprise profile is strong enough to orient leadership, but source gaps still matter before decisions.\n\nThe next evidence to validate is owner signoff and source freshness.",
    );
    const question = "What context is loaded, and what can we trust?";
    const v6 = answerHomeKnowFromV6({
      tenantKey: "skyharbor",
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
    expect(result.response.prose).toContain("Airline Demo");
    expect(result.response.prose).not.toContain(
      "For Airline Demo, For Airline Demo",
    );
  });

  it("normalizes loaded evidence language before visible-answer validation", async () => {
    mockClaudeText(
      "For Airline Demo, the loaded evidence makes the Tower boundary clear: Home can explain what is proven, while Tower should own execution readiness, adoption, spend, and value tracking.\n\nThe business context shows several AI initiatives with scale, hold, and stop decisions carrying open readiness conditions. That means leadership should use Home for the current-state read and move the portfolio decision, owner signoff, and value tracking questions into Tower.\n\nThe next evidence to validate is which initiatives still lack owner signoff or lineage support before any scale decision is treated as ready.",
    );
    const question =
      "Which questions should be handed off to Tower rather than answered in Home?";
    const v6 = answerHomeKnowFromV6({
      tenantKey: "skyharbor",
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
    expect(result.response.prose).toContain("Airline Demo");
    expect(result.response.prose).toContain("Tower");
    expect(result.response.prose).toContain("business context");
    expect(result.response.prose).not.toContain("loaded evidence");
    expect(result.response.safety.composerTrace?.reason).toContain(
      "answerSource=sanitized_claude",
    );
    expect(result.response.safety.composerTrace?.reason).toContain(
      "rawClaudePreserved=false",
    );
    expect(result.response.safety.composerTrace?.fallbackUsed).toBe(false);
  });

  it("normalizes loaded context language before visible-answer validation", async () => {
    mockClaudeText(
      "The loaded context for Financial Services Demo establishes the enterprise frame, not the full financial detail. What is proven today is the scale of the technology commitment: a stated technology budget of $2.4 billion against a financial services operating model.\n\nHere is the budget evidence currently available:\n\n| Record | Industry / Model | Technology Budget |\n|---|---|---|\n| Financial Services Demo | Financial services | $2.4 billion |\n\nWhat is not yet proven is actual spend against that budget, renewal timing, or realized value and return. Those facts should be added before leadership treats burn rate, renewal exposure, or value capture as decision-ready.",
    );
    const question =
      "What does the loaded context prove about budget, spend, renewals, and value?";
    const v6 = answerHomeKnowFromV6({
      tenantKey: "firstcapital",
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
    expect(result.response.prose).toContain("Financial Services Demo");
    expect(result.response.prose).toContain("$2.4 billion");
    expect(result.response.prose).toContain("available business material");
    expect(result.response.prose).not.toContain("loaded context");
    expect(result.response.safety.composerTrace?.fallbackUsed).toBe(false);
  });

  it("normalizes row language before visible-answer validation", async () => {
    mockClaudeText(
      "Industrial Demo is represented at the enterprise level with a technology budget of $1.16 billion, which gives leadership a clear budget anchor but not the internal operating structure beneath it.\n\nWhat is not yet proven is the breakdown by business units, divisions, legal entities, regions, or portfolio segments. If this were shown as a table, only the top-line enterprise row could be populated today; the remaining structural detail should stay empty until ownership and budget allocation are confirmed.\n\nThe next evidence to validate is the component-unit map and the accountable owner for each operating layer.",
    );
    const question =
      "How is the company or portfolio operating structure represented, and what is missing?";
    const v6 = answerHomeKnowFromV6({
      tenantKey: "lakeshore",
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
    expect(result.response.prose).toContain("Industrial Demo");
    expect(result.response.prose).toContain("top-line enterprise line");
    expect(result.response.prose).not.toContain("enterprise row");
    expect(result.response.safety.composerTrace?.fallbackUsed).toBe(false);
  });

  it("requires compact three-bullet Industrial Demo answers with branch choices", async () => {
    mockClaudeText(
      [
        "For Industrial Demo:",
        "- Finance and treasury modernization is the clearest value story, but value proof must stay evidence-backed.",
        "- SAP, data quality, payments, and controls are the operating dependencies leadership should inspect first.",
        "- AI should be framed around work redesign, not broad automation claims.",
        "",
        "Caveat: named-person accountability and board-grade value proof still need validation before scale decisions.",
        "",
        "Next branch: Tower for spend, value, decisions; Source for vendor/contracts/renewals; Intelligence for advisory options/tradeoffs; Moves for sequencing and execution.",
      ].join("\n"),
    );
    const question =
      "What is the AI footprint, including initiatives, adoption, usage, and value evidence?";
    const v6 = answerHomeKnowFromV6({
      tenantKey: "lakeshore",
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
    expect(result.response.prose).toContain("For Industrial Demo:");
    expect(result.response.prose).toContain("Caveat:");
    expect(result.response.prose).toContain(
      "Tower for spend, value, decisions",
    );
    expect(result.response.prose).toContain(
      "Source for vendor/contracts/renewals",
    );
    expect(result.response.prose).toContain(
      "Intelligence for advisory options/tradeoffs",
    );
    expect(result.response.prose).toContain(
      "Moves for sequencing and execution",
    );
    expect(
      mockGetAuditedAnthropicClient.mock.calls.at(-1)?.[0].prompt,
    ).toContain("Industrial Demo compact format is required.");
    expect(
      mockGetAuditedAnthropicClient.mock.calls.at(-1)?.[0].prompt,
    ).toContain("Target 120-170 words");
    expect(
      mockGetAuditedAnthropicClient.mock.calls.at(-1)?.[0].prompt,
    ).toContain("interesting point of view");
    expect(
      mockGetAuditedAnthropicClient.mock.calls.at(-1)?.[0].prompt,
    ).toContain("what this means, why it matters");
    expect(result.response.safety.composerTrace?.reason).toContain(
      "promptVersion=home-v6-executive-answer-v3",
    );
    expect(result.response.safety.composerTrace?.fallbackUsed).toBe(false);
  });

  it("blocks Home from making final vendor renegotiation decisions", async () => {
    process.env.HOME_V6_EXECUTIVE_SYNTHESIS_REQUIRED = "1";
    mockClaudeText(
      "For Industrial Demo:\n- The first contract to reopen is Microsoft.\n- The renewal risk is the highest commercial pressure point.\n- The next step is renegotiation.\n\nCaveat: Source can validate the supporting evidence later.",
    );
    const question =
      "For Industrial Demo, which vendor contract should be renegotiated first?";
    const v6 = answerHomeKnowFromV6({
      tenantKey: "lakeshore",
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
    expect(result.response.answerStatus).toBe("blocked");
    expect(result.response.prose).not.toContain(
      "The first contract to reopen is Microsoft",
    );
    expect(result.response.safety.composerTrace?.reason).toContain(
      "unsafe_home_commercial_action",
    );
    expect(
      mockGetAuditedAnthropicClient.mock.calls.at(-1)?.[0].prompt,
    ).toContain("Home must not issue the final commercial action");
    expect(
      mockGetAuditedAnthropicClient.mock.calls.at(-1)?.[0].prompt,
    ).toContain("Source-validation candidates");
  });

  it("translates backend-ish raw and source-owner language into executive wording", async () => {
    mockClaudeText(
      "For Airline Demo, the raw asset list is not yet decision-grade because the source-owner record is incomplete.\n\nThe next evidence to validate is ownership and lineage before this becomes ready for executive sequencing.",
    );
    const question = "For Airline Demo, what ERP/data dependencies matter most?";
    const v6 = answerHomeKnowFromV6({
      tenantKey: "skyharbor",
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
    expect(result.response.prose).toContain("unqualified asset list");
    expect(result.response.prose).toContain("source ownership");
    expect(result.response.prose).not.toContain("raw");
    expect(result.response.prose).not.toContain("source-owner record");
    expect(result.response.safety.composerTrace?.fallbackUsed).toBe(false);
  });

  it("prompts blocker and tradeoff questions to name Intelligence", async () => {
    mockClaudeText(
      "For Airline Demo, the blocking issue is not the budget; it is the readiness tradeoff between customer data foundation and IROPS scale.\n\nIntelligence should frame the advisory options and tradeoffs, Tower should own the value case, and Moves should sequence the execution plan.",
    );
    const question =
      "For Airline Demo, what is blocking agentic IROPS from scaling?";
    const v6 = answerHomeKnowFromV6({
      tenantKey: "skyharbor",
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
    expect(result.response.prose).toContain("Intelligence");
    expect(result.response.prose).toContain("Tower");
    expect(result.response.prose).toContain("Moves");
    expect(
      mockGetAuditedAnthropicClient.mock.calls.at(-1)?.[0].prompt,
    ).toContain(
      "If the user asks what is blocking, what tradeoff matters, whether to scale or hold",
    );
  });

  it("accepts executive handoff language that names recommendation and prioritization", async () => {
    mockClaudeText(
      "For Retail Demo, Home should confirm what the evidence proves, while Intelligence should own leadership judgment, prioritization, options, and the recommendation.\n\nThe advisory questions sitting on top of AI initiatives belong in Intelligence: which initiatives to sequence first, how to weigh trade-offs, and what an options-based investment case would look like. Home can ground the inventory and readiness, but Intelligence should synthesize the pattern-backed decision.\n\nThe next evidence to validate is initiative readiness detail before Intelligence produces a defensible recommendation.",
    );
    const question =
      "Which questions should be handed off to Intelligence rather than answered in Home?";
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
    expect(result.response.prose).toContain("Retail Demo");
    expect(result.response.prose).toContain("Intelligence");
    expect(result.response.safety.composerTrace?.fallbackUsed).toBe(false);
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
