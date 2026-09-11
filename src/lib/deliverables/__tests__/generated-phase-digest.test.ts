import { buildGeneratedPhaseDigest } from "../generated-phase-digest";
import {
  applyPhaseDigest,
  architectureMayProceed,
  emptySolutionContext,
} from "@/lib/programs/solution-context";

describe("generated phase digest", () => {
  it("turns a generated charter into P2-ready solution context", () => {
    const ctx = applyPhaseDigest(emptySolutionContext("m", "t"), {
      useCaseCandidate: "Unify clinical and claims data for quality KPIs",
    });
    const digest = buildGeneratedPhaseDigest({
      artifact: "charter",
      phase: 1,
      html: "<html><body><svg></svg><h1>Charter</h1></body></html>",
      context: ctx,
    });
    const next = applyPhaseDigest(ctx, digest);
    expect(next.useCase).toContain("clinical and claims");
    expect(next.kpis?.length).toBeGreaterThan(0);
  });

  it("keeps architecture blocked until a chosen option digest is applied", () => {
    let ctx = emptySolutionContext("m", "t");
    expect(architectureMayProceed(ctx).ready).toBe(false);
    ctx = applyPhaseDigest(ctx, {
      chosenOption: "Option C - Databricks lakehouse foundation",
      decisions: [
        {
          phase: 3,
          decision: "Approved solution option",
          rationale: "Best KPI and integration fit",
          approvedBy: "reviewer",
        },
      ],
    });
    expect(architectureMayProceed(ctx).ready).toBe(true);
  });

  it("carries exact diagnostic evidence forward after discovery generation", () => {
    const ctx = applyPhaseDigest(emptySolutionContext("m", "t"), {
      currentState: "Care-gap closure and interface monitoring evidence captured.",
      gaps: ["Interface monitoring incomplete"],
      baselineMetrics: {
        "Care-gap closure rate": "41.2% [quality_measures.csv]",
        "Unmonitored interfaces": "33 of 86 plus 18 partial [interface_inventory.csv]",
      },
      metricsThatMatter: [
        {
          label: "Open care gaps",
          value: "1,142,000",
          source: "care_gap_cells.csv",
        },
      ],
    });

    const digest = buildGeneratedPhaseDigest({
      artifact: "discovery_report",
      phase: 2,
      html: "<html><body><svg></svg><h1>Discovery</h1></body></html>",
      context: ctx,
    });

    expect(digest.baselineMetrics).toEqual(ctx.baselineMetrics);
    expect(digest.metricsThatMatter).toEqual(ctx.metricsThatMatter);
  });
});
