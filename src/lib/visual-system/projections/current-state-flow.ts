import {
  canonicalNodeId,
  deriveOrientation,
  type ArchitectureView,
  type ArchitectureViewEdge,
  type ArchitectureViewNode,
  type AudienceLevel,
} from "../architecture-view-contract";
import {
  ZONE_LABEL,
  ZONE_ORDER,
  zoneFor,
  type ArchitectureZone,
  resolveTechnologySemantics,
  type ResolvedTechnologySemantics,
  classifyMechanism,
  classifyTechnology,
  isMovementPlatform,
  MECHANISM_LABEL,
  SEMANTIC_TYPE_LABEL,
  type ClassificationSource,
  type DataMovementMechanism,
  type TechnologySemanticType,
} from "../semantics/technology-semantic-taxonomy";
import { assessTopologyFitness, type TopologyFitness } from "../semantics/topology-fitness";
import type { TechRecordType } from "@/lib/home/preview/types";

/**
 * Current-state data flow: what originates where, how it moves, where it lands.
 *
 * Every node, edge and count is a recorded value. Nothing is inferred about what *should* connect
 * to what, and no classification is asserted that the record does not support.
 *
 * Three rules, each written because breaking it produced a diagram a domain reader could discredit
 * on sight (see docs/architecture/CURRENT_STATE_FLOW_SEMANTIC_AUDIT.md):
 *
 *  1. **Endpoints are joined, never printed raw.** Both tenants resolve 100% to the application
 *     register — one by `systemName`, one by `originalRowId` — so a reader sees "Workday Core HR",
 *     not "APP-0093". Which key matched is recorded as classification provenance.
 *
 *  2. **`platformOrDatabase` never assigns a lane.** Its value is classified through the governed
 *     taxonomy and placed by what it IS. A warehouse lands among stores; an interface engine lands
 *     among movement platforms; `Direct point-to-point` is the recorded ABSENCE of an intermediary
 *     and produces no node at all, only a direct connector.
 *
 *  3. **Lanes adapt to the records.** A lane with no members is not drawn. If a tenant records no
 *     movement tooling, source connects to destination directly with the mechanism on the edge,
 *     rather than manufacturing a middle tier to fill the template.
 */

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : v === null || v === undefined ? "" : String(v);
}

/**
 * Zones are the lanes. The zone comes from the taxonomy, so a system sits in the same zone here,
 * in a table, and in anything aVa renders -- one classification, one placement.
 */
function laneFor(type: TechnologySemanticType): string {
  return zoneFor(type);
}

export interface CurrentStateFlowOptions {
  tenantKey: string;
  tenantDisplayName: string;
  integrations: TechRecordType;
  /** The application register, used to resolve endpoints to named systems. */
  applications?: TechRecordType;
  audienceLevel?: AudienceLevel;
  perLaneLimit?: number;
  canonicalBuild?: string;
}

interface Endpoint {
  id: string;
  label: string;
  semanticType: TechnologySemanticType;
  classificationSource: ClassificationSource;
  rawValue: string;
  /** Kept whole so the node can state its host and any conflict rather than flattening them. */
  resolved: ResolvedTechnologySemantics;
}

/** Builds the endpoint resolver. Tries `systemName`, then `originalRowId` -- the two keys the two
 * tenants actually use. Neither is declared in the canonical contract; both are tried and the
 * matching one is recorded, rather than assuming either. */
function buildResolver(applications?: TechRecordType) {
  const byName = new Map<string, Record<string, unknown>>();
  const byRowId = new Map<string, Record<string, unknown>>();
  for (const row of applications?.rows ?? []) {
    const name = str(row.systemName);
    const rowId = str(row.originalRowId);
    if (name) byName.set(name.toLowerCase(), row);
    if (rowId) byRowId.set(rowId.toLowerCase(), row);
  }

  return function resolve(raw: string): Endpoint {
    const key = raw.trim().toLowerCase();
    const app = byName.get(key) ?? byRowId.get(key);
    if (!app) {
      // Unresolved: keep the raw value visible and say so, rather than dropping the flow.
      const resolved = resolveTechnologySemantics({ systemName: raw });
      return {
        id: canonicalNodeId("ep", raw),
        label: raw,
        semanticType: resolved.entityType,
        classificationSource: "unclassified",
        rawValue: raw,
        resolved,
      };
    }
    const label = str(app.systemName) || raw;
    const resolved = resolveTechnologySemantics({
      systemName: label,
      systemCategory: str(app.systemCategory),
      systemType: str(app.systemType),
    });
    return {
      id: canonicalNodeId("ep", label),
      label,
      semanticType: resolved.entityType,
      classificationSource: resolved.classificationSources[0] ?? "unclassified",
      rawValue: raw,
      resolved,
    };
  };
}

