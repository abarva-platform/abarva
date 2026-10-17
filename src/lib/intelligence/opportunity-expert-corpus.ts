export type OpportunityExpertPackDomain =
  | "itsm-servicenow-process-intelligence"
  | "jira-delivery-intelligence"
  | "observability-app-operations"
  | "process-mining-reengineering"
  | "ai-automation-opportunity-archetypes"
  | "human-agent-operating-model"
  | "ai-governance-risk-control"
  | "ai-opportunity-architecture"
  | "value-rom-estimation"
  | "pilot-roadmap-90-day";

export type OpportunityArtifactType =
  | "p2-discovery"
  | "p3-options"
  | "p3-architecture"
  | "p4-roadmap"
  | "p4-business-case"
  | "p5-handoff"
  | "ava-answer"
  | "intelligence-answer";

export type OpportunitySourceSystem =
  | "servicenow"
  | "jira"
  | "logs"
  | "observability"
  | "cmdb"
  | "app_inventory"
  | "knowledge_base"
  | "process_observation"
  | "operational_event"
  | "rate_card"
  | "financials";

export interface OpportunityExpertPackRecord {
  expertPackId: string;
  domain: OpportunityExpertPackDomain;
  patternName: string;
  description: string;
  problemSignals: string[];
  diagnosticQuestions: string[];
  requiredEvidence: string[];
  sourceSystems: OpportunitySourceSystem[];
  metrics: string[];
  opportunityArchetypes: string[];
  valueLevers: string[];
  risks: string[];
  controls: string[];
  humanAgentGuidance: string[];
  architecturePattern: string;
  roadmapPattern: string;
  estimateModel: string;
  artifactGuidance: Partial<Record<OpportunityArtifactType, string[]>>;
  answerGuidance: string[];
  exampleOutputs: string[];
  confidenceRules: string[];
  caveats: string[];
}

export interface OpportunityExpertPackSelectionInput {
  moveArchetype?: string | null;
  tenantEvidenceAvailable?: string[];
  loadedSourceSystems?: OpportunitySourceSystem[];
  question?: string | null;
  artifactType?: OpportunityArtifactType | null;
  opportunityCategory?: string | null;
  businessDomain?: string | null;
  detectedPatterns?: string[];
}

export interface OpportunityExpertPackSelection {
  selectedPacks: OpportunityExpertPackRecord[];
  packIds: string[];
  reasons: Record<string, string[]>;
  evidenceBoundary: string;
}

export const AI_OPPORTUNITY_CORE_PACK_IDS = [
  "xp-corpus.ai-opportunity-archetypes",
  "xp-corpus.human-agent-operating-model",
  "xp-corpus.ai-governance-risk-control",
  "xp-corpus.ai-opportunity-architecture",
  "xp-corpus.value-rom-estimation",
  "xp-corpus.pilot-roadmap-90-day",
] as const;

const PACK = {
  itsm: "xp-corpus.itsm-servicenow-process-intelligence",
  jira: "xp-corpus.jira-delivery-intelligence",
  observability: "xp-corpus.observability-app-operations",
  process: "xp-corpus.process-mining-reengineering",
  archetypes: AI_OPPORTUNITY_CORE_PACK_IDS[0],
  humanAgent: AI_OPPORTUNITY_CORE_PACK_IDS[1],
  governance: AI_OPPORTUNITY_CORE_PACK_IDS[2],
  architecture: AI_OPPORTUNITY_CORE_PACK_IDS[3],
  value: AI_OPPORTUNITY_CORE_PACK_IDS[4],
  roadmap: AI_OPPORTUNITY_CORE_PACK_IDS[5],
} as const;

