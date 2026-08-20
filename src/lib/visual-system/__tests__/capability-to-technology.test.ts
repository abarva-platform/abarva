import {
  buildCapabilityToTechnologyView,
  listCapabilities,
} from "../projections/capability-to-technology";
import { AUDIENCE_DENSITY, validateArchitectureView } from "../architecture-view-contract";
import { getHomeReviewBundle } from "@/lib/home/preview/golden-snapshot";
import type { TechRecordType } from "@/lib/home/preview/types";

const TENANTS = [
  { key: "meridian-health", name: "Meridian Health" },
  { key: "skyharbor-air", name: "SkyHarbor Global" },
] as const;

function applicationsFor(tenantKey: string): TechRecordType {
  const bundle = getHomeReviewBundle(tenantKey);
  const apps = bundle?.technologyEstate?.recordTypes.find(
    (r) => r.objectType === "application_system",
  );
  if (!apps) throw new Error(`no application_system records for ${tenantKey}`);
  return apps;
}

function build(tenantKey: string, name: string, capability: string) {
  return buildCapabilityToTechnologyView({
    tenantKey,
    tenantDisplayName: name,
    applications: applicationsFor(tenantKey),
    capability,
  });
}

describe("capability -> technology (L2 relational)", () => {
  describe.each(TENANTS)("$name", ({ key, name }) => {
    const caps = () => listCapabilities(applicationsFor(key));

    it("produces real, non-empty edges for every capability", () => {
      for (const { capability } of caps()) {
        const view = build(key, name, capability);
        expect(view.edges.length).toBeGreaterThan(0);
      }
    });

    it("validates with no errors for every capability", () => {
      for (const { capability } of caps()) {
        const view = build(key, name, capability);
        const errors = validateArchitectureView(view).filter((i) => i.level === "error");
        expect({ capability, errors }).toEqual({ capability, errors: [] });
      }
    });

    it("stays inside L2 density for every capability, including the largest", () => {
      const max = AUDIENCE_DENSITY.L2_logical.max!;
      for (const { capability } of caps()) {
        const view = build(key, name, capability);
        expect({ capability, n: view.nodes.length }).toEqual({
          capability,
          n: Math.min(view.nodes.length, max),
        });
      }
    });

    it("traces every capability->system edge to business_function", () => {
      for (const { capability } of caps()) {
        const view = build(key, name, capability);
        expect(
          view.edges.every((e) => e.evidenceIds.some((id) => id.includes("business_function"))),
        ).toBe(true);
      }
    });

    it("marks a one-system-per-node edge CANONICAL", () => {
      const small = caps().find((c) => c.systems <= 40)!;
      const view = build(key, name, small.capability);
      expect(view.edges.length).toBeGreaterThan(0);
      expect(view.edges.every((e) => e.evidenceBasis === "CANONICAL")).toBe(true);
      expect(view.edges.every((e) => !e.derivedFromEdgeIds)).toBe(true);
    });

    it("marks a collapsed aggregate edge ABARVA_DERIVED and names the relationships it summarises", () => {
      const large = caps().find((c) => c.systems > 40);
      if (!large) return;
      const view = build(key, name, large.capability);
      const aggEdges = view.edges.filter((e) => e.derivedFromEdgeIds?.length);
      expect(aggEdges.length).toBeGreaterThan(0);
      expect(aggEdges.every((e) => e.evidenceBasis === "ABARVA_DERIVED")).toBe(true);
      // Every collapsed line must account for the canonical relationships beneath it.
      const summarised = aggEdges.reduce((s, e) => s + (e.derivedFromEdgeIds?.length ?? 0), 0);
      expect(summarised).toBe(large.systems);
    });

    it("marks aggregate nodes ABARVA_DERIVED and keeps their members reachable", () => {
      const large = caps().find((c) => c.systems > 40);
      if (!large) return;
      const view = build(key, name, large.capability);
      const aggs = view.nodes.filter((n) => n.aggregation);
      expect(aggs.length).toBeGreaterThan(0);
      expect(aggs.every((n) => n.evidenceBasis === "ABARVA_DERIVED")).toBe(true);
      expect(aggs.every((n) => n.aggregation!.memberNodeIds.length > 0)).toBe(true);
      expect(aggs.every((n) => n.aggregation!.basis === "CANONICAL_FIELD")).toBe(true);
    });

    it("keeps an individual system node CANONICAL", () => {
      const small = caps().find((c) => c.systems <= 40)!;
      const view = build(key, name, small.capability);
      const systems = view.nodes.filter((n) => n.semanticRole === "application");
      expect(systems.length).toBeGreaterThan(0);
      expect(systems.every((n) => n.evidenceBasis === "CANONICAL" && !n.aggregation)).toBe(true);
    });

    it("leaves no orphan application node -- every system connects to its capability", () => {
      const { capability } = caps()[0];
      const view = build(key, name, capability);
      const capId = view.nodes.find((n) => n.semanticRole === "business_capability")!.id;
      const connected = new Set(view.edges.map((e) => e.from));
      const apps = view.nodes.filter((n) => n.semanticRole === "application");
      expect(apps.length).toBeGreaterThan(0);
      expect(apps.every((n) => connected.has(n.id))).toBe(true);
      expect(view.edges.every((e) => e.to === capId)).toBe(true);
    });

    it("emits no duplicate node identity", () => {
      for (const { capability } of caps()) {
        const view = build(key, name, capability);
        const ids = view.nodes.map((n) => n.id);
        expect(ids.length).toBe(new Set(ids).size);
      }
    });

    it("accounts for every system in the capability", () => {
      const apps = applicationsFor(key);
      for (const { capability, systems } of caps()) {
        const view = build(key, name, capability);
        const appNodes = view.nodes.filter((n) => n.semanticRole === "application");
        // Either one node per system, or aggregated nodes whose counts sum to the same total.
        const counted = appNodes.some((n) => n.metrics?.systems)
          ? appNodes.reduce((s, n) => s + (n.metrics?.systems ?? 1), 0)
          : appNodes.length;
        expect({ capability, counted }).toEqual({ capability, counted: systems });
      }
      expect(apps.rows.length).toBeGreaterThan(200);
    });

    it("declares aggregation when a capability is too large to draw system-by-system", () => {
      const largest = caps()[0];
      const view = build(key, name, largest.capability);
      if (largest.systems > 40) {
        expect(view.limitations.some((l) => /grouped by their recorded system category/.test(l))).toBe(true);
      }
    });
  });

  it("keeps a system's canonical identity stable regardless of which view it appears in", () => {
    const apps = applicationsFor("meridian-health");
    const small = listCapabilities(apps).filter((c) => c.systems <= 40).slice(0, 3);
    for (const { capability } of small) {
      const view = build("meridian-health", "Meridian Health", capability);
      for (const node of view.nodes.filter((n) => n.semanticRole === "application")) {
        // id derives only from the system's own recorded name, never from the enclosing view.
        expect(node.id.startsWith("sys-")).toBe(true);
        expect(node.evidenceIds[0]).toBe(node.label);
      }
    }
  });

  it("carries real system metadata onto nodes without altering identity", () => {
    const apps = applicationsFor("meridian-health");
    const cap = listCapabilities(apps).find((c) => c.systems <= 40)!.capability;
    const view = build("meridian-health", "Meridian Health", cap);
    const withVendor = view.nodes.filter((n) => n.semanticRole === "application" && n.vendor);
    expect(withVendor.length).toBeGreaterThan(0);
    expect(view.nodes.some((n) => n.criticality)).toBe(true);
    expect(view.nodes.some((n) => (n.metrics?.recordedInterfaces ?? 0) > 0)).toBe(true);
  });
});

describe("canonical relationship direction is preserved, never inverted for layout", () => {
  it("keeps supports as system -> capability, matching the canonical record", () => {
    // 12_relationships.csv records `supports` as system -> function (382/382 target a function).
    // Flipping it so the diagram reads forward under business-first lanes would misstate the data.
    const apps = applicationsFor("meridian-health");
    const cap = listCapabilities(apps).find((c) => c.systems <= 40)!.capability;
    const view = build("meridian-health", "Meridian Health", cap);
    const capNode = view.nodes.find((n) => n.semanticRole === "business_capability")!;
    expect(view.edges.length).toBeGreaterThan(0);
    expect(view.edges.every((e) => e.to === capNode.id)).toBe(true);
    expect(view.edges.every((e) => e.from !== capNode.id)).toBe(true);
    expect(view.edges.every((e) => e.label === "supports")).toBe(true);
  });

  it("omits orientation where it would be uniformly backward and carry no signal", () => {
    const apps = applicationsFor("meridian-health");
    const cap = listCapabilities(apps)[0].capability;
    const view = build("meridian-health", "Meridian Health", cap);
    expect(view.edges.every((e) => e.orientation === undefined)).toBe(true);
  });
});