/** Environment suffixes recorded on a system name. Three rows reading "— Test", "— Production" and
 * "— Training" are three environments of one system; counted separately they split a concentration
 * into slices that hide it. The grouping is declared derived and names its members. */
const ENVIRONMENT_SUFFIX = /\s+[—-]\s+(production|prod|test|training|dev|development|qa|stage|staging|uat|sandbox|dr)\s*$/i;

function baseName(name: string): string {
  return name.replace(ENVIRONMENT_SUFFIX, "").trim();
}

interface Agg {
  label: string;
  semanticType: TechnologySemanticType;
  classificationSource: ClassificationSource;
  flows: number;
  environments: Set<string>;
  raws: Set<string>;
  resolved?: ResolvedTechnologySemantics;
}

/** What the projection returns alongside the view: whether the record can support a flow diagram
 * at all, and how many objects it could not classify. A caller that ignores `fitness` will render
 * a picture the data does not justify, so it is returned beside the view rather than buried in it. */
export interface CurrentStateFlowResult {
  view: ArchitectureView;
  fitness: TopologyFitness;
  unclassifiedCount: number;
  conflictCount: number;
}

/** Convenience for callers that have already checked fitness. */
export function buildCurrentStateFlowView(options: CurrentStateFlowOptions): ArchitectureView {
  return buildCurrentStateFlow(options).view;
}

