import type { ArchLayer, ArchNodeStatus, CloudProvider } from "./architecture-model";

/**
 * Architecture VIEW contract — the projection layer above `architecture-model.ts`.
 *
 * The distinction this file exists to enforce: a canonical object's *semantics* (what a thing is)
 * are stable and shared; its *placement* (which lane it sits in, for whom, at what density) is a
 * property of the view, not of the object. Collapsing those two is what forces every audience
 * through one diagram.
 *
 * `architecture-model.ts` is untouched and keeps serving the deliverables orchestrator. Its
 * seven-value `ArchLayer` is a legitimate vocabulary for solution/AI architecture and is preserved
 * here as the `solution_stack_v1` layer scheme rather than replaced. Home's enterprise-estate
 * views use `enterprise_estate_v1`; a physical deployment view can add its own scheme later
 * without either of the first two having to change.
 */

/** What a node IS. Stable across every view; never encodes placement. */
export type SemanticRole =
  | "business_capability"
  | "channel"
  | "application"
  | "core_system"
  | "integration"
  | "data_store"
  | "data_platform"
  | "analytics"
  | "ai_ml"
  | "infrastructure"
  | "security"
  | "external_party";

/**
 * Provenance of a node, edge, or classification. First-class, never a footnote.
 * - CANONICAL: the source record states this directly.
 * - ABARVA_DERIVED: we classified/grouped it from canonical fields. Defensible, but ours.
 * - CANDIDATE: proposed or under evaluation; not established fact.
 * Anything with no basis at all is not renderable — it must be omitted, not guessed.
 */
export type EvidenceBasis = "CANONICAL" | "ABARVA_DERIVED" | "CANDIDATE";

/** Named lane vocabularies. The renderer reads the scheme; it does not hardcode lanes. */
export type LayerScheme = "enterprise_estate_v1" | "solution_stack_v1" | "aws_physical_v1";

/**
 * Lane order is BUSINESS FIRST (decided 2026-08-20): a capability decomposes downward into the
 * technology that serves it. This is the axis the renderer lays out along.
 *
 * Consequence worth knowing before reading any orientation value: the canonical `supports`
 * relation is recorded system -> function (all 382 of Meridian's supports edges target a
 * function). "Supports" is an upward, serving relation, so against a business-first decomposition
 * axis it is uniformly `backward`. That is a property of the two readings being orthogonal, not a
 * defect in the data -- and it is why capability views omit orientation rather than labelling
 * every edge backward. Canonical direction is never inverted to make a diagram read tidily.
 */
export const LAYER_SCHEMES: Readonly<Record<LayerScheme, ReadonlyArray<string>>> = {
  enterprise_estate_v1: [
    "business_capability",
    "channels_consumption",
    "applications_core_platforms",
    "integration",
    "data",
    "analytics_ai",
    "infrastructure",
    "external_ecosystem",
  ],
  // Backward-compatible mirror of ArchLayer / ARCH_LAYER_ORDER. Kept in step deliberately so the
  // deliverables pipeline and the view layer cannot silently diverge.
  solution_stack_v1: [
    "experience",
    "agentic",
    "application",
    "data_platform",
    "integration",
    "core_systems",
    "infrastructure",
  ],
  aws_physical_v1: ["organization", "account", "region", "vpc", "az", "subnet", "service"],
};

export const LAYER_LABELS: Readonly<Record<string, string>> = {
  business_capability: "Business & Capability",
  channels_consumption: "Channels & Consumption",
  applications_core_platforms: "Applications & Core Platforms",
  integration: "Integration",
  data: "Data",
  analytics_ai: "Analytics & AI",
  infrastructure: "Infrastructure",
  external_ecosystem: "External Ecosystem",
};

export type ArchitectureViewType =
  | "business_capability_landscape"
  | "business_capability_to_technology"
  | "enterprise_technology_landscape"
  | "application_platform_landscape"
  | "data_analytics_architecture"
  | "integration_topology"
  | "infrastructure_hosting"
  | "vendor_sourcing"
  | "risk_resilience"
  | "current_transition_target";

/** Audience drives density, not just the title. Enforced by the validator, not by convention. */
export type AudienceLevel = "L0_executive" | "L1_domain" | "L2_logical" | "L3_technical";

/** L3 is drill/filter rather than a fixed ceiling — an arbitrary cap there would be theatre. */
export const AUDIENCE_DENSITY: Readonly<
  Record<AudienceLevel, { min: number; max: number | null }>
> = {
  L0_executive: { min: 8, max: 15 },
  L1_domain: { min: 15, max: 30 },
  L2_logical: { min: 20, max: 50 },
  L3_technical: { min: 1, max: null },
};

