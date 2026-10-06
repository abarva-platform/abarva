import { getEnterpriseLandscapeViewModel } from "@/lib/home/enterprise-landscape-view-model";
import { classifyAbarvaAnswerMode } from "@/lib/intelligence/ask/response-policy";
import { buildStarterPrompts } from "../AdvisoryIntelligencePage";

const TENANT_KEYS = ["skyharbor", "apexretail"];

describe("Intelligence starter prompts", () => {
  it("offers four distinct executive jobs", () => {
    const prompts = buildStarterPrompts(
      getEnterpriseLandscapeViewModel({ clientKey: "skyharbor" }),
    );
    expect(prompts).toHaveLength(4);
    expect(new Set(prompts).size).toBe(4);
  });

  it("routes the invest, outlook and pressure-test starters to a governed contract", () => {
    // The starters are the product's own advertisement of what Intelligence
    // can do. If one of them falls through to `general`, the surface promises
    // an advisory answer and returns a less specific one.
    for (const clientKey of TENANT_KEYS) {
      const [, invest, outlook, pressureTest] = buildStarterPrompts(
        getEnterpriseLandscapeViewModel({ clientKey }),
      );
      for (const prompt of [invest, outlook, pressureTest]) {
        expect([clientKey, prompt, classifyAbarvaAnswerMode(prompt)]).toEqual([
          clientKey,
          prompt,
          "industry_trend_to_ai_bets",
        ]);
      }
    }
  });

  it("names the tenant in the starters that are about the tenant", () => {
    for (const clientKey of TENANT_KEYS) {
      const viewModel = getEnterpriseLandscapeViewModel({ clientKey });
      const [currentState, invest] = buildStarterPrompts(viewModel);
      expect(currentState).toContain(viewModel.tenantName);
      expect(invest).toContain(viewModel.tenantName);
    }
  });

  it("keeps the outlook starter readable for every tenant vertical", () => {
    // Verticals include "Global Airline" and "Diversified Holdco", which do not
    // read well interpolated into a sentence, so the outlook starter says
    // "our industry" instead of naming the vertical.
    for (const clientKey of TENANT_KEYS) {
      const [, , outlook] = buildStarterPrompts(
        getEnterpriseLandscapeViewModel({ clientKey }),
      );
      expect(outlook).toContain("our industry");
    }
  });
});