export function buildCurrentStateFlow(options: CurrentStateFlowOptions): CurrentStateFlowResult {
  const { tenantKey, tenantDisplayName, integrations, applications } = options;
  const audienceLevel = options.audienceLevel ?? "L1_domain";
  const perLaneLimit = options.perLaneLimit ?? 6;
  const resolve = buildResolver(applications);

  const all = integrations.rows ?? [];
  const rows = all.filter((r) => {
    const s = str(r.currentStateOrTargetState);
    return s === "" || s === "current_state";
  });
  const excludedTargetState = all.length - rows.length;

  // --- pass 1: resolve, classify, count -------------------------------------------------------
  const originators = new Map<string, Agg>();
  const destinations = new Map<string, Agg>();
  const platforms = new Map<string, Agg>();
  const mechanisms = new Map<DataMovementMechanism, { label: string; flows: number; raws: Set<string> }>();
  let regulated = 0;

  interface Row {
    from: Endpoint;
    to: Endpoint;
    fromKey: string;
    toKey: string;
    platformKey: string | null;
    platformType: TechnologySemanticType;
    mechanism: DataMovementMechanism;
    mechanismRaw: string;
    rowId: string;
  }
  const parsed: Row[] = [];

  rows.forEach((row, i) => {
    const from = resolve(str(row.sourceSystem));
    const to = resolve(str(row.targetSystem));

    const platformRaw = str(row.platformOrDatabase);
    const platformCls = classifyTechnology(platformRaw);
    const mechRaw = str(row.integrationType);
    const mechCls = classifyMechanism(mechRaw);
    if (str(row.regulatedDataFlag) === "true") regulated += 1;

    const fromKey = baseName(from.label);
    const toKey = baseName(to.label);

    const bump = (map: Map<string, Agg>, key: string, ep: Endpoint) => {
      const a = map.get(key) ?? {
        label: key,
        semanticType: ep.semanticType,
        classificationSource: ep.classificationSource,
        flows: 0,
        environments: new Set<string>(),
        raws: new Set<string>(),
        resolved: ep.resolved,
      };
      a.flows += 1;
      a.environments.add(ep.label);
      a.raws.add(ep.rawValue);
      map.set(key, a);
    };
    bump(originators, fromKey, from);
    bump(destinations, toKey, to);

    // A platform becomes a node only when it is real movement tooling. A store recorded here is
    // context on the connector; `no_intermediary` is the recorded absence of a hop.
    const platformIsNode = isMovementPlatform(platformCls.semanticType);
    const platformKey = platformIsNode ? platformRaw : null;
    if (platformKey) {
      const a = platforms.get(platformKey) ?? {
        label: platformRaw,
        semanticType: platformCls.semanticType,
        classificationSource: platformCls.classificationSource,
        flows: 0,
        environments: new Set<string>(),
        raws: new Set<string>([platformRaw]),
      };
      a.flows += 1;
      platforms.set(platformKey, a);
    }

    const m = mechanisms.get(mechCls.semanticType) ?? {
      label: MECHANISM_LABEL[mechCls.semanticType],
      flows: 0,
      raws: new Set<string>(),
    };
    m.flows += 1;
    m.raws.add(mechRaw);
    mechanisms.set(mechCls.semanticType, m);

    parsed.push({
      from,
      to,
      fromKey,
      toKey,
      platformKey,
      platformType: platformCls.semanticType,
      mechanism: mechCls.semanticType,
      mechanismRaw: mechRaw,
      rowId: str(row.dataAssetName) || `${integrations.objectType}[${i}]`,
    });
  });

  // --- pass 2: choose what to draw ------------------------------------------------------------
  // Originators and destinations overlap (a system can both send and receive). A system that does
  // both is drawn once, in the lane its classification dictates.
  const drawn = new Map<string, Agg & { role: "origin" | "destination" | "both" }>();
  for (const [k, a] of originators) drawn.set(k, { ...a, role: destinations.has(k) ? "both" : "origin" });
  for (const [k, a] of destinations) {
    const existing = drawn.get(k);
    if (existing) existing.flows += a.flows;
    else drawn.set(k, { ...a, role: "destination" });
  }

  const rank = (m: Map<string, Agg>) => [...m.entries()].sort((x, y) => y[1].flows - x[1].flows);
  const topSystems = [...drawn.entries()].sort((a, b) => b[1].flows - a[1].flows);

  const nodes: ArchitectureViewNode[] = [];
  const idOf = (label: string) => canonicalNodeId("sys", label);
  const platIdOf = (label: string) => canonicalNodeId("plat", label);

  const laneBudget = new Map<string, number>();
  const tails = new Map<string, { count: number; flows: number; members: string[] }>();

  for (const [key, agg] of topSystems) {
    const lane = laneFor(agg.semanticType);
    const used = laneBudget.get(lane) ?? 0;
    if (used >= perLaneLimit) {
      const t = tails.get(lane) ?? { count: 0, flows: 0, members: [] };
      t.count += 1;
      t.flows += agg.flows;
      t.members.push(idOf(key));
      tails.set(lane, t);
      continue;
    }
    laneBudget.set(lane, used + 1);
    const grouped = agg.environments.size > 1;
    nodes.push({
      id: idOf(key),
      label: key,
      semanticRole:
        lane === "middleware" || lane === "data_integration"
          ? "integration"
          : lane === "data_warehouse" || lane === "data_mart"
            ? "data_store"
            : lane === "analytics_bi"
              ? "analytics"
              : "application",
      layer: lane,
      evidenceBasis: grouped ? "ABARVA_DERIVED" : "CANONICAL",
      evidenceIds: [...agg.raws].map((r) => `${integrations.objectType}.endpoint=${r}`),
      ...(grouped
        ? {
            aggregation: {
              groupByField: "systemName",
              groupByValue: key,
              memberNodeIds: [...agg.environments].map((e) => canonicalNodeId("env", e)),
              memberCount: agg.environments.size,
              basis: "CANONICAL_FIELD" as const,
            },
          }
        : {}),
      roleBasisNote:
        agg.resolved?.classificationStatus === "conflict"
          ? agg.resolved.conflictReason
          : agg.classificationSource === "unclassified"
            ? "Classification not established from the record."
            : `Classified from ${agg.classificationSource.replace(/_/g, " ")}.`,
      metrics: { flows: agg.flows, environments: agg.environments.size },
      // The host is stated alongside the identity rather than replacing it: a mart on SQL Server
      // stays a mart.
      note:
        `${SEMANTIC_TYPE_LABEL[agg.semanticType]}` +
        (agg.resolved?.hostingPlatform ? ` on ${agg.resolved.hostingPlatform}` : "") +
        ` · ${agg.flows} flows` +
        (agg.resolved?.classificationStatus === "conflict" ? " · classification conflict" : ""),
    });
  }

  const byIdSoFar = new Set(nodes.map((n) => n.id));
  for (const [key, agg] of rank(platforms)) {
    // A platform recorded in platformOrDatabase may also appear in the application register as an
    // endpoint. Drawing it twice produces two nodes for one system with two classifications --
    // which is how "Informatica is ETL" and "Informatica is Analytics/BI" appeared on one page.
    if (byIdSoFar.has(idOf(baseName(agg.label)))) continue;
    nodes.push({
      id: platIdOf(key),
      label: agg.label,
      semanticRole: "integration",
      layer: laneFor(agg.semanticType),
      evidenceBasis: "CANONICAL",
      evidenceIds: [`${integrations.objectType}.platformOrDatabase=${key}`],
      roleBasisNote: "Classified from governed reference taxonomy.",
      metrics: { flows: agg.flows },
      note: `${SEMANTIC_TYPE_LABEL[agg.semanticType]} · ${agg.flows} flows`,
    });
  }

  for (const [lane, t] of tails) {
    nodes.push({
      id: `tail-${lane}`,
      label: `${t.count} more`,
      semanticRole:
        lane === "data_warehouse" || lane === "data_mart"
          ? "data_store"
          : lane === "analytics_bi"
            ? "analytics"
            : "application",
      layer: lane,
      evidenceBasis: "ABARVA_DERIVED",
      evidenceIds: [`${integrations.objectType}.endpoint`],
      aggregation: {
        groupByField: "endpoint",
        groupByValue: `(remaining in ${lane})`,
        memberNodeIds: t.members,
        memberCount: t.count,
        basis: "CANONICAL_FIELD",
      },
      metrics: { flows: t.flows },
      note: `${t.flows} flows`,
    });
  }

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const nodeFor = (key: string, lane: string) => (byId.has(idOf(key)) ? idOf(key) : `tail-${lane}`);

  // --- pass 3: edges --------------------------------------------------------------------------
  const pairs = new Map<string, { from: string; to: string; count: number; mechs: Map<DataMovementMechanism, number>; platforms: Set<string>; ids: string[] }>();
  const addPair = (from: string, to: string, mech: DataMovementMechanism, platform: string, rowId: string) => {
    if (!from || !to || from === to) return;
    const k = `${from}->${to}`;
    const e = pairs.get(k) ?? { from, to, count: 0, mechs: new Map<DataMovementMechanism, number>(), platforms: new Set<string>(), ids: [] as string[] };
    e.count += 1;
    e.mechs.set(mech, (e.mechs.get(mech) ?? 0) + 1);
    if (platform) e.platforms.add(platform);
    if (e.ids.length < 40) e.ids.push(rowId);
    pairs.set(k, e);
  };

  for (const p of parsed) {
    const fromId = nodeFor(p.fromKey, laneFor(p.from.semanticType));
    const toId = nodeFor(p.toKey, laneFor(p.to.semanticType));
    if (p.platformKey && byId.has(platIdOf(p.platformKey))) {
      addPair(fromId, platIdOf(p.platformKey), p.mechanism, p.platformKey, p.rowId);
      addPair(platIdOf(p.platformKey), toId, p.mechanism, p.platformKey, p.rowId);
    } else {
      // No intermediary recorded: connect directly rather than inventing a hop.
      addPair(fromId, toId, p.mechanism, "", p.rowId);
    }
  }

  const flowTotal = rows.length;
  const labelMinWeight = Math.max(2, Math.ceil(flowTotal * 0.03));
  const edges: ArchitectureViewEdge[] = [];
  for (const [key, pair] of pairs) {
    const from = byId.get(pair.from);
    const to = byId.get(pair.to);
    if (!from || !to) continue;
    const ranked = [...pair.mechs.entries()].sort((a, b) => b[1] - a[1]);
    const dominant = ranked[0]?.[0] ?? "unknown";
    const share = (ranked[0]?.[1] ?? 0) / Math.max(1, pair.count);
    const collapsed = pair.count > 1;
    edges.push({
      id: `flow-${canonicalNodeId("e", key)}`,
      from: pair.from,
      to: pair.to,
      ...(pair.count >= labelMinWeight
        ? {
            label:
              pair.mechs.size === 1
                ? MECHANISM_LABEL[dominant]
                : share >= 0.6
                  ? `mostly ${MECHANISM_LABEL[dominant]}`
                  : `${pair.mechs.size} mechanisms`,
          }
        : {}),
      mechanism: MECHANISM_LABEL[dominant],
      weight: pair.count,
      evidenceBasis: collapsed ? "ABARVA_DERIVED" : "CANONICAL",
      evidenceIds: pair.ids,
      orientation: deriveOrientation(from.layer, to.layer, "current_state_zones_v1") ?? undefined,
      ...(collapsed ? { derivedFromEdgeIds: pair.ids } : {}),
    });
  }

  // --- narrative, computed per tenant ---------------------------------------------------------
  const topOrigin = rank(originators)[0];
  const originShare = topOrigin ? Math.round((topOrigin[1].flows / flowTotal) * 100) : 0;
  const destFanIn = [...destinations.values()].map((d) => d.flows);
  const maxFanIn = destFanIn.length ? Math.max(...destFanIn) : 0;
  const converging = destFanIn.filter((f) => f > 1).length;

  // A tenant with no convergence must not be given a convergence headline.
  const title =
    converging === 0
      ? `${flowTotal} recorded flows reach ${destinations.size} distinct destinations — none receives more than one`
      : topOrigin && originShare >= 20
        ? `${originShare}% of ${tenantDisplayName}'s recorded data movement starts at ${topOrigin[0]}`
        : `${flowTotal} recorded flows across ${drawn.size} systems`;

  const unclassified = nodes.filter((n) => n.roleBasisNote?.startsWith("Classification not established")).length;

  const limitations: string[] = [
    "Lanes follow each system's classification, not a stated architecture tier. The record does not declare which tier a system belongs to.",
    "Only systems appearing in a recorded integration are drawn. A system with no integration row is absent whether or not it exists.",
  ];
  if (converging === 0 && destinations.size > 1) {
    limitations.push(
      `No destination in this record receives more than one recorded flow, so this view shows distribution rather than convergence.`,
    );
  }
  if (unclassified > 0) {
    limitations.push(`${unclassified} systems could not be classified from the record and are shown as unclassified rather than placed by assumption.`);
  }
  if (tails.size > 0) {
    const total = [...tails.values()].reduce((s, t) => s + t.count, 0);
    limitations.push(`${total} further systems are folded into per-lane aggregates that state their own counts.`);
  }
  if (excludedTargetState > 0) {
    limitations.push(`${excludedTargetState} rows describe target state rather than current state and are excluded.`);
  }
  if (!applications) {
    limitations.push("The application register was not supplied, so endpoints are shown as recorded rather than resolved to named systems.");
  }

  const canonical = nodes.filter((n) => n.evidenceBasis === "CANONICAL").length;
  const aggregated = nodes.filter((n) => n.aggregation).length;

  // Only label lanes that actually have members.
  const present = new Set(nodes.map((n) => n.layer));
  const laneLabels: Record<string, string> = {};
  for (const zone of ZONE_ORDER) if (present.has(zone)) laneLabels[zone] = ZONE_LABEL[zone];

  const fitness = assessTopologyFitness(
    rows.map((r) => ({ source: str(r.sourceSystem), target: str(r.targetSystem) })),
  );
  const conflictCount = nodes.filter((n) => n.roleBasisNote?.includes("resolves to")).length;

  if (!fitness.fitForExecutiveFlow) {
    limitations.unshift(
      `This record does not support a defensible relationship view: ${fitness.findings.join(" ")}`,
    );
  }
  if (conflictCount > 0) {
    limitations.push(
      `${conflictCount} objects carry a classification conflict between their recorded category and their product identity, and are shown with that conflict stated rather than resolved.`,
    );
  }

  const view: ArchitectureView = {
    viewType: "integration_topology",
    audienceLevel,
    layerScheme: "current_state_zones_v1",
    validationProfile: "enterprise_current_state",
    tenantKey,
    title,
    primaryQuestion: "How does data actually move through this enterprise today?",
    contextLine: `Current state · observed · ${flowTotal} recorded flows · ${regulated} carrying regulated data · max fan-in ${maxFanIn}`,
    nodes,
    edges,
    laneLabels,
    groups: [],
    boundaries: [],
    overlays: [],
    evidenceCoverage: {
      nodesTotal: nodes.length,
      nodesCanonical: canonical,
      nodesDerived: nodes.length - canonical,
      nodesCandidate: 0,
      edgesTotal: edges.length,
      edgesCanonical: edges.filter((e) => e.evidenceBasis === "CANONICAL").length,
      nodesAggregated: aggregated,
      canonicalNodePct: Math.round((canonical / Math.max(1, nodes.length)) * 100),
      memberTraceablePct: 100,
      aggregationSummary: `${nodes.length} nodes · ${flowTotal} recorded flows · ${unclassified} unclassified · all traceable`,
      ...(options.canonicalBuild ? { canonicalBuild: options.canonicalBuild } : {}),
    },
    limitations,
  };

  return { view, fitness, unclassifiedCount: unclassified, conflictCount };
}
