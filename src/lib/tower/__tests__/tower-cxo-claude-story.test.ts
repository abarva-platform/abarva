import { buildTowerV3ContextPackFromTenantInputs } from "@/lib/enterprise-knowledge/tower/tower-v3-context-pack-from-tenant-inputs";
import { getAuditedAnthropicClient } from "@/lib/agent/stream";
import {
  applyTowerCxoClaudeStory,
  buildTowerCxoClaudeRequest,
  validateTowerCxoClaudePayload,
} from "../tower-cxo-claude-story";
import {
  buildTowerV3RuntimeViewModel,
  type TowerCxoStory,
  type TowerCxoVisualSpec,
  type TowerV3DefaultTabKey,
} from "../tower-v3-runtime-view";

jest.mock("@/lib/agent/stream", () => ({
  getAuditedAnthropicClient: jest.fn(),
}));

const mockedGetAuditedAnthropicClient =
  getAuditedAnthropicClient as jest.MockedFunction<
    typeof getAuditedAnthropicClient
  >;

const proof = () => {
  const { contextPack } = buildTowerV3ContextPackFromTenantInputs({
    tenantKey: "meridian-health",
    tenantName: "Meridian Health",
    activeInputRoot: "datasets/tenant-inputs/active/meridian-health/current",
  });
  const view = buildTowerV3RuntimeViewModel({
    tenantName: "Healthcare Demo",
    contextPack,
  });
  return { contextPack, view };
};

function goodClaudePayload(view: ReturnType<typeof buildTowerV3RuntimeViewModel>): {
  story: TowerCxoStory;
  visualSpecs: Record<TowerV3DefaultTabKey, TowerCxoVisualSpec>;
} {
  const scrub = (value: string) =>
    value
      .replace(/\bTowerValueClaim gate\b/gi, "finance evidence gate")
      .replace(/\bTowerContextPack\b/gi, "governed Tower packet")
      .replace(/\bv3\b/gi, "governed")
      .replace(/\bmetric records?\b/gi, "metrics")
      .replace(/\bvalue records?\b/gi, "value areas")
      .replace(/\bclaim gates?\b/gi, "evidence gates")
      .replace(/\bevidence refs?\b/gi, "evidence")
      .replace(/\bcontext gaps?\b/gi, "evidence gaps")
      .replace(/\bcertified financial outcome\b/gi, "board-ready proof")
      .replace(/\bcertified performance\b/gi, "board-ready proof");
  const tabs = Object.fromEntries(
    Object.entries(view.cxoStory.tabs).map(([key, tab]) => [
      key,
      {
        ...tab,
        headline:
          key === "overview"
            ? "The decision is not whether Meridian has value ideas; it is which ones are ready to govern."
            : tab.headline.replace(/\.$/, ""),
        summary:
          key === "value"
            ? "The value lens should rank planned benefits by proof readiness, not by the biggest forecast alone."
            : scrub(tab.summary),
        decisionImplication:
          key === "budget"
            ? "The CIO can use the budget lens to force run/change accountability before capital moves."
            : scrub(tab.decisionImplication),
        nextAction:
          key === "insights"
            ? "Run a joint CIO/CFO measurement sprint before any value claim enters steering materials."
            : scrub(tab.nextAction),
      },
    ]),
  ) as Record<TowerV3DefaultTabKey, TowerCxoStory["tabs"][TowerV3DefaultTabKey]>;
  return {
    story: {
      ...view.cxoStory,
      headline:
        "Meridian’s Tower story is a budget-to-value control conversation, not a savings victory lap.",
      executiveBrief:
        "Meridian has enough technology context to run a serious CIO/CFO portfolio conversation. The strongest move is to sequence planned value, budget pressure, and evidence blockers before any leadership material claims outcome proof.",
      cards: view.cxoStory.cards.map((card) => ({
        ...card,
        caption: `${scrub(card.caption)} This is the executive lens, not an accounting close.`,
      })),
      tabs,
    },
    visualSpecs: Object.fromEntries(
      Object.entries(view.cxoStory.tabs).map(([key, tab]) => [
        key,
        {
          key,
          visualType: tab.visualType,
          title: scrub(tab.headline),
          insight: scrub(tab.summary),
          dataRefs: [key],
          caveat: scrub(tab.decisionImplication),
        },
      ]),
    ) as Record<TowerV3DefaultTabKey, TowerCxoVisualSpec>,
  };
}

