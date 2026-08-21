import fs from "node:fs";
import path from "node:path";
import { assessTopologyFitness, TOPOLOGY_UNFIT_MESSAGE } from "../../src/lib/visual-system/semantics/topology-fitness";
import type { HomeReviewBundle } from "../../src/lib/home/preview/types";

const DIR = path.join(process.cwd(), "src/lib/home/preview/golden-snapshots");
function flowsFor(tenant: string) {
  const b = JSON.parse(fs.readFileSync(path.join(DIR, `${tenant}.json`), "utf8")) as HomeReviewBundle;
  const rt = b.technologyEstate?.recordTypes.find((r) => r.objectType === "data_asset_or_integration");
  return (rt?.rows ?? []).map((r) => ({ source: String(r.sourceSystem ?? ""), target: String(r.targetSystem ?? "") }));
}

describe("topology fitness", () => {
  it("passes a tenant whose destinations genuinely converge", () => {
    const fit = assessTopologyFitness(flowsFor("meridian-health"));
    expect(fit.maxInbound).toBeGreaterThan(1);
    expect(fit.targetConvergenceRatio).toBeGreaterThan(0.05);
    expect(fit.fitForExecutiveFlow).toBe(true);
  });

  it("REFUSES a tenant whose flows are one-to-one with opaque sequential ids", () => {
    // This is the whole point: every classification in that view can be correct and the picture
    // still asserts a structure the record does not contain.
    const fit = assessTopologyFitness(flowsFor("skyharbor-air"));
    expect(fit.maxInbound).toBe(1);
    expect(fit.targetConvergenceRatio).toBe(0);
    expect(fit.fitForExecutiveFlow).toBe(false);
    expect(fit.findings.join(" ")).toMatch(/distribution, not convergence/);
    expect(fit.findings.join(" ")).toMatch(/opaque sequential identifiers/);
  });

  it("states a remedy rather than only refusing", () => {
    expect(TOPOLOGY_UNFIT_MESSAGE).toMatch(/estate landscape remains available/);
  });

  it("counts convergence, not volume — many flows to one place still passes", () => {
    const flows = Array.from({ length: 40 }, (_, i) => ({ source: `S${i}`, target: "Warehouse" }));
    const fit = assessTopologyFitness(flows);
    expect(fit.maxInbound).toBe(40);
    expect(fit.fitForExecutiveFlow).toBe(true);
  });
});
