import type {
  ArchitectureAdvisory,
  ArchitectureGraph,
} from "@/types/architecture";
import allowedValuesSnapshot from "./ai-success-data/allowed-values.json";
import advisoryResultSnapshot from "./ai-success-data/architecture-advisory-result.json";
import architectureGraphSnapshot from "./ai-success-data/architecture-graph.json";
import dataCapabilityPacketSnapshot from "./ai-success-data/data-capability-packet.json";
import towerAdvisoryResultSnapshot from "./ai-success-data/tower-advisory-result.json";

type Json = Record<string, unknown>;

export interface AiSuccessHomeData {
  tenantName: string;
  datasetId: string;
  generatedAt: string;
  graphFingerprint: string;
  allowedValues: Record<
    string,
    { display: string; value: number; source: string }
  >;
  graph: ArchitectureGraph;
  advisory: ArchitectureAdvisory;
  enterpriseScale: string;
  moneyBars: Array<{
    label: string;
    valueLabel: string;
    value: number;
    note: string;
    tone: "dark" | "amber" | "muted" | "danger";
  }>;
  postureCards: Array<{
    label: string;
    value: string;
    note: string;
    state: "good" | "directional" | "blocked" | "unknown";
  }>;
  claimFunnel: Array<{ name: string; claims: number; note: string }>;
  observationQuality: Array<{ name: string; count: number; quality: string }>;
  aiToolMix: Array<{
    name: string;
    cost: number;
    activeUsers: number;
    evidence: string;
  }>;
  attentionSignals: Array<{
    severity: string;
    ref: string;
    title: string;
    body: string;
    owner: string;
    destination: string;
  }>;
  portfolioChoices: Array<{
    lane: string;
    project: string;
    budget: number;
    evidence: string;
    gate: string;
    ref: string;
  }>;
  heroHeadline: string;
  heroLead: string;
  decisions: Array<{
    decision: string;
    consequence: string;
    owner: string;
    destination: string;
    destinationHref: string;
  }>;
  investmentPriorities: Array<{
    rank: number;
    title: string;
    rationale: string;
    refs: string[];
  }>;
  architectureRisks: Array<{ pattern: string; description: string; refs: string[] }>;
  limits: Array<{ title: string; body: string; owner: string }>;
  flowDiagram: {
    stages: Array<{
      key: string;
      label: string;
      hint: string;
      boxes: Array<{ title: string; subtitle: string; tag: string }>;
    }>;
    crossCutting: { label: string; note: string };
  };
}

const MODULE_ROUTES: Record<string, string> = {
  Home: "/home",
  Intelligence: "/intelligence/enterprise-landscape",
  Source: "/source",
  Tower: "/tower",
  Moves: "/strategic-moves",
  "Evidence backlog": "/tower",
};

