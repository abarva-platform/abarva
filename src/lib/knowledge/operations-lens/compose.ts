/**
 * Pure composition for the Operations & Vendor Intelligence lens.
 *
 * These functions take a normalized {@link LensSource} (data the governed provider
 * already returned) and re-organize it by operational capability and by vendor.
 * They are deterministic and side-effect free: no provider calls, no `Date.now()`
 * (renewal windows use the baseline `asOf`). Governance invariants held here:
 *
 *  - A null/withheld/not-loaded value is NEVER coerced to 0 — it becomes a
 *    RepresentedCount with `value: null` and a reason.
 *  - No business judgment is synthesized. Vendor "concentration" is reported as
 *    raw counts; the only risk voice is governed risk objects reachable in the
 *    evidence-backed relationship graph.
 *  - Capability attribution comes only from an explicit governed capability signal
 *    (entity field), never inferred from names.
 */

import type {
  DomainReadinessV1,
  EntityFieldValue,
  EntitySummaryV1,
  RelationshipNodeV1,
} from "../consumption-contracts";
import { matchCapabilityKeys, OPERATIONS_CAPABILITIES, type OperationsCapabilityKey } from "./taxonomy";
import type {
  CapabilityView,
  DependencyChainView,
  DependencyLink,
  DependencyNodeView,
  LensSource,
  OperationsOverview,
  RepresentedCount,
  VendorIntelView,
} from "./types";

const RENEWAL_WINDOW_MONTHS = 12;
const INCIDENT_FIELD_KEYS = new Set([
  "sev1_incidents",
  "sev2_incidents",
  "sla_breaches",
  "incident_summary",
  "sla_summary",
]);

// ---------------------------------------------------------------------------
// small helpers
// ---------------------------------------------------------------------------

function domainState(domains: DomainReadinessV1[], domainKey: string): DomainReadinessV1 | undefined {
  return domains.find((d) => d.domainKey === domainKey);
}

/**
 * Build a RepresentedCount. When the owning domain is not loaded/withheld we
 * return a null value with a reason instead of a misleading 0.
 */
function representedCount(
  label: string,
  items: unknown[],
  domain: DomainReadinessV1 | undefined,
  evidenceRefs: string[] = [],
): RepresentedCount {
  const state = domain?.availabilityState;
  if (state === "not_loaded" || state === "withheld") {
    return {
      label,
      value: null,
      availabilityState: state,
      absenceReason:
        state === "not_loaded"
          ? `${domain?.label ?? "This domain"} is not loaded in the active baseline.`
          : `${domain?.label ?? "This domain"} is withheld.`,
      evidenceRefs: [],
    };
  }
  return {
    label,
    value: items.length,
    availabilityState: state ?? "available",
    evidenceRefs,
  };
}

function fieldValue(entity: EntitySummaryV1, key: string): EntityFieldValue | undefined {
  return entity.fields.find((f) => f.key === key);
}

/** Read a displayable string field, or null when the field has no usable value. */
function fieldString(entity: EntitySummaryV1, key: string): string | null {
  const f = fieldValue(entity, key);
  if (!f || f.value === null || f.availabilityState !== "available") return null;
  return String(f.value);
}

function isTierOne(app: EntitySummaryV1): boolean {
  const c = fieldString(app, "criticality");
  return c === "tier_1" || c === "tier1" || c === "critical";
}

// ---------------------------------------------------------------------------
// graph adjacency (nodeId is the stable entity ref in the governed projection)
// ---------------------------------------------------------------------------

interface Graph {
  nodeById: Map<string, RelationshipNodeV1>;
  /** ref -> set of neighbor refs (undirected view for reachability). */
  neighbors: Map<string, Set<string>>;
}

function buildGraph(src: LensSource): Graph {
  const nodeById = new Map<string, RelationshipNodeV1>();
  for (const n of src.relationships.nodes) nodeById.set(n.nodeId, n);
  const neighbors = new Map<string, Set<string>>();
  const add = (a: string, b: string) => {
    if (!neighbors.has(a)) neighbors.set(a, new Set());
    neighbors.get(a)!.add(b);
  };
  for (const e of src.relationships.edges) {
    add(e.fromNodeId, e.toNodeId);
    add(e.toNodeId, e.fromNodeId);
  }
  return { nodeById, neighbors };
}

