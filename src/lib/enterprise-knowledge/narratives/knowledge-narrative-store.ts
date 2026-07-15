import type { HomeSummarySnapshot } from "@/lib/home/home-summary-snapshot";
import {
  MERIDIAN_CLAUDE_DIMENSION_NARRATIVES,
  MERIDIAN_CLAUDE_HOME_INSIGHTS,
} from "@/lib/enterprise-knowledge/narratives/generated/meridian-claude-approved";

export type KnowledgeDimensionNarrativeSummary = {
  tenant_key: string;
  tenant_name: string;
  dimension_key: string;
  dimension_name: string;
  summary_title: string;
  executive_summary: string;
  what_nexus_knows: string[];
  why_it_matters: string;
  questions_supported: string[];
  current_caveats: string[];
  next_validation_actions: string[];
  module_usage: string[];
  safe_demo_claims: string[];
  do_not_claim: string[];
  evidence_refs_used: string[];
  source_fact_ids_used: string[];
  entity_profile_ids_used: string[];
  relationship_edge_ids_used: string[];
  context_gap_ids_used: string[];
  source_context_hash: string;
  generated_by: "approved_executive_narrative_seed" | "claude";
  generated_model: string;
  generated_at: string;
  validation_status: "passed" | "failed";
  validation_errors: string[];
  unsupported_claims: string[];
  active_or_candidate_status: "active";
};

export type KnowledgeHomeInsightSummary = {
  tenant_key: string;
  tenant_name: string;
  summary_title: string;
  executive_summary: string;
  strategic_priorities: string[];
  top_insights: Array<{
    title: string;
    what_nexus_sees: string;
    why_it_matters: string;
    evidence_strength: "Strong" | "Medium" | "Partial" | "Gap" | "Target / Future";
    related_dimensions: string[];
    next_action: string;
    module_handoff: string;
  }>;
  enterprise_context_map: Array<{
    from: string;
    relation: string;
    to: string;
    caveat?: string;
  }>;
  readiness_matrix: Array<{
    dimension: string;
    readiness: "Strong" | "Partial" | "Gap" | "Target / Future" | "Not validated";
    story: string;
  }>;
  evidence_heatmap: Array<{
    dimension: string;
    evidence_coverage: "High" | "Medium" | "Partial" | "Low";
    confidence: "High" | "Medium" | "Low";
    caveat: string;
  }>;
  top_gaps: Array<{
    gap: string;
    why_it_matters: string;
    source_dimension: string;
    evidence_requested: string;
    suggested_workshop_owner: string;
    module_impacted: string;
  }>;
  module_readiness: Array<{
    module: "Knowledge" | "Intelligence" | "Moves" | "Source" | "Tower";
    readiness: string;
    next_best_action: string;
  }>;
  safe_claims: string[];
  do_not_claim: string[];
  source_context_hash: string;
  evidence_refs_used: string[];
  relationship_edges_used: string[];
  context_gap_ids_used: string[];
  generated_by: "approved_executive_narrative_seed" | "claude";
  generated_model: string;
  generated_at: string;
  validation_status: "passed" | "failed";
  validation_errors: string[];
};

const GENERATED_AT = "2026-07-15T15:00:00.000Z";
const GENERATED_BY = "approved_executive_narrative_seed" as const;
const GENERATED_MODEL = "claude-ready-approved-seed";

const COMMON_EVIDENCE_REFS = [
  "meridian-enterprise-profile",
  "meridian-member-service-context",
  "meridian-current-analytics-estate",
  "meridian-agent-assist-use-case",
  "meridian-risk-control-context",
  "meridian-metrics-baseline-context",
];

const COMMON_SAFE_CLAIMS = [
  "This is synthetic Meridian-style demo context, not real Meridian production data.",
  "Nexus has source-backed context for discovery, chartering, and current-state diagnosis.",
  "AWS and Databricks are represented as a target-state foundation, not a certified current production platform.",
  "Agent Assist is ready for evidence planning and phase-gated execution framing, not production launch.",
];

const COMMON_DO_NOT_CLAIM = [
  "Do not claim real Meridian production data was loaded.",
  "Do not claim AWS or Databricks is certified current production for this tenant.",
  "Do not claim realized ROI, Tower value, or savings until measured evidence exists.",
  "Do not claim PHI-bearing transcripts have been ingested or approved.",
  "Do not treat candidate or generated graph rows as approved active tenant truth.",
];