export function readSkyHarborAiSuccessHome(): AiSuccessHomeData {
  const packet = objectFrom(dataCapabilityPacketSnapshot);
  const allowed = objectFrom(allowedValuesSnapshot);
  const graph = architectureGraphSnapshot as unknown as ArchitectureGraph;
  const advisoryResult = advisoryResultSnapshot as unknown as {
    advisory: ArchitectureAdvisory;
  };

  const allowedValues = Object.fromEntries(
    arrayFrom(allowed.values).map((item) => [
      textFrom(item.key),
      {
        display: textFrom(item.display_formatted_value),
        value: numberFrom(item.exact_value),
        source: textFrom(item.source_reference),
      },
    ]),
  );
  const tenant = objectFrom(packet.tenant);
  const asOf = objectFrom(packet.asOf);
  const aiPortfolio = objectFrom(packet.aiPortfolio);
  const aiSummary = objectFrom(aiPortfolio.summary);
  const towerValueProof = objectFrom(packet.towerValueProof);
  const towerClaims = arrayFrom(towerValueProof.claim_summary);
  const observations = arrayFrom(towerValueProof.metric_quality_summary);
  const initiatives = arrayFrom(
    objectFrom(packet.initiatives).top_material_rows,
  );
  const enterprise =
    arrayFrom(objectFrom(packet.enterpriseContext).rows)[0] ?? {};

  const funded = numberFrom(
    towerClaims.find(
      (row) => textFrom(row.claim_state) === "funded_no_baseline",
    )?.claim_count,
  );
  const usage = numberFrom(
    towerClaims.find((row) => textFrom(row.claim_state) === "usage_supported")
      ?.claim_count,
  );

  // The Tower Claude layer is the comprehensive, business-first transformation narrative --
  // it reads the full enterprise context (KPIs, interviews, portfolio, vendors, change
  // readiness), not just the architecture graph. It supersedes the narrower architecture
  // advisory for hero/decisions/priorities; the architecture advisory still backs the
  // diagram callouts in CurrentStateArchitectureMap.
  const tower = (
    towerAdvisoryResultSnapshot as unknown as {
      parsed: {
        headline: string;
        executive_thesis: string;
        leadership_decisions_required: Array<{
          decision: string;
          why_required: string;
          accountable_leadership_role: string;
        }>;
        portfolio_choices: Array<{
          scope: string;
          recommended_choice: string;
          business_rationale: string;
          evidence_refs: string[];
        }>;
        evidence_gaps: Array<{
          gap: string;
          why_material: string;
          next_action: string;
          owner_role: string;
        }>;
      };
    }
  ).parsed;

  const heroHeadline = tower.headline;
  const heroLead = tower.executive_thesis;

  const DECISION_DESTINATIONS = ["Tower", "Moves", "Source", "Tower", "Intelligence"];
  const decisions = tower.leadership_decisions_required.slice(0, 5).map((item, index) => {
    const destination = DECISION_DESTINATIONS[index] ?? "Intelligence";
    return {
      decision: item.decision,
      consequence: item.why_required,
      owner: item.accountable_leadership_role,
      destination,
      destinationHref: MODULE_ROUTES[destination] ?? "/intelligence",
    };
  });

  const investmentPriorities = tower.portfolio_choices.map((item, index) => ({
    rank: index + 1,
    title: `${item.scope} — ${item.recommended_choice}`,
    rationale: item.business_rationale,
    refs: item.evidence_refs,
  }));

  const architectureRisks = tower.evidence_gaps.map((item) => ({
    pattern: item.gap,
    description: `${item.why_material} ${item.next_action}`,
    refs: [item.owner_role],
  }));

  const flowDiagram = buildFlowDiagram(packet, graph, aiPortfolio);

  return {
    tenantName: textFrom(tenant.tenant_display_name, "SkyHarbor Global"),
    datasetId: textFrom(tenant.dataset_id, graph.scope.datasetId),
    generatedAt: textFrom(asOf.export_generated_at, graph.asOfDate),
    graphFingerprint: graph.inputFingerprint,
    allowedValues,
    graph,
    advisory: advisoryResult.advisory,
    enterpriseScale: textFrom(enterprise.enterprise_scale),
    moneyBars: [
      {
        label: "FY2027 technology budget",
        valueLabel: allowedValues.fy2027_technology_budget?.display ?? "$2.35B",
        value: allowedValues.fy2027_technology_budget?.value ?? 2350000000,
        note: `Allowed-value manifest · FY2026 actual ${allowedValues.fy2026_actual?.display ?? "$2.18B"}`,
        tone: "dark",
      },
      {
        label: "Under contract, annual",
        valueLabel: allowedValues.annual_contract_value?.display ?? "$1.4805B",
        value: allowedValues.annual_contract_value?.value ?? 1480500000,
        note: "119 contracts · annual value equals 63% of FY2027 budget, reducing near-term portfolio flexibility",
        tone: "muted",
      },
      {
        label: "AI portfolio, estimated use cost",
        valueLabel: "$170.2M",
        value: numberFrom(aiSummary.estimated_use_cost),
        note: `${textFrom(aiSummary.ai_tool_rows, "480")} tool rows · ${formatInt(numberFrom(aiSummary.active_users))} active-user observations`,
        tone: "amber",
      },
      {
        label: "Claimable value",
        valueLabel: allowedValues.tower_claimable_value?.display ?? "$0",
        value: 0,
        note: "Tower-established zero · the only real zero on this page",
        tone: "danger",
      },
    ],
    postureCards: [
      {
        label: "FY2027 technology budget",
        value: "$2.35B",
        note: "FY2026 actual $2.18B",
        state: "good",
      },
      {
        label: "Annual contract value",
        value: "$1.4805B",
        note: "119 contracts · clause evidence pending",
        state: "directional",
      },
      {
        label: "Governed value claims",
        value: String(funded + usage),
        note: "funded or usage-supported only",
        state: "directional",
      },
      {
        label: "Claimable value",
        value: "$0",
        note: "0 claims claimable",
        state: "blocked",
      },
      {
        label: "Funded, no baseline",
        value: String(funded),
        note: "structurally blocked",
        state: "blocked",
      },
      {
        label: "Usage-supported",
        value: String(usage),
        note: "telemetry only",
        state: "directional",
      },
      {
        label: "Finance-validated",
        value: "Not yet established",
        note: "no attestation method agreed",
        state: "unknown",
      },
      {
        label: "Realized value",
        value: "Not available",
        note: "requires baseline plus attestation",
        state: "unknown",
      },
    ],
    claimFunnel: [
      {
        name: "Potential",
        claims: funded + usage,
        note: "not yet established",
      },
      { name: "Funded", claims: funded, note: "missing baseline" },
      { name: "Usage-supported", claims: usage, note: "telemetry only" },
      { name: "Finance-validated", claims: 0, note: "awaiting attestation" },
      { name: "Claimable", claims: 0, note: "Tower-established $0" },
    ],
    observationQuality: observations.map((row: Json) => ({
      name: textFrom(row.evidence_state).replaceAll("_", " "),
      count: numberFrom(row.observation_count),
      quality: textFrom(row.quality_state),
    })),
    aiToolMix: arrayFrom(aiPortfolio.top_rows)
      .slice(0, 8)
      .map((row) => ({
        name: textFrom(row.tool_agent_product),
        cost: numberFrom(row.estimated_use_cost),
        activeUsers: numberFrom(row.active_users),
        evidence: textFrom(row.business_outcome_value_evidence, "Not supplied"),
      })),
    attentionSignals: [
      ...graph.deterministicFindings.map((finding) => ({
        severity: finding.severity.toUpperCase(),
        ref: finding.findingRef,
        title: finding.headline,
        body: finding.body,
        owner:
          finding.findingRef === "FIND-ARCH-AI-PROOF-GAP"
            ? "CFO with CDAO"
            : "CIO with business owner",
        destination:
          finding.findingRef === "FIND-ARCH-AI-PROOF-GAP"
            ? "Tower Value Proof"
            : "Intelligence",
      })),
      ...(graph.evidenceGaps ?? []).slice(0, 2).map((gap) => ({
        severity: gap.severity.toUpperCase(),
        ref: gap.gapRef,
        title: gap.gap,
        body: gap.implication,
        owner: "Tower with Moves",
        destination: "Evidence backlog",
      })),
    ].slice(0, 5),
    portfolioChoices: initiatives.slice(0, 6).map((row, index) => ({
      lane:
        ["FIX", "FIX", "REDESIGN", "DISCOVER", "CONSOLIDATE", "STOP"][index] ??
        "FIX",
      project: textFrom(row.initiative_project_name),
      budget: numberFrom(row.approved_budget),
      evidence: textFrom(row.kpis_outcomes_affected, "Directional"),
      gate: textFrom(row.decision_needed, "Confirm owner and baseline"),
      ref: textFrom(row.project_id, textFrom(row.evidence_ref)),
    })),
    heroHeadline,
    heroLead,
    decisions,
    investmentPriorities,
    architectureRisks,
    flowDiagram,
    limits: [
      {
        title: "Realized AI financial value",
        body: "Blocks any board-facing value statement. Requires a baseline plus Finance attestation.",
        owner: "Tower",
      },
      {
        title: "Workflow before-and-after evidence",
        body: "Blocks every Scale recommendation. AI adoption rows without auditable outcome evidence must remain telemetry-only.",
        owner: "Tower with Moves",
      },
      {
        title: "Clause-backed commercial findings",
        body: "Blocks a document-backed position across 119 contracts. doc.page and doc.span are not loaded.",
        owner: "Source",
      },
      {
        title: "Approved portfolio decisions",
        body: "Every lane on this page reads as recommended. No approved decision exists in this load.",
        owner: "Governance",
      },
      {
        title: "Target-state architecture",
        body: "The snapshot carries no proposed edges. Target state remains an Intelligence hypothesis.",
        owner: "Intelligence",
      },
      {
        title: "Recent material change",
        body: "No change feed is shown. Home cannot imply movement since the snapshot.",
        owner: "Platform",
      },
    ],
  };
}