describe("Tower CXO Claude story synthesis", () => {
  beforeEach(() => {
    mockedGetAuditedAnthropicClient.mockReset();
  });

  it("builds a bounded prompt that asks Claude for story and visual specs without arbitrary HTML", () => {
    const { contextPack, view } = proof();
    const request = buildTowerCxoClaudeRequest({
      view,
      contextPack,
      tenantName: "Healthcare Demo",
    });

    expect(request.promptTrace.fullPrompt).toContain("Return this exact JSON shape");
    expect(request.promptTrace.fullPrompt).toContain("visualSpecs");
    expect(request.promptTrace.fullPrompt).toContain("Do not invent");
    expect(request.promptTrace.fullPrompt).not.toContain("<html");
    expect(request.promptTrace.promptByteLength).toBeGreaterThan(1000);
  });

  it("accepts a valid Claude story and marks the runtime view as Claude-validated", async () => {
    const { contextPack, view } = proof();
    const payload = goodClaudePayload(view);
    mockedGetAuditedAnthropicClient.mockResolvedValue({
      client: {
        messages: {
          create: jest.fn().mockResolvedValue({
            content: [{ type: "text", text: JSON.stringify(payload) }],
          }),
        },
      } as never,
      auditId: "audit-tower-story-1",
      dataClass: "confidential",
    });

    const result = await applyTowerCxoClaudeStory({
      view,
      contextPack,
      tenantName: "Healthcare Demo",
    });

    expect(result.used).toBe(true);
    expect(result.view.cxoStorySource).toBe("claude_validated");
    expect(result.view.cxoStoryAuditId).toBe("audit-tower-story-1");
    expect(result.view.cxoStory.headline).toMatch(/budget-to-value control/);
    expect(result.view.cxoStory.cards.map((card) => card.value)).toEqual(
      view.cxoStory.cards.map((card) => card.value),
    );
    const egressCall = mockedGetAuditedAnthropicClient.mock.calls[0]?.[0];
    expect(egressCall).toEqual(
      expect.objectContaining({
        artifactType: "tower_cxo_story_block",
        metadata: expect.objectContaining({
          contextPackId: view.contextPackId,
        }),
      }),
    );
    expect(egressCall).not.toHaveProperty("artifactId");
  });

  it("rejects Claude output that changes locked values or leaks internal language", () => {
    const { view } = proof();
    const payload = goodClaudePayload(view);
    payload.story.cards[0].value = "$999.0M";
    payload.story.executiveBrief =
      "The TowerContextPack and claim gates prove realized value.";

    const validation = validateTowerCxoClaudePayload(payload, view);

    expect(validation.passed).toBe(false);
    expect(validation.issues).toEqual(
      expect.arrayContaining([
        "Story card 1 changed locked value.",
        "Story leaks internal implementation language.",
        "Story makes unsupported outcome-proof claims.",
      ]),
    );
  });

  it("falls back to deterministic story when Claude output fails validation", async () => {
    const { contextPack, view } = proof();
    const payload = goodClaudePayload(view);
    payload.story.executiveBrief = "Healthcare Demo has achieved ROI from v3 value records.";
    mockedGetAuditedAnthropicClient.mockResolvedValue({
      client: {
        messages: {
          create: jest.fn().mockResolvedValue({
            content: [{ type: "text", text: JSON.stringify(payload) }],
          }),
        },
      } as never,
      auditId: "audit-tower-story-bad",
      dataClass: "confidential",
    });

    const result = await applyTowerCxoClaudeStory({
      view,
      contextPack,
      tenantName: "Healthcare Demo",
    });

    expect(result.used).toBe(false);
    expect(result.view.cxoStorySource).toBe("claude_fallback");
    expect(result.view.cxoStory.headline).toBe(view.cxoStory.headline);
    expect(result.view.cxoStoryValidation.issues.length).toBeGreaterThan(0);
  });
});
