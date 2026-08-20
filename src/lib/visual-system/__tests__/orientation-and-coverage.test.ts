import {
  computeEvidenceCoverage,
  deriveOrientation,
  validateArchitectureView,
  type ArchitectureView,
  type ArchitectureViewNode,
} from "../architecture-view-contract";

function node(id: string, layer: string, extra: Partial<ArchitectureViewNode> = {}): ArchitectureViewNode {
  return {
    id,
    label: id,
    semanticRole: "application",
    layer,
    evidenceBasis: "CANONICAL",
    evidenceIds: [id],
    ...extra,
  };
}

describe("deriveOrientation", () => {
  it("reads direction from lane position, not from the edge's own claim", () => {
    expect(deriveOrientation("business_capability", "data", "enterprise_estate_v1")).toBe("forward");
    expect(deriveOrientation("data", "business_capability", "enterprise_estate_v1")).toBe("backward");
  });

  it("treats same-lane as lateral -- a third case, not a mild backward", () => {
    expect(deriveOrientation("data", "data", "enterprise_estate_v1")).toBe("lateral");
  });

  it("returns null rather than guessing when a lane is not in the scheme", () => {
    expect(deriveOrientation("agentic", "data", "enterprise_estate_v1")).toBeNull();
  });
});

describe("orientation is validated against lane order, not merely asserted", () => {
  function view(orientation: "forward" | "lateral" | "backward"): ArchitectureView {
    const nodes = [node("a", "business_capability"), node("b", "data")];
    return {
      viewType: "data_analytics_architecture",
      audienceLevel: "L2_logical",
      layerScheme: "enterprise_estate_v1",
      validationProfile: "enterprise_current_state",
      tenantKey: "t",
      title: "t",
      primaryQuestion: "q",
      nodes,
      edges: [
        { id: "e1", from: "b", to: "a", evidenceBasis: "CANONICAL", evidenceIds: ["x"], orientation },
      ],
      groups: [],
      boundaries: [],
      overlays: [],
      evidenceCoverage: computeEvidenceCoverage(nodes, []),
      limitations: [],
    };
  }

  it("rejects an edge whose asserted orientation contradicts the lane order", () => {
    // data -> business_capability is backward; claiming forward must fail.
    const errors = validateArchitectureView(view("forward")).filter((i) => i.level === "error");
    expect(errors.some((e) => /asserts orientation "forward" but the lane order makes it "backward"/.test(e.message))).toBe(true);
  });

  it("accepts an edge whose assertion matches", () => {
    const errors = validateArchitectureView(view("backward")).filter((i) => i.level === "error");
    expect(errors).toEqual([]);
  });
});

describe("coverage separates 'is a record' from 'is traceable'", () => {
  it("a rollup reports 0% canonical but 100% traceable", () => {
    const nodes = [
      node("g1", "business_capability", {
        evidenceBasis: "ABARVA_DERIVED",
        aggregation: {
          groupByField: "business_function",
          groupByValue: "X",
          memberNodeIds: ["s1", "s2"],
          memberCount: 2,
          basis: "CANONICAL_FIELD",
        },
      }),
    ];
    const cov = computeEvidenceCoverage(nodes, []);
    expect(cov.canonicalNodePct).toBe(0);
    expect(cov.memberTraceablePct).toBe(100);
    expect(cov.aggregationSummary).toBe("1 nodes, each a group · 2 records underneath · all traceable");
  });

  it("keeps zero reserved for 'we do not know' -- an untraceable node scores 0 on both", () => {
    const nodes = [node("c1", "data", { evidenceBasis: "CANDIDATE", evidenceIds: [] })];
    const cov = computeEvidenceCoverage(nodes, []);
    expect(cov.canonicalNodePct).toBe(0);
    expect(cov.memberTraceablePct).toBe(0);
  });

  it("an aggregate with no reachable members is not traceable", () => {
    const nodes = [
      node("g1", "data", {
        evidenceBasis: "ABARVA_DERIVED",
        aggregation: {
          groupByField: "f",
          groupByValue: "v",
          memberNodeIds: [],
          memberCount: 0,
          basis: "CANONICAL_FIELD",
        },
      }),
    ];
    expect(computeEvidenceCoverage(nodes, []).memberTraceablePct).toBe(0);
  });

  it("an L2 view of individual records reports 100% canonical", () => {
    const nodes = [node("s1", "data"), node("s2", "data")];
    const cov = computeEvidenceCoverage(nodes, []);
    expect(cov.canonicalNodePct).toBe(100);
    expect(cov.aggregationSummary).toBeUndefined();
  });
});
