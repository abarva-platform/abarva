import {
  buildPhaseCharts,
  type CostScenariosChart,
  type GovernedShareChart,
  type RootCauseParetoChart,
  type SensitivityTornadoChart,
  type ValueBridgeChart,
} from "@/lib/programs/moves-phase-charts";
import type {
  InstrumentReadiness,
  ReadinessReport,
  ReadinessStatus,
} from "@/lib/programs/current-state-readiness";
import type { EvidenceKind } from "@/lib/programs/archetypes/types";

function instrument(
  over: Partial<InstrumentReadiness> &
    Pick<InstrumentReadiness, "key" | "label">,
): InstrumentReadiness {
  return {
    kind: "qualitative",
    whyNeeded: "Needed to diagnose the current state.",
    sourceDocHint: "Governance ownership map",
    severity: "hard",
    status: "missing",
    backingTable: null,
    committedRows: 0,
    rationale: "Applies to this archetype at this phase.",
    documentFamily: true,
    pendingReviews: [],
    evidenceDigest: [],
    ...over,
  };
}

function report(
  phase: number,
  instruments: InstrumentReadiness[],
): ReadinessReport {
  const hardGaps = instruments
    .filter((i) => i.severity === "hard" && i.status !== "committed")
    .map((i) => i.key);
  const softGaps = instruments
    .filter((i) => i.severity === "soft" && i.status !== "committed")
    .map((i) => i.key);
  return {
    phase,
    archetypeId: "arch_1",
    archetypeName: "Data remediation",
    archetypeVersion: "1.0.0",
    profile: {} as ReadinessReport["profile"],
    instruments,
    coverageScore: 0,
    hardGaps,
    softGaps,
  };
}

const byKind = (kind: EvidenceKind, status: ReadinessStatus, n = 1) =>
  Array.from({ length: n }, (_, i) =>
    instrument({ key: `${kind}_${status}_${i}`, label: `${kind} ${i}`, kind, status }),
  );

describe("buildPhaseCharts — gating", () => {
  it("returns null for every non-intelligence phase", () => {
    for (const phase of [0, 1, 3, 5]) {
      expect(
        buildPhaseCharts({ phase, readiness: null, contentSignals: [] }),
      ).toBeNull();
    }
  });

  it("returns a model for the intelligence phases P2 and P4", () => {
    expect(
      buildPhaseCharts({ phase: 2, readiness: null, contentSignals: [] }),
    ).not.toBeNull();
    expect(
      buildPhaseCharts({ phase: 4, readiness: null, contentSignals: [] }),
    ).not.toBeNull();
  });
});

describe("P2 governed share — derived from readiness states", () => {
  const rep = report(2, [
    instrument({ key: "identity", label: "Enterprise identity", status: "committed" }),
    instrument({ key: "measures", label: "Certified measures", status: "review_required" }),
    instrument({ key: "access", label: "PHI access", status: "missing" }),
  ]);
  const model = buildPhaseCharts({ phase: 2, readiness: rep, contentSignals: [] })!;
  const share = model.charts.find(
    (c): c is GovernedShareChart => c.kind === "governed_share",
  )!;

  it("is NOT illustrative and is readiness-derived", () => {
    expect(share.illustrative).toBe(false);
    expect(share.provenance).toBe("readiness_derived");
    expect(share.provenanceLabel).toBe("Readiness-derived");
  });

  it("emits one datum per instrument, with the status-mapped fraction and label", () => {
    expect(share.data).toHaveLength(3);
    expect(share.data[0]).toMatchObject({
      key: "identity",
      fraction: 1,
      valueLabel: "100%",
      statusLabel: "Committed",
    });
    expect(share.data[1]).toMatchObject({
      key: "measures",
      fraction: 0.5,
      valueLabel: "50%",
      statusLabel: "In review",
    });
    expect(share.data[2]).toMatchObject({
      key: "access",
      fraction: 0,
      valueLabel: "0%",
      statusLabel: "Not provided",
    });
  });

  it("marks the whole P2 model non-illustrative with no honesty note when all charts are real", () => {
    expect(model.anyIllustrative).toBe(false);
    expect(model.honestyNote).toBeNull();
  });
});