function neighborRefsOfType(graph: Graph, ref: string, nodeType: string): string[] {
  const out: string[] = [];
  for (const nb of graph.neighbors.get(ref) ?? []) {
    if (graph.nodeById.get(nb)?.nodeType === nodeType) out.push(nb);
  }
  return out;
}

// ---------------------------------------------------------------------------
// vendor <-> application association
// ---------------------------------------------------------------------------

/**
 * Applications supported by a vendor. Primary signal is the evidence-backed
 * relationship graph (app node adjacent to the vendor node); a governed `vendor`
 * field on an application is a secondary confirmation. We never guess from names.
 */
function applicationsForVendor(
  src: LensSource,
  graph: Graph,
  vendor: EntitySummaryV1,
): EntitySummaryV1[] {
  const byGraph = new Set(neighborRefsOfType(graph, vendor.entityRef, "application"));
  return src.applications.filter((app) => {
    if (byGraph.has(app.entityRef)) return true;
    const v = fieldString(app, "vendor");
    return v !== null && (v === vendor.entityRef || v === vendor.displayName);
  });
}

function capabilitiesOfApp(app: EntitySummaryV1): OperationsCapabilityKey[] {
  const signal =
    fieldString(app, "capability") ?? fieldString(app, "operational_capability");
  return matchCapabilityKeys(signal);
}

/** Risk entities reachable (1 hop) from any of the given application refs. */
function risksReachableFrom(
  src: LensSource,
  graph: Graph,
  appRefs: string[],
): EntitySummaryV1[] {
  const riskRefs = new Set<string>();
  for (const appRef of appRefs) {
    for (const r of neighborRefsOfType(graph, appRef, "risk")) riskRefs.add(r);
  }
  // Prefer full risk entities; fall back to a minimal shape from the graph node.
  return Array.from(riskRefs).map((ref) => {
    const entity = src.risks.find((r) => r.entityRef === ref);
    if (entity) return entity;
    const node = graph.nodeById.get(ref);
    return {
      entityRef: ref,
      entityType: "risk",
      displayName: node?.label ?? ref,
      domainKey: "risks",
      availabilityState: node?.availabilityState ?? "available",
      fields: [],
      evidenceRefs: node?.evidenceRefs ?? [],
    } satisfies EntitySummaryV1;
  });
}

// ---------------------------------------------------------------------------
// contracts & renewals (window is measured from the baseline as-of)
// ---------------------------------------------------------------------------

function contractsForVendor(src: LensSource, vendor: EntitySummaryV1): EntitySummaryV1[] {
  return src.contracts.filter((c) => {
    const v = fieldString(c, "vendor");
    return v === vendor.entityRef || v === vendor.displayName;
  });
}

function isRenewalWithinWindow(renewalIso: string, asOfIso: string): boolean {
  const renewal = Date.parse(renewalIso);
  const asOf = Date.parse(asOfIso);
  if (Number.isNaN(renewal) || Number.isNaN(asOf)) return false;
  const windowEnd = new Date(asOf);
  windowEnd.setMonth(windowEnd.getMonth() + RENEWAL_WINDOW_MONTHS);
  return renewal >= asOf && renewal <= windowEnd.getTime();
}

/**
 * Count of contracts renewing within the 12-month window from the baseline as-of.
 * If no contract carries an available renewal date, the count is null (unknown),
 * never 0 — "we cannot see it" must not read as "there are none".
 */
function renewalsApproaching(
  contracts: EntitySummaryV1[],
  domains: DomainReadinessV1[],
  asOf: string,
): RepresentedCount {
  const vendorsDomain = domainState(domains, "vendors");
  if (vendorsDomain?.availabilityState === "not_loaded") {
    return representedCount("Renewals in 12 months", [], vendorsDomain);
  }
  const withDate = contracts.filter((c) => fieldString(c, "renewal_date") !== null);
  if (contracts.length > 0 && withDate.length === 0) {
    return {
      label: "Renewals in 12 months",
      value: null,
      availabilityState: "not_loaded",
      absenceReason: "Renewal dates are not loaded for these contracts.",
      evidenceRefs: [],
    };
  }
  const approaching = withDate.filter((c) =>
    isRenewalWithinWindow(fieldString(c, "renewal_date") as string, asOf),
  );
  return {
    label: "Renewals in 12 months",
    value: approaching.length,
    availabilityState: "available",
    evidenceRefs: approaching.flatMap((c) => c.evidenceRefs),
  };
}