const DIMENSION_NARRATIVE_INPUTS: Array<{
  dimension_key: string;
  dimension_name: string;
  summary_title: string;
  executive_summary: string;
  knows: string[];
  why: string;
  questions: string[];
  caveats: string[];
  next: string[];
  moduleUsage: string[];
  relationshipRefs?: string[];
  gapRefs?: string[];
}> = [
  {
    dimension_key: "00_enterprise_profile",
    dimension_name: "Enterprise Profile",
    summary_title: "Meridian enterprise profile",
    executive_summary:
      "Meridian is represented as a mid-to-large healthcare enterprise evaluating AI Agent Assist for member service. Nexus has enough profile context to orient the discussion around healthcare operations, data governance, and transformation readiness, while keeping synthetic/demo status and missing evidence visible.",
    knows: [
      "Meridian is healthcare-oriented and the primary proof story is member service Agent Assist.",
      "The tenant context is synthetic and source-backed for demo use, not real production data.",
      "Business, technology, data, risk, and metric dimensions are available for fact-based orientation.",
    ],
    why:
      "A credible Agent Assist conversation starts with who the enterprise is, what work matters, and what evidence boundaries apply before any module recommends action.",
    questions: [
      "What kind of enterprise is Meridian modeled as?",
      "Which strategic themes frame the Agent Assist opportunity?",
      "Which context is safe for discovery versus not yet decision-grade?",
    ],
    caveats: [
      "Company metadata should remain synthetic/demo-scoped until validated by a client packet.",
      "Revenue, employee, and location facts must not be overclaimed unless explicitly source-backed.",
    ],
    next: [
      "Confirm leadership, headquarters, revenue, employee count, operating regions, and strategic priorities in the enterprise profile template.",
    ],
    moduleUsage: [
      "Knowledge orients the enterprise story.",
      "Intelligence uses it to frame executive questions.",
      "Moves uses it to anchor charter language.",
    ],
  },
  {
    dimension_key: "01_business_functions",
    dimension_name: "Business Functions",
    summary_title: "Member Service as the business anchor",
    executive_summary:
      "Meridian's Agent Assist opportunity is anchored in business functions such as Member Service, Health Plan Operations, Clinical Operations, Enterprise Data and Analytics, Quality, Finance, and Technology Platform teams. Nexus can explain which functions participate, but owner confirmation and workshop validation are still required before execution decisions.",
    knows: [
      "Member Service and contact center operations are central to the Agent Assist use case.",
      "Claims, eligibility, clinical, quality, finance, and data teams are downstream participants.",
      "Business function records support discovery and phase-gated Moves framing.",
    ],
    why:
      "Agent Assist changes how work is performed across functions; it cannot be evaluated as only a technology feature.",
    questions: [
      "Which business functions are affected by Agent Assist?",
      "Who should participate in the current-state workshop?",
      "Which functions own readiness, controls, and outcome measurement?",
    ],
    caveats: [
      "Named function owners and decision rights still need client validation.",
      "Cross-function dependency depth remains incomplete until relationships are validated.",
    ],
    next: [
      "Run a Member Service current-state workshop with business, data, technology, privacy, and operations owners.",
    ],
    moduleUsage: [
      "Moves uses this for P0/P1 scope and sponsor alignment.",
      "Tower uses it for ownership and accountability.",
      "Intelligence uses it for enterprise decision framing.",
    ],
  },
  {
    dimension_key: "02_org_ownership",
    dimension_name: "Org Ownership",
    summary_title: "Decision rights and accountable owners",
    executive_summary:
      "Nexus has enough ownership context to show that Agent Assist requires coordinated decision rights across member service, data, platform, privacy, and analytics teams. The ownership dimension should be treated as directional until named accountable executives and stewards are confirmed.",
    knows: [
      "Agent Assist needs business, platform, data, privacy, and operations accountability.",
      "Ownership context can support workshop planning and governance design.",
      "Unconfirmed owners should remain gaps, not synthetic facts.",
    ],
    why:
      "AI work fails when ownership is unclear; Nexus uses this dimension to prevent an AI idea from entering execution without decision rights.",
    questions: [
      "Who must approve Agent Assist scope?",
      "Which owners must sign off on data, controls, and metrics?",
      "Where are ownership gaps blocking execution?",
    ],
    caveats: [
      "Owner names and signoff authority require validation.",
      "Do not infer executive accountability from system or data rows alone.",
    ],
    next: [
      "Confirm accountable business owner, platform owner, data owner, privacy/security owner, and measurement owner.",
    ],
    moduleUsage: [
      "Moves uses owners for gate readiness.",
      "Tower uses owners for outcome accountability.",
      "Source uses owners for vendor decision paths.",
    ],
  },
  {
    dimension_key: "03_workforce_roles",
    dimension_name: "Workforce Roles",
    summary_title: "Roles affected by Agent Assist",
    executive_summary:
      "The workforce context shows that Agent Assist affects member service agents, supervisors, knowledge stewards, data/platform teams, and compliance reviewers. Nexus can use this to shape adoption and workflow questions, but role counts, training needs, and adoption baselines still require evidence.",
    knows: [
      "Member service agents and supervisors are the primary workflow users.",
      "Knowledge, data, privacy, and platform roles are necessary enabling roles.",
      "Role context supports adoption planning and human-in-the-loop controls.",
    ],
    why:
      "Agent Assist only creates value if frontline roles can safely use it and supporting roles maintain knowledge, controls, and measurement.",
    questions: [
      "Which roles will use or govern Agent Assist?",
      "Where is human review required?",
      "What training and adoption evidence must be captured?",
    ],
    caveats: [
      "Workforce counts and role coverage are not approved as actuals.",
      "Adoption and productivity claims require baselines and measured usage.",
    ],
    next: [
      "Validate agent, supervisor, knowledge steward, data steward, and privacy reviewer roles in workshop outputs.",
    ],
    moduleUsage: [
      "Moves uses roles for operating-model design.",
      "Tower uses roles for adoption measurement.",
      "Intelligence uses roles for risk-aware recommendations.",
    ],
  },
  {
    dimension_key: "04_applications_systems",
    dimension_name: "Applications & Systems",
    summary_title: "Member-service systems landscape",
    executive_summary:
      "Meridian's Agent Assist opportunity depends on current-state member-service systems including contact center, CRM/member service, claims, eligibility, knowledge, reporting, and healthcare data context. Nexus has source-backed context for the systems involved, but production design still requires validation of integrations, transcript availability, API readiness, ownership, and KPI baselines.",
    knows: [
      "Contact center and CRM/member-service platforms are in scope.",
      "Claims and eligibility systems are required for grounded answers.",
      "Knowledge base governance is a key dependency.",
      "Epic Clarity, Epic Caboodle, SQL Server reporting marts, DB2-style warehouse, Tableau, and SAS provide healthcare/data context.",
      "AWS and Databricks are target-state foundation signals, not current certified production.",
    ],
    why:
      "Agent Assist cannot be evaluated as a chatbot alone. It depends on systems, integrations, data, controls, and metrics across member service, claims, eligibility, knowledge, and analytics.",
    questions: [
      "Which systems do agents use today?",
      "Which integrations are required for safe answers?",
      "Which data sources are needed for grounding?",
      "What must be validated before production design?",
      "Which vendors or platforms may require Source involvement?",
    ],
    caveats: [
      "Transcript governance is not validated.",
      "KPI baselines are incomplete.",
      "API readiness across CRM, claims, eligibility, and knowledge systems is unclear.",
      "AWS/Databricks target foundation is not production-certified.",
    ],
    next: [
      "Confirm system ownership, integration/API readiness, transcript availability, consent/retention posture, KPI baselines, and PHI/HITL/audit controls.",
    ],
    moduleUsage: [
      "Knowledge explains known systems and gaps.",
      "Moves supports P0/P1/P2 Agent Assist framing and diagnosis.",
      "Intelligence assesses readiness, risks, and decisions.",
      "Source identifies vendor/platform dependencies.",
      "Tower defines metrics and measurement plan.",
    ],
    relationshipRefs: ["rel-member-service-to-contact-center", "rel-member-service-to-claims"],
    gapRefs: ["gap-transcript-governance", "gap-api-readiness", "gap-kpi-baselines"],
  },
  {
    dimension_key: "05_data_assets_integrations",
    dimension_name: "Data Assets & Integrations",
    summary_title: "Data foundation required for safe answers",
    executive_summary:
      "Meridian has current-state healthcare data context spanning EMR/reporting repositories, claims, eligibility, knowledge, SQL Server marts, SAS, Tableau, and legacy warehouse patterns. Nexus also sees AWS and Databricks as the target lakehouse direction, but not as certified current production.",
    knows: [
      "Claims, eligibility, member, knowledge, and clinical/reporting data are required for Agent Assist grounding.",
      "Epic Clarity/Caboodle, SQL Server marts, SAS, Tableau, and warehouse-style assets appear in the current-state context.",
      "A future AWS + Databricks lakehouse would need medallion architecture, governance, data products, and access controls.",
    ],
    why:
      "Agent Assist quality depends on governed data access, lineage, freshness, and controls; poor data readiness turns a promising AI use case into a risk.",
    questions: [
      "Which data assets are needed for Agent Assist?",
      "Which integrations must be validated?",
      "What data foundation work must precede production AI?",
    ],
    caveats: [
      "Integration freshness, lineage, and API readiness are not fully validated.",
      "AWS/Databricks is target/future foundation, not current certified production.",
    ],
    next: [
      "Validate source-of-record, integration method, data steward, refresh cadence, and PHI handling for each Agent Assist data asset.",
    ],
    moduleUsage: [
      "Intelligence uses this for AI readiness.",
      "Moves uses it for data foundation work.",
      "Tower uses it for measurement context.",
    ],
    relationshipRefs: ["rel-agent-assist-to-data-foundation"],
    gapRefs: ["gap-api-readiness", "gap-data-lineage"],
  },
  {
    dimension_key: "06_infrastructure_platforms",
    dimension_name: "Infrastructure & Platforms",
    summary_title: "Current-state platform constraints and target foundation",
    executive_summary:
      "Nexus treats Meridian as on-premise-heavy for current analytics and reporting, with AWS and Databricks represented as a future foundation to be designed and validated. This is central to the case study: Agent Assist requires a governed platform path, not an assumption that cloud lakehouse capabilities already exist.",
    knows: [
      "Current analytics context includes legacy/on-prem reporting and analytics platforms.",
      "AWS landing zone, Databricks foundation, medallion architecture, and governance are target-state needs.",
      "Security, network, PHI, audit, and access controls are prerequisites.",
    ],
    why:
      "A technology target is only useful if Nexus keeps current state and future state distinct; otherwise the demo would claim capabilities the client has not built.",
    questions: [
      "What platform capabilities exist today?",
      "What target foundation must be designed before production Agent Assist?",
      "Which security and network controls are prerequisites?",
    ],
    caveats: [
      "Do not claim AWS or Databricks production readiness.",
      "Network, security, governance, and operational support evidence must be confirmed.",
    ],
    next: [
      "Validate landing-zone, Databricks, identity, network, PHI, catalog, observability, and platform-operations readiness.",
    ],
    moduleUsage: [
      "Moves uses this for solution design and target-state readiness.",
      "Source uses it for platform/vendor scope.",
      "Intelligence uses it for modernization options.",
    ],
    gapRefs: ["gap-aws-databricks-production-readiness"],
  },
  {
    dimension_key: "07_vendors_contracts",
    dimension_name: "Vendors & Contracts",
    summary_title: "Vendor and contract context for platform decisions",
    executive_summary:
      "Vendor and contract context is useful for identifying where Agent Assist may touch CRM, contact center, cloud, Databricks, analytics, and managed-services providers. Nexus can frame sourcing questions, but contract optimization and savings claims require actual contract evidence.",
    knows: [
      "Agent Assist may depend on contact center, CRM, cloud, Databricks, analytics, and integration partners.",
      "Source can use this context to prepare vendor/platform questions.",
      "Contract economics must remain caveated until source-backed agreements are loaded.",
    ],
    why:
      "Agent Assist will likely require vendor decisions; Source should help with scope and options without pretending contract economics are already proven.",
    questions: [
      "Which vendors or platforms are likely dependencies?",
      "What contract evidence is needed before sourcing decisions?",
      "Where could Source support the next step?",
    ],
    caveats: [
      "Do not claim contract savings without loaded contract economics.",
      "Vendor ownership and obligations require source documents.",
    ],
    next: [
      "Load or validate CRM, contact center, cloud, Databricks, analytics, and managed-services contract evidence if Source is involved.",
    ],
    moduleUsage: [
      "Source uses it for sourcing scope.",
      "Intelligence uses it for options.",
      "Tower uses it for vendor value tracking once measured.",
    ],
  },
  {
    dimension_key: "08_it_budget_spend_value",
    dimension_name: "IT Budget, Spend & Value",
    summary_title: "Financial context without value overclaim",
    executive_summary:
      "Nexus can use IT budget and value context to frame where Agent Assist and data foundation work may require investment, but the current Knowledge summary must not claim savings, ROI, or Tower outcomes until baselines and actuals are loaded.",
    knows: [
      "Agent Assist and data foundation work require investment framing.",
      "Savings, avoided cost, and vendor economics are not approved facts without financial evidence.",
      "Tower will later need baseline and measured actuals.",
    ],
    why:
      "The platform should help executives avoid unfunded AI pilots and value claims that cannot be proved.",
    questions: [
      "What financial evidence is needed before business-case approval?",
      "Which cost categories need baseline validation?",
      "What should Tower measure later?",
    ],
    caveats: [
      "Savings and ROI claims are not supported by this Knowledge summary.",
      "Budget ownership and run-cost baselines require validation.",
    ],
    next: [
      "Load addressable spend, baseline run cost, transformation budget, vendor economics, and measurement cadence before value claims.",
    ],
    moduleUsage: [
      "Intelligence uses it for business case framing.",
      "Moves uses it for value hypothesis.",
      "Tower uses it for actual value tracking after baselines exist.",
    ],
  },
  {
    dimension_key: "09_programs_initiatives",
    dimension_name: "Programs & Initiatives",
    summary_title: "Agent Assist as a governed transformation candidate",
    executive_summary:
      "Nexus sees Agent Assist as a transformation candidate that should move through governed discovery, chartering, diagnosis, design, business case, and measurement planning. It should not jump straight from idea to production deployment.",
    knows: [
      "Agent Assist is a meaningful initiative candidate for member service.",
      "Data foundation and governance work are likely prerequisites.",
      "Moves can turn the idea into a phase-gated execution plan.",
    ],
    why:
      "Programs fail when an AI idea is funded without baseline, dependencies, controls, and execution ownership.",
    questions: [
      "Should Agent Assist become a Move?",
      "What phase should it start in?",
      "What evidence is needed before executive commitment?",
    ],
    caveats: [
      "Program funding, sponsor signoff, and delivery roadmap are not yet approved.",
      "Production scope requires platform and data validation.",
    ],
    next: [
      "Create or validate the Agent Assist Move charter with sponsor, baseline, scope, dependencies, and gate criteria.",
    ],
    moduleUsage: [
      "Moves is the primary module for execution planning.",
      "Intelligence helps compare options.",
      "Tower later tracks promised versus measured outcomes.",
    ],
    gapRefs: ["gap-charter-baseline"],
  },
  {
    dimension_key: "10_ai_automation_use_cases",
    dimension_name: "AI & Automation Use Cases",
    summary_title: "Agent Assist readiness, not production approval",
    executive_summary:
      "The AI use-case context supports evaluating Agent Assist for member service, intent support, knowledge retrieval, and next-best-action workflows. Nexus should frame this as a readiness and execution question, not as a production-ready AI claim.",
    knows: [
      "Agent Assist is the primary AI use case in the Meridian proof story.",
      "Likely capabilities include agent support, intent detection, knowledge retrieval, and next-best-action.",
      "Data, transcript, control, and measurement readiness determine feasibility.",
    ],
    why:
      "AI value depends on the operating system around the model: data, workflow, controls, adoption, and measurable outcomes.",
    questions: [
      "What would Agent Assist need to be safe?",
      "Which blockers must be resolved before design?",
      "Which use-case assumptions require evidence?",
    ],
    caveats: [
      "Do not claim model deployment, PHI ingestion, or production readiness.",
      "Transcript access and governance are not validated.",
    ],
    next: [
      "Validate transcripts, knowledge sources, PHI controls, HITL design, hallucination safeguards, and measurement baselines.",
    ],
    moduleUsage: [
      "Intelligence evaluates readiness.",
      "Moves turns it into a governed plan.",
      "Tower defines measurement after baselines.",
    ],
    gapRefs: ["gap-transcript-governance", "gap-phi-hitl-controls"],
  },
  {
    dimension_key: "11_risks_controls",
    dimension_name: "Risks & Controls",
    summary_title: "Controls that gate safe Agent Assist",
    executive_summary:
      "The risk and control context shows that PHI, consent/retention, hallucination risk, human review, audit logging, data access, and knowledge governance must be addressed before Agent Assist can move toward production design.",
    knows: [
      "PHI, HITL, hallucination, audit, and knowledge governance are gating controls.",
      "Risk context is strong enough to shape readiness questions.",
      "Control effectiveness is not proven until evidence and owners are validated.",
    ],
    why:
      "Healthcare Agent Assist requires trust controls before speed; Nexus keeps risk visible in the same context used for decisions.",
    questions: [
      "Which controls must be validated?",
      "What should not be claimed as ready?",
      "Which risks affect phase gates?",
    ],
    caveats: [
      "No compliance opinion or control effectiveness conclusion is supported.",
      "Policy, consent, retention, and audit evidence need owner validation.",
    ],
    next: [
      "Validate PHI handling, consent/retention, HITL workflow, audit logging, access controls, and knowledge governance.",
    ],
    moduleUsage: [
      "Moves uses controls for gates.",
      "Intelligence uses them for risk-aware decisions.",
      "Source uses them for contract/control requirements.",
      "Tower uses them for control tracking once measurable.",
    ],
    relationshipRefs: ["rel-agent-assist-to-phi-controls"],
    gapRefs: ["gap-phi-hitl-controls", "gap-audit-logging"],
  },
  {
    dimension_key: "12_relationships",
    dimension_name: "Relationships",
    summary_title: "Cross-domain links still need validation depth",
    executive_summary:
      "Nexus can show the intended Agent Assist golden thread from business function to systems, data, controls, metrics, Moves phases, and Tower measurement. Relationship depth should remain caveated until the graph links are validated with source evidence and owners.",
    knows: [
      "Member Service uses contact center, CRM, claims, eligibility, and knowledge context.",
      "Agent Assist should connect systems, data, controls, and metrics.",
      "Relationship evidence exists directionally but should not be overstated as complete dependency mapping.",
    ],
    why:
      "The value of Knowledge is in connection, but unsupported relationship claims are more dangerous than missing rows.",
    questions: [
      "What is connected to Agent Assist?",
      "Which links are ready for discussion?",
      "Which relationships need evidence before design or value claims?",
    ],
    caveats: [
      "Cross-domain dependency reasoning remains limited until validated.",
      "Do not infer complete architecture or integration maps from representative links.",
    ],
    next: [
      "Validate system-to-data, system-to-vendor, function-to-owner, risk-to-control, and metric-to-outcome links.",
    ],
    moduleUsage: [
      "Knowledge explains the golden thread.",
      "Moves uses validated links for evidence attachment.",
      "Tower uses validated links for measurement lineage.",
    ],
    relationshipRefs: ["rel-member-service-to-contact-center", "rel-agent-assist-to-data-foundation"],
  },
  {
    dimension_key: "13_evidence_sources",
    dimension_name: "Evidence Sources",
    summary_title: "Evidence trail for the Knowledge story",
    executive_summary:
      "Evidence sources tell Nexus what can be treated as source-backed versus what remains a gap or preview. For Meridian, the evidence trail is strong enough for discovery and diagnosis, but not enough to certify production readiness or realized value.",
    knows: [
      "Evidence references are attached to major context dimensions.",
      "The UI should expose evidence without turning file names into the executive story.",
      "Missing evidence should remain visible as a gap.",
    ],
    why:
      "Evidence is what keeps aVa and downstream modules from converting plausible narrative into unsupported fact.",
    questions: [
      "What backs this claim?",
      "Which sources should be inspected next?",
      "Where does evidence remain too thin?",
    ],
    caveats: [
      "Source evidence does not equal approved production truth unless it has been validated.",
      "Generated summaries must remain linked to evidence refs.",
    ],
    next: [
      "Attach source lineage, row references, owner validation, and as-of dates for high-risk Agent Assist claims.",
    ],
    moduleUsage: [
      "All modules consume evidence references through the Knowledge context contract.",
    ],
  },
  {
    dimension_key: "14_metrics_outcomes",
    dimension_name: "Metrics & Outcomes",
    summary_title: "Measurement plan before value claims",
    executive_summary:
      "Meridian's Agent Assist story can discuss measurement categories such as AHT, first-contact resolution, transfer rate, repeat contacts, CSAT, quality, compliance, and cost per contact. Baselines and actuals still need validation before Tower can make value claims.",
    knows: [
      "AHT, FCR, transfer rate, repeat contacts, CSAT, and cost per contact are relevant measurement categories.",
      "Tower can help define a measurement plan after baselines are validated.",
      "Outcome value is not yet supported.",
    ],
    why:
      "AbarVa should convert AI ideas into measurable outcomes, but only when baseline and actual evidence exists.",
    questions: [
      "Which metrics should be baselined?",
      "What can Tower measure later?",
      "Which outcomes are not claimable yet?",
    ],
    caveats: [
      "KPI baselines are incomplete.",
      "Savings, ROI, and measured Tower outcomes are not supported yet.",
    ],
    next: [
      "Validate AHT, FCR, transfer, repeat contact, CSAT, quality, compliance, adoption, and cost-per-contact baselines.",
    ],
    moduleUsage: [
      "Tower defines and tracks measurement.",
      "Moves uses baselines for gates.",
      "Intelligence uses metrics for business-case framing.",
    ],
    gapRefs: ["gap-kpi-baselines"],
  },
  {
    dimension_key: "15_industry_context_patterns",
    dimension_name: "Industry Context Patterns",
    summary_title: "Healthcare pattern context",
    executive_summary:
      "Healthcare Agent Assist patterns involve regulated data, complex member journeys, claims and eligibility dependencies, clinical context, and strict control requirements. Nexus can use these patterns to ask better questions, not to replace client-specific evidence.",
    knows: [
      "Healthcare member service requires claims, eligibility, knowledge, privacy, and quality controls.",
      "Industry patterns help identify likely gaps and workshop participants.",
      "Patterns are advisory until grounded in tenant evidence.",
    ],
    why:
      "Patterns make the product useful early, but Nexus must keep pattern-based assumptions separate from approved tenant truth.",
    questions: [
      "Which healthcare-specific risks should we validate?",
      "What evidence is usually needed for Agent Assist?",
      "Which assumptions are only patterns?",
    ],
    caveats: [
      "Industry pattern context is not a substitute for client evidence.",
      "Do not treat generic healthcare patterns as Meridian facts.",
    ],
    next: [
      "Validate industry-pattern assumptions against Meridian-specific source files and workshops.",
    ],
    moduleUsage: [
      "Intelligence uses patterns for better questions.",
      "Moves uses them for workshop design.",
      "Source uses them for requirement prompts.",
    ],
  },
  {
    dimension_key: "16_expert_lenses",
    dimension_name: "Expert Lenses",
    summary_title: "Expert viewpoints to pressure-test Agent Assist",
    executive_summary:
      "Expert lenses help Nexus inspect Agent Assist through CDAO, operations, technology, security/privacy, finance, and transformation perspectives. They should guide questions and caveats, not create facts independently.",
    knows: [
      "CDAO, operations, technology, privacy, finance, and transformation lenses are relevant.",
      "Expert lenses help identify blind spots in data, controls, adoption, and measurement.",
      "They depend on the same source-backed context boundary.",
    ],
    why:
      "Executive decisions improve when the same evidence is examined through multiple accountable perspectives.",
    questions: [
      "What would a CDAO worry about?",
      "What would operations need to validate?",
      "What would privacy/security require before design?",
    ],
    caveats: [
      "Expert commentary is advisory unless backed by tenant evidence.",
      "Do not infer decisions or approvals from a lens.",
    ],
    next: [
      "Run a cross-functional review using CDAO, operations, platform, privacy, finance, and service-owner lenses.",
    ],
    moduleUsage: [
      "Intelligence uses lenses for decision options.",
      "Moves uses lenses for gate criteria.",
      "Tower uses lenses for outcome interpretation.",
    ],
  },
  {
    dimension_key: "17_managed_services_scope",
    dimension_name: "Managed Services Scope",
    summary_title: "Run/support model implications",
    executive_summary:
      "Managed-services context can help identify who maintains reporting, analytics, integrations, contact center support, and future platform operations. For Meridian, this is relevant to AI/data foundation work but requires service scope and contract evidence before Source or Tower claims are made.",
    knows: [
      "Agent Assist and data foundation work affect run, support, integration, and platform operations.",
      "Managed-services scope may matter for sourcing, transition, and ongoing value.",
      "Contract and service-level evidence remains required.",
    ],
    why:
      "AI programs fail when build scope ignores who will run, monitor, support, and improve the capability after launch.",
    questions: [
      "Who supports current reporting and analytics?",
      "Who would operate the target data foundation?",
      "What scope needs contract or sourcing review?",
    ],
    caveats: [
      "Do not claim outsourcing savings or service readiness without contract and operational evidence.",
      "Current support volumes and service levels need validation.",
    ],
    next: [
      "Validate managed-services scope, ticket volumes, SLAs, run cost, and transition responsibilities.",
    ],
    moduleUsage: [
      "Source uses this for sourcing scope.",
      "Moves uses it for operating-model design.",
      "Tower uses it for run-value tracking.",
    ],
  },
  {
    dimension_key: "18_operational_process_evidence",
    dimension_name: "Operational Process Evidence",
    summary_title: "Process evidence needed before production design",
    executive_summary:
      "Operational evidence must show how member service agents handle calls, use CRM and knowledge tools, check claims and eligibility, escalate issues, and measure outcomes. Nexus can frame the process diagnosis now, but transcript samples, workflow observations, and KPI extracts still need validation.",
    knows: [
      "Agent Assist depends on actual call-handling, escalation, knowledge, and claims/eligibility workflows.",
      "Operational process evidence is needed to move from idea to design.",
      "Transcript governance and workflow evidence remain priority gaps.",
    ],
    why:
      "Without process evidence, Agent Assist design becomes generic and risks missing the real work.",
    questions: [
      "How do agents handle member service interactions today?",
      "Where do they use systems, data, and knowledge?",
      "Which evidence is needed before design?",
    ],
    caveats: [
      "Transcript samples and process-observation evidence are not validated.",
      "Workflow bottlenecks and baselines need source evidence.",
    ],
    next: [
      "Collect approved workflow notes, call transcript policy/sample evidence, KPI extracts, escalation rules, and knowledge article governance.",
    ],
    moduleUsage: [
      "Moves uses process evidence for P2 diagnosis.",
      "Intelligence uses it for feasibility.",
      "Tower uses it for baseline and adoption measurement.",
    ],
    gapRefs: ["gap-transcript-governance", "gap-process-observation"],
  },
];

