export {};

import { persistDeliverable } from "../persistence";
import type { OrchestrationResult } from "../orchestrator";
import type { RenderableDeliverable } from "../types";
import type { TenantAiPolicy } from "@/lib/integrations/ai-egress";

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
  const captured: { html?: string; outputFormat?: string } = {};
  const save = (async (
    _input: unknown,
    rendered: { html: string; outputFormat: string },
  ) => {
    captured.html = rendered.html;
    captured.outputFormat = rendered.outputFormat;
    return { id: "a1", outputFormat: rendered.outputFormat } as never;
  }) as never;
  return { captured, save };
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
});
