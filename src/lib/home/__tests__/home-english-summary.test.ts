import { buildHomeDataQualityModel } from "@/lib/home/home-data-quality";
import { buildHomeEnglishSummary } from "@/lib/home/home-english-summary";

describe("Home English summary renderer", () => {
  it("renders SkyHarbor as source-rich and partial without active-truth overclaim", () => {
    const dataQuality = buildHomeDataQualityModel({
      repoRoot: process.cwd(),
      tenantKey: "skyharbor",
      tenantDisplayName: "Airline Demo",
    });

    const summary = buildHomeEnglishSummary(dataQuality);
    const rendered = [
      summary.currentUnderstanding,
      summary.completenessMeaning,
      summary.relationshipPosture,
      summary.answerability,
      summary.nextDataAction,
      ...summary.decisionCautions,
    ].join(" ");

    expect(summary.title).toBe("What this means");
    expect(summary.statusLabel).toBe("Partial context");
    expect(rendered).toMatch(/rich source estate/i);
    expect(rendered).toMatch(/partial/i);
    expect(rendered).toMatch(/active Home/i);
    expect(rendered).toMatch(/applications/i);
    expect(rendered).toMatch(/systems/i);
    expect(rendered).toMatch(/relationship/i);
    expect(rendered).toMatch(/full enterprise estate coverage/i);
    expect(rendered).not.toMatch(/full enterprise coverage is available/i);
    expect(rendered).not.toMatch(/candidate data is active/i);
    expect(rendered).not.toMatch(/realized value is proven/i);
    expect(summary.guardrails).toMatchObject({
      deterministicRenderer: true,
      callsClaude: false,
      productionTenantDataWritten: false,
      activeTenantAccessLayerUpdated: false,
      candidatePromoted: false,
      moduleRuntimeConsumptionChanged: false,
      candidateReadByDefault: false,
    });
  });

  it("labels explicit candidate preview as inactive candidate-only context", () => {
    const dataQuality = buildHomeDataQualityModel({
      repoRoot: process.cwd(),
      tenantKey: "skyharbor",
      tenantDisplayName: "Airline Demo",
      candidatePreviewEnabled: true,
    });

    const summary = buildHomeEnglishSummary(dataQuality);

    expect(summary.statusLabel).toBe("Candidate-only");
    expect(summary.currentUnderstanding).toMatch(/inactive candidate preview/i);
    expect(summary.completenessMeaning).toMatch(/candidate-only coverage/i);
    expect(summary.answerability).toMatch(/must not describe candidate data as active/i);
    expect(summary.decisionCautions.join(" ")).toMatch(/candidate preview data is active/i);
  });

  it("renders non-SkyHarbor summaries from the tenant model without SkyHarbor-specific copy", () => {
    const dataQuality = buildHomeDataQualityModel({
      repoRoot: process.cwd(),
      tenantKey: "meridian-health",
      tenantDisplayName: "Meridian Health",
    });

    const summary = buildHomeEnglishSummary(dataQuality);
    const rendered = [
      summary.currentUnderstanding,
      summary.completenessMeaning,
      summary.nextDataAction,
    ].join(" ");

    expect(summary.tenantDisplayName).toBe("Meridian Health");
    expect(rendered).toMatch(/Meridian Health/i);
    expect(rendered).toMatch(/source-rich, candidate-thin/i);
    expect(rendered).not.toMatch(/Airline Demo/i);
    expect(rendered).not.toMatch(/Applications and systems remediation/i);
  });

  it("returns an honest not-available summary without a model", () => {
    const summary = buildHomeEnglishSummary(null);

    expect(summary.statusLabel).toBe("Not ready for decision");
    expect(summary.currentUnderstanding).toMatch(/not available yet/i);
    expect(summary.answerability).toMatch(/what is missing/i);
    expect(summary.guardrails.callsClaude).toBe(false);
  });
});