// ---------------------------------------------------------------------------
// public compose functions
// ---------------------------------------------------------------------------

export function composeOverview(src: LensSource): OperationsOverview {
  const tech = domainState(src.domains, "technology");
  const vendorsD = domainState(src.domains, "vendors");
  const risksD = domainState(src.domains, "risks");

  const capabilities = composeCapabilities(src);
  const representedCaps = capabilities.filter((c) => c.represented);

  // "deferred" = candidate (proposed, not yet accepted) entities/edges awaiting a
  // human decision. "conflicting" = objects the baseline flags as conflicting.
  const allEntities = [
    ...src.applications,
    ...src.vendors,
    ...src.contracts,
    ...src.risks,
    ...src.programs,
  ];
  const deferred = [
    ...allEntities.filter((e) => e.availabilityState === "candidate"),
    ...src.relationships.edges.filter((e) => e.availabilityState === "candidate"),
  ];
  const conflicting = [
    ...allEntities.filter((e) => e.availabilityState === "conflicting"),
    ...src.gaps.filter((g) => g.gapState === "conflicting"),
  ];

  return {
    criticalCapabilities: {
      label: "Critical capabilities represented",
      value: representedCaps.length,
      availabilityState: tech?.availabilityState ?? "available",
      evidenceRefs: [],
    },
    applications: representedCount("Applications connected", src.applications, tech),
    materialVendors: representedCount("Material vendors", src.vendors, vendorsD),
    contracts: representedCount("Contracts", src.contracts, vendorsD),
    renewalsApproaching: renewalsApproaching(src.contracts, src.domains, src.asOf),
    operationalRisks: representedCount("Known operational risks", src.risks, risksD),
    evidenceCoverage: src.overallEvidenceCoverage,
    deferredAssertions: {
      label: "Candidate / deferred assertions",
      value: deferred.length,
      availabilityState: "candidate",
      evidenceRefs: [],
    },
    conflictingAssertions: {
      label: "Conflicting assertions",
      value: conflicting.length,
      availabilityState: conflicting.length > 0 ? "conflicting" : "available",
      evidenceRefs: [],
    },
  };
}

export function composeCapabilities(src: LensSource): CapabilityView[] {
  const graph = buildGraph(src);
  return OPERATIONS_CAPABILITIES.map((cap) => {
    const apps = src.applications.filter((app) =>
      capabilitiesOfApp(app).includes(cap.key),
    );
    const appRefs = apps.map((a) => a.entityRef);
    const vendorRefs = new Set<string>();
    for (const app of apps) {
      for (const vRef of neighborRefsOfType(graph, app.entityRef, "vendor")) {
        vendorRefs.add(vRef);
      }
      const vField = fieldString(app, "vendor");
      if (vField) {
        const match = src.vendors.find(
          (v) => v.entityRef === vField || v.displayName === vField,
        );
        if (match) vendorRefs.add(match.entityRef);
      }
    }
    const represented = apps.length > 0;
    return {
      key: cap.key,
      label: cap.label,
      description: cap.description,
      represented,
      applications: apps,
      vendorRefs: Array.from(vendorRefs),
      linkedRisks: risksReachableFrom(src, graph, appRefs),
      availabilityState: represented ? "available" : "not_loaded",
      absenceReason: represented
        ? null
        : "No systems are mapped to this capability in the active baseline yet.",
    } satisfies CapabilityView;
  });
}

