import {
  computeEvidenceCoverage,
  type ArchitectureView,
  type ArchitectureViewEdge,
  type ArchitectureViewNode,
  type ArchitectureViewGroup,
  type ArchitectureViewOverlay,
  type AudienceLevel,
} from "../architecture-view-contract";
import { canonicalNodeId } from "../architecture-view-contract";
import type { TechRecordType } from "@/lib/home/preview/types";

/**
 * Business capability LANDSCAPE -- technology concentration across the enterprise.
 *
 * This view deliberately has no edges: there are no recorded capability-to-capability
 * relationships, and drawing arrows between capabilities would be fabrication. It answers
 * "where is technology complexity concentrated?", not "what supports what" -- that relational
 * question is `capability-to-technology.ts` at L2.
 *
 * No model call is involved anywhere in this path: nodes, groupings, counts and overlays are all
 * computed from recorded fields. `businessFunction` is populated on 100% of Meridian's and
 * SkyHarbor's application records, which is why this projection is the first one built -- it is
 * the view whose evidence is strongest, and it is the hub the other views cross-link from.
 *
 * The one judgement this file makes is which lane a business function belongs in, and where it
 * does so the node is marked ABARVA_DERIVED with the reason recorded on `roleBasisNote`. Node
 * existence and every count remain CANONICAL.
 */

const CAPABILITY_LANE = "business_capability";

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function str(value: unknown): string {
  return value === null || value === undefined ? "" : String(value).trim();
}

export interface BusinessCapabilityLandscapeOptions {
  tenantKey: string;
  tenantDisplayName: string;
  applications: TechRecordType;
  audienceLevel?: AudienceLevel;
  canonicalBuild?: string;
}

/**
 * L0/L1 rollup: one node per business function, sized by real record counts. Individual systems
 * are L2/L3 detail and are deliberately not emitted here -- 301 application nodes in an executive
 * view is precisely the density failure the contract's validator rejects.
 */