export const OPPORTUNITY_EXPERT_PACK_CORPUS: readonly OpportunityExpertPackRecord[] = [
  {
    expertPackId: PACK.itsm,
    domain: "itsm-servicenow-process-intelligence",
    patternName: "ITSM and ServiceNow Process Intelligence",
    description:
      "Interprets incidents, requests, changes, problems, SLA breaches, reassignments, reopens, knowledge usage, and support handoffs to identify practical service-management automation opportunities.",
    problemSignals: [
      "high reassignment count",
      "repeat reopen after resolution",
      "SLA breach before resolver assignment",
      "low KB attach or deflection rate",
      "same symptom across incidents",
      "L1 to L2 to L3 ping-pong",
      "change-related incident cluster",
      "major incident without problem follow-through",
    ],
    diagnosticQuestions: [
      "Which ticket categories drive the most handle time and reassignment?",
      "Where do tickets reopen after the first resolver response?",
      "Which services breach SLA before triage is complete?",
      "Which incidents recur without a linked problem record?",
      "Where is KB usage low despite repeated symptoms?",
      "Which assignment groups receive high-volume misrouted tickets?",
    ],
    requiredEvidence: [
      "ticket id, category, assignment group, timestamps, priority, status, SLA status",
      "reassignment and reopen history",
      "linked problem/change/CI references",
      "resolution notes and KB references",
      "service/application owner mapping",
    ],
    sourceSystems: ["servicenow", "cmdb", "knowledge_base"],
    metrics: [
      "ticket volume",
      "mean time to triage",
      "mean time to resolve",
      "reassignment count",
      "reopen rate",
      "SLA breach rate",
      "KB attach rate",
      "recurrence rate",
    ],
    opportunityArchetypes: [
      "Ticket Intake Agent",
      "Resolver Recommendation Agent",
      "Ticket Summarization Agent",
      "Duplicate Ticket Detection",
      "KB Recommendation Agent",
      "KB/Runbook Generation Agent",
      "Recurring Incident Pattern Agent",
      "SLA Risk Alert Agent",
    ],
    valueLevers: [
      "lower triage effort",
      "reduced reassignment waste",
      "faster mean time to resolve",
      "fewer SLA penalties",
      "higher knowledge reuse",
    ],
    risks: [
      "routing agent over-trust",
      "PII or sensitive ticket text leakage",
      "automation that hides major incidents",
      "KB generation from low-quality resolutions",
    ],
    controls: [
      "human approval for resolver reassignment",
      "confidence threshold by priority",
      "PII redaction before model input",
      "major incident escalation override",
      "audit log of agent recommendations",
    ],
    humanAgentGuidance: [
      "L1 agent drafts classification and summary; human submits on low confidence.",
      "Resolver recommendation is assist or recommend until accuracy is proven.",
      "KB generation requires service-owner review before publication.",
    ],
    architecturePattern:
      "ServiceNow export or API read -> operational evidence normalization -> ticket/process metrics -> opportunity scoring -> agent recommendation -> resolver review -> service-management action -> value measurement.",
    roadmapPattern:
      "0-30: load tickets and establish triage metrics; 31-60: pilot summarization and resolver recommendation; 61-90: expand to KB/runbook generation with controls.",
    estimateModel:
      "Estimate effort saved from ticket volume x avoidable minutes per ticket x loaded labor rate, adjusted by automation confidence and human review effort.",
    artifactGuidance: {
      "p2-discovery": ["show bottlenecks by category, group, SLA, reassignment, reopen"],
      "p3-options": ["rank ticket intake, resolver recommendation, KB recommendation, duplicate detection"],
      "p4-business-case": ["show effort saved, SLA risk reduced, review/control cost"],
    },
    answerGuidance: [
      "Separate ServiceNow evidence from ITIL/ITSM pattern interpretation.",
      "Name the specific ticket signal before recommending automation.",
      "Use specific gap language when assignment history, timestamps, or KB links are missing.",
    ],
    exampleOutputs: [
      "Top service desk automation candidates table",
      "Triage/reassignment bottleneck narrative",
      "Ticket intake pilot control card",
    ],
    confidenceRules: [
      "High when ticket timestamps, reassignment history, assignment group, category, and SLA status are present.",
      "Medium when only ticket summaries and categories are loaded.",
      "Low when ticket text exists without workflow history.",
    ],
    caveats: [
      "Expert pack patterns are not client evidence.",
      "Do not infer SLA or effort savings without ticket timestamps and rate-card assumptions.",
    ],
  },
  {
    expertPackId: PACK.jira,
    domain: "jira-delivery-intelligence",
    patternName: "Jira and Delivery Intelligence",
    description:
      "Interprets epics, stories, bugs, blockers, dependencies, releases, cycle time, story quality, duplicate demand, and backlog hygiene for delivery productivity opportunities.",
    problemSignals: [
      "stories with weak acceptance criteria",
      "high blocker age",
      "epic with repeated scope churn",
      "defect leakage after release",
      "duplicate demand across squads",
      "long cycle time after in-progress",
      "release readiness gaps",
    ],
    diagnosticQuestions: [
      "Which story types have poor acceptance criteria?",
      "Where do dependencies block cycle time?",
      "Which defects repeat across releases?",
      "Which epics show duplicate demand?",
      "Which releases lack readiness evidence?",
      "Where does status reporting consume manual effort?",
    ],
    requiredEvidence: [
      "epic/story/bug id, status, timestamps, assignee, squad, labels, blockers",
      "acceptance criteria and description quality",
      "linked defects and release/version references",
      "dependency links and parent-child hierarchy",
    ],
    sourceSystems: ["jira"],
    metrics: [
      "cycle time",
      "blocked days",
      "acceptance criteria completeness",
      "defect leakage",
      "duplicate issue cluster count",
      "release readiness score",
    ],
    opportunityArchetypes: [
      "Story Quality Agent",
      "Backlog Clustering Agent",
      "Dependency Detection Agent",
      "Release Readiness Agent",
      "Defect Pattern Agent",
      "Status Reporting Agent",
    ],
    valueLevers: [
      "reduced rework",
      "faster cycle time",
      "less PM/status-reporting effort",
      "lower release defect risk",
    ],
    risks: [
      "story-quality agent invents requirements",
      "delivery scoring becomes punitive",
      "backlog clustering hides product nuance",
    ],
    controls: [
      "PO approval before story edits",
      "team-level calibration of quality rules",
      "evidence trail for dependency inference",
    ],
    humanAgentGuidance: [
      "Agent drafts acceptance criteria; product owner approves.",
      "Agent clusters duplicate demand; squad confirms merge/disposition.",
      "Agent prepares release readiness brief; release manager decides.",
    ],
    architecturePattern:
      "Jira extract -> issue normalization -> dependency/story-quality scoring -> delivery pattern matching -> recommendation agent -> PO/squad review -> backlog action -> cycle-time/value measurement.",
    roadmapPattern:
      "0-30: load Jira and score story quality; 31-60: pilot backlog clustering and release readiness; 61-90: add dependency alerts and status automation.",
    estimateModel:
      "Estimate value from story count x avoidable rework minutes plus blocker-day reduction x squad cost rate, with delivery-lead validation.",
    artifactGuidance: {
      "p2-discovery": ["show blockers, story-quality gaps, duplicate demand clusters"],
      "p3-options": ["compare story quality, backlog clustering, dependency detection"],
      "p4-business-case": ["translate reduced rework and blocker days into ROM value"],
    },
    answerGuidance: [
      "Do not call a squad inefficient without evidence.",
      "Separate backlog hygiene facts from Agile best-practice interpretation.",
      "Cite issue fields, not raw Jira ids in executive prose.",
    ],
    exampleOutputs: ["Delivery intelligence opportunity map", "Release readiness scorecard"],
    confidenceRules: [
      "High when timestamps, issue hierarchy, blockers, and releases are loaded.",
      "Medium when issue summaries/status are loaded without link graph.",
      "Low when only narrative status is loaded.",
    ],
    caveats: [
      "Story quality is contextual; product-owner review remains required and expert guidance must not replace tenant delivery evidence.",
    ],
  },
  {
    expertPackId: PACK.observability,
    domain: "observability-app-operations",
    patternName: "Observability and Application Operations",
    description:
      "Connects alerts, logs, events, latency, errors, batch failures, change windows, and incidents to application-friction and prevention opportunities.",
    problemSignals: [
      "alert flood with low actionability",
      "recurring error signature",
      "incident after change deployment",
      "API failure cluster",
      "batch failure repeats",
      "latency degradation before ticket creation",
    ],
    diagnosticQuestions: [
      "Which alerts repeatedly create no action?",
      "Which error signatures correlate with incidents?",
      "Which changes precede production incidents?",
      "Which APIs drive most user-facing friction?",
      "Which jobs fail repeatedly without permanent fix?",
      "Where is observability disconnected from ticketing?",
    ],
    requiredEvidence: [
      "event/log/alert timestamp, service, severity, signature, trace id",
      "incident linkage",
      "change/deployment reference",
      "service ownership and criticality",
    ],
    sourceSystems: ["logs", "observability", "servicenow", "cmdb", "operational_event"],
    metrics: [
      "alert volume",
      "alert-actionability rate",
      "error recurrence",
      "incident correlation rate",
      "change-related incident rate",
      "latency percentile",
    ],
    opportunityArchetypes: [
      "Incident Prevention Agent",
      "Log-to-Ticket Correlation Agent",
      "Alert Noise Reduction Advisor",
      "Recurring Error Pattern Agent",
      "App Friction Advisor",
      "Change Impact Agent",
    ],
    valueLevers: ["reduced incident volume", "faster root cause", "lower alert fatigue", "better change safety"],
    risks: ["suppressing real alerts", "false root-cause inference", "missing service ownership context"],
    controls: [
      "never auto-close high-severity alerts",
      "source-link every root-cause suggestion",
      "change-correlation confidence threshold",
    ],
    humanAgentGuidance: [
      "Agent clusters signatures; SRE approves noise suppression.",
      "Agent drafts root-cause backlog; app owner prioritizes.",
    ],
    architecturePattern:
      "Observability/log exports -> event normalization -> incident/change/service correlation -> friction scoring -> SRE/app-owner review -> backlog/remediation -> reliability measurement.",
    roadmapPattern:
      "0-30: load alerts/incidents/service map; 31-60: pilot noise clustering and incident correlation; 61-90: introduce change-impact and prevention backlog.",
    estimateModel:
      "Estimate value from avoidable incidents, alert-review effort, and reduced MTTR, with reliability-owner validation.",
    artifactGuidance: {
      "p2-discovery": ["show recurring events, noisy alerts, incident correlations"],
      "p3-architecture": ["show source-to-ticket-to-service correlation architecture"],
    },
    answerGuidance: [
      "Never infer root cause from logs without correlation caveat.",
      "Distinguish prevention backlog from fully automated remediation.",
    ],
    exampleOutputs: ["Alert-noise opportunity table", "App friction heatmap"],
    confidenceRules: [
      "High when alerts, logs, incidents, changes, and service map are joined.",
      "Medium when events and incidents exist without service ownership.",
      "Low when only alert counts exist.",
    ],
    caveats: ["Observability evidence needs timestamp alignment before causal claims."],
  },
  {
    expertPackId: PACK.process,
    domain: "process-mining-reengineering",
    patternName: "Process Mining and Reengineering",
    description:
      "Builds current-state flow from operational evidence and finds bottlenecks, handoffs, queues, approvals, rework loops, and human-agent redesign candidates.",
    problemSignals: [
      "high wait time between steps",
      "excess approval hops",
      "manual status reporting",
      "rework loop",
      "handoff without owner",
      "exception queue growth",
    ],
    diagnosticQuestions: [
      "Where does work wait longest?",
      "Which handoffs create rework?",
      "Which approvals are rules-based?",
      "Which exceptions are repetitive?",
      "Where does status reporting duplicate system state?",
      "Which steps can shift from manual execution to agent assist?",
    ],
    requiredEvidence: [
      "process step timestamps",
      "work item owner and status",
      "handoff/approval events",
      "exception reason",
      "rework marker",
    ],
    sourceSystems: ["process_observation", "operational_event", "servicenow", "jira"],
    metrics: ["cycle time", "wait time", "handoff count", "rework rate", "approval time", "exception rate"],
    opportunityArchetypes: [
      "Intake Automation",
      "Approval Routing Agent",
      "Exception Summary Agent",
      "Process Bottleneck Advisor",
      "Manual Status Reporting Agent",
      "Workflow Redesign Candidate",
    ],
    valueLevers: ["cycle-time reduction", "less manual coordination", "fewer rework loops", "higher throughput"],
    risks: ["automating waste", "skipping needed control", "process map from incomplete events"],
    controls: ["process-owner signoff", "exception handling review", "approval threshold matrix"],
    humanAgentGuidance: [
      "Agent recommends flow redesign; process owner approves future-state.",
      "Agent summarizes exceptions; human resolves disputed cases.",
    ],
    architecturePattern:
      "Operational events -> process-step normalization -> flow and wait-time model -> bottleneck scoring -> redesign options -> human-agent workflow -> measurement.",
    roadmapPattern:
      "0-30: discover current-state flow; 31-60: test exception and status agents; 61-90: pilot redesigned workflow with control checkpoints.",
    estimateModel:
      "Estimate value from volume x wait/rework reduction x labor or revenue-delay rate, with process owner validation.",
    artifactGuidance: {
      "p2-discovery": ["show current-state process, bottlenecks, handoffs, rework"],
      "p3-options": ["compare automate, assist, recommend, and redesign options"],
      "p5-handoff": ["produce human-agent responsibility matrix"],
    },
    answerGuidance: [
      "Do not recommend automation before naming the process waste.",
      "Use process-mining caveats when event logs are incomplete.",
    ],
    exampleOutputs: ["Current-state process intelligence brief", "Human-agent workflow redesign card"],
    confidenceRules: [
      "High when event sequence, owners, and timestamps are loaded.",
      "Medium when observations identify handoffs but lack full event logs.",
      "Low when only interview notes exist.",
    ],
    caveats: [
      "Process redesign must not remove controls without explicit approval, and the pack must not substitute for tenant process evidence.",
    ],
  },
  {
    expertPackId: PACK.archetypes,
    domain: "ai-automation-opportunity-archetypes",
    patternName: "AI Automation Opportunity Archetype Library",
    description:
      "Defines reusable AI opportunity archetypes and the evidence, value, feasibility, risk, human-in-loop, guardrail, pilot, and roadmap patterns that make each credible.",
    problemSignals: [
      "manual classification",
      "manual summarization",
      "repeated recommendation judgment",
      "repetitive exception handling",
      "pattern detection by spreadsheet",
      "manual reporting assembly",
    ],
    diagnosticQuestions: [
      "Is the work classify, summarize, recommend, predict, generate, or execute workflow?",
      "What evidence proves volume and repeatability?",
      "What data is needed to avoid confident wrong answers?",
      "What human decision remains accountable?",
      "Which guardrails are mandatory before scaling?",
      "What pilot scope is narrow enough to validate value in 90 days?",
    ],
    requiredEvidence: [
      "volume baseline",
      "workflow states",
      "input/output examples",
      "quality outcome or error signal",
      "human owner and approval threshold",
    ],
    sourceSystems: ["servicenow", "jira", "logs", "observability", "process_observation", "knowledge_base"],
    metrics: [
      "volume",
      "handling time",
      "error rate",
      "rework rate",
      "approval rate",
      "confidence threshold",
      "pilot conversion",
    ],
    opportunityArchetypes: [
      "Classification/Routing",
      "Summarization",
      "Recommendation",
      "Knowledge Generation",
      "Pattern Detection",
      "Exception Handling",
      "Prediction/Risk Scoring",
      "Agentic Workflow",
      "Reporting Automation",
      "Policy/Procedure Assistant",
      "Process Mining",
      "Control Evidence Automation",
    ],
    valueLevers: ["effort saved", "cycle-time reduction", "quality improvement", "risk reduction", "better adoption"],
    risks: ["weak evidence baseline", "unclear accountability", "no measurable outcome", "pilot too broad"],
    controls: ["archetype-specific guardrails", "human approval threshold", "evidence sufficiency check"],
    humanAgentGuidance: [
      "Assist for low evidence, recommend when confidence can be measured, automate only with clear thresholds and audit trail.",
    ],
    architecturePattern:
      "Evidence signals -> archetype matching -> feasibility/risk/value scoring -> human-agent control design -> pilot definition -> measurement contract.",
    roadmapPattern:
      "0-30: archetype match and evidence sufficiency; 31-60: prototype one bounded workflow; 61-90: validate quality, control, value, and adoption.",
    estimateModel:
      "Use archetype-specific inputs: volume, baseline effort, quality delta, review effort, runtime cost, implementation complexity, and confidence.",
    artifactGuidance: {
      "p3-options": ["rank candidate archetypes by value, feasibility, risk, and evidence sufficiency"],
      "intelligence-answer": ["explain why the archetype fits or does not fit the loaded evidence"],
    },
    answerGuidance: [
      "Always name the archetype before recommending the opportunity.",
      "Label pattern-only interpretation separately from tenant facts.",
    ],
    exampleOutputs: ["Opportunity archetype scorecard", "Pilot candidate recommendation"],
    confidenceRules: [
      "High when source evidence proves volume, repeatability, outcome, and owner.",
      "Medium when volume and workflow exist but value or quality baseline is missing.",
      "Low when only anecdotal pain exists.",
    ],
    caveats: ["An archetype is not a recommendation unless tenant evidence supports it."],
  },
  {
    expertPackId: PACK.humanAgent,
    domain: "human-agent-operating-model",
    patternName: "Human-Agent Operating Model",
    description:
      "Defines safe assist, recommend, automate-with-approval, and automate patterns, including accountability, thresholds, audit trails, adoption, escalation, and role impact.",
    problemSignals: [
      "no accountable human owner",
      "agent action without approval threshold",
      "no audit trail",
      "unclear escalation path",
      "adoption resistance from role ambiguity",
    ],
    diagnosticQuestions: [
      "Who owns the final decision?",
      "What can the agent do without approval?",
      "What confidence threshold changes the mode?",
      "What evidence must be stored for audit?",
      "Who handles exceptions?",
      "Which roles change day to day?",
    ],
    requiredEvidence: ["role inventory", "decision rights", "approval thresholds", "exception rules", "audit/logging requirement"],
    sourceSystems: ["process_observation", "servicenow", "jira", "knowledge_base"],
    metrics: ["human review rate", "override rate", "exception rate", "adoption rate", "audit completion"],
    opportunityArchetypes: ["Assist", "Recommend", "Automate with approval", "Automate", "Escalate"],
    valueLevers: ["safe adoption", "reduced review burden", "faster decisions", "lower operating risk"],
    risks: ["accountability gap", "shadow automation", "user distrust", "control failure"],
    controls: ["approval thresholds", "audit log", "override reason capture", "exception escalation"],
    humanAgentGuidance: [
      "Default to assist when evidence is incomplete.",
      "Use recommend for judgment workflows with measurable quality.",
      "Use automate-with-approval before full automation for externally visible outcomes.",
    ],
    architecturePattern:
      "Agent recommendation -> human review/approval threshold -> action log -> exception path -> adoption and value telemetry.",
    roadmapPattern:
      "0-30: map roles and decision rights; 31-60: pilot assist/recommend; 61-90: introduce approval automation only where metrics prove quality.",
    estimateModel:
      "Subtract human review and governance effort from gross automation savings; include training/adoption time.",
    artifactGuidance: {
      "p3-options": ["show assist/recommend/automate choice by workflow"],
      "p5-handoff": ["produce human-agent responsibility matrix"],
    },
    answerGuidance: ["Never imply an agent owns accountability; name the human role."],
    exampleOutputs: ["Human-agent responsibility matrix", "Approval-threshold control model"],
    confidenceRules: [
      "High when role, decision, threshold, and audit evidence exist.",
      "Medium when roles exist but thresholds are missing.",
      "Low when workflow ownership is unclear.",
    ],
    caveats: [
      "Automation mode is a control decision, not just a technology decision; tenant role and approval evidence must drive the final boundary.",
    ],
  },
  {
    expertPackId: PACK.governance,
    domain: "ai-governance-risk-control",
    patternName: "AI Governance, Risk, and Control",
    description:
      "Defines privacy, access, audit, evaluation, human approval, confidence, exception routing, security review, model-risk, change, and control-evidence requirements.",
    problemSignals: [
      "sensitive data in prompt context",
      "no model/prompt eval",
      "no approval control",
      "missing exception routing",
      "agent change without change management",
      "no control evidence",
    ],
    diagnosticQuestions: [
      "What sensitive data can enter the model?",
      "How is output quality evaluated?",
      "What actions require approval?",
      "What exceptions route to humans?",
      "How are prompts/models changed safely?",
      "What audit evidence proves the control operated?",
    ],
    requiredEvidence: ["data classification", "access model", "approval rules", "evaluation set", "audit logging", "risk tier"],
    sourceSystems: ["knowledge_base", "servicenow", "process_observation"],
    metrics: ["eval pass rate", "approval rate", "override rate", "exception rate", "audit log completeness"],
    opportunityArchetypes: ["Control Evidence Automation", "Policy/Procedure Assistant", "Risk Scoring"],
    valueLevers: ["risk reduction", "faster approvals", "audit readiness", "trusted adoption"],
    risks: ["data leakage", "unsafe autonomous action", "unmeasured model drift", "policy mismatch"],
    controls: ["RBAC", "data redaction", "human approval", "eval gate", "audit trail", "change control"],
    humanAgentGuidance: ["Controls must match the action risk; advice-only agents still need source and eval evidence."],
    architecturePattern:
      "Policy/access context -> model/prompt eval -> risk-tier controls -> approval and audit -> exception routing -> control evidence store.",
    roadmapPattern:
      "0-30: risk tier and data access review; 31-60: eval and approval gates; 61-90: audit/control evidence automation.",
    estimateModel:
      "Governance effort is implementation cost: security review, eval set creation, control logging, exception handling, and owner time.",
    artifactGuidance: {
      "p3-options": ["show control posture by candidate opportunity"],
      "p4-roadmap": ["include governance/control setup in every 90-day pilot"],
    },
    answerGuidance: ["Call out missing controls as a gap, not a reason to invent safe deployment."],
    exampleOutputs: ["AI opportunity control checklist", "Risk-tiered pilot gate"],
    confidenceRules: [
      "High when data classification, approvals, eval, and audit controls are specified.",
      "Medium when policy exists but action-specific controls are missing.",
      "Low when governance is generic.",
    ],
    caveats: ["Governance guidance is pattern knowledge unless tenant controls are loaded."],
  },
  {
    expertPackId: PACK.architecture,
    domain: "ai-opportunity-architecture",
    patternName: "AI Opportunity and Operational Evidence Architecture",
    description:
      "Defines reusable architecture for source systems, secure ingestion/export, operational evidence normalization, Context Layer, semantic question layer, pattern detection, agents, review workflow, action, and value measurement.",
    problemSignals: [
      "raw exports without lineage",
      "no normalized operational evidence",
      "semantic layer disconnected from source systems",
      "agent prompts without source citations",
      "no value telemetry loop",
    ],
    diagnosticQuestions: [
      "Which source systems feed the evidence?",
      "How is source lineage preserved?",
      "Where are normalized entities/facts/relationships stored?",
      "How does semantic routing find relevant evidence?",
      "Which agent actions require human review?",
      "How does value measurement feed back?",
    ],
    requiredEvidence: ["source registry", "file/API lineage", "normalized evidence schema", "semantic dimensions", "agent logs", "value metric"],
    sourceSystems: ["servicenow", "jira", "logs", "observability", "cmdb", "app_inventory", "knowledge_base"],
    metrics: ["source coverage", "lineage completeness", "semantic match rate", "agent action audit rate", "value telemetry completeness"],
    opportunityArchetypes: ["Agentic Workflow", "Process Mining", "Control Evidence Automation"],
    valueLevers: ["trusted reuse", "less rework", "safe scaling", "better proof"],
    risks: ["dual write drift", "lost source lineage", "unbounded tool access", "unmeasured value"],
    controls: ["read-only ingestion", "source-row citations", "tenant fence", "agent action log", "approval workflow"],
    humanAgentGuidance: ["Architecture should preserve human review and audit before business action."],
    architecturePattern:
      "Source systems -> secure ingestion/export -> operational evidence normalization -> Context Layer -> semantic question layer -> pattern detection/opportunity scoring -> AI/agent layer -> human review/workflow -> business process/action -> value measurement.",
    roadmapPattern:
      "0-30: source and lineage foundation; 31-60: semantic/pattern detection and agent prototype; 61-90: human workflow, controls, and value telemetry.",
    estimateModel:
      "Architecture cost includes connector effort, normalization, semantic mapping, agent runtime, audit logging, and value telemetry.",
    artifactGuidance: {
      "p3-architecture": ["produce source-to-context-to-agent-to-action architecture"],
      "p4-roadmap": ["sequence ingestion, normalization, agent prototype, controls, value measurement"],
    },
    answerGuidance: ["Show the architecture chain; do not skip lineage or human review."],
    exampleOutputs: ["Operational evidence architecture diagram", "Secure ingestion pattern"],
    confidenceRules: [
      "High when sources, lineage, schema, semantic layer, agent workflow, and value loop are all specified.",
      "Medium when source and semantic layer exist but agent workflow is not specified.",
      "Low when architecture is only a conceptual diagram.",
    ],
    caveats: ["Architecture pack is reusable pattern knowledge, not proof that a tenant has implemented it."],
  },
  {
    expertPackId: PACK.value,
    domain: "value-rom-estimation",
    patternName: "Value and ROM Estimation",
    description:
      "Defines rate-card assumptions, effort models, cycle-time models, cost models, review/control/adoption effort, confidence, and finance validation caveats.",
    problemSignals: [
      "value estimate with no baseline volume",
      "savings before human review effort",
      "cycle-time claim without timestamp evidence",
      "no agent runtime cost",
      "finance validation missing",
    ],
    diagnosticQuestions: [
      "What volume and baseline effort are loaded?",
      "What rate card is approved?",
      "What human review effort remains?",
      "What implementation and run cost is included?",
      "What confidence band applies?",
      "What must finance validate before board use?",
    ],
    requiredEvidence: [
      "volume baseline",
      "time/effort baseline",
      "rate card",
      "review effort",
      "implementation cost",
      "run cost",
      "finance validation status",
    ],
    sourceSystems: ["rate_card", "financials", "servicenow", "jira", "process_observation"],
    metrics: ["gross effort saved", "net effort saved", "cycle-time reduction", "run cost", "implementation cost", "payback"],
    opportunityArchetypes: ["Reporting Automation", "Classification/Routing", "Summarization", "Recommendation"],
    valueLevers: ["labor productivity", "cycle-time compression", "error/rework reduction", "risk reduction"],
    risks: ["double counting", "unsupported rate card", "ignored adoption/control cost", "pattern-only benchmark used as client fact"],
    controls: ["finance validation", "assumption log", "confidence band", "sensitivity analysis"],
    humanAgentGuidance: ["Every value estimate should name the human work that remains and the review/control effort."],
    architecturePattern:
      "Evidence baseline -> rate-card/assumption registry -> gross value model -> control/adoption/runtime cost -> confidence band -> finance validation.",
    roadmapPattern:
      "0-30: baseline and rate-card validation; 31-60: pilot value tracking; 61-90: finance-reviewed scale case.",
    estimateModel:
      "Net value = avoidable volume x baseline effort x approved rate x adoption factor minus human review, run, governance, and implementation cost.",
    artifactGuidance: {
      "p4-business-case": ["show assumptions, gross value, net value, cost, confidence, finance caveats"],
      "intelligence-answer": ["label planning range versus tenant-validated value"],
    },
    answerGuidance: [
      "Never present ROM as client-approved value unless finance validation is loaded.",
      "State missing baseline or rate-card data as a specific gap.",
    ],
    exampleOutputs: ["ROM value model", "Finance validation caveat table"],
    confidenceRules: [
      "High when volume, effort, rate card, adoption, run cost, and finance validation exist.",
      "Medium when volume and effort exist but finance validation is pending.",
      "Low when value uses only benchmark ranges.",
    ],
    caveats: ["ROM estimates are planning evidence until finance validates assumptions."],
  },
  {
    expertPackId: PACK.roadmap,
    domain: "pilot-roadmap-90-day",
    patternName: "90-Day Pilot Roadmap",
    description:
      "Defines a practical 0-30, 31-60, 61-90 pilot roadmap for evidence loading, discovery, ranking, human-agent design, prototype, validation, governance, value measurement, and scale decision.",
    problemSignals: [
      "pilot starts before data access",
      "no opportunity ranking",
      "human-agent controls delayed",
      "no value measurement",
      "scale decision criteria missing",
    ],
    diagnosticQuestions: [
      "What data must be loaded in the first 30 days?",
      "Which process is narrow enough for pilot?",
      "What is the first value gate?",
      "Which controls must exist before users touch it?",
      "What evidence decides scale/no-scale?",
      "Who owns adoption and change?",
    ],
    requiredEvidence: ["source access plan", "pilot workflow", "baseline metric", "control requirements", "pilot owner", "scale decision criteria"],
    sourceSystems: ["servicenow", "jira", "logs", "observability", "process_observation", "rate_card"],
    metrics: ["pilot readiness", "baseline metric", "quality metric", "adoption metric", "value gate", "scale decision"],
    opportunityArchetypes: ["Classification/Routing", "Summarization", "Recommendation", "Exception Handling", "Agentic Workflow"],
    valueLevers: ["fast proof", "lower pilot risk", "clear scale decision", "adoption credibility"],
    risks: ["pilot too broad", "controls late", "no owner", "no baseline"],
    controls: ["stage gate", "human review", "eval set", "audit trail", "scale/no-scale criteria"],
    humanAgentGuidance: ["Pilot roadmap must introduce users only after baseline, control, and review paths are ready."],
    architecturePattern:
      "Pilot evidence load -> opportunity score -> human-agent prototype -> controlled user validation -> value telemetry -> scale/no-scale decision.",
    roadmapPattern:
      "0-30: access, evidence, baseline, process discovery; 31-60: prototype and human-agent design; 61-90: validation, controls, value measurement, and scale decision.",
    estimateModel:
      "Pilot cost includes data access, prototype, eval, controls, user validation, change/adoption, and measurement effort.",
    artifactGuidance: {
      "p4-roadmap": ["build 0-30, 31-60, 61-90 plan with gates and owners"],
      "p5-handoff": ["create execution packet and measurement contract"],
    },
    answerGuidance: ["Every roadmap must include data access, controls, value gate, and scale decision."],
    exampleOutputs: ["90-day pilot roadmap", "Scale/no-scale decision checklist"],
    confidenceRules: [
      "High when pilot workflow, baseline, owner, controls, and scale criteria are loaded.",
      "Medium when workflow and owner exist but baseline/control details are incomplete.",
      "Low when only a theme exists.",
    ],
    caveats: [
      "A 90-day pilot roadmap is not a production rollout plan; tenant baseline evidence and owner validation are still required.",
    ],
  },
] as const;