/**
 * Validation profiles. The deliverables validator legitimately demands target state, AI control
 * flow, gap-to-target bridges and implementation waves -- correct for a P3/P4 solution deliverable,
 * wrong for "show me the current application landscape". Rather than weaken that validator, a
 * current-state view declares a different profile.
 */
export type ValidationProfile =
  | "enterprise_current_state"
  | "solution_design"
  | "target_architecture"
  | "physical_deployment"
  | "transformation";

/**
 * A visual node that summarises several canonical records. The field grouped BY is canonical; the
 * resulting group is not -- there is no source record for "these 17 systems". Such a node is
 * therefore ABARVA_DERIVED, and must carry the members it stands for so evidence inspection can
 * always reach the underlying canonical records.
 */
export interface NodeAggregation {
  groupByField: string;
  groupByValue: string;
  /** Canonical identities summarised. May reference nodes not present in this view. */
  memberNodeIds: string[];
  memberCount: number;
  basis: "CANONICAL_FIELD";
}

export interface ArchitectureViewNode {
  id: string;
  label: string;
  semanticRole: SemanticRole;
  /** Lane within the view's declared layerScheme. */
  layer: string;
  groupId?: string;
  boundaryId?: string;
  evidenceBasis: EvidenceBasis;
  evidenceIds: string[];
  /** Why this node sits in this lane, when the placement is ours rather than stated. */
  roleBasisNote?: string;
  /** Present when this node summarises multiple canonical records. */
  aggregation?: NodeAggregation;
  status?: ArchNodeStatus;
  provider?: CloudProvider;
  service?: string;
  vendor?: string;
  owner?: string;
  businessFunction?: string;
  dataDomain?: string;
  criticality?: string;
  lifecycle?: string;
  /** Quantities that belong to the node itself (record counts, degree, headroom). */
  metrics?: Record<string, number>;
  note?: string;
}

/**
 * Stable, bounded, collision-resistant id for a canonical object.
 *
 * Plain truncation is not safe here: Meridian has three "Sunquest Laboratory Information System
 * Interface — Meridian Rehabilitation Hospital — <site>" records that are identical for the first
 * 60 characters. Truncating collapsed 301 distinct systems into 287 ids, which would make a
 * drill-down click ambiguous. The suffix keeps ids short while preserving identity.
 */
export function canonicalNodeId(prefix: string, name: string): string {
  const raw = String(name ?? "").trim();
  const base = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  let h = 2166136261;
  for (let i = 0; i < raw.length; i += 1) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const suffix = (h >>> 0).toString(36).slice(0, 6);
  return `${prefix}-${base.slice(0, 48)}-${suffix}`;
}

export type EdgeOrientation = "forward" | "lateral" | "backward";

/**
 * Orientation from lane positions. `lateral` means same lane -- there is no direction to violate,
 * so it is a third case, not a mild form of backward.
 */
export function deriveOrientation(
  fromLayer: string,
  toLayer: string,
  layerScheme: LayerScheme,
): EdgeOrientation | null {
  const lanes = LAYER_SCHEMES[layerScheme];
  if (!lanes) return null;
  const a = lanes.indexOf(fromLayer);
  const b = lanes.indexOf(toLayer);
  if (a === -1 || b === -1) return null;
  if (a === b) return "lateral";
  return a < b ? "forward" : "backward";
}

export interface ArchitectureViewEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  mechanism?: string;
  weight?: number;
  evidenceBasis: EvidenceBasis;
  evidenceIds: string[];
  /**
   * Asserted in the contract AND validated against the view's lane order. Deriving it silently
   * would mean a change to lane order reclassifies every edge without anyone noticing; asserting
   * it without validation lets it drift from reality. Both, so it is explicit and cannot rot.
   */
  orientation?: EdgeOrientation;
  /** Set when this edge collapses several canonical relationships into one drawn line. */
  derivedFromEdgeIds?: string[];
}

export interface ArchitectureViewGroup {
  id: string;
  label: string;
  layer?: string;
  evidenceBasis: EvidenceBasis;
  note?: string;
}

/** A drawn limit of knowledge -- e.g. "no inbound lineage recorded before the reporting layer". */
export interface ArchitectureViewBoundary {
  id: string;
  label: string;
  kind: "coverage_gap" | "trust_boundary" | "external" | "environment";
  note?: string;
}

export interface ArchitectureViewOverlay {
  id: string;
  kind: "risk" | "cost" | "regulated_data" | "resilience" | "modernization";
  label: string;
  /** Node ids this overlay marks. */
  nodeIds: string[];
  evidenceBasis: EvidenceBasis;
  evidenceIds: string[];
}