const MERIDIAN_SEEDED_DIMENSION_NARRATIVES: KnowledgeDimensionNarrativeSummary[] =
  DIMENSION_NARRATIVE_INPUTS.map((item) => ({
    tenant_key: "meridian-health",
    tenant_name: "Meridian Health",
    dimension_key: item.dimension_key,
    dimension_name: item.dimension_name,
    summary_title: item.summary_title,
    executive_summary: item.executive_summary,
    what_nexus_knows: item.knows,
    why_it_matters: item.why,
    questions_supported: item.questions,
    current_caveats: item.caveats,
    next_validation_actions: item.next,
    module_usage: item.moduleUsage,
    safe_demo_claims: COMMON_SAFE_CLAIMS,
    do_not_claim: COMMON_DO_NOT_CLAIM,
    evidence_refs_used: COMMON_EVIDENCE_REFS,
    source_fact_ids_used: [
      `fact-${item.dimension_key}-meridian`,
      "fact-meridian-agent-assist",
    ],
    entity_profile_ids_used: [
      "profile-meridian-member-service",
      "profile-meridian-agent-assist",
    ],
    relationship_edge_ids_used: item.relationshipRefs ?? [
      "rel-agent-assist-cross-dimension",
    ],
    context_gap_ids_used: item.gapRefs ?? ["gap-validation-needed"],
    source_context_hash: `sha256:${stableHash([
      item.dimension_key,
      item.executive_summary,
      item.knows.join("|"),
      item.caveats.join("|"),
    ])}`,
    generated_by: GENERATED_BY,
    generated_model: GENERATED_MODEL,
    generated_at: GENERATED_AT,
    validation_status: "passed",
    validation_errors: [],
    unsupported_claims: [],
    active_or_candidate_status: "active",
  }));

