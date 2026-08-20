import { buildBusinessCapabilityLandscapeView } from "../projections/capability-landscape";
import {
  AUDIENCE_DENSITY,
  LAYER_SCHEMES,
  validateArchitectureView,
  type ArchitectureView,
} from "../architecture-view-contract";
import { getHomeReviewBundle } from "@/lib/home/preview/golden-snapshot";
import type { TechRecordType } from "@/lib/home/preview/types";

const TENANTS = [
  { key: "meridian-health", name: "Meridian Health" },
  { key: "skyharbor-air", name: "SkyHarbor Global" },
] as const;

function applicationsFor(tenantKey: string): TechRecordType {
  const bundle = getHomeReviewBundle(tenantKey);
  if (!bundle?.technologyEstate) throw new Error(`no technologyEstate for ${tenantKey}`);
  const apps = bundle.technologyEstate.recordTypes.find((r) => r.objectType === "application_system");
  if (!apps) throw new Error(`no application_system records for ${tenantKey}`);
  return apps;
}

function build(tenantKey: string, name: string, audienceLevel: "L0_executive" | "L1_domain"): ArchitectureView {
  return buildBusinessCapabilityLandscapeView({
    tenantKey,
    tenantDisplayName: name,
    applications: applicationsFor(tenantKey),
    audienceLevel,
  });
}

describe("capability landscape projection", () => {
  describe.each(TENANTS)("$name", ({ key, name }) => {
    it("produces a valid L0 executive view with no errors", () => {
      const view = build(key, name, "L0_executive");
      const errors = validateArchitectureView(view).filter((i) => i.level === "error");
      expect(errors).toEqual([]);
    });

    it("produces a valid L1 domain view with no errors", () => {
      const view = build(key, name, "L1_domain");
      const errors = validateArchitectureView(view).filter((i) => i.level === "error");
      expect(errors).toEqual([]);
    });

    it("respects the L0 density ceiling rather than dumping every application", () => {
      const view = build(key, name, "L0_executive");
      expect(view.nodes.length).toBeLessThanOrEqual(AUDIENCE_DENSITY.L0_executive.max!);
      // 301/503 applications exist; an executive view must not attempt to show them.
      expect(applicationsFor(key).rows.length).toBeGreaterThan(200);
    });

    it("gives every node an evidence basis", () => {
      const view = build(key, name, "L1_domain");
      expect(view.nodes.length).toBeGreaterThan(0);
      expect(view.nodes.every((n) => Boolean(n.evidenceBasis))).toBe(true);
    });

    it("draws no edges at capability rollup level, by design", () => {
      // A capability rollup has no recorded capability-to-capability relationships. Inventing
      // arrows between them would be exactly the fabrication this contract exists to prevent.
      const view = build(key, name, "L1_domain");
      expect(view.edges).toEqual([]);
    });

    it("places every node in a lane belonging to the declared scheme", () => {
      const view = build(key, name, "L1_domain");
      const lanes = LAYER_SCHEMES[view.layerScheme];
      expect(view.nodes.every((n) => lanes.includes(n.layer))).toBe(true);
    });

    it("counts real systems -- capability totals reconcile to the record count", () => {
      const apps = applicationsFor(key);
      const view = build(key, name, "L1_domain");
      const counted = view.nodes
        .filter((n) => n.semanticRole === "business_capability")
        .reduce((s, n) => s + (n.metrics?.systems ?? 0), 0);
      expect(counted).toBe(apps.rows.length);
    });

    it("declares limitations rather than presenting itself as complete", () => {
      const view = build(key, name, "L1_domain");
      expect(view.limitations.length).toBeGreaterThan(0);
    });

    it("carries no target-state status in a current-state view", () => {
      const view = build(key, name, "L1_domain");
      expect(view.nodes.every((n) => n.status !== "new" && n.status !== "changed")).toBe(true);
    });
  });

  it("keeps node identity stable across audience levels for the same canonical object", () => {
    const l0 = build("meridian-health", "Meridian Health", "L0_executive");
    const l1 = build("meridian-health", "Meridian Health", "L1_domain");
    const l0Ids = l0.nodes.filter((n) => n.id !== "cap-remaining").map((n) => n.id);
    const l1Ids = new Set(l1.nodes.map((n) => n.id));
    // Same canonical object must resolve to the same id in every view -- the cross-link contract.
    expect(l0Ids.every((id) => l1Ids.has(id))).toBe(true);
  });

  it("reports evidence coverage computed from what is actually drawn", () => {
    const view = build("meridian-health", "Meridian Health", "L1_domain");
    expect(view.evidenceCoverage.nodesTotal).toBe(view.nodes.length);
    expect(view.evidenceCoverage.edgesTotal).toBe(view.edges.length);
    // Every node here rolls up many records, so none maps 1:1 to a canonical record. Reporting
    // 100% canonical would overstate what the view actually shows.
    // Structurally zero in a rollup and always will be -- which is why it must not be rendered
    // above L2. The readable measure is memberTraceablePct.
    expect(view.evidenceCoverage.nodesAggregated).toBe(view.nodes.length);
    expect(view.evidenceCoverage.canonicalNodePct).toBe(0);
    expect(view.evidenceCoverage.memberTraceablePct).toBe(100);
    expect(view.evidenceCoverage.aggregationSummary).toMatch(
      /^\d+ nodes, each a group · \d+ records underneath · all traceable$/,
    );
  });

  it("marks every capability rollup ABARVA_DERIVED with its members reachable", () => {
    const view = build("meridian-health", "Meridian Health", "L1_domain");
    expect(view.nodes.every((n) => n.evidenceBasis === "ABARVA_DERIVED")).toBe(true);
    expect(view.nodes.every((n) => (n.aggregation?.memberNodeIds.length ?? 0) > 0)).toBe(true);
    expect(view.nodes.every((n) => n.aggregation?.groupByField === "business_function")).toBe(true);
  });
});