export interface EvidenceCoverage {
  nodesTotal: number;
  nodesCanonical: number;
  nodesDerived: number;
  nodesCandidate: number;
  edgesTotal: number;
  edgesCanonical: number;
  /** Nodes that summarise several canonical records rather than standing for one. */
  nodesAggregated: number;
  /**
   * Share of nodes that are themselves one canonical record. Structurally 0 in any rollup and
   * always will be -- meaningful at L2/L3, misleading above it. Do not render above L2.
   */
  canonicalNodePct: number;
  /**
   * Share of nodes whose provenance resolves to canonical records, directly or through members.
   * This is the measure that is readable at every level.
   */
  memberTraceablePct: number;
  /** Plain sentence for rollup views, where a percentage cannot be read correctly. */
  aggregationSummary?: string;
  canonicalBuild?: string;
}

export interface ArchitectureView {
  viewType: ArchitectureViewType;
  audienceLevel: AudienceLevel;
  layerScheme: LayerScheme;
  validationProfile: ValidationProfile;
  tenantKey: string;
  /** Answer-first, not a category label. */
  title: string;
  primaryQuestion: string;
  contextLine?: string;
  nodes: ArchitectureViewNode[];
  edges: ArchitectureViewEdge[];
  groups: ArchitectureViewGroup[];
  boundaries: ArchitectureViewBoundary[];
  overlays: ArchitectureViewOverlay[];
  evidenceCoverage: EvidenceCoverage;
  limitations: string[];
}

export interface ArchitectureViewIssue {
  level: "error" | "warn";
  message: string;
}

/**
 * Governance teeth. Rejects the failure modes that produced the bad exhibit this contract exists
 * to prevent: nodes with no provenance, edges pointing at nothing, lanes that don't belong to the
 * declared scheme, and an "executive" view carrying seventy nodes.
 */
export function validateArchitectureView(view: ArchitectureView): ArchitectureViewIssue[] {
  const issues: ArchitectureViewIssue[] = [];
  if (!view || typeof view !== "object") {
    return [{ level: "error", message: "Architecture view is missing." }];
  }

  const lanes = LAYER_SCHEMES[view.layerScheme];
  if (!lanes) {
    issues.push({ level: "error", message: `Unknown layerScheme "${view.layerScheme}".` });
  }
  if (!view.title?.trim()) {
    issues.push({ level: "error", message: "View needs an answer-first title." });
  }
  if (!view.primaryQuestion?.trim()) {
    issues.push({ level: "error", message: "View needs a primary question." });
  }

  const ids = new Set<string>();
  for (const node of view.nodes ?? []) {
    if (ids.has(node.id)) {
      issues.push({ level: "error", message: `Duplicate node id "${node.id}".` });
    }
    ids.add(node.id);
    if (!node.evidenceBasis) {
      issues.push({ level: "error", message: `Node "${node.id}" has no evidenceBasis.` });
    }
    if (node.evidenceBasis === "CANONICAL" && (node.evidenceIds ?? []).length === 0) {
      issues.push({
        level: "error",
        message: `Node "${node.id}" claims CANONICAL basis with no evidenceIds.`,
      });
    }
    if (node.aggregation && node.evidenceBasis !== "ABARVA_DERIVED") {
      issues.push({
        level: "error",
        message: `Node "${node.id}" summarises ${node.aggregation.memberCount} records but claims ${node.evidenceBasis}; an aggregate is ABARVA_DERIVED.`,
      });
    }
    if (node.aggregation && node.aggregation.memberNodeIds.length === 0) {
      issues.push({
        level: "error",
        message: `Aggregate node "${node.id}" carries no memberNodeIds, so its evidence cannot be inspected.`,
      });
    }
    if (lanes && !lanes.includes(node.layer)) {
      issues.push({
        level: "error",
        message: `Node "${node.id}" sits in lane "${node.layer}", which is not part of ${view.layerScheme}.`,
      });
    }
  }

  for (const edge of view.edges ?? []) {
    if (!ids.has(edge.from) || !ids.has(edge.to)) {
      issues.push({
        level: "error",
        message: `Edge "${edge.id}" references a node that is not in this view.`,
      });
    }
    if (!edge.evidenceBasis) {
      issues.push({ level: "error", message: `Edge "${edge.id}" has no evidenceBasis.` });
    }
    if (edge.orientation) {
      const from = view.nodes?.find((n) => n.id === edge.from);
      const to = view.nodes?.find((n) => n.id === edge.to);
      if (from && to) {
        const derived = deriveOrientation(from.layer, to.layer, view.layerScheme);
        if (derived && derived !== edge.orientation) {
          issues.push({
            level: "error",
            message: `Edge "${edge.id}" asserts orientation "${edge.orientation}" but the lane order makes it "${derived}".`,
          });
        }
      }
    }
    if (edge.derivedFromEdgeIds?.length && edge.evidenceBasis !== "ABARVA_DERIVED") {
      issues.push({
        level: "error",
        message: `Edge "${edge.id}" collapses ${edge.derivedFromEdgeIds.length} canonical relationships but claims ${edge.evidenceBasis}.`,
      });
    }
  }

  for (const group of view.groups ?? []) {
    const mirrored = view.nodes?.find((n) => n.id === group.id);
    if (mirrored && mirrored.evidenceBasis !== group.evidenceBasis) {
      issues.push({
        level: "error",
        message: `Group "${group.id}" claims ${group.evidenceBasis} while the node of the same id is ${mirrored.evidenceBasis}; one identity cannot carry two provenances.`,
      });
    }
  }

  for (const overlay of view.overlays ?? []) {
    const orphan = overlay.nodeIds.filter((id) => !ids.has(id));
    if (orphan.length > 0) {
      issues.push({
        level: "warn",
        message: `Overlay "${overlay.id}" marks ${orphan.length} node(s) absent from this view.`,
      });
    }
  }

  // Progressive disclosure, enforced rather than requested.
  const density = AUDIENCE_DENSITY[view.audienceLevel];
  const count = (view.nodes ?? []).length;
  if (density) {
    if (density.max !== null && count > density.max) {
      issues.push({
        level: "error",
        message: `${view.audienceLevel} view carries ${count} nodes; the ceiling is ${density.max}. Raise the audience level or aggregate.`,
      });
    }
    if (count < density.min) {
      issues.push({
        level: "warn",
        message: `${view.audienceLevel} view carries only ${count} nodes (expected at least ${density.min}).`,
      });
    }
  }

  if (view.validationProfile === "enterprise_current_state") {
    // A current-state view must state what it cannot show. Silence reads as completeness.
    if (!Array.isArray(view.limitations)) {
      issues.push({ level: "error", message: "Current-state views must declare limitations[]." });
    }
    for (const node of view.nodes ?? []) {
      if (node.status === "new" || node.status === "changed") {
        issues.push({
          level: "error",
          message: `Node "${node.id}" carries target-state status "${node.status}" in a current-state view.`,
        });
      }
    }
  }

  return issues;
}