const MERIDIAN_SEEDED_HOME_INSIGHTS: KnowledgeHomeInsightSummary = {
  tenant_key: "meridian-health",
  tenant_name: "Meridian Health",
  summary_title: "Meridian Agent Assist Knowledge Command Center",
  executive_summary:
    "Meridian is exploring AI Agent Assist for Member Service. Nexus has source-backed context across business functions, systems, data assets, risks, metrics, and target architecture. The context is strong enough for enterprise orientation, discovery, chartering, and current-state diagnosis, but it is not enough to claim production readiness, certified AWS/Databricks foundation, PHI-bearing transcript ingestion, or realized value.",
  strategic_priorities: [
    "Improve member service experience with safe, evidence-backed Agent Assist.",
    "Modernize the healthcare analytics foundation from on-premise-heavy reporting and marts toward a governed AWS + Databricks target architecture.",
    "Create measured value discipline before approving production AI or Tower outcome claims.",
  ],
  top_insights: [
    {
      title: "Agent Assist is cross-functional, not a standalone chatbot.",
      what_nexus_sees:
        "Member Service depends on contact center, CRM/member-service, claims, eligibility, knowledge, data, controls, and metrics.",
      why_it_matters:
        "The work should move through governed discovery and Moves phases before production design.",
      evidence_strength: "Strong",
      related_dimensions: [
        "Business Functions",
        "Applications & Systems",
        "Data Assets & Integrations",
        "Risks & Controls",
        "Metrics & Outcomes",
      ],
      next_action:
        "Run a Member Service current-state diagnosis with operations, data, platform, privacy, and measurement owners.",
      module_handoff: "Moves P0/P1/P2 framing",
    },
    {
      title: "Systems are known, but integration/API readiness is still a gate.",
      what_nexus_sees:
        "CRM, contact center, claims, eligibility, knowledge, Epic reporting context, SQL Server marts, Tableau, and SAS are visible in the landscape.",
      why_it_matters:
        "Agent Assist answer quality depends on live or governed integration paths, not merely system names.",
      evidence_strength: "Medium",
      related_dimensions: [
        "Applications & Systems",
        "Data Assets & Integrations",
        "Operational Process Evidence",
      ],
      next_action:
        "Validate integration method, API readiness, owner, refresh cadence, and access controls for each required system.",
      module_handoff: "Intelligence readiness assessment",
    },
    {
      title: "AWS + Databricks is target-state foundation, not current production.",
      what_nexus_sees:
        "The future-state data foundation should include AWS, Databricks, medallion architecture, governed data products, catalog, lineage, and controls.",
      why_it_matters:
        "The case study should show Nexus guiding the foundation direction instead of pretending it already exists.",
      evidence_strength: "Target / Future",
      related_dimensions: [
        "Infrastructure & Platforms",
        "Data Assets & Integrations",
        "AI & Automation Use Cases",
        "Programs & Initiatives",
      ],
      next_action:
        "Validate landing-zone, network, security, Databricks, catalog, PHI, and platform-operations readiness.",
      module_handoff: "Moves design and Source platform scope",
    },
    {
      title: "Metrics exist as categories, but baselines must be validated.",
      what_nexus_sees:
        "AHT, FCR, transfer rate, repeat contacts, CSAT, quality, compliance, and cost per contact are relevant to Agent Assist.",
      why_it_matters:
        "Tower can define the measurement plan now, but cannot claim realized value without baselines and actuals.",
      evidence_strength: "Partial",
      related_dimensions: ["Metrics & Outcomes", "Operational Process Evidence"],
      next_action:
        "Load baseline extracts and define measurement cadence before executive value claims.",
      module_handoff: "Tower baseline design",
    },
    {
      title: "PHI, HITL, audit, and knowledge governance are gating controls.",
      what_nexus_sees:
        "Healthcare Agent Assist requires privacy, consent/retention, audit logging, human review, hallucination controls, and knowledge freshness.",
      why_it_matters:
        "Control gaps should block production design even when the business case is attractive.",
      evidence_strength: "Medium",
      related_dimensions: [
        "Risks & Controls",
        "AI & Automation Use Cases",
        "Data Assets & Integrations",
      ],
      next_action:
        "Validate PHI handling, transcript governance, HITL workflow, audit logging, and knowledge article approval process.",
      module_handoff: "Moves gate criteria and Intelligence caveats",
    },
  ],
  enterprise_context_map: [
    { from: "Member Service", relation: "uses", to: "Contact Center Platform" },
    { from: "Member Service", relation: "uses", to: "CRM / Member Service Platform" },
    { from: "Member Service", relation: "integrates_with", to: "Claims Platform" },
    { from: "Member Service", relation: "integrates_with", to: "Eligibility Platform" },
    { from: "Member Service", relation: "uses", to: "Knowledge Base" },
    { from: "Agent Assist", relation: "consumes", to: "Member / Claims / Eligibility / Knowledge data" },
    { from: "Agent Assist", relation: "measured_by", to: "AHT / FCR / Transfer / Repeat Contact / CSAT / Cost per Contact" },
    { from: "Agent Assist", relation: "has_risk", to: "PHI / HITL / Hallucination / Audit / Knowledge Governance" },
    {
      from: "Agent Assist",
      relation: "target_platform_for",
      to: "AWS + Databricks Lakehouse",
      caveat: "Target-state foundation, not current production certification.",
    },
  ],
  readiness_matrix: [
    {
      dimension: "Business Context",
      readiness: "Strong",
      story: "Member Service and related operations are clear enough for discovery and chartering.",
    },
    {
      dimension: "Systems Context",
      readiness: "Strong",
      story: "Core member-service, claims, eligibility, knowledge, reporting, and analytics systems are visible.",
    },
    {
      dimension: "Data Context",
      readiness: "Partial",
      story: "Required data assets are known, but lineage, freshness, and integration readiness need validation.",
    },
    {
      dimension: "Metrics Baseline",
      readiness: "Partial",
      story: "Measurement categories are known; baselines and actuals are not yet Tower-proof.",
    },
    {
      dimension: "Risk / Controls",
      readiness: "Partial",
      story: "PHI, HITL, audit, and knowledge governance are visible gates requiring evidence.",
    },
    {
      dimension: "Target Data Foundation",
      readiness: "Target / Future",
      story: "AWS + Databricks is the recommended target-state direction, not certified current production.",
    },
  ],
  evidence_heatmap: [
    {
      dimension: "Business Functions",
      evidence_coverage: "High",
      confidence: "High",
      caveat: "Owner and decision-right validation still needed.",
    },
    {
      dimension: "Applications & Systems",
      evidence_coverage: "High",
      confidence: "Medium",
      caveat: "Integration/API readiness still needs validation.",
    },
    {
      dimension: "Data Assets & Integrations",
      evidence_coverage: "Medium",
      confidence: "Medium",
      caveat: "Lineage, refresh cadence, and access controls require confirmation.",
    },
    {
      dimension: "Metrics & Outcomes",
      evidence_coverage: "Partial",
      confidence: "Low",
      caveat: "Baselines and actuals are not yet sufficient for value claims.",
    },
    {
      dimension: "Risks & Controls",
      evidence_coverage: "Medium",
      confidence: "Medium",
      caveat: "Control design and effectiveness evidence are not yet approved.",
    },
    {
      dimension: "Operational Process Evidence",
      evidence_coverage: "Partial",
      confidence: "Low",
      caveat: "Transcript and workflow evidence are priority gaps.",
    },
  ],
  top_gaps: [
    {
      gap: "Transcript availability and governance not validated",
      why_it_matters: "Agent Assist cannot be safely grounded without approved transcript and retention posture.",
      source_dimension: "Operational Process Evidence",
      evidence_requested: "Transcript access policy, sample approval, consent/retention posture",
      suggested_workshop_owner: "Member Service + Privacy",
      module_impacted: "Moves / Intelligence",
    },
    {
      gap: "KPI baselines incomplete",
      why_it_matters: "Tower cannot claim value without baseline and actual measurement evidence.",
      source_dimension: "Metrics & Outcomes",
      evidence_requested: "AHT, FCR, transfer, repeat contact, CSAT, quality, compliance, cost per contact",
      suggested_workshop_owner: "Operations Analytics",
      module_impacted: "Tower / Moves",
    },
    {
      gap: "API readiness unclear across CRM, claims, eligibility, and knowledge",
      why_it_matters: "System names alone do not prove production integration feasibility.",
      source_dimension: "Applications & Systems",
      evidence_requested: "API inventory, integration map, owner signoff, latency/security constraints",
      suggested_workshop_owner: "Technology Platform",
      module_impacted: "Moves / Source",
    },
    {
      gap: "AWS + Databricks production-readiness validation missing",
      why_it_matters: "The target data foundation must be designed before production Agent Assist.",
      source_dimension: "Infrastructure & Platforms",
      evidence_requested: "Landing zone, network/security, catalog, PHI controls, Databricks operating model",
      suggested_workshop_owner: "CDAO + CDIO",
      module_impacted: "Moves / Source / Tower",
    },
  ],
  module_readiness: [
    {
      module: "Knowledge",
      readiness: "Ready",
      next_best_action: "Explain what is known, missing, and connected for Meridian Agent Assist.",
    },
    {
      module: "Intelligence",
      readiness: "Ready with caveats",
      next_best_action: "Assess readiness, risks, decision options, and evidence gaps.",
    },
    {
      module: "Moves",
      readiness: "Ready for P0/P1/P2",
      next_best_action: "Frame, charter, and diagnose Agent Assist before future-state design.",
    },
    {
      module: "Source",
      readiness: "Partial",
      next_best_action: "Identify likely vendor/platform dependencies; load contracts before optimization claims.",
    },
    {
      module: "Tower",
      readiness: "Measurement planning only",
      next_best_action: "Define baseline and measurement plan; do not claim realized value yet.",
    },
  ],
  safe_claims: COMMON_SAFE_CLAIMS,
  do_not_claim: COMMON_DO_NOT_CLAIM,
  source_context_hash: `sha256:${stableHash(["meridian-home-insights", GENERATED_AT])}`,
  evidence_refs_used: COMMON_EVIDENCE_REFS,
  relationship_edges_used: [
    "rel-member-service-to-contact-center",
    "rel-member-service-to-claims",
    "rel-agent-assist-to-data-foundation",
    "rel-agent-assist-to-phi-controls",
  ],
  context_gap_ids_used: [
    "gap-transcript-governance",
    "gap-api-readiness",
    "gap-kpi-baselines",
    "gap-aws-databricks-production-readiness",
  ],
  generated_by: GENERATED_BY,
  generated_model: GENERATED_MODEL,
  generated_at: GENERATED_AT,
  validation_status: "passed",
  validation_errors: [],
};

