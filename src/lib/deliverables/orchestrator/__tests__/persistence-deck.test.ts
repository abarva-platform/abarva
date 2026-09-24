export {};

import {
  deckExhibitsRenderedAsVisual,
  persistDeliverable,
} from "../persistence";
import type { OrchestrationResult } from "../orchestrator";
import type { RenderableDeliverable } from "../types";
import type { TenantAiPolicy } from "@/lib/integrations/ai-egress";
import {
  renderDeckHtml,
  type StorylineDeck,
} from "@/lib/visual-system/storyline-deck";

function doc(): RenderableDeliverable {
  return {
    title: "AI Trade Finance L/C Automation — Business Case",
    clientDisplayName: "First Capital Financial",
    initiativeDisplayName: "AI Trade Finance L/C Automation",
    generatedSections: [
      {
        key: "cs",
        title: "Current-State Baseline",
        bodyMarkdown: "…",
        groundingMode: "governed_facts",
        citationsUsed: [1],
      },
    ],
    tables: [],
    exhibits: [],
    sourceRegister: [
      {
        citationNumber: 1,
        label: "FY26 run cost",
        evidenceFamily: "run_cost_baseline",
        confidence: "high",
      },
    ],
    assumptions: [],
    clientCompleteChecklist: [],
    recommendation: "Fund an AI-native build; it pays back quickly.",
    nextActions: ["Approve"],
  };
}

function result(): OrchestrationResult {
  return {
    ok: true,
    document: doc(),
    brief: {
      module: "moves",
      deliverableType: "business_case",
      decisionToSupport: "Fund the build",
    },
    quality: { pass: true, blockers: [], warnings: [], metrics: {} },
    passTrace: [],
  } as unknown as OrchestrationResult;
}

const opts = (extra: Record<string, unknown>) => ({
  clientId: "c1",
  renderedBy: "u1",
  sourceArtifactRef: "m1",
  tenantPolicy: {} as TenantAiPolicy,
  ...extra,
});

function captureSave() {
  const captured: {
    html?: string;
    outputFormat?: string;
    quarantined?: boolean;
    quarantineReason?: string | null;
  } = {};
  const save = (async (
    _input: unknown,
    rendered: {
      html: string;
      outputFormat: string;
      quarantined?: boolean;
      quarantineReason?: string | null;
    },
  ) => {
    captured.html = rendered.html;
    captured.outputFormat = rendered.outputFormat;
    captured.quarantined = rendered.quarantined;
    captured.quarantineReason = rendered.quarantineReason;
    return { id: "a1", outputFormat: rendered.outputFormat } as never;
  }) as never;
  return { captured, save };
}

function storylineDeck(): StorylineDeck {
  return {
    engagement: "Synthetic operating move",
    client: "Synthetic cover tenant",
    title: "Executive Handoff",
    slides: [
      {
        kind: "decision_headline",
        governingMessage:
          "The evidence supports moving from pilot to controlled execution",
        exhibit: "decision_headline",
      },
      {
        kind: "value",
        governingMessage: "The value story depends on adoption and controls",
        exhibit: "value_story",
      },
      {
        kind: "roadmap",
        governingMessage: "Delivery should sequence foundation before scale",
        exhibit: "roadmap_lanes",
      },
      {
        kind: "risks",
        governingMessage: "Risk mitigation must be owned from day one",
        exhibit: "risks_and_mitigations",
      },
    ],
  };
}

describe("persistDeliverable — flag-gated decision-storytelling deck", () => {
  it("renders the exhibit-led HTML preview without changing the governed final format", async () => {
    const { captured, save } = captureSave();
    await persistDeliverable(
      result(),
      opts({ renderAsDeck: true, tenantKey: "first-capital" }),
      { save },
    );
    expect(captured.outputFormat).toBe("docx");
    expect(captured.html?.startsWith("<!doctype html")).toBe(true);
    expect(captured.html).toContain("AI Trade Finance L/C Automation");
    expect(captured.html).toContain("AbarVa"); // deck chrome
  });

  it("renders the prose document (docx-prescribed) when the flag is off", async () => {
    const { captured, save } = captureSave();
    await persistDeliverable(result(), opts({}), { save });
    expect(captured.outputFormat).toBe("docx"); // business_case prescribed format, unchanged
    expect(captured.html).not.toContain("AbarVa · Moves"); // not the deck chrome
  });

  it("does not count deck exhibit labels as rendered visuals", () => {
    const deck = storylineDeck();
    const html = renderDeckHtml(deck);
    expect(html).toContain('data-exhibit="decision_headline"');
    expect(deckExhibitsRenderedAsVisual(html, deck)).toEqual([]);
  });

  it("credits only visuals inside the matching exhibit block", () => {
    const deck = storylineDeck();
    const html = renderDeckHtml(deck);
    const outsideVisual = `<svg aria-label="unrelated"></svg>${html}`;
    expect(deckExhibitsRenderedAsVisual(outsideVisual, deck)).toEqual([]);

    const inlineVisual = html.replace(
      'data-exhibit="decision_headline">Exhibit',
      'data-exhibit="decision_headline"><svg aria-label="real exhibit"></svg>Exhibit',
    );
    expect(deckExhibitsRenderedAsVisual(inlineVisual, deck)).toEqual([
      "decision_headline",
    ]);
  });

  it("quarantines a profile-rendered storyline deck when exhibits are labels only", async () => {
    const { captured, save } = captureSave();
    await persistDeliverable(
      result(),
      opts({
        deliverableTypeKey: "handoff_package",
        outputFormat: "pptx",
        renderViaProfile: true,
        structuredModels: { storylineDeck: storylineDeck() },
      }),
      { save },
    );

    expect(captured.outputFormat).toBe("pptx");
    expect(captured.quarantined).toBe(true);
    expect(captured.quarantineReason).toMatch(/blocked_missing/);
  });
});