/** Compiles coverage from the view's own nodes/edges so it can never drift from what is drawn. */
export function computeEvidenceCoverage(
  nodes: ArchitectureViewNode[],
  edges: ArchitectureViewEdge[],
  canonicalBuild?: string,
): EvidenceCoverage {
  const nodesCanonical = nodes.filter((n) => n.evidenceBasis === "CANONICAL").length;
  const nodesDerived = nodes.filter((n) => n.evidenceBasis === "ABARVA_DERIVED").length;
  const nodesCandidate = nodes.filter((n) => n.evidenceBasis === "CANDIDATE").length;
  const nodesAggregated = nodes.filter((n) => Boolean(n.aggregation)).length;
  const edgesCanonical = edges.filter((e) => e.evidenceBasis === "CANONICAL").length;
  // Traceable = stands for a record, or names the records it summarises. A CANDIDATE node or an
  // aggregate with no members is not traceable -- zero stays reserved for "we do not know".
  const traceable = nodes.filter(
    (n) =>
      n.evidenceBasis === "CANONICAL" ||
      (n.evidenceBasis === "ABARVA_DERIVED" && (n.aggregation?.memberNodeIds.length ?? 0) > 0),
  ).length;
  // Distinct member identities, not a sum of memberCount: a view can hold both a parent
  // aggregate and its children (capability 217 + its 8 categories = 217 again), and summing
  // would report 434 records for an estate of 217.
  const memberIds = new Set<string>();
  for (const n of nodes) for (const id of n.aggregation?.memberNodeIds ?? []) memberIds.add(id);
  const members = memberIds.size;
  const aggregationSummary =
    nodesAggregated === nodes.length && nodes.length > 0
      ? `${nodes.length} nodes, each a group · ${members} records underneath · all traceable`
      : undefined;
  return {
    nodesTotal: nodes.length,
    nodesCanonical,
    nodesDerived,
    nodesCandidate,
    edgesTotal: edges.length,
    edgesCanonical,
    nodesAggregated,
    canonicalNodePct: nodes.length === 0 ? 0 : Math.round((nodesCanonical / nodes.length) * 100),
    memberTraceablePct: nodes.length === 0 ? 0 : Math.round((traceable / nodes.length) * 100),
    aggregationSummary,
    canonicalBuild,
  };
}

/** Compatibility bridge: the deliverables model's lane vocabulary IS solution_stack_v1. */
export function archLayerToScheme(layer: ArchLayer): string {
  return layer;
}