const PACK_BY_ID = new Map(OPPORTUNITY_EXPERT_PACK_CORPUS.map((pack) => [pack.expertPackId, pack]));

export function getOpportunityExpertPackById(
  expertPackId: string,
): OpportunityExpertPackRecord | undefined {
  return PACK_BY_ID.get(expertPackId);
}

export function validateOpportunityExpertPackCorpus(
  corpus: readonly OpportunityExpertPackRecord[] = OPPORTUNITY_EXPERT_PACK_CORPUS,
): string[] {
  const blockers: string[] = [];
  const ids = new Set<string>();
  const domains = new Set<OpportunityExpertPackDomain>();
  for (const pack of corpus) {
    if (ids.has(pack.expertPackId)) blockers.push(`Duplicate expert_pack_id: ${pack.expertPackId}`);
    ids.add(pack.expertPackId);
    domains.add(pack.domain);
    for (const [field, value] of Object.entries(pack)) {
      if (Array.isArray(value) && value.length === 0) {
        blockers.push(`${pack.expertPackId} has empty required array ${field}`);
      }
      if (typeof value === "string" && value.trim().length === 0) {
        blockers.push(`${pack.expertPackId} has empty required field ${field}`);
      }
    }
  }
  for (const domain of REQUIRED_OPPORTUNITY_EXPERT_PACK_DOMAINS) {
    if (!domains.has(domain)) blockers.push(`Missing required domain: ${domain}`);
  }
  return blockers;
}

