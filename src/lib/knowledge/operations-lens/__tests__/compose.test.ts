/**
 * Operations & Vendor Intelligence lens — composition invariants.
 *
 * These prove the governance rules the UI depends on:
 *  - capability attribution comes only from an explicit governed signal;
 *  - a not-loaded/withheld domain becomes a null count with a reason, never 0;
 *  - vendor "concentration" is raw counts, and risk is voiced only by governed
 *    risk objects reachable in the evidence-backed graph;
 *  - renewal windows are measured from the baseline as-of, not a wall clock.
 */

import {
  composeCapabilities,
  composeDependencyChain,
  composeOverview,
  composeVendorIntel,
  matchCapabilityKeys,
  type LensSource,
} from "..";
import { AIRLINE_DEMO_NEW } from "../../fixtures/airline-demo-new";
import type { EntitySummaryV1 } from "../../consumption-contracts";

const AS_OF = "2026-07-01T00:00:00.000Z";

/** Build a LensSource from the airline fixture the same way the hook does. */
function airlineSource(): LensSource {
  const pack = AIRLINE_DEMO_NEW;
  const entities = pack.exploreLanding.entities;
  const byType = (t: string): EntitySummaryV1[] => entities.filter((e) => e.entityType === t);
  return {
    asOf: AS_OF,
    applications: byType("application"),
    vendors: byType("vendor"),
    contracts: byType("contract"),
    risks: byType("risk"),
    programs: [],
    relationships: pack.relationships,
    gaps: pack.evidence.gaps,
    overallEvidenceCoverage: pack.evidence.overallEvidenceCoverage,
    domains: pack.brief.domains,
  };
}

describe("capability taxonomy", () => {
  it("maps explicit governed values and drops unknowns (never a default)", () => {
    expect(matchCapabilityKeys("crew_operations")).toEqual(["crew_operations"]);
    expect(matchCapabilityKeys("Crew Ops")).toEqual(["crew_operations"]);
    expect(matchCapabilityKeys("irops, data_integration")).toEqual(["irops", "data_integration"]);
    expect(matchCapabilityKeys("totally_unknown")).toEqual([]);
    expect(matchCapabilityKeys(null)).toEqual([]);
  });
});

describe("composeOverview", () => {
  const overview = composeOverview(airlineSource());

  it("counts represented objects across domains", () => {
    expect(overview.applications.value).toBe(8);
    expect(overview.materialVendors.value).toBe(4);
    expect(overview.contracts.value).toBe(5);
    expect(overview.operationalRisks.value).toBe(2);
  });

  it("counts only renewals within the 12-month window from as-of", () => {
    // opsuite-msa 2027-03-01, opsuite-mod 2026-11-15, station 2026-09-30 are in window;
    // gds 2028-01-01 is out; maint has no loaded renewal date.
    expect(overview.renewalsApproaching.value).toBe(3);
  });

  it("surfaces candidate (deferred) and conflicting counts", () => {
    expect(overview.deferredAssertions.value).toBe(2); // two candidate edges
    expect(overview.conflictingAssertions.value).toBeGreaterThanOrEqual(2);
    expect(overview.conflictingAssertions.availabilityState).toBe("conflicting");
  });

  it("carries governed coverage through unchanged", () => {
    expect(overview.evidenceCoverage).toBeCloseTo(0.63);
  });
});

describe("composeCapabilities", () => {
  const caps = composeCapabilities(airlineSource());

  it("returns the full taxonomy with represented flags", () => {
    expect(caps).toHaveLength(7);
    const irops = caps.find((c) => c.key === "irops")!;
    expect(irops.represented).toBe(true);
    expect(irops.applications.map((a) => a.entityRef)).toContain("app-ops-control");
  });

  it("marks a capability with no mapped systems as explicitly not-represented", () => {
    // The fixture maps six of seven capabilities; the unmapped one must not fabricate.
    const unrepresented = caps.filter((c) => !c.represented);
    for (const c of unrepresented) {
      expect(c.applications).toHaveLength(0);
      expect(c.availabilityState).toBe("not_loaded");
      expect(c.absenceReason).toBeTruthy();
    }
  });
});

describe("composeVendorIntel", () => {
  const src = airlineSource();

  it("links supported applications via the evidence-backed graph and reports concentration as counts", () => {
    const v = composeVendorIntel(src, "vendor-opsuite")!;
    const supported = v.supportedApplications.map((a) => a.entityRef);
    expect(supported).toEqual(expect.arrayContaining(["app-dispatch", "app-ops-control", "app-data-hub"]));
    expect(v.concentration.applicationsSupported).toBeGreaterThanOrEqual(3);
    expect(v.concentration.tierOneApplications).toBeGreaterThanOrEqual(3);
    expect(v.concentration.capabilitiesTouched).toBeGreaterThanOrEqual(3);
  });

  it("voices risk only via governed risk objects reachable in the graph", () => {
    const v = composeVendorIntel(src, "vendor-opsuite")!;
    expect(v.linkedRisks.map((r) => r.entityRef)).toContain("risk-vendor-concentration");
  });

  it("counts contracts and in-window renewals for the vendor", () => {
    const v = composeVendorIntel(src, "vendor-opsuite")!;
    expect(v.contractCount.value).toBe(2);
    expect(v.renewalsApproaching.value).toBe(2);
  });

  it("returns a null renewal count (not zero) when renewal dates are not loaded", () => {
    const v = composeVendorIntel(src, "vendor-maintsys")!;
    expect(v.renewalsApproaching.value).toBeNull();
    expect(v.renewalsApproaching.absenceReason).toBeTruthy();
  });

  it("passes incident/SLA fields through, keeping not-measured as a state not a zero", () => {
    const v = composeVendorIntel(src, "vendor-maintsys")!;
    const sev1 = v.incidentSummary.find((f) => f.key === "sev1_incidents");
    expect(sev1?.value).toBeNull();
    expect(sev1?.availabilityState).toBe("not_measured");
  });

  it("reports transformation exposure as unavailable when the programs domain is not loaded", () => {
    const v = composeVendorIntel(src, "vendor-opsuite")!;
    expect(v.transformationExposure.value).toBeNull();
    expect(v.transformationExposure.availabilityState).toBe("not_loaded");
  });
});

describe("composeDependencyChain", () => {
  it("builds evidence-carrying links around a focal object", () => {
    const chain = composeDependencyChain(airlineSource(), "app-dispatch");
    const links = chain.links.filter((l) => l.fromRef === "app-dispatch" || l.toRef === "app-dispatch");
    expect(links.length).toBeGreaterThan(0);
    const supported = links.find((l) => l.toRef === "vendor-opsuite");
    expect(supported?.evidenceRefs).toContain("ev-vendor-scorecard");
  });
});