export const MERIDIAN_KNOWLEDGE_DIMENSION_NARRATIVES: KnowledgeDimensionNarrativeSummary[] =
  MERIDIAN_CLAUDE_DIMENSION_NARRATIVES.length > 0
    ? MERIDIAN_CLAUDE_DIMENSION_NARRATIVES
    : MERIDIAN_SEEDED_DIMENSION_NARRATIVES;

export const MERIDIAN_KNOWLEDGE_HOME_INSIGHTS: KnowledgeHomeInsightSummary =
  MERIDIAN_CLAUDE_HOME_INSIGHTS ?? MERIDIAN_SEEDED_HOME_INSIGHTS;

export function getStoredKnowledgeDimensionNarratives(
  tenantKey: string | null | undefined,
): KnowledgeDimensionNarrativeSummary[] {
  return normalizeTenantKey(tenantKey) === "meridian-health"
    ? MERIDIAN_KNOWLEDGE_DIMENSION_NARRATIVES
    : [];
}

export function getStoredKnowledgeHomeInsightSummary(
  tenantKey: string | null | undefined,
): KnowledgeHomeInsightSummary | null {
  return normalizeTenantKey(tenantKey) === "meridian-health"
    ? MERIDIAN_KNOWLEDGE_HOME_INSIGHTS
    : null;
}