describe("P2 root-cause Pareto — derived from the open gaps", () => {
  const rep = report(2, [
    instrument({ key: "c", label: "committed", status: "committed", kind: "org" }),
    ...byKind("qualitative", "missing", 3), // Definitions & process ×3
    ...byKind("org", "missing", 2), // Ownership & identity ×2
    ...byKind("document", "review_required", 1), // Governance evidence ×1
  ]);
  const model = buildPhaseCharts({ phase: 2, readiness: rep, contentSignals: [] })!;
  const pareto = model.charts.find(
    (c): c is RootCauseParetoChart => c.kind === "root_cause_pareto",
  )!;

  it("is gap-derived and sorts categories by descending count", () => {
    expect(pareto.illustrative).toBe(false);
    expect(pareto.provenance).toBe("gap_derived");
    expect(pareto.data.map((d) => d.label)).toEqual([
      "Definitions & process",
      "Ownership & identity",
      "Governance evidence",
    ]);
  });

  it("uses only the OPEN gaps as the denominator (committed excluded)", () => {
    // 6 open gaps total: 3 + 2 + 1.
    expect(pareto.data[0].valueLabel).toBe("50%"); // 3/6
    expect(pareto.data[1].valueLabel).toBe("33%"); // 2/6
    expect(pareto.data[2].valueLabel).toBe("17%"); // 1/6
  });

  it("has a monotonic cumulative that reaches 100%", () => {
    const cum = pareto.data.map((d) => d.cumulativeFraction);
    for (let i = 1; i < cum.length; i += 1) {
      expect(cum[i]).toBeGreaterThanOrEqual(cum[i - 1]);
    }
    expect(cum[cum.length - 1]).toBeCloseTo(1, 6);
    expect(pareto.data[pareto.data.length - 1].cumulativeLabel).toBe("100%");
    expect(pareto.thresholdFraction).toBe(0.8);
  });

  it("omits the Pareto when there are no open gaps", () => {
    const allCommitted = report(2, [
      instrument({ key: "a", label: "a", status: "committed" }),
      instrument({ key: "b", label: "b", status: "committed" }),
    ]);
    const m = buildPhaseCharts({ phase: 2, readiness: allCommitted, contentSignals: [] })!;
    expect(m.charts.some((c) => c.kind === "root_cause_pareto")).toBe(false);
    expect(m.charts.some((c) => c.kind === "governed_share")).toBe(true);
    expect(m.anyIllustrative).toBe(false);
  });
});

describe("P2 without a readiness report — labelled illustrative fallback", () => {
  const model = buildPhaseCharts({ phase: 2, readiness: null, contentSignals: [] })!;

  it("falls back to illustrative placeholders for both P2 charts", () => {
    expect(model.charts.map((c) => c.kind)).toEqual([
      "governed_share",
      "root_cause_pareto",
    ]);
    expect(model.charts.every((c) => c.illustrative)).toBe(true);
    expect(model.anyIllustrative).toBe(true);
    expect(model.honestyNote).toMatch(/Illustrative/);
    expect(model.honestyNote).toMatch(/no figure is presented as a confirmed/i);
  });

  it("also falls back when a readiness report has no instruments", () => {
    const empty = buildPhaseCharts({
      phase: 2,
      readiness: report(2, []),
      contentSignals: [],
    })!;
    expect(empty.charts.every((c) => c.illustrative)).toBe(true);
  });
});

describe("P4 business case — all illustrative, no governed baseline", () => {
  const model = buildPhaseCharts({ phase: 4, readiness: null, contentSignals: [] })!;

  it("renders cost scenarios, value bridge and sensitivity, all illustrative", () => {
    expect(model.surface).toBe("business_case");
    expect(model.charts.map((c) => c.kind)).toEqual([
      "cost_scenarios",
      "value_bridge",
      "sensitivity_tornado",
    ]);
    expect(model.charts.every((c) => c.illustrative)).toBe(true);
    expect(model.charts.every((c) => c.provenance === "illustrative")).toBe(true);
    expect(model.anyIllustrative).toBe(true);
    expect(model.honestyNote).toMatch(/Every figure here is illustrative/i);
  });

  it("stays illustrative even when a readiness report exists (no Finance baseline is modelled)", () => {
    const withReadiness = buildPhaseCharts({
      phase: 4,
      readiness: report(4, [
        instrument({ key: "x", label: "x", status: "committed", kind: "financial" }),
      ]),
      contentSignals: [],
    })!;
    expect(withReadiness.charts.every((c) => c.illustrative)).toBe(true);
  });

  it("carries well-formed cost / value / sensitivity series", () => {
    const cost = model.charts.find(
      (c): c is CostScenariosChart => c.kind === "cost_scenarios",
    )!;
    // low <= mid <= high on every scenario; axis covers the top of the range.
    for (const d of cost.data) {
      expect(d.low).toBeLessThanOrEqual(d.mid);
      expect(d.mid).toBeLessThanOrEqual(d.high);
      expect(d.high).toBeLessThanOrEqual(cost.axisMax);
    }

    const bridge = model.charts.find(
      (c): c is ValueBridgeChart => c.kind === "value_bridge",
    )!;
    const flows = bridge.steps.filter((s) => s.stepKind !== "net");
    const sum = flows.reduce((a, s) => a + s.delta, 0);
    const net = bridge.steps.find((s) => s.stepKind === "net")!;
    // The waterfall's net equals the sum of the flows (internally consistent).
    expect(Math.round(sum * 10) / 10).toBe(net.delta);
    expect(net.delta).toBe(bridge.net);

    const sens = model.charts.find(
      (c): c is SensitivityTornadoChart => c.kind === "sensitivity_tornado",
    )!;
    for (const d of sens.data) {
      expect(d.low).toBeLessThanOrEqual(d.high);
      expect(d.low).toBeGreaterThanOrEqual(sens.axisMin);
      expect(d.high).toBeLessThanOrEqual(sens.axisMax);
    }
  });
});
