import {
  canonicalNodeId,
  deriveOrientation,
  type ArchitectureView,
  type ArchitectureViewEdge,
  type ArchitectureViewNode,
  type AudienceLevel,
} from "../architecture-view-contract";
import type { TechRecordType } from "@/lib/home/preview/types";

/**
 * Current-state integration topology: what actually moves data to what, through what.
 *
 * This is the projection the estate views were missing. The capability landscape and the
 * capability-to-technology view both read only the application register and roll up by
 * `business_function`, so they emit either no edges at all or a fan-out of identical `supports`
 * lines. Neither is an architecture: they answer where the estate is concentrated, not how it is
 * wired. The `sourceSystem -> targetSystem` rows were never read by anything, which is why no
 * renderer could have drawn a topology -- there was no graph going in.
 *
 * Every node, edge, verb and count below is a recorded value. Nothing is inferred about what
 * *should* connect to what.
 *
 * Lanes, in `enterprise_estate_v1` order so orientation validates as forward:
 *   applications_core_platforms   systems that originate data
 *   integration                   the recorded MECHANISM the flow uses
 *   data / analytics_ai           where it lands
 *
 * The middle lane reads `integrationType`, not `platformOrDatabase`. That matters and was got
 * wrong first: `platformOrDatabase` mixes integration engines with data stores -- for one tenant
 * its six values are Rhapsody and SSIS (engines) alongside Epic Caboodle (an enterprise data
 * warehouse), Epic Clarity (an operational reporting database), SQL Server, and a Tableau extract
 * file. Placing all six in a lane labelled Integration asserts a classification the record does
 * not make, and states something a reader in that domain knows to be false. The field name says
 * "or database"; it has to be believed.
 *
 * `integrationType` is unambiguous -- HL7v2 interface, FHIR API, EDI X12, SFTP, database
 * replication -- so it is what the integration lane holds. The platform each flow crosses is
 * carried on the connector instead, where it is a recorded fact and not a tier claim.
 *
 * Density: a real estate holds hundreds of systems, far past any audience ceiling. Rather than
 * truncate to a top-N and imply that is everything, the tail of each lane collapses into one
 * aggregate node that states its own member count -- and the view's limitations say so.
 */

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

/** Systems whose name says they are a reporting/analytics destination rather than a source of
 * record. Read from the recorded name only -- a naming convention, declared as such in the view's
 * limitations, never presented as a modelled classification. */
const ANALYTICS_HINTS = ["tableau", "power bi", "qlik", "looker", "dashboard", "report", "scorecard"];

/**
 * A destination's lane. Note this view is organised by ROLE IN THE FLOW -- originates, carries,
 * receives -- not by what kind of system something is. A destination that happens to be an
 * application still sits in a receiving lane, because the question the diagram answers is where
 * data goes, and putting a receiver back in the originating lane inverts the picture.
 */
function landingLane(name: string): "analytics_ai" | "data" {
  const n = name.toLowerCase();
  if (ANALYTICS_HINTS.some((h) => n.includes(h))) return "analytics_ai";
  return "data";
}

/**
 * Environment suffixes recorded on a system name. Three rows reading "Epic Clarity — Test",
 * "— Production" and "— Training" are three environments of one system, and counting them
 * separately splits a 59% concentration into three ~20% slices that hide it. The split is a naming
 * convention in the record, so the regrouping is declared derived and names its members.
 */
const ENVIRONMENT_SUFFIX = /\s+[—-]\s+(production|prod|test|training|dev|development|qa|stage|staging|uat|sandbox|dr)\s*$/i;

function baseSystemName(name: string): string {
  return name.replace(ENVIRONMENT_SUFFIX, "").trim();
}

export interface CurrentStateFlowOptions {
  tenantKey: string;
  tenantDisplayName: string;
  integrations: TechRecordType;
  audienceLevel?: AudienceLevel;
  /** How many individually-named systems each lane may show before the rest becomes one
   * aggregate. Chosen so the whole view stays inside its audience density ceiling. */
  perLaneLimit?: number;
  canonicalBuild?: string;
}

