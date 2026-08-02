import type {
  ArchitectureAdvisory,
  ArchitectureGraph,
} from "@/types/architecture";
import allowedValuesSnapshot from "./ai-success-data/allowed-values.json";
import advisoryResultSnapshot from "./ai-success-data/architecture-advisory-result.json";
import architectureGraphSnapshot from "./ai-success-data/architecture-graph.json";
import dataCapabilityPacketSnapshot from "./ai-success-data/data-capability-packet.json";

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
  decisions: Array<{
    decision: string;
    consequence: string;
    owner: string;
    destination: string;
  }>;
  limits: Array<{ title: string; body: string; owner: string }>;
}

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
    decisions: [
      {
        decision: "Approve the baseline gate policy",
        consequence:
          "Blocks 150 claims from ever becoming provable if deferred.",
        owner: "CFO",
        destination: "Moves",
      },
      {
        decision: "Authorize the contract page and span load",
        consequence: "No clause-level evidence exists across 119 contracts.",
        owner: "CIO",
        destination: "Source",
      },
      {
        decision: "Resolve SAP S/4HANA lifecycle dispute",
        consequence:
          "ERP consolidation remains blocked by an unresolved platform decision.",
        owner: "CIO",
        destination: "Intelligence",
      },
      {
        decision: "Sequence AI scaling against Tier 1 dependencies",
        consequence: "130 critical applications shape the AI agenda.",
        owner: "CIO + CDAO",
        destination: "Tower",
      },
    ],
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