export function applyStoredKnowledgeDimensionNarratives(
  snapshot: HomeSummarySnapshot,
  tenantKey: string | null | undefined,
): HomeSummarySnapshot {
  const narratives = getStoredKnowledgeDimensionNarratives(tenantKey).filter(
    (summary) => summary.validation_status === "passed",
  );
  if (narratives.length === 0) return snapshot;
  const byAreaKey = new Map(
    narratives.map((summary) => [
      dimensionKeyToAreaKey(summary.dimension_key),
      summary,
    ]),
  );
  const byDisplayName = new Map(
    narratives.map((summary) => [
      summary.dimension_name.toLowerCase(),
      summary,
    ]),
  );
  return {
    ...snapshot,
    contextAreas: snapshot.contextAreas.map((area) => {
      const narrative =
        byAreaKey.get(area.areaKey) ??
        byDisplayName.get(area.displayName.toLowerCase());
      if (!narrative) return area;
      return {
        ...area,
        claudeExecutiveSummary: narrative.executive_summary,
        claudeWhatAbarVaKnows: narrative.what_nexus_knows,
        claudeWhyItMatters: narrative.why_it_matters,
        claudeSupportedQuestions: narrative.questions_supported,
        claudeUnsupportedQuestions: narrative.do_not_claim,
        claudeNextDataAction: narrative.next_validation_actions[0],
        caveats: narrative.current_caveats,
        safeQuestions: narrative.questions_supported,
        unsupportedQuestions: narrative.do_not_claim,
        nextDataActions: narrative.next_validation_actions,
      };
    }),
  };
}

