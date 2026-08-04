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
  tenantKey: string;
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
  architectureFlow: Array<{
    stageRef: string;
    title: string;
    subtitle: string;
    metric: string;
    items: Array<{
      ref: string;
      name: string;
      kind: string;
      tag: string;
      metric: string;
      caption: string;
      evidenceState: string;
    }>;
  }>;
  advisoryTabs: Array<{
    id: string;
    label: string;
    kicker: string;
    headline: string;
    read: string;
    points: Array<{ label: string; body: string }>;
    evidenceRefs: string[];
    callout?: { label: string; value: string; note: string };
  }>;
  advisoryValueMatrix: Array<{
    id: string;
    shortLabel: string;
    title: string;
    valuePotential: "High" | "Medium" | "Low";
    executionReadiness: "High" | "Medium" | "Low";
    x: number;
    y: number;
    zone: "invest" | "build" | "monitor";
    note: string;
    evidenceGate: string;
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
  const aiToolMix = buildAiToolMix(arrayFrom(aiPortfolio.top_rows));

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
    tenantKey: textFrom(tenant.tenant_key, "skyharbor-air"),
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
    aiToolMix,
    architectureFlow: buildArchitectureFlow(graph, aiToolMix),
    advisoryTabs: buildAdvisoryTabs({
      graph,
      funded,
      usage,
      contractValue: allowedValues.annual_contract_value?.display ?? "$1.4805B",
      budgetValue: allowedValues.fy2027_technology_budget?.display ?? "$2.35B",
      aiUseCost: "$170.2M",
      fingerprint: graph.inputFingerprint.slice(0, 8),
    }),
    advisoryValueMatrix: buildAdvisoryValueMatrix(),
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

function buildAdvisoryTabs({
  graph,
  funded,
  usage,
  contractValue,
  budgetValue,
  aiUseCost,
  fingerprint,
}: {
  graph: ArchitectureGraph;
  funded: number;
  usage: number;
  contractValue: string;
  budgetValue: string;
  aiUseCost: string;
  fingerprint: string;
}): AiSuccessHomeData["advisoryTabs"] {
  const criticalApps = graph.nodes.filter(
    (node) =>
      node.nodeKind === "application" &&
      String(node.criticality ?? "")
        .toLowerCase()
        .includes("critical"),
  ).length;
  const claimCount = funded + usage;

  return [
    {
      id: "thesis",
      label: "Thesis",
      kicker: "Executive thesis",
      headline: "AI scale is real. Value management has not caught up.",
      read: "SkyHarbor has meaningful AI adoption across coding, analytics, ERP, service and workforce platforms, but leadership cannot yet treat the portfolio as realized value. The management question is no longer whether AI is being used. It is which funded claims can be converted into finance-validated outcomes.",
      points: [
        {
          label: "What is proven",
          body: `${graph.nodes.length} architecture nodes and ${graph.edges.length} evidenced flows show AI operating inside a large, connected technology estate.`,
        },
        {
          label: "What is not proven",
          body: `${claimCount} governed value claims remain outside the claimable threshold because baseline, outcome, and attestation evidence is incomplete.`,
        },
        {
          label: "Leadership implication",
          body: "Treat the AI portfolio as a large active option until each material investment has a baseline, accountable owner, and finance-recognized value mechanism.",
        },
      ],
      evidenceRefs: [
        `snapshot ${fingerprint}`,
        `${graph.nodes.length} nodes`,
        `${graph.edges.length} flows`,
        `${claimCount} governed claims`,
      ],
      callout: {
        label: "Claimable value",
        value: "$0",
        note: "Tower-established zero; unknown value is not rendered as money.",
      },
    },
    {
      id: "current-work",
      label: "Current Work",
      kicker: "Current operating picture",
      headline: "AI is embedded in work, but measurement is still downstream.",
      read: "The current state shows active AI usage in development, BI, ERP, service, and employee productivity workflows. The weak point is not usage telemetry; it is the absence of before-and-after operating evidence that links usage to cycle time, quality, recovery, service, or cost outcomes.",
      points: [
        {
          label: "Adoption signal",
          body: `${aiUseCost} of estimated AI use cost and broad active-user observations show adoption is no longer experimental.`,
        },
        {
          label: "Estate gravity",
          body: `${criticalApps} critical applications shape the AI agenda; value proof has to respect Tier 1 dependency, lifecycle, and control constraints.`,
        },
        {
          label: "Missing bridge",
          body: "DORA, service workflow, HR agent, and finance outcome baselines need to be captured before tool-level enthusiasm becomes an executive value claim.",
        },
      ],
      evidenceRefs: [
        "AI adoption usage",
        "application criticality",
        "Tower metric quality",
      ],
      callout: {
        label: "AI use cost",
        value: aiUseCost,
        note: "Usage evidence exists; value evidence is still gated.",
      },
    },
    {
      id: "ai-shift",
      label: "Use Cases",
      kicker: "Industry value ideas",
      headline:
        "The first dollar should follow value potential and proof readiness.",
      read: "The stronger advisory story is business-first: AI should compress high-friction operating decisions where evidence, ownership, and controls can be proven. For an airline, the best candidates are recovery, crew, maintenance, customer service, revenue, developer productivity, and workforce service workflows.",
      points: [
        {
          label: "Invest now",
          body: "Prioritize ideas with high business value and a plausible evidence path: IROPS recovery, crew legality, and maintenance event triage.",
        },
        {
          label: "Build selectively",
          body: "Proceed where value is attractive but baselines or controls are not yet mature: customer recovery, revenue management, and developer productivity.",
        },
        {
          label: "Monitor",
          body: "Hold lower-readiness ideas until source owners approve data quality, control evidence, and outcome measurement.",
        },
      ],
      evidenceRefs: ["architecture flow", "AI tool mix", "evidence backlog"],
    },
    {
      id: "proof-gap",
      label: "Proof Gap",
      kicker: "Value proof boundary",
      headline: "The portfolio is funded ahead of its proof system.",
      read: "The financial posture is substantial, but the evidence boundary is disciplined: technology budget, contracted spend, AI usage cost, and claim counts are known; realized value is not. That distinction is the advisory standard the page must teach.",
      points: [
        {
          label: "Budget scale",
          body: `${budgetValue} FY2027 technology budget creates enough spend gravity that measurement quality matters at board level.`,
        },
        {
          label: "Contract exposure",
          body: `${contractValue} annual contract value is visible, but clause and span-level contract evidence remains a Source workstream.`,
        },
        {
          label: "Value stop-line",
          body: "Claims stop at funded or usage-supported until operational baselines and finance attestation are present.",
        },
      ],
      evidenceRefs: [
        "allowed values manifest",
        "contract 360",
        "Tower claim states",
      ],
      callout: {
        label: "Annual contract value",
        value: contractValue,
        note: "Commercial exposure is known; document evidence is still pending.",
      },
    },
    {
      id: "decisions",
      label: "Decisions",
      kicker: "Leadership choices",
      headline: "The next move is governance, not more narrative.",
      read: "Leadership needs a short decision agenda: require baselines before funding claims, load contract evidence, assign owners for material AI workflows, and sequence scaling against critical systems and controls.",
      points: [
        {
          label: "CFO",
          body: "Approve the baseline gate: no material AI value claim progresses without a before-and-after measure and finance attestation path.",
        },
        {
          label: "CIO",
          body: "Authorize contract page/span evidence and resolve unresolved platform lifecycle decisions before committing modernization spend.",
        },
        {
          label: "CDAO",
          body: "Name certified data domains for AI workflows and prevent telemetry-only adoption from being presented as outcome evidence.",
        },
      ],
      evidenceRefs: [
        "decision agenda",
        "Source evidence load",
        "Tower validation",
      ],
    },
    {
      id: "validation",
      label: "Validation",
      kicker: "What to collect next",
      headline: "Turn the advisory into a sign-off sequence.",
      read: "The advisory page should end with the evidence required to move from planning-grade to board-grade. That means named data owners, source extracts, metric baselines, contract documents, and explicit business sign-off before loading or publishing claims.",
      points: [
        {
          label: "Productivity tools",
          body: "For Claude Code, Copilot, and other developer tools, collect DORA metrics before and after adoption: lead time, deployment frequency, change failure rate, MTTR, review cycle time, and developer experience.",
        },
        {
          label: "Enterprise agents",
          body: "For ServiceNow or Workday agents, collect ticket deflection, time-to-resolution, escalation rate, HR case cycle time, employee satisfaction, and control exceptions.",
        },
        {
          label: "Sign-off gate",
          body: "Client experts should approve the source extracts, field mappings, known gaps, and evidence boundary before raw load and before Home/Tower narrative promotion.",
        },
      ],
      evidenceRefs: [
        "metric baseline request",
        "owner sign-off",
        "known gaps ledger",
      ],
      callout: {
        label: "Next evidence",
        value: "6 gaps",
        note: "Rendered as blockers, not hidden as missing data.",
      },
    },
  ];
}

function buildAdvisoryValueMatrix(): AiSuccessHomeData["advisoryValueMatrix"] {
  return [
    {
      id: "irops-recovery",
      shortLabel: "IROPS",
      title: "AI-assisted disruption recovery cockpit",
      valuePotential: "High",
      executionReadiness: "High",
      x: 84,
      y: 86,
      zone: "invest",
      note: "Compresses flight, crew, maintenance, and customer recovery decisions.",
      evidenceGate: "Certify recovery-time, cost, and NPS baselines.",
    },
    {
      id: "crew-legality",
      shortLabel: "CREW",
      title: "Crew legality decision assistant",
      valuePotential: "High",
      executionReadiness: "Medium",
      x: 58,
      y: 76,
      zone: "build",
      note: "High consequence workflow; humans retain legality accountability.",
      evidenceGate: "Validate rule coverage and exception handling.",
    },
    {
      id: "maintenance-triage",
      shortLabel: "MX",
      title: "Maintenance event triage",
      valuePotential: "High",
      executionReadiness: "Medium",
      x: 50,
      y: 71,
      zone: "build",
      note: "Reduces delay propagation when event lineage is certified.",
      evidenceGate: "Certify maintenance-event data and control sign-off.",
    },
    {
      id: "customer-reaccommodation",
      shortLabel: "CARE",
      title: "Customer reaccommodation agent",
      valuePotential: "Medium",
      executionReadiness: "High",
      x: 76,
      y: 50,
      zone: "invest",
      note: "Near-term service productivity and recovery experience use case.",
      evidenceGate:
        "Tie ServiceNow/CRM outcomes to cycle time and satisfaction.",
    },
    {
      id: "developer-productivity",
      shortLabel: "DEV",
      title: "Developer productivity with Claude Code",
      valuePotential: "Medium",
      executionReadiness: "Medium",
      x: 48,
      y: 46,
      zone: "build",
      note: "Promising tool value, but requires before-and-after engineering metrics.",
      evidenceGate:
        "Track DORA, review time, escaped defects, and developer sentiment.",
    },
    {
      id: "workforce-agent",
      shortLabel: "HR",
      title: "Workday HR service agent",
      valuePotential: "Medium",
      executionReadiness: "High",
      x: 72,
      y: 42,
      zone: "build",
      note: "Good service automation candidate if HR controls and policy evidence hold.",
      evidenceGate:
        "Measure case cycle time, deflection, escalation, and exceptions.",
    },
  ];
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

function buildAiToolMix(rows: Json[]): AiSuccessHomeData["aiToolMix"] {
  const byTool = new Map<
    string,
    { name: string; cost: number; activeUsers: number; evidence: Set<string> }
  >();
  for (const row of rows) {
    const name = textFrom(row.tool_agent_product, "Unspecified AI tool").trim();
    const existing = byTool.get(name) ?? {
      name,
      cost: 0,
      activeUsers: 0,
      evidence: new Set<string>(),
    };
    existing.cost += numberFrom(row.estimated_use_cost);
    existing.activeUsers += numberFrom(row.active_users);
    const evidence = textFrom(
      row.business_outcome_value_evidence,
      "Not supplied",
    ).trim();
    if (evidence) existing.evidence.add(evidence);
    byTool.set(name, existing);
  }

  return [...byTool.values()]
    .sort((a, b) => b.cost - a.cost || b.activeUsers - a.activeUsers)
    .slice(0, 8)
    .map((item) => ({
      name: item.name,
      cost: item.cost,
      activeUsers: item.activeUsers,
      evidence: [...item.evidence].slice(0, 2).join(" + ") || "Not supplied",
    }));
}

function buildArchitectureFlow(
  graph: ArchitectureGraph,
  aiToolMix: AiSuccessHomeData["aiToolMix"],
): AiSuccessHomeData["architectureFlow"] {
  const degree = new Map<string, number>();
  for (const edge of graph.edges) {
    degree.set(edge.fromNodeRef, (degree.get(edge.fromNodeRef) ?? 0) + 1);
    degree.set(edge.toNodeRef, (degree.get(edge.toNodeRef) ?? 0) + 1);
  }

  const sourceItems = graph.nodes
    .filter(
      (node) => node.layer === "source" && node.nodeKind === "application",
    )
    .sort(
      (a, b) =>
        (b.annualCost ?? 0) - (a.annualCost ?? 0) ||
        (degree.get(b.nodeRef) ?? 0) - (degree.get(a.nodeRef) ?? 0),
    )
    .slice(0, 4)
    .map((node) => ({
      ref: node.nodeRef,
      name: textFrom(node.shortLabel || node.label, "Source system"),
      kind: node.nodeKind.replaceAll("_", " "),
      tag: textFrom(node.criticality || node.businessFunction, "evidenced"),
      metric: node.annualCost
        ? moneyShort(node.annualCost)
        : `${degree.get(node.nodeRef) ?? 0} flows`,
      caption: textFrom(
        node.vendorName || node.technology || node.businessFunction,
        node.evidenceState,
      ),
      evidenceState: node.evidenceState,
    }));

  const integrationItems = topByDegree(graph, degree, "integration", 5);
  const transformationItems = topByDegree(graph, degree, "transformation", 5);
  const isDataPlatformFlowNode = (node: ArchitectureGraph["nodes"][number]) =>
    node.layer === "data_platform" ||
    (node.layer === "consumption" &&
      ["analytics_platform", "data_platform", "reporting_tool"].includes(
        node.nodeKind,
      ));
  const dataPlatformItems = aggregateNodesByName(
    graph,
    degree,
    isDataPlatformFlowNode,
    5,
  );
  const aiItems = aiToolMix.slice(0, 5).map((tool) => ({
    ref: `ai-tool-${slug(tool.name)}`,
    name: tool.name,
    kind: "AI tool",
    tag: `${formatInt(tool.activeUsers)} active users`,
    metric: moneyShort(tool.cost),
    caption: tool.evidence,
    evidenceState: tool.evidence.match(/not yet|not supplied/i)
      ? "unresolved"
      : "evidenced",
  }));

  return [
    {
      stageRef: "source",
      title: "Source Systems",
      subtitle: "operational systems of record",
      metric: `${sourceItems.length} shown · ${graph.nodes.filter((node) => node.layer === "source").length} total`,
      items: sourceItems,
    },
    {
      stageRef: "integration",
      title: "Integration",
      subtitle: "APIs, files and messaging",
      metric: `${integrationItems.reduce((sum, item) => sum + numberFrom(item.metric), 0)} evidenced flows`,
      items: integrationItems,
    },
    {
      stageRef: "transformation",
      title: "Transformation",
      subtitle: "ETL and data pipelines",
      metric: `${transformationItems.reduce((sum, item) => sum + numberFrom(item.metric), 0)} evidenced flows`,
      items: transformationItems,
    },
    {
      stageRef: "data",
      title: "Data Platforms",
      subtitle: "marts, lakehouse and semantic layer",
      metric: moneyShort(
        graph.nodes
          .filter(isDataPlatformFlowNode)
          .reduce((sum, node) => sum + (node.annualCost ?? 0), 0),
      ),
      items: dataPlatformItems,
    },
    {
      stageRef: "ai",
      title: "AI Outcomes",
      subtitle: "tools with usage evidence",
      metric: moneyShort(aiToolMix.reduce((sum, tool) => sum + tool.cost, 0)),
      items: aiItems,
    },
  ];
}

function topByDegree(
  graph: ArchitectureGraph,
  degree: Map<string, number>,
  layer: string,
  limit: number,
): AiSuccessHomeData["architectureFlow"][number]["items"] {
  return graph.nodes
    .filter((node) => node.layer === layer)
    .sort((a, b) => (degree.get(b.nodeRef) ?? 0) - (degree.get(a.nodeRef) ?? 0))
    .slice(0, limit)
    .map((node) => {
      const flowCount = degree.get(node.nodeRef) ?? 0;
      return {
        ref: node.nodeRef,
        name: textFrom(node.shortLabel || node.label, layer),
        kind: node.nodeKind.replaceAll("_", " "),
        tag: textFrom(
          node.businessFunction || node.technology,
          `${flowCount} flows`,
        ),
        metric: `${flowCount} flows`,
        caption: textFrom(node.evidenceState, "evidenced"),
        evidenceState: node.evidenceState,
      };
    });
}

function aggregateNodesByName(
  graph: ArchitectureGraph,
  degree: Map<string, number>,
  predicate: (node: ArchitectureGraph["nodes"][number]) => boolean,
  limit: number,
): AiSuccessHomeData["architectureFlow"][number]["items"] {
  const byName = new Map<
    string,
    {
      ref: string;
      name: string;
      kind: string;
      cost: number;
      degree: number;
      tags: Set<string>;
      captions: Set<string>;
      evidenceState: string;
    }
  >();
  for (const node of graph.nodes.filter(predicate)) {
    const name = textFrom(node.label, "Data platform");
    const existing = byName.get(name) ?? {
      ref: node.nodeRef,
      name,
      kind: node.nodeKind.replaceAll("_", " "),
      cost: 0,
      degree: 0,
      tags: new Set<string>(),
      captions: new Set<string>(),
      evidenceState: node.evidenceState,
    };
    existing.cost += node.annualCost ?? 0;
    existing.degree += degree.get(node.nodeRef) ?? 0;
    for (const tag of [
      ...textFrom(node.technology).split(";"),
      ...textFrom(node.businessFunction).split(";"),
    ]) {
      const clean = tag.trim();
      if (clean) existing.tags.add(clean);
    }
    if (node.evidenceState) existing.captions.add(node.evidenceState);
    byName.set(name, existing);
  }

  return [...byName.values()]
    .sort((a, b) => b.cost - a.cost || b.degree - a.degree)
    .slice(0, limit)
    .map((item) => ({
      ref: item.ref,
      name: item.name,
      kind: item.kind,
      tag:
        [...item.tags].slice(0, 2).join(" · ") ||
        `${item.degree.toLocaleString("en-US")} flows`,
      metric: item.cost ? moneyShort(item.cost) : `${item.degree} flows`,
      caption: [...item.captions].join(" + ") || "evidenced",
      evidenceState: item.evidenceState,
    }));
}

function moneyShort(value: number): string {
  if (!value) return "$0";
  if (Math.abs(value) >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