export function buildBusinessCapabilityLandscapeView(
  options: BusinessCapabilityLandscapeOptions,
): ArchitectureView {
  const { tenantKey, tenantDisplayName, applications } = options;
  const audienceLevel = options.audienceLevel ?? "L1_domain";
  const rows = applications.rows ?? [];

  const byFunction = new Map<string, Array<(typeof rows)[number]>>();
  for (const row of rows) {
    const fn = str(row.businessFunction) || "(not specified)";
    const bucket = byFunction.get(fn);
    if (bucket) bucket.push(row);
    else byFunction.set(fn, [row]);
  }

  const ordered = [...byFunction.entries()].sort((a, b) => b[1].length - a[1].length);

  // L0 shows the significant capabilities and folds the tail into one honest remainder rather
  // than truncating silently; L1 shows them all.
  const headCount = audienceLevel === "L0_executive" ? 12 : ordered.length;
  const head = ordered.slice(0, headCount);
  const tail = ordered.slice(headCount);

  const nodes: ArchitectureViewNode[] = [];
  const edges: ArchitectureViewEdge[] = [];
  const overlays: ArchitectureViewOverlay[] = [];

  const replacementNodeIds: string[] = [];
  const agingNodeIds: string[] = [];

  for (const [fn, group] of head) {
    const capabilityId = `cap-${slug(fn)}`;

    const vendors = new Set(group.map((r) => str(r.vendor)).filter(Boolean));
    const replacement = group.filter((r) => str(r.replacementCandidate) === "yes").length;
    const aging = group.filter((r) =>
      ["legacy_stable", "sunset_planned", "deprecated"].includes(str(r.lifecycleState)),
    ).length;
    const tier1 = group.filter((r) => str(r.criticality) === "tier1").length;
    const interfaces = group.reduce((s, r) => s + num(r.interfacesCount), 0);

    // One node per capability, carrying the technology that supports it as metrics. Individual
    // systems become nodes at L2 -- emitting a second "estate" node per function here would
    // double the count without adding meaning, and blows the executive density ceiling.
    nodes.push({
      id: capabilityId,
      label: fn,
      semanticRole: "business_capability",
      layer: CAPABILITY_LANE,
      // Rolls up `group.length` application records; no single source record is this node.
      evidenceBasis: "ABARVA_DERIVED",
      evidenceIds: group.slice(0, 8).map((r) => str(r.systemName)).filter(Boolean),
      aggregation: {
        groupByField: "business_function",
        groupByValue: fn,
        memberNodeIds: group.map((r) => canonicalNodeId("sys", str(r.systemName))).filter((x) => !x.endsWith("--")),
        memberCount: group.length,
        basis: "CANONICAL_FIELD",
      },
      businessFunction: fn,
      metrics: {
        systems: group.length,
        distinctVendors: vendors.size,
        tier1Systems: tier1,
        replacementCandidates: replacement,
        agingSystems: aging,
        recordedInterfaces: interfaces,
      },
      note: `${group.length} systems · ${vendors.size} vendors · ${tier1} tier-1`,
    });

    if (replacement > 0) replacementNodeIds.push(capabilityId);
    if (aging > 0) agingNodeIds.push(capabilityId);
  }

  if (tail.length > 0) {
    const tailSystems = tail.reduce((s, [, g]) => s + g.length, 0);
    nodes.push({
      id: "cap-remaining",
      label: `${tail.length} further functions`,
      semanticRole: "business_capability",
      layer: CAPABILITY_LANE,
      evidenceBasis: "ABARVA_DERIVED",
      evidenceIds: tail.map(([fn]) => fn),
      aggregation: {
        groupByField: "business_function",
        groupByValue: `${tail.length} further functions`,
        memberNodeIds: tail.flatMap(([, g]) =>
          g.map((r) => canonicalNodeId("sys", str(r.systemName))).filter((x) => !x.endsWith("--")),
        ),
        memberCount: tailSystems,
        basis: "CANONICAL_FIELD",
      },
      metrics: { systems: tailSystems, functions: tail.length },
      note: `${tailSystems} systems across ${tail.length} functions — expand at L1`,
    });
  }

  // Same rule as the nodes: the key is recorded, the grouping is ours.
  const groups: ArchitectureViewGroup[] = head.map(([fn]) => ({
    id: `cap-${slug(fn)}`,
    label: fn,
    layer: CAPABILITY_LANE,
    evidenceBasis: "ABARVA_DERIVED" as const,
    note: "Grouped by recorded business_function; not a modelled capability object.",
  }));

  if (replacementNodeIds.length > 0) {
    const total = rows.filter((r) => str(r.replacementCandidate) === "yes").length;
    overlays.push({
      id: "overlay-replacement",
      kind: "modernization",
      label: `${total} systems flagged to replace`,
      nodeIds: replacementNodeIds,
      evidenceBasis: "CANONICAL",
      evidenceIds: [`${applications.objectType}.replacementCandidate=yes`],
    });
  }
  if (agingNodeIds.length > 0) {
    const total = rows.filter((r) =>
      ["legacy_stable", "sunset_planned", "deprecated"].includes(str(r.lifecycleState)),
    ).length;
    overlays.push({
      id: "overlay-aging",
      kind: "resilience",
      label: `${total} systems legacy, sunset-planned or deprecated`,
      nodeIds: agingNodeIds,
      evidenceBasis: "CANONICAL",
      evidenceIds: [`${applications.objectType}.lifecycleState`],
    });
  }

  const limitations: string[] = [
    "Groupings are business functions as recorded on each application; they are not a formally modelled capability taxonomy.",
  ];
  const unspecified = byFunction.get("(not specified)")?.length ?? 0;
  if (unspecified > 0) {
    limitations.push(`${unspecified} systems carry no business function and are grouped as "(not specified)".`);
  }
  if (tail.length > 0) {
    limitations.push(
      `${tail.length} lower-volume functions are folded into a single node at this audience level; raise to L1 to see each.`,
    );
  }
  const noVendor = rows.filter((r) => !str(r.vendor)).length;
  if (noVendor > 0) {
    limitations.push(`Vendor is unrecorded on ${noVendor} of ${rows.length} systems, so vendor counts understate the estate.`);
  }

  const topFunction = ordered[0];
  const share = topFunction ? Math.round((topFunction[1].length / rows.length) * 100) : 0;

  return {
    viewType: "business_capability_landscape",
    audienceLevel,
    layerScheme: "enterprise_estate_v1",
    validationProfile: "enterprise_current_state",
    tenantKey,
    title: topFunction
      ? `${topFunction[0]} carries ${share}% of ${tenantDisplayName}'s application estate`
      : `${tenantDisplayName} application estate by business function`,
    primaryQuestion: "Where is technology complexity concentrated across the enterprise?",
    contextLine: `Current state · observed · ${tenantDisplayName} · ${rows.length} applications`,
    nodes,
    edges,
    groups,
    boundaries: [],
    overlays,
    evidenceCoverage: computeEvidenceCoverage(nodes, edges, options.canonicalBuild),
    limitations,
  };
}
