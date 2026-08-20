import { layoutArchitectureView, nodesOverlap, wrapLabel } from "../layout/architecture-layout";
import { canonicalNodeId } from "../architecture-view-contract";
import { renderArchitectureViewSvg } from "../architecture-svg-renderer";
import { buildBusinessCapabilityLandscapeView } from "../projections/capability-landscape";
import { buildCapabilityToTechnologyView, listCapabilities } from "../projections/capability-to-technology";
import { getHomeReviewBundle } from "@/lib/home/preview/golden-snapshot";
import type { TechRecordType } from "@/lib/home/preview/types";

function apps(tenantKey: string): TechRecordType {
  const rt = getHomeReviewBundle(tenantKey)?.technologyEstate?.recordTypes.find(
    (r) => r.objectType === "application_system",
  );
  if (!rt) throw new Error(`no apps for ${tenantKey}`);
  return rt;
}

const PROOFS = [
  { key: "meridian-health", name: "Meridian Health", cap: "Clinical Informatics" },
  { key: "skyharbor-air", name: "SkyHarbor Global", cap: "Airport & Ground Operations" },
] as const;

describe("wrapLabel", () => {
  it("never emits a line longer than the box allows", () => {
    const lines = wrapLabel("Ambulatory & Physician Network Operations", 18, 3);
    expect(lines.every((l) => l.length <= 18)).toBe(true);
  });

  it("hard-splits a single token wider than the line rather than overflowing", () => {
    const lines = wrapLabel("Supercalifragilisticexpialidocious", 10, 3);
    expect(lines.every((l) => l.length <= 10)).toBe(true);
  });

  it("marks truncation instead of silently dropping content", () => {
    const long = "one two three four five six seven eight nine ten eleven twelve";
    const lines = wrapLabel(long, 12, 2);
    expect(lines.length).toBe(2);
    expect(lines[1].endsWith("…")).toBe(true);
  });
});

describe.each(PROOFS)("layout · $name", ({ key, name, cap }) => {
  const l0 = () =>
    buildBusinessCapabilityLandscapeView({
      tenantKey: key,
      tenantDisplayName: name,
      applications: apps(key),
      audienceLevel: "L0_executive",
    });
  const l2 = () =>
    buildCapabilityToTechnologyView({
      tenantKey: key,
      tenantDisplayName: name,
      applications: apps(key),
      capability: cap,
    });

  it.each([
    ["L0", l0],
    ["L2", l2],
  ])("%s: no two node boxes overlap", (_label, build) => {
    const out = layoutArchitectureView(build());
    for (let i = 0; i < out.nodes.length; i++) {
      for (let j = i + 1; j < out.nodes.length; j++) {
        expect({ pair: [out.nodes[i].node.id, out.nodes[j].node.id], overlap: nodesOverlap(out.nodes[i], out.nodes[j]) })
          .toEqual({ pair: [out.nodes[i].node.id, out.nodes[j].node.id], overlap: false });
      }
    }
  });

  it.each([
    ["L0", l0],
    ["L2", l2],
  ])("%s: every node stays inside the canvas", (_label, build) => {
    const out = layoutArchitectureView(build());
    for (const n of out.nodes) {
      expect(n.x).toBeGreaterThanOrEqual(0);
      expect(n.y).toBeGreaterThanOrEqual(0);
      expect(n.x + n.width).toBeLessThanOrEqual(out.width);
      expect(n.y + n.height).toBeLessThanOrEqual(out.height);
    }
  });

  it.each([
    ["L0", l0],
    ["L2", l2],
  ])("%s: every label renders at least one line -- nothing is silently blank", (_label, build) => {
    const out = layoutArchitectureView(build());
    expect(out.nodes.every((n) => n.labelLines.length > 0)).toBe(true);
  });

  it("L2: every edge resolves to two laid-out endpoints", () => {
    const view = l2();
    const out = layoutArchitectureView(view);
    expect(view.edges.length).toBeGreaterThan(0);
    expect(out.edges.length).toBe(view.edges.length);
    expect(out.edges.every((e) => e.path.startsWith("M"))).toBe(true);
  });

  it("L2: aggregates carry a member count in their meta line", () => {
    const out = layoutArchitectureView(l2());
    const aggs = out.nodes.filter((n) => n.node.aggregation);
    if (aggs.length === 0) return;
    expect(aggs.every((n) => /\d+ systems?$/.test(n.metaLine ?? ""))).toBe(true);
  });

  it("renders SVG carrying provenance and relationship verbs, with no invented edges", () => {
    const view = l2();
    const { svg } = renderArchitectureViewSvg(view);
    expect(svg).toContain("<svg");
    expect(svg).toContain('data-basis="');
    expect(svg).toContain("supports");
    // one <g class="edge"> per contract edge -- the renderer adds none of its own
    expect((svg.match(/class="edge"/g) ?? []).length).toBe(view.edges.length);
    expect((svg.match(/class="node"/g) ?? []).length).toBe(view.nodes.length);
  });

  it("keeps canonical node ids intact in the emitted SVG for drill-down", () => {
    const view = l2();
    const { svg } = renderArchitectureViewSvg(view);
    for (const n of view.nodes.slice(0, 5)) {
      expect(svg).toContain(`data-node-id="${n.id}"`);
    }
  });
});

describe("layout is deterministic", () => {
  it("produces identical geometry for identical input", () => {
    const view = buildBusinessCapabilityLandscapeView({
      tenantKey: "meridian-health",
      tenantDisplayName: "Meridian Health",
      applications: apps("meridian-health"),
      audienceLevel: "L1_domain",
    });
    expect(JSON.stringify(layoutArchitectureView(view))).toBe(
      JSON.stringify(layoutArchitectureView(view)),
    );
  });
});

describe("canonical identity survives real tenant data", () => {
  it("gives every distinct system a distinct id -- long names must not collide", () => {
    // Meridian has three "Sunquest Laboratory Information System Interface — Meridian
    // Rehabilitation Hospital — <site>" records identical for their first 60 characters.
    // Plain truncation collapsed 301 systems into 287 ids and made drill-down ambiguous.
    const rt = apps("meridian-health");
    const names = rt.rows.map((r) => String(r.systemName ?? "").trim()).filter(Boolean);
    const ids = names.map((n) => canonicalNodeId("sys", n));
    expect(new Set(names).size).toBe(names.length);
    expect(new Set(ids).size).toBe(names.length);
  });

  it("member identities reconcile to the real record count, without double-counting", () => {
    const rt = apps("meridian-health");
    const view = buildCapabilityToTechnologyView({
      tenantKey: "meridian-health",
      tenantDisplayName: "Meridian Health",
      applications: rt,
      capability: "Clinical Informatics",
    });
    // The view holds both the capability aggregate and its category children; summing
    // memberCount would report the estate twice.
    const distinct = new Set(view.nodes.flatMap((n) => n.aggregation?.memberNodeIds ?? []));
    expect(distinct.size).toBe(rt.rows.filter((r) => r.businessFunction === "Clinical Informatics").length);
    expect(view.evidenceCoverage.aggregationSummary).toContain("99 records underneath");
  });
});
