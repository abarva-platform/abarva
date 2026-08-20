import {
  computeEvidenceCoverage,
  type ArchitectureView,
  type ArchitectureViewEdge,
  type ArchitectureViewGroup,
  type ArchitectureViewNode,
  type ArchitectureViewOverlay,
} from "../architecture-view-contract";
import { canonicalNodeId } from "../architecture-view-contract";
import type { TechRecordType } from "@/lib/home/preview/types";

/**
 * Business capability -> technology, at L2. The relational view: real capability nodes, real
 * application/platform nodes, and capability->system edges that come directly from a recorded
 * field (`application_system.business_function`). No fuzzy matching and no model-generated
 * relationships -- if the field is absent the system is grouped as "(not specified)" rather than
 * attached to a guess.
 *
 * Scoped to one capability at a time. Rendering 301 systems at once is the density failure the
 * contract rejects; scoping is the mechanism that keeps L2 usable. Where a single capability is
 * still too large to draw system-by-system (Meridian's Clinical Informatics at 99, SkyHarbor's
 * Airport & Ground Operations at 217), the systems aggregate by `system_category` -- also a
 * recorded field, never an invented grouping -- and the aggregation is declared in limitations.
 */

const CAPABILITY_LANE = "business_capability";
const APPLICATIONS_LANE = "applications_core_platforms";

/** Above this, a capability aggregates by canonical system_category to stay inside L2 density. */
const SYSTEM_NODE_CEILING = 40;

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

function str(value: unknown): string {
  return value === null || value === undefined ? "" : String(value).trim();
}

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export interface CapabilityToTechnologyOptions {
  tenantKey: string;
  tenantDisplayName: string;
  applications: TechRecordType;
  /** The capability to scope to. Required: L2 is always capability-scoped. */
  capability: string;
  canonicalBuild?: string;
}

