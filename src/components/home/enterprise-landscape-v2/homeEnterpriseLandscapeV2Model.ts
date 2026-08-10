export type HomeLandscapeTabId =
  | "summary"
  | "patterns"
  | "context"
  | "economics"
  | "architecture"
  | "architectureEvidence"
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
  today: string;
  potential: string;
  gap: string;
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
  { id: "architectureEvidence", label: "Architecture Evidence" },
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
      "The architecture read is a set of scoped current-state exhibits, not one giant map. Data and AI, ERP and finance, private data-center/mainframe resilience, and digital airline channels each have distinct source, integration, hosting, consumption, and proof questions.",
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
        title: "Operationally critical",
        body: "Network operations, crew, airport, maintenance, cargo, loyalty, and travel-service execution make the technology estate a reliability system, not a back-office portfolio.",
        tone: "blue",
      },
      {
        title: "Investment capacity, constrained flexibility",
        body: "The governed budget is material, but the committed contract base means modernization choices have to respect commercial timing and rights.",
        tone: "amber",
      },
      {
        title: "Transformation-active and capacity-sensitive",
        body: "Active modernization spans core platforms, cloud, data products, interfaces, analytics, and operations-facing systems, creating sequencing pressure.",
        tone: "teal",
      },
      {
        title: "Fragmented measures and ownership",
        body: "Measures, platform lifecycle states, and ownership signals need reconciliation before the landscape can support a target-state commitment.",
        tone: "slate",
      },
      {
        title: "Resilience and control posture",
        body: "Hybrid architecture, private data-center gravity, SaaS consumption, and operational control requirements create a practical resilience agenda.",
        tone: "amber",
      },
      {
        title: "AI-enabled, outcome proof developing",
        body: "AI activity and tool usage are visible, but Home keeps value claims separate from Tower validation, baselines, and attestation evidence.",
        tone: "red",
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
          "Operational applications, digital channels, ERP systems, and mainframe-hosted systems of record are both data producers and workflow endpoints for airline execution.",
        coverage: "Source lane",
        examples: [
          "Operations Control",
          "Crew scheduling",
          "Baggage",
          "MRO",
          "Passenger service",
          "IBM mainframe",
          "Airline.com",
        ],
        tone: "blue",
        ratio: 0.92,
      },
      {
        layer: "02",
        title: "Integration, ETL, and event movement",
        detail:
          "Batch, API, file, event, MQ, and ETL paths move data from core systems into analytical and AI-ready platforms.",
        coverage: "Movement lane",
        examples: [
          "ETL modernization",
          "Kafka",
          "MuleSoft",
          "IBM MQ",
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
          "IBM DB2",
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
        body: "Systems marked for retirement while still carrying maintain decisions need governance before dependent AI, ERP, or data-platform modernization work is scaled.",
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
        label: "Private DC / mainframe",
        posture: "Core, resilience, and legacy gravity",
        body: "A credible airline current state needs at least two private data centers and explicit IBM/mainframe gravity where reliability, latency, settlement, and legacy integration dominate.",
        examples: ["DC1/DC2", "IBM z/OS", "CICS", "DB2", "MQ", "legacy ETL"],
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
        body: "The practical architecture is hybrid: mainframe, private cloud, core systems, integration, warehouses, cloud analytics, SaaS, and AI tools must be governed as one flow.",
        examples: [
          "Private cloud",
          "Kafka/API paths",
          "EDW to marts",
          "Cloud analytics",
          "Agent retrieval",
        ],
        tone: "teal",
        ratio: 0.88,
      },
      {
        label: "Digital edge",
        posture: "Customer-facing speed layer",
        body: "Airline.com, mobile, kiosks, loyalty, passenger service, and contact-center channels follow a real-time API and experience-data pattern rather than the ERP control pattern.",
        examples: [
          "Airline.com",
          "Mobile",
          "API gateway",
          "Loyalty",
          "Passenger service",
        ],
        tone: "blue",
        ratio: 0.8,
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
        domain: "Operations",
        evidence: "High",
        authority: "Mixed",
        valueState: "Constrained",
        attention: "Selective",
      },
      {
        domain: "Data and KPI",
        evidence: "Moderate",
        authority: "Fragmented",
        valueState: "Constrained",
        attention: "High",
      },
      {
        domain: "Portfolio",
        evidence: "Moderate",
        authority: "Mixed",
        valueState: "Locked",
        attention: "Selective",
      },
      {
        domain: "Commercial",
        evidence: "Moderate",
        authority: "Fragmented",
        valueState: "Locked",
        attention: "Selective",
      },
      {
        domain: "AI and automation",
        evidence: "Limited",
        authority: "Mixed",
        valueState: "Constrained",
        attention: "Selective",
      },
    ],
    coherence: [
      {
        label: "Operations",
        detail: "Crew, airport, recovery",
        x: 22,
        y: 22,
        tone: "blue",
      },
      {
        label: "Critical platforms",
        detail: "Tier-1 gravity, lifecycle",
        x: 50,
        y: 18,
        tone: "teal",
      },
      {
        label: "Portfolio capacity",
        detail: "Sequencing, dependency load",
        x: 78,
        y: 28,
        tone: "slate",
      },
      {
        label: "Commercial",
        detail: "Pricing, loyalty, revenue",
        x: 24,
        y: 58,
        tone: "amber",
      },
      {
        label: "Data and measures",
        detail: "Definitions, lineage, trust",
        x: 50,
        y: 62,
        tone: "blue",
      },
      {
        label: "Controls and vendors",
        detail: "Contracts, resilience, risk",
        x: 76,
        y: 64,
        tone: "slate",
      },
      {
        label: "Coherence",
        detail: "Enterprise system",
        x: 92,
        y: 46,
        tone: "red",
      },
    ],
    trajectory: [
      {
        today: "Fragmented metric ownership",
        potential: "Common enterprise measures",
        gap: "Owner and definition alignment",
        authority: "Planning hypothesis",
        gate: "Definition alignment",
        route: "Intelligence",
      },
      {
        today: "Activity-led portfolio",
        potential: "Sequenced enterprise change",
        gap: "Capacity and dependency governance",
        authority: "Planning hypothesis",
        gate: "Capacity governance",
        route: "Moves",
      },
      {
        today: "Committed vendor base",
        potential: "Negotiated optionality",
        gap: "Commercial rights and timing windows",
        authority: "Not authorized",
        gate: "Source action required",
        route: "Source",
      },
      {
        today: "AI usage visible",
        potential: "Finance-recognized outcomes",
        gap: "Baselines and Finance validation",
        authority: "Planning hypothesis",
        gate: "Tower validation required",
        route: "Tower",
      },
    ],
    watchlist: [
      {
        severity: "High",
        title: "Critical platform gravity",
        body: "Critical-platform lifecycle choices shape modernization sequencing, dependency risk, and AI feasibility.",
        route: "Intelligence",
      },
      {
        severity: "Medium",
        title: "Hybrid hosting reality",
        body: "Cloud timelines need operational, resilience, latency, data-center, and integration constraints represented together.",
        route: "Intelligence",
      },
      {
        severity: "High",
        title: "AI before value approval",
        body: "AI adoption is visible before enterprise value claims are approved. Baseline, ownership, and attestation gates must stay explicit.",
        route: "Tower",
      },
      {
        severity: "Medium",
        title: "Commercial lock-in pressure",
        body: "The contracted base reduces near-term flexibility unless renewal windows, rights, and scope choices are actively governed.",
        route: "Source",
      },
      {
        severity: "Watch",
        title: "Target-state authority",
        body: "Current-to-potential trajectory needs declared target-state authority before it becomes a plan.",
        route: "Moves",
      },
    ],
    evidence: [
      {
        label: "Domain coverage",
        value: "Broad, uneven depth",
        detail:
          "Operations, technology, portfolio, commercial, and AI context are represented.",
        tone: "blue",
      },
      {
        label: "Freshness",
        value: "Aug 2, 2026",
        detail:
          "Current-state export date retained in the planning-grade package.",
        tone: "teal",
      },
      {
        label: "Conflicts",
        value: "To review",
        detail:
          "Definitions and lifecycle states must be reconciled before production use.",
        tone: "amber",
      },
      {
        label: "Missing sources",
        value: "Identity facts",
        detail:
          "Network, workforce, fleet, customer scale, and final owner facts need source authority.",
        tone: "amber",
      },
      {
        label: "Material claims",
        value: "Directional",
        detail:
          "Validation is required before release as realized value, target state, or recommendation.",
        tone: "slate",
      },
    ],
  };
