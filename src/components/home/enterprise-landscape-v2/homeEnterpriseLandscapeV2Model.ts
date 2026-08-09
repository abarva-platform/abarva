export type HomeLandscapeTabId =
  | "summary"
  | "patterns"
  | "context"
  | "economics"
  | "architecture"
  | "posture"
  | "coherence"
  | "trajectory"
  | "watchlist"
  | "evidence";

export type SignalTone = "blue" | "teal" | "amber" | "slate" | "red";

export interface MetricAnchor {
  label: string;
  value: string;
  detail: string;
  tone: SignalTone;
  ratio: number;
}

export interface StandoutSignal {
  label: string;
  title: string;
  body: string;
}

export interface PatternSignal {
  title: string;
  body: string;
  tone: SignalTone;
}

export interface EconomicRow {
  label: string;
  value: string;
  detail: string;
  ratio: number;
  tone: SignalTone;
}

export interface PostureRow {
  domain: string;
  evidence: string;
  authority: string;
  valueState: string;
  attention: string;
}

export interface ContextSignal {
  label: string;
  value: string;
  detail: string;
  tone: SignalTone;
  ratio: number;
}

export interface ContextDomain {
  label: string;
  title: string;
  body: string;
  evidence: string;
  tone: SignalTone;
}

export interface ArchitectureLayer {
  layer: string;
  title: string;
  detail: string;
  coverage: string;
  examples: string[];
  tone: SignalTone;
  ratio: number;
}

export interface ArchitectureDecision {
  title: string;
  body: string;
  evidence: string;
  tone: SignalTone;
}

export interface ArchitectureDeployment {
  label: string;
  posture: string;
  body: string;
  examples: string[];
  tone: SignalTone;
  ratio: number;
}

export interface ArchitectureArchetype {
  title: string;
  topology: string;
  body: string;
  examples: string[];
  route: string;
  tone: SignalTone;
}

export interface CoherenceNode {
  label: string;
  detail: string;
  x: number;
  y: number;
  tone: SignalTone;
}

export interface TrajectoryRow {
  area: string;
  current: string;
  potential: string;
  authority: string;
  gate: string;
  route: string;
}

export interface WatchItem {
  severity: string;
  title: string;
  body: string;
  route: string;
}

export interface EvidenceItem {
  label: string;
  value: string;
  detail: string;
  tone: SignalTone;
}

export interface HomeEnterpriseLandscapeV2Model {
  tenantName: string;
  subtitle: string;
  status: string;
  executiveRead: string;
  economicsRead: string;
  contextRead: string;
  architectureRead: string;
  anchors: MetricAnchor[];
  standouts: StandoutSignal[];
  patterns: PatternSignal[];
  contextSignals: ContextSignal[];
  contextDomains: ContextDomain[];
  economics: EconomicRow[];
  architectureLayers: ArchitectureLayer[];
  architectureDecisions: ArchitectureDecision[];
  architectureDeployments: ArchitectureDeployment[];
  architectureArchetypes: ArchitectureArchetype[];
  posture: PostureRow[];
  coherence: CoherenceNode[];
  trajectory: TrajectoryRow[];
  watchlist: WatchItem[];
  evidence: EvidenceItem[];
}

export const HOME_LANDSCAPE_TABS: Array<{
  id: HomeLandscapeTabId;
  label: string;
}> = [
  { id: "summary", label: "Summary" },
  { id: "patterns", label: "Patterns" },
  { id: "context", label: "Context" },
  { id: "economics", label: "Economics" },
  { id: "architecture", label: "Architecture" },
  { id: "posture", label: "Posture" },
  { id: "coherence", label: "Coherence" },
  { id: "trajectory", label: "Trajectory" },
  { id: "watchlist", label: "Watchlist" },
  { id: "evidence", label: "Evidence" },
];

