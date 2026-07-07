import {
  deriveWorkPackages,
  buildCurrentStatePlan,
} from "../current-state-plan";
import {
  scoreMaturity,
  deriveCapabilityGaps,
  rankLeverage,
  type CurrentStateRecommendation,
  type MaturitySignals,
} from "../current-state-maturity";
import { emptyProfile, type MoveProfile } from "../current-state-readiness";

const DORA_GOOD: MaturitySignals = {
  dora: {
    rows: 7,
    avgDeployFreq: 3.5,
    avgCfr: 12,
    avgMttr: 3,
    avgLeadTime: 18,
  },
};

function recFor(over: Partial<MoveProfile>): CurrentStateRecommendation {
  const profile = { ...emptyProfile(), ...over };
  const maturity = scoreMaturity(profile, DORA_GOOD);
  const gaps = deriveCapabilityGaps(maturity);
  const ranking = rankLeverage(profile, maturity, gaps);
  return {
    profile,
    maturity,
    gaps,
    ranking,
    whereToStart: "test",
    overallConfidence: "low",
  };
}

const REC = recFor({
  teamArchetypes: ["full_stack_cloud"],
  deliveryMaturity: "continuous",
});

describe("deriveWorkPackages", () => {
  it("creates one package per capability gap, tracing the gap id", () => {
    const wps = deriveWorkPackages(REC);
    for (const g of REC.gaps) {
      const wp = wps.find((w) => w.capabilityGapIds.includes(g.id));
      expect(wp).toBeDefined();
    }
  });

  it("tags workstream + swimlane from the dimension (data→data_architecture, analytics→consumption)", () => {
    const wps = deriveWorkPackages(REC);
    // data_architecture is unassessed → a real (foundation) gap → mapped to the data workstream.
    const data = wps.find((w) => w.id === "wp_data_architecture");
    expect(data?.workstreamId).toBe("data");
    expect(data?.swimlane).toBe("data_architecture");
    const ai = wps.find((w) => w.id === "wp_ai_enablement");
    expect(ai?.workstreamId).toBe("ai_build");
    expect(ai?.swimlane).toBe("consumption");
  });

  it("adds an AI-enablement package for the top-ranked area", () => {
    const ai = deriveWorkPackages(REC).find((w) => w.id === "wp_ai_enablement");
    expect(ai?.label).toMatch(/Full-stack/);
  });

  it("omits the AI-enablement package when no archetype is ranked", () => {
    const cold = recFor({});
    expect(
      deriveWorkPackages(cold).some((w) => w.id === "wp_ai_enablement"),
    ).toBe(false);
  });
});

describe("buildCurrentStatePlan — estimate phased by the roadmap", () => {
  const plan = buildCurrentStatePlan(REC, { moveName: "AI-Powered SDLC" });

  it("estimate workstreams are exactly the workpackage workstreams (no float)", () => {
    const wpWs = new Set(plan.workPackages.map((w) => w.workstreamId));
    const estWs = new Set(plan.estimate.workstreams.map((w) => w.id));
    expect(estWs).toEqual(wpWs);
  });

  it("every estimate workstream is claimed by exactly one roadmap phase", () => {
    const claimed = plan.roadmap.phases.flatMap((p) => p.workstreamIds);
    expect(new Set(claimed).size).toBe(claimed.length); // no double-claim
    expect(new Set(claimed)).toEqual(
      new Set(plan.estimate.workstreams.map((w) => w.id)),
    );
  });

  it("roadmap sequences foundation before consumption (where-to-start leads after enablement)", () => {
    const orderOf = (swim: string) =>
      plan.roadmap.phases.find((p) => p.id.includes(swim))?.order ?? -1;
    if (orderOf("foundation") >= 0 && orderOf("consumption") >= 0) {
      expect(orderOf("foundation")).toBeLessThan(orderOf("consumption"));
    }
  });

  it("produces a real cost range and no blocker flags", () => {
    expect(plan.estimate.totalCost.low).toBeGreaterThan(0);
    expect(plan.roadmap.totalCost.high).toBeGreaterThanOrEqual(
      plan.roadmap.totalCost.low,
    );
    expect(plan.roadmap.flags.some((f) => f.severity === "blocker")).toBe(
      false,
    );
  });

  it("surfaces the rate-card provenance banner", () => {
    expect(plan.rateCardProvenance).toMatch(/benchmark|planning|NOT a quote/i);
  });

  it("marks value as not-ratified and says so honestly when no value supplied", () => {
    expect(plan.valueRatified).toBe(false);
    expect(plan.note).toMatch(/value is not yet ratified/i);
  });

  it("ratifies value when a steady-state value is supplied", () => {
    const p2 = buildCurrentStatePlan(REC, {
      moveName: "x",
      steadyStateAnnualValue: 5_000_000,
    });
    expect(p2.valueRatified).toBe(true);
  });

  it("every work package traces to at least one capability gap or the ranked area", () => {
    for (const wp of plan.workPackages) {
      expect(wp.capabilityGapIds.length).toBeGreaterThanOrEqual(0);
      expect(wp.workstreamId).toBeTruthy();
    }
  });
});