export function buildCapabilityToTechnologyView(
  options: CapabilityToTechnologyOptions,
): ArchitectureView {
  const { tenantKey, tenantDisplayName, applications, capability } = options;
  const rows = (applications.rows ?? []).filter(
    (r) => (str(r.businessFunction) || "(not specified)") === capability,
  );

  const nodes: ArchitectureViewNode[] = [];
  const edges: ArchitectureViewEdge[] = [];
  const overlays: ArchitectureViewOverlay[] = [];
  const limitations: string[] = [];

  const capabilityId = `cap-${slug(capability)}`;
  nodes.push({
    id: capabilityId,
    label: capability,
    semanticRole: "business_capability",
    layer: CAPABILITY_LANE,
    evidenceBasis: "ABARVA_DERIVED",
    evidenceIds: [`${applications.objectType}.business_function=${capability}`],
    businessFunction: capability,
    metrics: { systems: rows.length },
    aggregation: {
      groupByField: "business_function",
      groupByValue: capability,
      memberNodeIds: rows.map((r) => canonicalNodeId("sys", str(r.systemName))).filter((x) => !x.endsWith("--")),
      memberCount: rows.length,
      basis: "CANONICAL_FIELD",
    },
  });

  const aggregate = rows.length > SYSTEM_NODE_CEILING;
  const replacementIds: string[] = [];
  const agingIds: string[] = [];

  if (!aggregate) {
    // One node per real system, keeping canonical identity.
    for (const row of rows) {
      const name = str(row.systemName);
      if (!name) continue;
      const id = canonicalNodeId("sys", name);
      const lifecycle = str(row.lifecycleState);
      const replacement = str(row.replacementCandidate) === "yes";
      const aging = ["legacy_stable", "sunset_planned", "deprecated"].includes(lifecycle);

      nodes.push({
        id,
        label: name,
        semanticRole: "application",
        layer: APPLICATIONS_LANE,
        groupId: capabilityId,
        evidenceBasis: "CANONICAL",
        evidenceIds: [name],
        businessFunction: capability,
        vendor: str(row.vendor) || undefined,
        owner: str(row.businessOwner) || str(row.technologyOwner) || undefined,
        dataDomain: str(row.dataDomains) || undefined,
        criticality: str(row.criticality) || undefined,
        lifecycle: lifecycle || undefined,
        service: str(row.systemCategory) || undefined,
        metrics: {
          annualCostUsd: num(row.annualCostUsd),
          recordedInterfaces: num(row.interfacesCount),
          userCount: num(row.userCount),
        },
      });

      edges.push({
        id: `sup-${slug(name)}`,
        from: id,
        to: capabilityId,
        label: "supports",
        evidenceBasis: "CANONICAL",
        evidenceIds: [`${applications.objectType}.business_function=${capability}`],
      });

      if (replacement) replacementIds.push(id);
      if (aging) agingIds.push(id);
    }
  } else {
    // Aggregate by canonical system_category rather than truncating the estate.
    const byCategory = new Map<string, typeof rows>();
    for (const row of rows) {
      const cat = str(row.systemCategory) || "(uncategorised)";
      const bucket = byCategory.get(cat);
      if (bucket) bucket.push(row);
      else byCategory.set(cat, [row]);
    }
    for (const [cat, group] of [...byCategory.entries()].sort((a, b) => b[1].length - a[1].length)) {
      const id = `cat-${slug(capability)}-${slug(cat)}`;
      const vendors = new Set(group.map((r) => str(r.vendor)).filter(Boolean));
      const replacement = group.filter((r) => str(r.replacementCandidate) === "yes").length;
      const aging = group.filter((r) =>
        ["legacy_stable", "sunset_planned", "deprecated"].includes(str(r.lifecycleState)),
      ).length;

      nodes.push({
        id,
        label: cat,
        semanticRole: "application",
        layer: APPLICATIONS_LANE,
        groupId: capabilityId,
        // The field grouped BY is canonical; the resulting group is not a source record.
        evidenceBasis: "ABARVA_DERIVED",
        evidenceIds: group.slice(0, 8).map((r) => str(r.systemName)).filter(Boolean),
        aggregation: {
          groupByField: "system_category",
          groupByValue: cat,
          memberNodeIds: group.map((r) => canonicalNodeId("sys", str(r.systemName))).filter((x) => !x.endsWith("--")),
          memberCount: group.length,
          basis: "CANONICAL_FIELD",
        },
        businessFunction: capability,
        service: cat,
        metrics: {
          systems: group.length,
          distinctVendors: vendors.size,
          replacementCandidates: replacement,
          agingSystems: aging,
          annualCostUsd: group.reduce((s, r) => s + num(r.annualCostUsd), 0),
          recordedInterfaces: group.reduce((s, r) => s + num(r.interfacesCount), 0),
        },
        note: `${group.length} systems · ${vendors.size} vendors`,
      });

      edges.push({
        id: `sup-${slug(capability)}-${slug(cat)}`,
        from: id,
        to: capabilityId,
        label: "supports",
        weight: group.length,
        // Collapses `group.length` canonical system->capability relationships into one line.
        evidenceBasis: "ABARVA_DERIVED",
        evidenceIds: [`${applications.objectType}.business_function=${capability}`],
        derivedFromEdgeIds: group
          .map((r) => `sup-${slug(str(r.systemName))}`)
          .filter((x) => x !== "sup-"),
      });

      if (replacement > 0) replacementIds.push(id);
      if (aging > 0) agingIds.push(id);
    }
    limitations.push(
      `${rows.length} systems support this capability — more than can be drawn individually, so they are grouped by their recorded system category. Drill into a category for the individual systems.`,
    );
  }

  if (replacementIds.length > 0) {
    overlays.push({
      id: "overlay-replacement",
      kind: "modernization",
      label: `${rows.filter((r) => str(r.replacementCandidate) === "yes").length} systems flagged to replace`,
      nodeIds: replacementIds,
      evidenceBasis: "CANONICAL",
      evidenceIds: [`${applications.objectType}.replacement_candidate=yes`],
    });
  }
  if (agingIds.length > 0) {
    overlays.push({
      id: "overlay-aging",
      kind: "resilience",
      label: `${rows.filter((r) => ["legacy_stable", "sunset_planned", "deprecated"].includes(str(r.lifecycleState))).length} systems legacy, sunset-planned or deprecated`,
      nodeIds: agingIds,
      evidenceBasis: "CANONICAL",
      evidenceIds: [`${applications.objectType}.lifecycle_state`],
    });
  }

  const noVendor = rows.filter((r) => !str(r.vendor)).length;
  if (noVendor > 0) {
    limitations.push(`Vendor is unrecorded on ${noVendor} of ${rows.length} systems in this capability.`);
  }
  limitations.push(
    "Risk counts per system are not carried in this view: the risk register links to systems by name and does not fully resolve, so a per-system risk figure would be incomplete rather than wrong-by-omission.",
  );

  // The grouping KEY is a recorded business_function value; the GROUP is our construct. There is
  // no canonical "capability object" in the source, so the container inherits the same derived
  // status as the node it mirrors -- otherwise the same id claims two different provenances.
  const groups: ArchitectureViewGroup[] = [
    {
      id: capabilityId,
      label: capability,
      layer: CAPABILITY_LANE,
      evidenceBasis: "ABARVA_DERIVED",
      note: "Grouped by recorded business_function; not a modelled capability object.",
    },
  ];

  const totalCost = rows.reduce((s, r) => s + num(r.annualCostUsd), 0);

  return {
    viewType: "business_capability_to_technology",
    audienceLevel: "L2_logical",
    layerScheme: "enterprise_estate_v1",
    validationProfile: "enterprise_current_state",
    tenantKey,
    title: `${rows.length} systems support ${capability} at ${tenantDisplayName}`,
    primaryQuestion: `What technology supports ${capability}?`,
    contextLine: `Current state · observed · ${tenantDisplayName} · ${rows.length} systems · $${(totalCost / 1_000_000).toFixed(1)}M recorded annual cost`,
    nodes,
    edges,
    groups,
    boundaries: [],
    overlays,
    evidenceCoverage: computeEvidenceCoverage(nodes, edges, options.canonicalBuild),
    limitations,
  };
}

/** Capabilities available to scope to, largest first. */
export function listCapabilities(applications: TechRecordType): Array<{ capability: string; systems: number }> {
  const counts = new Map<string, number>();
  for (const row of applications.rows ?? []) {
    const fn = str(row.businessFunction) || "(not specified)";
    counts.set(fn, (counts.get(fn) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([capability, systems]) => ({ capability, systems }))
    .sort((a, b) => b.systems - a.systems);
}