export const SKYHARBOR_HOME_ENTERPRISE_LANDSCAPE_V2: HomeEnterpriseLandscapeV2Model =
  {
    tenantName: "SkyHarbor Global",
    subtitle: "Synthetic current-state package | Aug 2, 2026",
    status: "Planning-grade | Directional confidence | As of Aug 2, 2026",
    executiveRead:
      "SkyHarbor is a large, operations-intensive airline with substantial modernization activity across its operating, commercial, technology, and data estate. The current landscape points to execution alignment across critical platforms, measures, portfolio dependencies, and commercial commitments as the central management challenge.",
    economicsRead:
      "The economic read is not that AI value is zero. It is that the enterprise has a large governed technology budget, a material committed contract base, and a visible AI cost lane while finance-recognized value remains unestablished at Home level.",
    contextRead:
      "The loaded context reads as an airline operating system, not a generic AI portfolio: industry context, source systems, applications, contracts, usage, evidence, and module routes all need to appear in one executive landscape.",
    architectureRead:
      "The architecture read is the current Data and AI flow from source systems to consumption and agent action. Home should show where operational applications create data, how it moves through integration, where it lands, who consumes it, where AI agents run, and what evidence gates control value claims.",
    anchors: [
      {
        label: "Technology budget",
        value: "$2.35B",
        detail: "FY2027, governed scope",
        tone: "blue",
        ratio: 1,
      },
      {
        label: "Prior-year actual",
        value: "$2.18B",
        detail: "FY2026 technology spend",
        tone: "teal",
        ratio: 0.93,
      },
      {
        label: "Committed base",
        value: "$1.48B",
        detail: "Annual contract value",
        tone: "amber",
        ratio: 0.63,
      },
      {
        label: "Contract register",
        value: "119",
        detail: "Annual-value contracts",
        tone: "slate",
        ratio: 0.78,
      },
    ],
    standouts: [
      {
        label: "Strength to preserve",
        title: "Investment capacity",
        body: "The governed budget and prior-year spend show material technology capacity that can support enterprise-level modernization.",
      },
      {
        label: "Structural constraint",
        title: "Committed economics",
        body: "The annual contracted base is large enough to make commercial timing, rights, and flexibility a management issue.",
      },
      {
        label: "Transformation in motion",
        title: "Outcome proof still maturing",
        body: "AI activity is visible, but value evidence remains a specialist Tower validation question rather than the Home thesis.",
      },
    ],
    patterns: [
      {
        title: "Operations-heavy enterprise",
        body: "Core airline operations, commercial channels, loyalty, workforce, maintenance, and airport execution are all in scope for the current landscape.",
        tone: "blue",
      },
      {
        title: "Hybrid technology estate",
        body: "Modernization activity spans core systems, cloud platforms, data products, integration paths, and analytics tooling rather than a single-platform migration.",
        tone: "teal",
      },
      {
        title: "Control evidence matters",
        body: "The management read depends on scope, ownership, evidence depth, and module-specific validation instead of broad transformation labels.",
        tone: "amber",
      },
    ],
    contextSignals: [
      {
        label: "Industry context",
        value: "Airline",
        detail: "Network, cargo, loyalty, travel services",
        tone: "blue",
        ratio: 0.9,
      },
      {
        label: "Architecture graph",
        value: "444",
        detail: "Current-state nodes",
        tone: "teal",
        ratio: 1,
      },
      {
        label: "Relationship flows",
        value: "586",
        detail: "Evidence-backed edges",
        tone: "amber",
        ratio: 0.86,
      },
      {
        label: "Context layers",
        value: "7",
        detail: "Business to proof gates",
        tone: "slate",
        ratio: 0.72,
      },
    ],
    contextDomains: [
      {
        label: "Industry",
        title: "Global airline operating context",
        body: "The story must start with airline execution: network operations, commercial channels, loyalty, cargo, airports, maintenance, workforce, and service reliability.",
        evidence: "enterprise_context · industry_sector",
        tone: "blue",
      },
      {
        label: "Systems",
        title: "Applications, cloud, data, integration",
        body: "The systems view is a hybrid estate across core applications, cloud platforms, data products, analytics, interfaces, and operational systems of record.",
        evidence: "architecture_graph · data_capability_packet",
        tone: "teal",
      },
      {
        label: "Workflows",
        title: "Operational dependency paths",
        body: "Operations Control, crew scheduling, baggage, MRO, revenue management, and passenger service should appear as business paths, not isolated technology inventory.",
        evidence: "architecture_advisory_result · relationship_edges",
        tone: "amber",
      },
      {
        label: "Commercial",
        title: "Contracts shape flexibility",
        body: "Vendor, contract, and renewal context belongs beside architecture because commercial commitments constrain sequencing and modernization choices.",
        evidence: "contract register · Source route",
        tone: "slate",
      },
      {
        label: "AI activity",
        title: "Usage is visible, outcomes are gated",
        body: "AI tool usage and use-case signals should be visible, while finance-recognized value remains routed to Tower baseline and attestation evidence.",
        evidence: "Tower value lane · allowed values",
        tone: "red",
      },
      {
        label: "Proof",
        title: "Evidence posture controls the narrative",
        body: "Home can summarize what is loaded, what is directional, and what is missing; it should not turn gaps into facts or recommendations.",
        evidence: "Home evidence contract · validation gate",
        tone: "blue",
      },
    ],
    economics: [
      {
        label: "FY2027 technology budget",
        value: "$2.35B",
        detail: "Governed planning scope",
        ratio: 1,
        tone: "blue",
      },
      {
        label: "FY2026 actual technology spend",
        value: "$2.18B",
        detail: "Prior-year actual",
        ratio: 0.93,
        tone: "teal",
      },
      {
        label: "Annual contracted base",
        value: "$1.48B",
        detail: "63% of FY2027 budget",
        ratio: 0.63,
        tone: "amber",
      },
      {
        label: "Estimated AI use cost",
        value: "$170.2M",
        detail: "Specialist Tower validation lane",
        ratio: 0.07,
        tone: "slate",
      },
    ],
    architectureLayers: [
      {
        layer: "01",
        title: "Applications and core systems",
        detail:
          "Operational applications and systems of record are both data producers and workflow endpoints for airline execution.",
        coverage: "Source lane",
        examples: [
          "Operations Control",
          "Crew scheduling",
          "Baggage",
          "MRO",
          "Passenger service",
        ],
        tone: "blue",
        ratio: 0.92,
      },
      {
        layer: "02",
        title: "Integration, ETL, and event movement",
        detail:
          "Batch, API, file, and event paths move data from core systems into analytical and AI-ready platforms.",
        coverage: "Movement lane",
        examples: [
          "ETL modernization",
          "Kafka",
          "MuleSoft",
          "IBM DataStage",
          "Informatica",
          "Ab Initio",
        ],
        tone: "teal",
        ratio: 0.84,
      },
      {
        layer: "03",
        title: "Storage, EDW, and data marts",
        detail:
          "Enterprise warehouses, domain analytics stores, and marts form the current analytical substrate.",
        coverage: "Persistence lane",
        examples: [
          "Teradata Vantage",
          "Teradata EDW",
          "Snowflake",
          "SQL Server",
          "PostgreSQL",
          "Overlapping marts",
        ],
        tone: "amber",
        ratio: 1,
      },
      {
        layer: "04",
        title: "Data science and engineering",
        detail:
          "Modeling, engineering, and advanced analytics platforms sit between governed data and operational decisions.",
        coverage: "Modeling lane",
        examples: ["Databricks", "Spark", "MLflow", "SAS Viya", "SAS"],
        tone: "slate",
        ratio: 0.78,
      },
      {
        layer: "05",
        title: "Consumption and decision surfaces",
        detail:
          "Portals, dashboards, semantic layers, and business-facing BI are where analytics reach operators and executives.",
        coverage: "Consumption lane",
        examples: ["Power BI", "Tableau", "dbt metrics", "Business portals"],
        tone: "blue",
        ratio: 0.7,
      },
      {
        layer: "06",
        title: "AI agents and copilots",
        detail:
          "Agents and copilots run in productivity, analytics, engineering, service, ERP, and workflow surfaces; Home shows activity, not validated value.",
        coverage: "AI lane",
        examples: [
          "Microsoft 365 Copilot",
          "Power BI Copilot",
          "GitHub Copilot",
          "ChatGPT Enterprise",
          "SAP Joule",
          "Now Assist",
        ],
        tone: "teal",
        ratio: 0.66,
      },
      {
        layer: "07",
        title: "Core-system action and proof gates",
        detail:
          "Any AI loopback into core workflows needs identity, retrieval, approval, writeback, control, baseline, and attestation evidence.",
        coverage: "Control lane",
        examples: [
          "Identity",
          "Retrieval",
          "Human approval",
          "Writeback",
          "Baseline",
          "Attestation",
        ],
        tone: "red",
        ratio: 0.38,
      },
    ],
    architectureDecisions: [
      {
        title: "Resolve contradictory lifecycle states",
        body: "Systems marked for retirement while still carrying maintain decisions need governance before dependent AI or modernization work is scaled.",
        evidence: "APP-APP-0011 signal · planning-grade",
        tone: "red",
      },
      {
        title: "Escalate disputed ERP trajectory",
        body: "SAP S/4HANA lifecycle disagreement blocks a clean enterprise architecture read until ownership, timing, and target path are declared.",
        evidence: "APP-APP-0306 signal · planning-grade",
        tone: "amber",
      },
      {
        title: "Make MRO platform intent explicit",
        body: "Overlapping maintenance systems should be shown as an architecture and operating-risk decision, not just a systems inventory fact.",
        evidence: "MRO overlap signal · planning-grade",
        tone: "blue",
      },
      {
        title: "Route value claims to Tower",
        body: "Home can show adoption and context; finance-recognized outcomes require Tower baselines, attestation, and claim validation.",
        evidence: "Tower value lane · required",
        tone: "teal",
      },
    ],
    architectureDeployments: [
      {
        label: "On-prem / private DC",
        posture: "Core and legacy gravity",
        body: "Airline operational and ERP-adjacent systems often retain private data-center or on-prem gravity where reliability, latency, control, and legacy integration dominate.",
        examples: ["ERP/finance", "MRO", "SAS", "Teradata", "legacy ETL"],
        tone: "amber",
        ratio: 0.72,
      },
      {
        label: "Cloud and SaaS",
        posture: "Consumption and productivity scale",
        body: "SaaS, BI, productivity, and selected engineering platforms create faster consumption paths, but they do not remove source-system dependency.",
        examples: [
          "Microsoft 365",
          "Power BI",
          "Tableau",
          "Salesforce",
          "Databricks",
        ],
        tone: "blue",
        ratio: 0.78,
      },
      {
        label: "Hybrid cloud",
        posture: "The real operating model",
        body: "The practical architecture is hybrid: core systems, integration, warehouses, cloud analytics, and AI tools must be governed as one flow.",
        examples: [
          "Kafka/API paths",
          "EDW to marts",
          "Cloud analytics",
          "Agent retrieval",
        ],
        tone: "teal",
        ratio: 0.88,
      },
    ],
    architectureArchetypes: [
      {
        title: "ERP and finance core",
        topology:
          "System of record -> controlled integration -> finance consumption",
        body: "ERP architecture is slower-moving and control-heavy. The story should emphasize master data, batch/API integration, reconciled finance outputs, and governance before AI action.",
        examples: ["SAP S/4HANA", "Oracle EPM", "finance data", "attestation"],
        route: "Tower / Finance proof",
        tone: "amber",
      },
      {
        title: "Digital and customer apps",
        topology:
          "Digital channels -> APIs/CDP -> analytics -> personalization",
        body: "Digital apps have a different shape: customer journeys, real-time APIs, clickstream or channel data, data products, BI, and AI-assisted personalization.",
        examples: [
          "Digital commerce",
          "Passenger service",
          "Salesforce",
          "Power BI",
        ],
        route: "Intelligence / Moves",
        tone: "blue",
      },
      {
        title: "Airline operations systems",
        topology:
          "Operational workflow -> event/data movement -> reliability decisions",
        body: "Operations systems need reliability, station execution, safety, workforce, and disruption-management context. AI here needs explicit human approval and operational controls.",
        examples: ["Ops Control", "Crew", "Baggage", "MRO", "Dispatch"],
        route: "Moves / Source",
        tone: "teal",
      },
      {
        title: "Data and AI platforms",
        topology:
          "EDW/marts -> data science -> BI/agents -> controlled loopback",
        body: "Data and AI architecture ties Teradata/Snowflake/Databricks/SAS/BI tools to agents and copilots. The unanswered question is where AI can safely act back into core workflows.",
        examples: [
          "Teradata",
          "Snowflake",
          "Databricks",
          "SAS Viya",
          "Copilots",
        ],
        route: "Tower / Evidence",
        tone: "red",
      },
    ],
    posture: [
      {
        domain: "Business operations",
        evidence: "Broad",
        authority: "Current state",
        valueState: "Observed",
        attention: "Workflow alignment",
      },
      {
        domain: "Applications and platforms",
        evidence: "Broad",
        authority: "Current state",
        valueState: "Derived",
        attention: "Dependency gravity",
      },
      {
        domain: "Vendors and contracts",
        evidence: "Governed",
        authority: "Current state",
        valueState: "Observed",
        attention: "Commercial flexibility",
      },
      {
        domain: "AI and automation",
        evidence: "Specialist",
        authority: "Tower routed",
        valueState: "Not generalized",
        attention: "Outcome proof",
      },
    ],
    coherence: [
      {
        label: "Operating model",
        detail: "Airline workflows and ownership",
        x: 14,
        y: 42,
        tone: "blue",
      },
      {
        label: "Core platforms",
        detail: "Applications, cloud, data, integration",
        x: 40,
        y: 28,
        tone: "teal",
      },
      {
        label: "Commercial base",
        detail: "Vendors, contracts, renewal choices",
        x: 66,
        y: 44,
        tone: "amber",
      },
      {
        label: "Value proof",
        detail: "Tower-routed outcome validation",
        x: 86,
        y: 64,
        tone: "slate",
      },
    ],
    trajectory: [
      {
        area: "Enterprise modernization",
        current: "Multiple active domains",
        potential: "Coordinated enterprise roadmap",
        authority: "Planning hypothesis",
        gate: "Approved target-state source",
        route: "Intelligence",
      },
      {
        area: "Commercial flexibility",
        current: "Large committed base",
        potential: "Renegotiated rights and timing",
        authority: "Source owned",
        gate: "Clause-level evidence",
        route: "Source",
      },
      {
        area: "AI value realization",
        current: "Activity visible",
        potential: "Finance-recognized outcomes",
        authority: "Tower owned",
        gate: "Baseline and attestation",
        route: "Tower",
      },
    ],
    watchlist: [
      {
        severity: "Material",
        title: "Contract-backed run economics",
        body: "The committed annual base is large enough to constrain near-term portfolio flexibility if renewal, rights, and service scope are not managed.",
        route: "Source",
      },
      {
        severity: "Material",
        title: "Outcome proof separation",
        body: "Home should not turn AI activity into enterprise value claims. Tower remains the validation lane for claimability and finance recognition.",
        route: "Tower",
      },
      {
        severity: "Watch",
        title: "Future-state authority",
        body: "Current-to-future language needs approved strategy, approved Moves, declared target state, or explicit planning-hypothesis status.",
        route: "Moves",
      },
    ],
    evidence: [
      {
        label: "Design contract",
        value: "V0.2.5",
        detail: "Integrated context and architecture canvas",
        tone: "blue",
      },
      {
        label: "Deterministic layer",
        value: "Visual source",
        detail:
          "Validated HomeEnterpriseEvidenceV2 should drive SVG and charts",
        tone: "amber",
      },
      {
        label: "Claude result",
        value: "Audit retained",
        detail:
          "Prompt, raw response, scrubbed response, and rejection log required",
        tone: "amber",
      },
      {
        label: "Runtime posture",
        value: "Planning-grade",
        detail: "No new Claude response is claimed by this render",
        tone: "slate",
      },
    ],
  };
