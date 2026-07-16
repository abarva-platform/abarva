import {
  aggregateTowerV3GapThemes,
  buildTowerV3RuntimeViewModel,
} from "../tower-v3-runtime-view";
import { buildTowerV3ContextPackFromTenantInputs } from "@/lib/enterprise-knowledge/tower/tower-v3-context-pack-from-tenant-inputs";

const proof = () =>
  buildTowerV3ContextPackFromTenantInputs({
    tenantKey: "meridian-health",
    tenantName: "Meridian Health",
    activeInputRoot: "datasets/tenant-inputs/active/meridian-health/current",
  });

describe("Tower v3 runtime view", () => {
  it("aggregates repeated Meridian row-level gaps into executive blocker themes", () => {
    const { contextPack } = proof();
    const themes = aggregateTowerV3GapThemes(contextPack);

    expect(contextPack.gaps.length).toBeGreaterThan(100);
    expect(themes.length).toBeLessThan(10);
    expect(themes.map((theme) => theme.title)).toEqual(
      expect.arrayContaining([
        "Baseline metrics need validation",
        "Value claims are planning-grade only",
        "AWS/Databricks foundation is target-state, not production-certified",
        "Operational evidence needs owner confirmation",
        "Managed services / contract / SLA evidence is incomplete",
      ]),
    );
    expect(themes.every((theme) => theme.representativeEvidenceRefs.length > 0)).toBe(true);
    expect(themes.every((theme) => theme.requiredEvidence.length > 0)).toBe(true);
  });

  it("renders Meridian as measurement readiness and value hypothesis only", () => {
    const { contextPack } = proof();
    const view = buildTowerV3RuntimeViewModel({
      tenantName: "Meridian Health",
      contextPack,
    });

    expect(view.metricFamilies.length).toBeGreaterThan(0);
    expect(view.valueHypotheses.length).toBeGreaterThan(0);
    expect(view.gateCounts.caveated).toBe(79);
    expect(view.gateCounts.allowed).toBe(0);
    expect(view.gateCounts.blocked).toBe(0);
    expect(view.blockedOutcomeProof).toBe(true);
    expect(view.valueHypotheses.every((item) => item.gateStatus === "caveated")).toBe(true);
  });

  it("classifies every default Meridian tab as v3-derived and keeps bridge as diagnostic only", () => {
    const { contextPack } = proof();
    const view = buildTowerV3RuntimeViewModel({
      tenantName: "Meridian Health",
      contextPack,
    });

    expect(view.defaultTabs.map((tab) => tab.label)).toEqual([
      "Overview",
      "Value",
      "Budget",
      "Portfolio",
      "Benchmark",
      "Evidence",
      "Insights",
    ]);
    expect(
      view.defaultTabs.every((tab) =>
        [
          "tower_context_pack_v3_derived",
          "tower_projection_v3_derived",
        ].includes(tab.sourceClassification),
      ),
    ).toBe(true);
    expect(view.defaultTabs.every((tab) => tab.rows > 0)).toBe(true);
    expect(view.bridgeDiagnostics.sourceOfTruthStatus).toBe("bridge_only");
    expect(view.bridgeDiagnostics.v3ReconciliationStatus).toBe(
      "not_v3_reconciled",
    );
  });

  it("creates grounded CIO and CFO insights from the same TowerContextPack", () => {
    const { contextPack } = proof();
    const view = buildTowerV3RuntimeViewModel({
      tenantName: "Meridian Health",
      contextPack,
    });

    expect(view.executiveInsights.length).toBeGreaterThanOrEqual(4);
    expect(view.executiveInsights.map((insight) => insight.role)).toEqual(
      expect.arrayContaining(["CIO", "CFO"]),
    );
    expect(
      view.executiveInsights.every(
        (insight) =>
          insight.evidenceRefsUsed.length > 0 &&
          insight.contextGapsUsed.length > 0 &&
          insight.decisionImplication.length > 0 &&
          insight.claimStrength !== "measured",
      ),
    ).toBe(true);
  });

  it("creates a CXO-facing business story separate from runtime proof language", () => {
    const { contextPack } = proof();
    const view = buildTowerV3RuntimeViewModel({
      tenantName: "Healthcare Demo",
      contextPack,
    });

    expect(view.cxoStory.tenantDisplayName).toBe("Meridian");
    expect(view.cxoStory.cards).toHaveLength(4);
    expect(Object.keys(view.cxoStory.tabs)).toEqual([
      "overview",
      "value",
      "budget",
      "portfolio",
      "benchmark",
      "evidence",
      "insights",
    ]);
    expect(
      Object.values(view.cxoStory.tabs).every(
        (tab) =>
          tab.headline.length > 0 &&
          tab.summary.length > 0 &&
          tab.decisionImplication.length > 0 &&
          tab.nextAction.length > 0,
      ),
    ).toBe(true);

    const primaryStoryText = [
      view.cxoStory.eyebrow,
      view.cxoStory.headline,
      view.cxoStory.executiveBrief,
      ...view.cxoStory.cards.map((card) => `${card.label} ${card.value} ${card.caption}`),
      ...Object.values(view.cxoStory.tabs).map(
        (tab) => `${tab.headline} ${tab.summary} ${tab.decisionImplication} ${tab.nextAction}`,
      ),
    ].join(" ");

    expect(primaryStoryText).not.toMatch(/\{|\}|raw json/i);
    expect(primaryStoryText).not.toMatch(/\bTowerContextPack\b|\bv[467]\b|metric records|value records|claim gates|bridge diagnostics|evidence refs|context gaps/i);
    expect(primaryStoryText).not.toMatch(/Healthcare Demo/i);
    expect(primaryStoryText).not.toMatch(/realized value|proven value|delivered value|harvested savings|achieved ROI|value captured/i);
  });

  it("keeps proof posture available for diagnostics without using it as the CXO story", () => {
    const { contextPack } = proof();
    const view = buildTowerV3RuntimeViewModel({
      tenantName: "Meridian Health",
      contextPack,
    });

    expect(view.defaultTabs.some((item) => item.sourcePosture.includes("v3"))).toBe(true);
    expect(view.defaultTabs.every((item) => item.businessPosture.length > 0)).toBe(true);
    expect(view.bridgeDiagnostics.message).toMatch(/TowerContextPack/);
  });
});