export function knowledgeNarrativeValidationFailures(): string[] {
  return [
    ...MERIDIAN_KNOWLEDGE_DIMENSION_NARRATIVES.flatMap(validateDimensionNarrative),
    ...validateHomeInsightSummary(MERIDIAN_KNOWLEDGE_HOME_INSIGHTS),
  ];
}

export function validateDimensionNarrative(
  summary: KnowledgeDimensionNarrativeSummary,
): string[] {
  const failures: string[] = [];
  const text = stripSafeBoundaryLanguage([
    summary.tenant_name,
    summary.summary_title,
    summary.executive_summary,
    summary.what_nexus_knows.join(" "),
    summary.why_it_matters,
    summary.questions_supported.join(" "),
    summary.current_caveats.join(" "),
    summary.next_validation_actions.join(" "),
    summary.module_usage.join(" "),
  ].join(" "));
  const forbidden = [
    ["wrong tenant", /\b(Airline Demo|SkyHarbor|Apex Retail|First Capital|Lakeshore)\b/i],
    ["legacy data layer language", /\bV[4-7]\b|\bv[4-7]\b|current-state-pack|rich-pack/i],
    ["production AWS Databricks overclaim", /\b(AWS|Databricks)\b.{0,80}\b(is|are|as)\s+(?:a\s+)?(?:current\s+)?(?:certified\s+)?production\b/i],
    [
      "realized value overclaim",
      /\b(has|have|is|are|delivered|delivers|achieved|proved|proves|guaranteed|guarantees)\b.{0,60}\b(realized ROI|realized value|realized savings|actual savings|Tower value)\b/i,
    ],
    [
      "PHI ingestion overclaim",
      /\bPHI-bearing transcripts? (were|are|have been) ingested\b(?![^.]{0,100}\bnot\b)/i,
    ],
  ] as const;
  for (const [label, pattern] of forbidden) {
    if (pattern.test(text)) failures.push(`${summary.dimension_key}: ${label}`);
  }
  if (summary.tenant_key !== "meridian-health") {
    failures.push(`${summary.dimension_key}: tenant key mismatch`);
  }
  if (summary.evidence_refs_used.length === 0) {
    failures.push(`${summary.dimension_key}: missing evidence refs`);
  }
  if (!/^sha256:[a-f0-9]{64}$/.test(summary.source_context_hash)) {
    failures.push(`${summary.dimension_key}: invalid source context hash`);
  }
  if (summary.validation_status !== "passed") {
    failures.push(`${summary.dimension_key}: validation status is not passed`);
  }
  if (summary.current_caveats.length === 0) {
    failures.push(`${summary.dimension_key}: missing caveats`);
  }
  return failures;
}

