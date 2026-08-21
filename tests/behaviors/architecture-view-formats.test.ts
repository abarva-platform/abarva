import {
  ARCHITECTURE_VIEW_POLICIES,
  ARCHITECTURE_VIEW_ORDER,
  resolveAvailableFormats,
} from "../../src/lib/visual-system/semantics/architecture-view-formats";

describe("architecture view formats", () => {
  it("gives every view a stated question", () => {
    // A view that cannot say what question it answers should not exist.
    for (const f of ARCHITECTURE_VIEW_ORDER) {
      expect(ARCHITECTURE_VIEW_POLICIES[f].executiveQuestion.length).toBeGreaterThan(20);
    }
  });

  it("keeps the executive landscape genuinely executive", () => {
    expect(ARCHITECTURE_VIEW_POLICIES.executive_landscape.maximumVisibleNodes).toBeLessThanOrEqual(18);
  });

  it("requires topology fitness ONLY for the view that asserts relationships", () => {
    const requiring = ARCHITECTURE_VIEW_ORDER.filter((f) => ARCHITECTURE_VIEW_POLICIES[f].requiresTopologyFitness);
    expect(requiring).toEqual(["end_to_end_data_flow"]);
  });

  it("suppresses only the flow view when topology fails, keeping four true views", () => {
    const avail = resolveAvailableFormats({ topologyFitPasses: false, topologyFindings: ["no convergence"] });
    const blocked = avail.filter((a) => !a.available).map((a) => a.format);
    const open = avail.filter((a) => a.available).map((a) => a.format);
    expect(blocked).toEqual(["end_to_end_data_flow"]);
    expect(open).toEqual(["executive_landscape", "platform_topology", "movement_profile", "lineage_trace", "estate_evidence"]);
  });

  it("names the remedy and falls back rather than only refusing", () => {
    const flow = resolveAvailableFormats({ topologyFitPasses: false, topologyFindings: [] }).find(
      (a) => a.format === "end_to_end_data_flow",
    )!;
    expect(flow.reason).toMatch(/remain available while the topology is remediated/);
    expect(flow.fallbackFormat).toBe("executive_landscape");
  });

  it("opens every view when the topology holds", () => {
    const avail = resolveAvailableFormats({ topologyFitPasses: true, topologyFindings: [] });
    expect(avail.every((a) => a.available)).toBe(true);
  });
});
