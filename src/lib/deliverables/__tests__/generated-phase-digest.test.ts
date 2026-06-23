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
});
