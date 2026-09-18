import {
  buildSkyHarborCtoReadinessPromptAddendum,
  buildSkyHarborCtoReadinessSource,
  buildSkyHarborCtoReadinessNativeCanvasBlock,
  isSkyHarborCtoReadinessQuestion,
  isSkyHarborTenantKey,
} from "../skyharbor-cto-readiness-source";

describe("SkyHarbor CTO readiness ask source", () => {
  it("provides an unavailable source without a readiness exhibit when curated IDs are absent", () => {
    const query = "Is IROPS ready for autonomous recovery?";
    const source = buildSkyHarborCtoReadinessSource(query, ["skyharbor-air"]);

    expect(source?.detail).toMatch(/curated CTO readiness evidence is unavailable/i);
    expect(source?.id).toBe("skyharbor-cto-readiness-unavailable");
    expect(source?.confidence).toBe(0);
    expect(source?.detail).not.toMatch(/IROPS-critical systems:|Recommended decision posture:/i);
    expect(buildSkyHarborCtoReadinessNativeCanvasBlock(query, ["skyharbor-air"])).toBe("");
    expect(buildSkyHarborCtoReadinessSource(query, ["other-tenant"])).toBeNull();
    expect(buildSkyHarborCtoReadinessSource(query, ["other-skyharbor-tenant"])).toBeNull();
    expect(buildSkyHarborCtoReadinessSource(query, ["meridian", "skyharbor-air"])).toBeNull();
    expect(buildSkyHarborCtoReadinessSource(query, ["unknown-tenant", "skyharbor-air"])).toBeNull();
    expect(buildSkyHarborCtoReadinessNativeCanvasBlock(query, ["meridian", "skyharbor-air"])).toBe("");
    expect(buildSkyHarborCtoReadinessSource(query, ["skyharbor_global"])?.id)
      .toBe("skyharbor-cto-readiness-unavailable");
  });
  it("recognizes SkyHarbor tenant aliases", () => {
    expect(isSkyHarborTenantKey("skyharbor-air")).toBe(true);
    expect(isSkyHarborTenantKey("skyharbor_global")).toBe(true);
    expect(isSkyHarborTenantKey("skyharbor-global")).toBe(true);
    expect(isSkyHarborTenantKey("SkyHarbor Air Group")).toBe(false);
    expect(isSkyHarborTenantKey("lakeshore-industries")).toBe(false);
    expect(isSkyHarborTenantKey("other-skyharbor-tenant")).toBe(false);
  });

  it("recognizes CTO/IROPS readiness questions without matching unrelated prompts", () => {
    expect(
      isSkyHarborCtoReadinessQuestion(
        "What is blocking agentic IROPS from scaling?",
      ),
    ).toBe(true);
    expect(
      isSkyHarborCtoReadinessQuestion(
        "What data must be certified before autonomous recovery decisions?",
      ),
    ).toBe(true);
    expect(
      isSkyHarborCtoReadinessQuestion(
        "What should the CTO fund first for AI readiness?",
      ),
    ).toBe(true);
    expect(
      isSkyHarborCtoReadinessQuestion(
        "Summarize the last conversation in one sentence.",
      ),
    ).toBe(false);
  });

  it("builds a refusal source only for exact SkyHarbor tenant aliases and readiness questions", () => {
    const source = buildSkyHarborCtoReadinessSource(
      "What is blocking agentic IROPS from scaling?",
      ["skyharbor-air"],
    );

    expect(source).toMatchObject({
      type: "TENANT",
      id: "skyharbor-cto-readiness-unavailable",
      name: "SkyHarbor CTO IROPS readiness unavailable",
      confidence: 0,
    });
    expect(source?.detail).toContain("Curated CTO readiness evidence is unavailable");
    expect(source?.detail).not.toContain("lakeshore");

    expect(
      buildSkyHarborCtoReadinessSource(
        "What is blocking agentic IROPS from scaling?",
        ["lakeshore-industries"],
      ),
    ).toBeNull();
    expect(
      buildSkyHarborCtoReadinessSource("What should legal automate?", [
        "skyharbor-air",
      ]),
    ).toBeNull();
  });

  it("instructs the model to state the unavailable path", () => {
    const addendum = buildSkyHarborCtoReadinessPromptAddendum(
      "Is the IROPS AI case board-grade today?",
      ["skyharbor-air"],
    );

    expect(addendum).toContain("CTO READINESS UNAVAILABLE");
    expect(addendum).toContain("State this refusal plainly");
    expect(addendum).not.toContain("SKYHARBOR CTO DEMO MODE");
  });
});
