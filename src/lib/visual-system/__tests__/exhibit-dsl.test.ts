import {
  EXHIBIT_RENDERER_CAPABILITY,
  resolveExhibitRenderer,
  engineHasRenderer,
  exhibitCoverage,
} from "../exhibit-dsl";
import type { ExhibitType } from "@/lib/deliverables/story/types";

describe("exhibit renderer-capability map", () => {
  it("every 'available' entry names a real function on the shared engine surface", () => {
    for (const [, status] of Object.entries(EXHIBIT_RENDERER_CAPABILITY)) {
      if (status.status === "available") {
        expect(engineHasRenderer(status.renderer)).toBe(true);
      } else {
        // gaps must carry an explanatory note so PR4 knows what to build.
        expect(status.note.length).toBeGreaterThan(0);
      }
    }
  });

  it("resolves the value-economics convergence exhibits to the real chart functions", () => {
    expect(resolveExhibitRenderer("ValueWaterfall")).toEqual({ status: "available", renderer: "investmentWaterfall" });
    expect(resolveExhibitRenderer("ValueBridge")).toEqual({ status: "available", renderer: "valueBridge" });
    expect(resolveExhibitRenderer("TransformationRoadmap")).toEqual({ status: "available", renderer: "roadmapSwimlane" });
  });

  it("honestly reports the tree / RACI / org family as gaps for PR4", () => {
    const gaps: ExhibitType[] = exhibitCoverage().gaps;
    for (const t of ["IssueTree", "RootCauseTree", "RACIMap", "OperatingModel", "ValueTree"] as ExhibitType[]) {
      expect(gaps).toContain(t);
    }
  });

  it("reports a coverage majority already backed by the existing engine", () => {
    const cov = exhibitCoverage();
    expect(cov.available + cov.needsBuild).toBe(cov.total);
    expect(cov.coveragePct).toBeGreaterThanOrEqual(50);
    expect(cov.coveragePct).toBeLessThan(100); // gaps remain — honest, not over-claimed
  });
});