export function composeVendorIntel(src: LensSource, vendorRef: string): VendorIntelView | null {
  const vendor = src.vendors.find((v) => v.entityRef === vendorRef);
  if (!vendor) return null;
  const graph = buildGraph(src);

  const supportedApplications = applicationsForVendor(src, graph, vendor);
  const appRefs = supportedApplications.map((a) => a.entityRef);
  const capabilitiesTouched = Array.from(
    new Set(supportedApplications.flatMap(capabilitiesOfApp)),
  );
  const contracts = contractsForVendor(src, vendor);
  const vendorsD = domainState(src.domains, "vendors");
  const programsD = domainState(src.domains, "programs");

  const transformationPrograms = src.programs.filter((p) => {
    const affected = fieldString(p, "systems");
    if (!affected) return false;
    const set = new Set(affected.split(/[,;|]/).map((s) => s.trim()));
    return appRefs.some((ref) => set.has(ref));
  });

  const incidentSummary = vendor.fields.filter((f) => INCIDENT_FIELD_KEYS.has(f.key));

  return {
    vendorRef: vendor.entityRef,
    displayName: vendor.displayName,
    availabilityState: vendor.availabilityState,
    supportedApplications,
    capabilitiesTouched,
    contractCount: representedCount("Contracts", contracts, vendorsD),
    renewalsApproaching: renewalsApproaching(contracts, src.domains, src.asOf),
    incidentSummary,
    transformationExposure: programsD?.availabilityState === "not_loaded"
      ? representedCount("Transformation exposure", [], programsD)
      : {
          label: "Transformation exposure",
          value: transformationPrograms.length,
          availabilityState: "available",
          evidenceRefs: transformationPrograms.flatMap((p) => p.evidenceRefs),
        },
    concentration: {
      applicationsSupported: supportedApplications.length,
      tierOneApplications: supportedApplications.filter(isTierOne).length,
      capabilitiesTouched: capabilitiesTouched.length,
    },
    linkedRisks: risksReachableFrom(src, graph, appRefs),
    evidenceGaps: src.gaps.filter((g) => g.domainKey === "vendors"),
    evidenceRefs: vendor.evidenceRefs,
  };
}

/** Compact vendor list for the vendor navigator. */
export function composeVendorList(
  src: LensSource,
): Array<{ vendorRef: string; displayName: string; availabilityState: EntitySummaryV1["availabilityState"] }> {
  return src.vendors.map((v) => ({
    vendorRef: v.entityRef,
    displayName: v.displayName,
    availabilityState: v.availabilityState,
  }));
}

/**
 * Build a navigable dependency chain rooted at a focal object, from the governed
 * relationship graph. Ordering is the object's neighbors grouped by hop; each link
 * carries its edge evidence refs so any hop opens the evidence drawer.
 */
export function composeDependencyChain(
  src: LensSource,
  focalRef: string,
): DependencyChainView {
  const graph = buildGraph(src);
  const focalNode = graph.nodeById.get(focalRef);
  const focalLabel =
    focalNode?.label ??
    [...src.applications, ...src.vendors, ...src.risks, ...src.programs].find(
      (e) => e.entityRef === focalRef,
    )?.displayName ??
    focalRef;

  const nodes: DependencyNodeView[] = src.relationships.nodes.map((n) => ({
    ref: n.nodeId,
    label: n.label,
    type: n.nodeType,
    availabilityState: n.availabilityState,
    hop: n.hop,
    evidenceRefs: n.evidenceRefs,
  }));

  const labelOf = (ref: string): string => graph.nodeById.get(ref)?.label ?? ref;
  const typeOf = (ref: string): string => graph.nodeById.get(ref)?.nodeType ?? "unknown";

  const links: DependencyLink[] = src.relationships.edges.map((e) => ({
    edgeId: e.edgeId,
    fromRef: e.fromNodeId,
    fromLabel: labelOf(e.fromNodeId),
    fromType: typeOf(e.fromNodeId),
    toRef: e.toNodeId,
    toLabel: labelOf(e.toNodeId),
    toType: typeOf(e.toNodeId),
    relationshipType: e.relationshipType,
    authorityState: e.authorityState,
    availabilityState: e.availabilityState,
    scope: e.scope,
    evidenceRefs: e.evidenceRefs,
  }));

  return {
    focalRef,
    focalLabel,
    nodes,
    links,
    truncated: src.relationships.truncated,
    omittedNodeCount: src.relationships.omittedNodeCount,
  };
}