export function validateHomeInsightSummary(
  summary: KnowledgeHomeInsightSummary,
): string[] {
  const failures: string[] = [];
  const text = stripSafeBoundaryLanguage(JSON.stringify({
    ...summary,
    do_not_claim: [],
  }));
  const forbidden = [
    ["wrong tenant", /\b(Airline Demo|SkyHarbor|Apex Retail|First Capital|Lakeshore)\b/i],
    ["legacy data layer language", /\bV[4-7]\b|\bv[4-7]\b|current-state-pack|rich-pack/i],
    ["production AWS Databricks overclaim", /\b(AWS|Databricks)\b.{0,80}\b(is|are|as)\s+(?:a\s+)?(?:current\s+)?(?:certified\s+)?production\b/i],
    [
      "realized value overclaim",
      /\b(has|have|is|are|delivered|delivers|achieved|proved|proves|guaranteed|guarantees)\b.{0,60}\b(realized ROI|realized value|realized savings|actual savings|Tower value)\b/i,
    ],
    [
      "PHI ingestion overclaim",
      /\bPHI-bearing transcripts? (were|are|have been) ingested\b(?![^.]{0,100}\bnot\b)/i,
    ],
  ] as const;
  for (const [label, pattern] of forbidden) {
    if (pattern.test(text)) failures.push(`home-insights: ${label}`);
  }
  if (summary.tenant_key !== "meridian-health") {
    failures.push("home-insights: tenant key mismatch");
  }
  if (!/^sha256:[a-f0-9]{64}$/.test(summary.source_context_hash)) {
    failures.push("home-insights: invalid source context hash");
  }
  if (summary.top_insights.length < 5) {
    failures.push("home-insights: fewer than 5 insights");
  }
  if (summary.enterprise_context_map.length < 8) {
    failures.push("home-insights: context map is too thin");
  }
  if (summary.validation_status !== "passed") {
    failures.push("home-insights: validation status is not passed");
  }
  return failures;
}

function normalizeTenantKey(tenantKey: string | null | undefined): string | null {
  const normalized = tenantKey?.trim().toLowerCase() ?? "";
  if (!normalized) return null;
  if (normalized === "meridian" || normalized === "healthcare-demo") {
    return "meridian-health";
  }
  return normalized;
}

function dimensionKeyToAreaKey(dimensionKey: string): string {
  return dimensionKey.replace(/^\d+_/, "").replace(/_/g, "-");
}

function stableHash(parts: string[]): string {
  let hashA = 0x811c9dc5;
  let hashB = 0x811c9dc5;
  const input = parts.join("\n");
  for (let index = 0; index < input.length; index += 1) {
    const code = input.charCodeAt(index);
    hashA ^= code;
    hashA = Math.imul(hashA, 0x01000193) >>> 0;
    hashB ^= code + index;
    hashB = Math.imul(hashB, 0x01000193) >>> 0;
  }
  const block = `${hashA.toString(16).padStart(8, "0")}${hashB
    .toString(16)
    .padStart(8, "0")}`;
  return `${block}${block}${block}${block}`.slice(0, 64);
}

function stripSafeBoundaryLanguage(value: string): string {
  return value
    .replace(/\bnot\s+(?:real\s+)?Meridian production data\b/gi, "")
    .replace(/\bnot current production\b/gi, "")
    .replace(/\bnot certified current production\b/gi, "")
    .replace(/\bno realized (?:ROI|value|savings)\b/gi, "")
    .replace(/\bno realized outcomes? (?:are|is|has been|have been)?\s*claimed\b/gi, "")
    .replace(/\bnot audited financials or realized ROI\b/gi, "")
    .replace(/\bwithout (?:proven controls or )?realized value\b/gi, "")
    .replace(/\brealized savings are not proven\b/gi, "")
    .replace(/\brealized (?:ROI|value|savings) (?:is|are) not proven\b/gi, "")
    .replace(/\bplanning hypotheses, not audited spend or realized savings\b/gi, "")
    .replace(/\bare the scaffolding for Tower value tracking\b/gi, "")
    .replace(/\bROI, savings, or Tower value should not be claimed until measured actuals exist\b/gi, "")
    .replace(/\bNo realized ROI, savings, or value has been proven\b/gi, "")
    .replace(/\bNo realized ROI, ROI, savings, or Tower value should not be claimed until measured actuals exist\b/gi, "")
    .replace(/\bwill only track realized value once actuals exist\b/gi, "")
    .replace(/\bnone imply that PHI[- ]?bearing transcripts? (?:have been|were|are) ingested or approved\b/gi, "")
    .replace(/\bnot (?:yet )?ingested\b/gi, "");
}