export const REQUIRED_OPPORTUNITY_EXPERT_PACK_DOMAINS: readonly OpportunityExpertPackDomain[] = [
  "itsm-servicenow-process-intelligence",
  "jira-delivery-intelligence",
  "observability-app-operations",
  "process-mining-reengineering",
  "ai-automation-opportunity-archetypes",
  "human-agent-operating-model",
  "ai-governance-risk-control",
  "ai-opportunity-architecture",
  "value-rom-estimation",
  "pilot-roadmap-90-day",
];

export function selectOpportunityExpertPacks(
  input: OpportunityExpertPackSelectionInput,
): OpportunityExpertPackSelection {
  const reasons = new Map<string, Set<string>>();
  const add = (packId: string, reason: string) => {
    if (!PACK_BY_ID.has(packId)) return;
    const existing = reasons.get(packId) ?? new Set<string>();
    existing.add(reason);
    reasons.set(packId, existing);
  };

  const sourceSystems = new Set(input.loadedSourceSystems ?? []);
  const evidence = new Set(
    (input.tenantEvidenceAvailable ?? []).map((item) => item.toLowerCase()),
  );
  const normalizedQuestion = (input.question ?? "").toLowerCase();
  const moveArchetype = (input.moveArchetype ?? "").toLowerCase();
  const artifactType = input.artifactType ?? null;
  const opportunityCategory = (input.opportunityCategory ?? "").toLowerCase();
  const detectedPatterns = new Set((input.detectedPatterns ?? []).map((item) => item.toLowerCase()));

  if (/ai opportunity|process intelligence|automation discovery/.test(moveArchetype)) {
    for (const packId of AI_OPPORTUNITY_CORE_PACK_IDS) {
      add(packId, "AI Opportunity Discovery core pack");
    }
  }

  if (sourceSystems.has("servicenow") || evidence.has("tickets") || /ticket|incident|itsm|servicenow/.test(normalizedQuestion)) {
    add(PACK.itsm, "ServiceNow or ticket evidence");
  }
  if (sourceSystems.has("jira") || /jira|story|epic|bug|release|backlog|squad/.test(normalizedQuestion)) {
    add(PACK.jira, "Jira or delivery evidence");
  }
  if (
    sourceSystems.has("logs") ||
    sourceSystems.has("observability") ||
    /log|alert|observability|latency|error|sre|root cause|root-cause/.test(normalizedQuestion)
  ) {
    add(PACK.observability, "Logs or observability evidence");
  }
  if (
    sourceSystems.has("process_observation") ||
    sourceSystems.has("operational_event") ||
    /process|handoff|queue|bottleneck|rework|approval/.test(normalizedQuestion)
  ) {
    add(PACK.process, "Process observations or bottleneck language");
  }

  if (artifactType === "p3-architecture") add(PACK.architecture, "P3 Architecture artifact");
  if (artifactType === "p4-business-case") add(PACK.value, "P4 Business Case artifact");
  if (artifactType === "p4-roadmap") add(PACK.roadmap, "P4 Roadmap artifact");
  if (artifactType === "p5-handoff") {
    add(PACK.humanAgent, "P5 Handoff responsibility model");
    add(PACK.governance, "P5 Handoff controls model");
  }

  if (/automate first|what should we automate|automation opportunit|first pilot/.test(normalizedQuestion)) {
    add(PACK.archetypes, "automation-opportunity question");
    add(PACK.value, "automation-opportunity value model");
    add(PACK.governance, "automation-opportunity control model");
  }
  if (/architecture|context layer|semantic layer|agent orchestration/.test(normalizedQuestion)) {
    add(PACK.architecture, "architecture question");
  }
  if (/business case|rom|roi|value|savings|cost/.test(normalizedQuestion) || opportunityCategory.includes("value")) {
    add(PACK.value, "value or ROM question");
  }
  if (/roadmap|90 day|90-day|pilot plan|scale decision/.test(normalizedQuestion)) {
    add(PACK.roadmap, "roadmap question");
  }
  if (/human|agent|approval|hitl|responsibilit|workflow/.test(normalizedQuestion)) {
    add(PACK.humanAgent, "human-agent operating model question");
  }
  if (/governance|risk|control|privacy|audit|security/.test(normalizedQuestion)) {
    add(PACK.governance, "governance or control question");
  }

  if (detectedPatterns.has("service-desk-bottleneck")) add(PACK.itsm, "detected service desk bottleneck");
  if (detectedPatterns.has("delivery-bottleneck")) add(PACK.jira, "detected delivery bottleneck");
  if (detectedPatterns.has("alert-noise")) add(PACK.observability, "detected alert noise");
  if (detectedPatterns.has("process-handoff")) add(PACK.process, "detected process handoff");

  const selectedPacks = [...reasons.keys()]
    .map((packId) => PACK_BY_ID.get(packId))
    .filter((pack): pack is OpportunityExpertPackRecord => Boolean(pack));

  return {
    selectedPacks,
    packIds: selectedPacks.map((pack) => pack.expertPackId),
    reasons: Object.fromEntries(
      [...reasons.entries()].map(([packId, reasonSet]) => [packId, [...reasonSet]]),
    ),
    evidenceBoundary:
      "Expert packs are AbarVa knowledge assets. They interpret tenant evidence but are never client evidence; unsupported tenant claims require caveats or gaps.",
  };
}

export function buildOpportunityExpertContext(selection: OpportunityExpertPackSelection): string {
  const lines = [
    "EXPERT PACK CORPUS CONTEXT",
    selection.evidenceBoundary,
    ...selection.selectedPacks.flatMap((pack) => [
      `Pack: ${pack.patternName} (${pack.expertPackId})`,
      `Use for: ${pack.description}`,
      `Signals: ${pack.problemSignals.slice(0, 5).join("; ")}`,
      `Required evidence: ${pack.requiredEvidence.slice(0, 5).join("; ")}`,
      `Opportunity archetypes: ${pack.opportunityArchetypes.slice(0, 6).join("; ")}`,
      `Controls: ${pack.controls.slice(0, 5).join("; ")}`,
      `Answer guidance: ${pack.answerGuidance.join(" ")}`,
      `Caveats: ${pack.caveats.join(" ")}`,
    ]),
  ];
  return lines.join("\n");
}
