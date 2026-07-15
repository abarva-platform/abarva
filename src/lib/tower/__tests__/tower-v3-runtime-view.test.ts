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

  it("does not expose raw JSON or unsupported outcome language in the visible runtime view model", () => {
    const { contextPack } = proof();
    const view = buildTowerV3RuntimeViewModel({
      tenantName: "Meridian Health",
      contextPack,
    });
    const visibleText = [
      view.headline,
      ...view.caveats,
      ...view.nextMeasurementActions,
      ...view.metricFamilies.map((item) => `${item.label} ${item.baselineStatus} ${item.targetStatus}`),
      ...view.valueHypotheses.map((item) => `${item.label} ${item.value} ${item.claimBasis} ${item.gateStatus}`),
      ...view.gapThemes.map((item) => `${item.title} ${item.whyItMatters}`),
    ].join(" ");

    expect(visibleText).not.toMatch(/\{|\}|raw json/i);
    expect(visibleText).not.toMatch(/\bv[0-9]\b/i);
    expect(visibleText).not.toMatch(/realized value|proven value|delivered value|harvested savings|achieved ROI|value captured/i);
  });
});
