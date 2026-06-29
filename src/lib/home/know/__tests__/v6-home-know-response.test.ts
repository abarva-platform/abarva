import { shapeHomeKnowResponseForRender } from "@/lib/home/know/home-render-layer-shaper";
import { answerHomeKnowFromV6 } from "@/lib/home/know/v6-home-ask";
import { toHomeKnowResponseFromV6 } from "@/lib/home/know/v6-home-know-response";

describe("Home V6 KNOW response contract", () => {
  it("adapts the V6 dataset contract into the HomeKnowResponse shape without legacy fallback", () => {
    const result = answerHomeKnowFromV6({
      tenantKey: "skyharbor",
      question: "What AI footprint do we have loaded?",
      includeTrace: true,
    });

    const response = toHomeKnowResponseFromV6(result, {
      question: "What AI footprint do we have loaded?",
    });

    expect(response.mode).toBe("KNOW");
    expect(response.tenantKey).toBe("skyharbor");
    expect(response.prose).toBe(result.answer.directAnswer);
    expect(response.tables).toHaveLength(1);
    expect(response.citations.length).toBeGreaterThan(0);
    expect(response.safety.composerTrace?.composer).toBe(
      "home_v6_dataset_contract",
    );
    expect(response.safety.composerTrace?.fallbackUsed).toBe(false);
    expect(response.safety.composerTrace?.reason).toContain(
      "oldSemanticLayersSunset=true",
    );
    expect(response.safety.composerTrace?.reason).toContain(
      "datasetDir=skyharbor-air-synthetic-v6",
    );
  });

  it("keeps V6-visible sections byte-stable through the Home render shaper", () => {
    const result = answerHomeKnowFromV6({
      tenantKey: "lakeshore",
      question: "How is our IT organization structured today?",
      includeTrace: true,
    });
    const response = toHomeKnowResponseFromV6(result, {
      question: "How is our IT organization structured today?",
    });
    const before = JSON.stringify({
      prose: response.prose,
      tables: response.tables,
      gaps: response.gaps,
      citations: response.citations,
    });

    const shaped = shapeHomeKnowResponseForRender(response);

    const after = JSON.stringify({
      prose: shaped.prose,
      tables: shaped.tables,
      gaps: shaped.gaps,
      citations: shaped.citations,
    });
    expect(after).toBe(before);
  });

  it("resolves Financial Services demo aliases to the canonical V6 dataset", () => {
    for (const tenantKey of ["arcturus", "firstcapital", "first-capital"]) {
      const result = answerHomeKnowFromV6({
        tenantKey,
        question: "What business context is available for Financial Services Demo?",
        includeTrace: true,
      });

      expect(result.tenant.appClientKey).toBe("arcturus");
      expect(result.tenant.displayName).toBe("Financial Services Demo");
      expect(result.tenant.datasetDir).toBe(
        "first-capital-financial-synthetic-v6",
      );
      expect(result.proof.datasetDir).toBe(
        "first-capital-financial-synthetic-v6",
      );
    }
  });
});