function objectFrom(value: unknown): Json {
  return isJson(value) ? value : {};
}

function arrayFrom(value: unknown): Json[] {
  return Array.isArray(value) ? value.filter(isJson) : [];
}

function isJson(value: unknown): value is Json {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function textFrom(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  return fallback;
}

function numberFrom(value: unknown): number {
  const n = Number(String(value ?? "0").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function formatInt(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

function formatMoney(value: number): string {
  if (!value) return "Not established";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

// Excludes vendors that are themselves integration/analytics tooling (they'd otherwise
// double-appear as both a "source system" and later as an Integration/Data platform box).
const NON_SOURCE_VENDORS = new Set([
  "Informatica",
  "Ab Initio",
  "Cloudera",
  "IBM",
  "Confluent",
  "Databricks",
  "MuleSoft",
  "Snowflake",
  "Talend",
  "Denodo",
]);

function buildFlowDiagram(packet: Json, graph: ArchitectureGraph, aiPortfolio: Json) {
  const apps = arrayFrom(objectFrom(packet.applications).top_material_rows);
  const seenFunctions = new Set<string>();
  const sourceBoxes: Array<{ title: string; subtitle: string; tag: string }> = [];
  for (const row of [...apps].sort(
    (a, b) => numberFrom(b.annual_run_cost) - numberFrom(a.annual_run_cost),
  )) {
    const [vendor, product] = textFrom(row.primary_vendor_product).split(" / ");
    if (NON_SOURCE_VENDORS.has(vendor)) continue;
    const businessFunction = textFrom(row.primary_business_function);
    if (seenFunctions.has(businessFunction)) continue;
    seenFunctions.add(businessFunction);
    sourceBoxes.push({
      title: product || vendor,
      subtitle: businessFunction,
      tag: formatMoney(numberFrom(row.annual_run_cost)),
    });
    if (sourceBoxes.length >= 5) break;
  }

  const edgeDegree = (nodeRef: string) =>
    graph.edges.filter((e) => e.fromNodeRef === nodeRef || e.toNodeRef === nodeRef).length;

  const integrationBoxes = graph.nodes
    .filter((n) => n.layer === "integration")
    .map((n) => ({ title: n.label, subtitle: "Integration tool", tag: `${edgeDegree(n.nodeRef)} connections` }));

  const transformationBoxes = graph.nodes
    .filter((n) => n.layer === "transformation")
    .map((n) => ({ title: n.label, subtitle: "Transformation", tag: `${edgeDegree(n.nodeRef)} connections` }));

  const platforms = arrayFrom(objectFrom(packet.platforms).top_material_rows);
  const costByTech = new Map<string, number>();
  for (const row of platforms) {
    const tech = textFrom(row.technology_product);
    if (!tech) continue;
    costByTech.set(tech, (costByTech.get(tech) ?? 0) + numberFrom(row.approx_annual_run_cost));
  }
  const dataPlatformBoxes = [...costByTech.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tech, cost]) => ({ title: tech, subtitle: "Function marts", tag: formatMoney(cost) }));

  const aiRows = arrayFrom(aiPortfolio.top_rows);
  const aiByTool = new Map<string, { vendor: string; cost: number }>();
  for (const row of aiRows) {
    const tool = textFrom(row.tool_agent_product);
    if (!tool) continue;
    const existing = aiByTool.get(tool);
    const cost = numberFrom(row.estimated_use_cost);
    aiByTool.set(tool, { vendor: textFrom(row.vendor_provider), cost: (existing?.cost ?? 0) + cost });
  }
  const aiBoxes = [...aiByTool.entries()]
    .sort((a, b) => b[1].cost - a[1].cost)
    .slice(0, 5)
    .map(([tool, agg]) => ({ title: tool, subtitle: agg.vendor, tag: formatMoney(agg.cost) }));

  const riskSummary = objectFrom(objectFrom(packet.risksAndControls).summary);
  const totalControls = textFrom(riskSummary.risk_control_count, "0");
  const missingTestDate = textFrom(riskSummary.result_without_test_date_count, "0");

  return {
    stages: [
      { key: "source", label: "Source systems", hint: "operational systems of record", boxes: sourceBoxes },
      { key: "integration", label: "Integration", hint: "APIs, files and messaging", boxes: integrationBoxes },
      { key: "transformation", label: "Transformation", hint: "ETL, pipelines and logic", boxes: transformationBoxes },
      { key: "data_platform", label: "Data platforms", hint: "warehouses, lakes and marts", boxes: dataPlatformBoxes },
      { key: "ai_and_decision", label: "AI-enabled outcomes", hint: "AI activation and proof", boxes: aiBoxes },
    ],
    crossCutting: {
      label: "Risk and control coverage",
      note: `${totalControls} risk/control rows registered · ${missingTestDate} missing a control test date`,
    },
  };
}