describe("validateArchitectureView", () => {
  function baseView(): ArchitectureView {
    return build("meridian-health", "Meridian Health", "L1_domain");
  }

  it("rejects an executive view that exceeds its density ceiling", () => {
    const view = { ...baseView(), audienceLevel: "L0_executive" as const };
    const errors = validateArchitectureView(view).filter((i) => i.level === "error");
    expect(errors.some((e) => /ceiling/.test(e.message))).toBe(true);
  });

  it("rejects a node claiming CANONICAL basis with no evidence ids", () => {
    const view = baseView();
    view.nodes[0] = { ...view.nodes[0], evidenceBasis: "CANONICAL", aggregation: undefined, evidenceIds: [] };
    const errors = validateArchitectureView(view).filter((i) => i.level === "error");
    expect(errors.some((e) => /CANONICAL basis with no evidenceIds/.test(e.message))).toBe(true);
  });

  it("rejects an edge pointing at a node that is not in the view", () => {
    const view = baseView();
    // Built explicitly: the capability rollup has no edges, so asserting over its empty array
    // would pass without exercising the rule.
    view.edges = [
      {
        id: "e1",
        from: view.nodes[0].id,
        to: "does-not-exist",
        evidenceBasis: "CANONICAL",
        evidenceIds: ["x"],
      },
    ];
    const errors = validateArchitectureView(view).filter((i) => i.level === "error");
    expect(errors.some((e) => /references a node that is not in this view/.test(e.message))).toBe(true);
  });

  it("accepts an edge whose endpoints are both present", () => {
    const view = baseView();
    view.edges = [
      {
        id: "e1",
        from: view.nodes[0].id,
        to: view.nodes[1].id,
        evidenceBasis: "CANONICAL",
        evidenceIds: ["x"],
      },
    ];
    const errors = validateArchitectureView(view).filter((i) => i.level === "error");
    expect(errors).toEqual([]);
  });

  it("rejects an edge with no evidence basis", () => {
    const view = baseView();
    view.edges = [
      { id: "e1", from: view.nodes[0].id, to: view.nodes[1].id } as never,
    ];
    const errors = validateArchitectureView(view).filter((i) => i.level === "error");
    expect(errors.some((e) => /has no evidenceBasis/.test(e.message))).toBe(true);
  });

  it("rejects a lane that is not part of the declared scheme", () => {
    const view = baseView();
    view.nodes[0] = { ...view.nodes[0], layer: "agentic" };
    const errors = validateArchitectureView(view).filter((i) => i.level === "error");
    expect(errors.some((e) => /not part of enterprise_estate_v1/.test(e.message))).toBe(true);
  });

  it("rejects an aggregate node that claims CANONICAL", () => {
    const view = baseView();
    view.nodes[0] = { ...view.nodes[0], evidenceBasis: "CANONICAL" };
    const errors = validateArchitectureView(view).filter((i) => i.level === "error");
    expect(errors.some((e) => /an aggregate is ABARVA_DERIVED/.test(e.message))).toBe(true);
  });

  it("rejects an aggregate node with no reachable members", () => {
    const view = baseView();
    view.nodes[0] = {
      ...view.nodes[0],
      aggregation: { ...view.nodes[0].aggregation!, memberNodeIds: [] },
    };
    const errors = validateArchitectureView(view).filter((i) => i.level === "error");
    expect(errors.some((e) => /carries no memberNodeIds/.test(e.message))).toBe(true);
  });

  it("rejects a collapsed edge that claims CANONICAL", () => {
    const view = baseView();
    view.edges = [
      {
        id: "e1",
        from: view.nodes[0].id,
        to: view.nodes[1].id,
        evidenceBasis: "CANONICAL",
        evidenceIds: ["x"],
        derivedFromEdgeIds: ["a", "b"],
      },
    ];
    const errors = validateArchitectureView(view).filter((i) => i.level === "error");
    expect(errors.some((e) => /collapses 2 canonical relationships/.test(e.message))).toBe(true);
  });

  it("rejects target-state status inside a current-state profile", () => {
    const view = baseView();
    view.nodes[0] = { ...view.nodes[0], status: "new" };
    const errors = validateArchitectureView(view).filter((i) => i.level === "error");
    expect(errors.some((e) => /target-state status/.test(e.message))).toBe(true);
  });
});