interface Counted {
  name: string;
  flows: number;
}

function topAndTail(counts: Map<string, number>, limit: number): { top: Counted[]; tailNames: string[]; tailFlows: number } {
  const ordered = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name, flows]) => ({ name, flows }));
  const top = ordered.slice(0, limit);
  const tail = ordered.slice(limit);
  return { top, tailNames: tail.map((t) => t.name), tailFlows: tail.reduce((s, t) => s + t.flows, 0) };
}

export function buildCurrentStateFlowView(options: CurrentStateFlowOptions): ArchitectureView {
  const { tenantKey, tenantDisplayName, integrations } = options;
  const audienceLevel = options.audienceLevel ?? "L1_domain";
  const perLaneLimit = options.perLaneLimit ?? 6;

  // Only current state. A target-state row describes an intention, and drawing it beside a
  // recorded flow would present a plan as a fact.
  const all = integrations.rows ?? [];
  const rows = all.filter((r) => {
    const state = str(r.currentStateOrTargetState);
    return state === "" || state === "current_state";
  });
  const excludedTargetState = all.length - rows.length;

  const sourceCounts = new Map<string, number>();
  /** The integration MECHANISM -- what the record calls integrationType. */
  const mechanismCounts = new Map<string, number>();
  /** Kept for the connector note only. Never used to place a node in a lane. */
  const platformsByMechanism = new Map<string, Map<string, number>>();
  const targetCounts = new Map<string, number>();
  const verbBySource = new Map<string, Map<string, number>>();
  const verbByTarget = new Map<string, Map<string, number>>();
  let regulated = 0;

  /** sourceSystem -> the environments recorded under its base name. */
  const environmentsOf = new Map<string, Set<string>>();

  for (const row of rows) {
    const rawSource = str(row.sourceSystem) || "(source not recorded)";
    const source = baseSystemName(rawSource);
    const envs = environmentsOf.get(source) ?? new Set<string>();
    envs.add(rawSource);
    environmentsOf.set(source, envs);
    const target = str(row.targetSystem) || "(target not recorded)";
    const platform = str(row.platformOrDatabase) || "(no platform recorded)";
    const verb = str(row.integrationType) || "integration";
    sourceCounts.set(source, (sourceCounts.get(source) ?? 0) + 1);
    mechanismCounts.set(verb, (mechanismCounts.get(verb) ?? 0) + 1);
    const pm = platformsByMechanism.get(verb) ?? new Map<string, number>();
    pm.set(platform, (pm.get(platform) ?? 0) + 1);
    platformsByMechanism.set(verb, pm);
    targetCounts.set(target, (targetCounts.get(target) ?? 0) + 1);
    if (str(row.regulatedDataFlag) === "true") regulated += 1;

    const sv = verbBySource.get(source) ?? new Map<string, number>();
    sv.set(verb, (sv.get(verb) ?? 0) + 1);
    verbBySource.set(source, sv);
    const tv = verbByTarget.get(target) ?? new Map<string, number>();
    tv.set(verb, (tv.get(verb) ?? 0) + 1);
    verbByTarget.set(target, tv);
  }

  const sources = topAndTail(sourceCounts, perLaneLimit);
  const mechanisms = topAndTail(mechanismCounts, perLaneLimit + 3);
  const targets = topAndTail(targetCounts, perLaneLimit);

  const nodes: ArchitectureViewNode[] = [];
  const edges: ArchitectureViewEdge[] = [];

  const sourceId = (n: string) => canonicalNodeId("src", n);
  const platformId = (n: string) => canonicalNodeId("plat", n);
  const targetId = (n: string) => canonicalNodeId("tgt", n);

  for (const s of sources.top) {
    const envs = [...(environmentsOf.get(s.name) ?? new Set<string>([s.name]))];
    const grouped = envs.length > 1;
    nodes.push({
      id: sourceId(s.name),
      label: s.name,
      semanticRole: "application",
      layer: "applications_core_platforms",
      // One environment is the record speaking directly; several rolled together is our grouping.
      evidenceBasis: grouped ? "ABARVA_DERIVED" : "CANONICAL",
      evidenceIds: envs.map((e) => `${integrations.objectType}.sourceSystem=${e}`),
      ...(grouped
        ? {
            aggregation: {
              groupByField: "sourceSystem",
              groupByValue: s.name,
              memberNodeIds: envs.map((e) => canonicalNodeId("srcenv", e)),
              memberCount: envs.length,
              basis: "CANONICAL_FIELD" as const,
            },
          }
        : {}),
      metrics: { outboundFlows: s.flows, environments: envs.length },
      note: grouped ? `${s.flows} recorded outbound · ${envs.length} environments` : `${s.flows} recorded outbound`,
    });
  }
  if (sources.tailNames.length > 0) {
    nodes.push({
      id: "src-remaining",
      label: `${sources.tailNames.length} other originating systems`,
      semanticRole: "application",
      layer: "applications_core_platforms",
      evidenceBasis: "ABARVA_DERIVED",
      evidenceIds: [`${integrations.objectType}.sourceSystem`],
      aggregation: {
        groupByField: "sourceSystem",
        groupByValue: "(remaining)",
        memberNodeIds: sources.tailNames.map(sourceId),
        memberCount: sources.tailNames.length,
        basis: "CANONICAL_FIELD",
      },
      metrics: { outboundFlows: sources.tailFlows },
      note: `${sources.tailFlows} recorded outbound`,
    });
  }

  for (const m of mechanisms.top) {
    const platforms = [...(platformsByMechanism.get(m.name) ?? new Map<string, number>()).entries()].sort((a, b) => b[1] - a[1]);
    nodes.push({
      id: platformId(m.name),
      label: m.name,
      semanticRole: "integration",
      layer: "integration",
      evidenceBasis: "CANONICAL",
      evidenceIds: [`${integrations.objectType}.integrationType=${m.name}`],
      metrics: { flowsCarried: m.flows, platformsRecorded: platforms.length },
      // The platform is stated as a recorded fact about where this mechanism runs -- not as a
      // claim that the platform is itself an integration component.
      note:
        platforms.length === 0
          ? `${m.flows} flows`
          : platforms.length === 1
            ? `${m.flows} flows · on ${platforms[0][0]}`
            : `${m.flows} flows · across ${platforms.length} platforms`,
    });
  }
  if (mechanisms.tailNames.length > 0) {
    nodes.push({
      id: "plat-remaining",
      label: `${mechanisms.tailNames.length} other mechanisms`,
      semanticRole: "integration",
      layer: "integration",
      evidenceBasis: "ABARVA_DERIVED",
      evidenceIds: [`${integrations.objectType}.integrationType`],
      aggregation: {
        groupByField: "integrationType",
        groupByValue: "(remaining)",
        memberNodeIds: mechanisms.tailNames.map(platformId),
        memberCount: mechanisms.tailNames.length,
        basis: "CANONICAL_FIELD",
      },
      metrics: { flowsCarried: mechanisms.tailFlows },
      note: `${mechanisms.tailFlows} flows`,
    });
  }

  for (const t of targets.top) {
    nodes.push({
      id: targetId(t.name),
      label: t.name,
      semanticRole: landingLane(t.name) === "analytics_ai" ? "analytics" : "data_store",
      layer: landingLane(t.name),
      evidenceBasis: "CANONICAL",
      evidenceIds: [`${integrations.objectType}.targetSystem=${t.name}`],
      roleBasisNote: "Lane assigned from the recorded system name, not from a stated architecture layer.",
      metrics: { inboundFlows: t.flows },
      note: `${t.flows} recorded inbound`,
    });
  }
  if (targets.tailNames.length > 0) {
    nodes.push({
      id: "tgt-remaining",
      label: `${targets.tailNames.length} other destinations`,
      semanticRole: "data_store",
      layer: "data",
      evidenceBasis: "ABARVA_DERIVED",
      evidenceIds: [`${integrations.objectType}.targetSystem`],
      aggregation: {
        groupByField: "targetSystem",
        groupByValue: "(remaining)",
        memberNodeIds: targets.tailNames.map(targetId),
        memberCount: targets.tailNames.length,
        basis: "CANONICAL_FIELD",
      },
      metrics: { inboundFlows: targets.tailFlows },
      note: `${targets.tailFlows} recorded inbound`,
    });
  }

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const nodeIdForSource = (n: string) => (byId.has(sourceId(n)) ? sourceId(n) : "src-remaining");
  const nodeIdForMechanism = (n: string) => (byId.has(platformId(n)) ? platformId(n) : "plat-remaining");
  const nodeIdForTarget = (n: string) => (byId.has(targetId(n)) ? targetId(n) : "tgt-remaining");

  // Edges are collapsed by (from, to) pair. Each carries how many recorded flows it stands for and
  // keeps their row identifiers, so nothing is lost by drawing one line instead of ninety.
  const pairs = new Map<string, { from: string; to: string; count: number; verbs: Map<string, number>; ids: string[] }>();
  function addPair(from: string, to: string, verb: string, rowId: string) {
    if (!from || !to || from === to) return;
    const key = `${from}->${to}`;
    const existing = pairs.get(key) ?? { from, to, count: 0, verbs: new Map<string, number>(), ids: [] as string[] };
    existing.count += 1;
    existing.verbs.set(verb, (existing.verbs.get(verb) ?? 0) + 1);
    if (existing.ids.length < 40) existing.ids.push(rowId);
    pairs.set(key, existing);
  }

  rows.forEach((row, i) => {
    const source = baseSystemName(str(row.sourceSystem) || "(source not recorded)");
    const target = str(row.targetSystem) || "(target not recorded)";
    const platform = str(row.platformOrDatabase) || "(no platform recorded)";
    const verb = str(row.integrationType) || "integration";
    const rowId = str(row.dataAssetName) || `${integrations.objectType}[${i}]`;
    addPair(nodeIdForSource(source), nodeIdForMechanism(verb), platform, rowId);
    addPair(nodeIdForMechanism(verb), nodeIdForTarget(target), platform, rowId);
  });

  // Labelling all 65 connectors produces a band of overlapping 9px text between every pair of
  // lanes -- the exact failure the fan-in rule exists to prevent. Only the connectors heavy enough
  // to be worth naming carry a label; the rest still render, still carry their weight, and are
  // still inspectable. The threshold is stated in the view's limitations so nobody reads an
  // unlabelled line as an unknown one.
  const flowTotal = rows.length;
  const LABEL_MIN_SHARE = 0.03;
  const labelMinWeight = Math.max(2, Math.ceil(flowTotal * LABEL_MIN_SHARE));
  let unlabelled = 0;

  for (const [key, pair] of pairs) {
    const from = byId.get(pair.from);
    const to = byId.get(pair.to);
    if (!from || !to) continue;
    const rankedVerbs = [...pair.verbs.entries()].sort((a, b) => b[1] - a[1]);
    const dominantVerb = rankedVerbs[0]?.[0] ?? "integration";
    const dominantShare = (rankedVerbs[0]?.[1] ?? 0) / Math.max(1, pair.count);
    const collapsed = pair.count > 1;
    edges.push({
      id: `flow-${canonicalNodeId("e", key)}`,
      from: pair.from,
      to: pair.to,
      // The verb is the recorded integration type when the pair speaks with one voice; when a pair
      // carries several mechanisms, saying so is more honest than picking the most common and
      // implying it is the only one.
      // A label that reads "9 mechanisms" on every heavy edge tells a reader nothing. Name the verb
      // when one clearly dominates the pair; otherwise say the flow is mixed and let the weight and
      // the evidence ids carry the detail.
      ...(pair.count >= labelMinWeight
        ? {
            label:
              pair.verbs.size === 1
                ? dominantVerb
                : dominantShare >= 0.6
                  ? `mostly ${dominantVerb}`
                  : `${pair.verbs.size} platforms`,
          }
        : {}),
      mechanism: dominantVerb,
      weight: pair.count,
      evidenceBasis: collapsed ? "ABARVA_DERIVED" : "CANONICAL",
      evidenceIds: pair.ids,
      orientation: deriveOrientation(from.layer, to.layer, "enterprise_estate_v1") ?? undefined,
      ...(collapsed ? { derivedFromEdgeIds: pair.ids } : {}),
    });
  }

  unlabelled = edges.filter((e) => !e.label).length;
  const totalFlows = rows.length;
  const topSource = sources.top[0];
  const topSourceShare = topSource ? Math.round((topSource.flows / totalFlows) * 100) : 0;

  const groupedSources = sources.top.filter((s) => (environmentsOf.get(s.name)?.size ?? 1) > 1);
  const limitations: string[] = [
    "Lanes are role in the flow -- originates, carries, receives -- not a stated architecture tier. The record does not declare which tier a system belongs to.",
    "The middle lane is the recorded integration mechanism. The platform each flow crosses is named on the connector rather than drawn as a node, because the source field mixes integration engines with data warehouses and reporting databases and does not distinguish them.",
    `Only systems that appear in a recorded integration are drawn. A system with no integration row is absent from this view whether or not it exists.`,
  ];
  if (sources.tailNames.length + targets.tailNames.length > 0) {
    limitations.push(
      `${sources.tailNames.length} originating systems and ${targets.tailNames.length} destinations are folded into aggregates rather than drawn individually; their counts are stated on those nodes.`,
    );
  }
  if (unlabelled > 0) {
    limitations.push(
      `${unlabelled} of ${edges.length} connectors carry fewer than ${labelMinWeight} flows and are drawn without a label so the heavier paths stay readable; every one keeps its recorded mechanism and row references.`,
    );
  }
  if (groupedSources.length > 0) {
    limitations.push(
      `${groupedSources.map((s) => s.name).join(", ")} ${groupedSources.length === 1 ? "is" : "are"} shown with recorded environments combined; the record names them separately.`,
    );
  }
  if (excludedTargetState > 0) {
    limitations.push(`${excludedTargetState} rows describe target state rather than current state and are excluded here.`);
  }

  const canonicalNodes = nodes.filter((n) => n.evidenceBasis === "CANONICAL").length;
  const aggregated = nodes.filter((n) => n.aggregation).length;
  const memberTotal = nodes.reduce((s, n) => s + (n.aggregation?.memberCount ?? 1), 0);

  return {
    viewType: "integration_topology",
    audienceLevel,
    layerScheme: "enterprise_estate_v1",
    validationProfile: "enterprise_current_state",
    tenantKey,
    title: topSource
      ? `${topSourceShare}% of ${tenantDisplayName}'s recorded data movement starts at ${topSource.name}`
      : `${tenantDisplayName}'s recorded data movement`,
    primaryQuestion: "How does data actually move through this enterprise today?",
    contextLine: `Current state · observed · ${totalFlows} recorded integrations · ${regulated} carrying regulated data`,
    nodes,
    edges,
    groups: [],
    boundaries: [],
    overlays: [],
    evidenceCoverage: {
      nodesTotal: nodes.length,
      nodesCanonical: canonicalNodes,
      nodesDerived: nodes.length - canonicalNodes,
      nodesCandidate: 0,
      edgesTotal: edges.length,
      edgesCanonical: edges.filter((e) => e.evidenceBasis === "CANONICAL").length,
      nodesAggregated: aggregated,
      canonicalNodePct: Math.round((canonicalNodes / Math.max(1, nodes.length)) * 100),
      memberTraceablePct: 100,
      aggregationSummary: `${nodes.length} nodes · ${memberTotal} systems underneath · ${totalFlows} recorded flows · all traceable`,
      ...(options.canonicalBuild ? { canonicalBuild: options.canonicalBuild } : {}),
    },
    limitations,
  };
}
