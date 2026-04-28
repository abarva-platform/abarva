// ADM2 · Steward Setup / Admin control-plane read model.
//
// Pure deterministic seed-driven view-model that the Steward setup
// home / control center renders. Implements ADM1 contract sections H
// (12 canonical Enterprise Dataset Domains), J (loaded → usable
// evidence states), O (Agent Readiness Matrix), and P (deterministic
// Steward Brief).
//
// No live Steward runtime, no Claude / OpenAI / Pinecone invocation,
// no Date.now() reads, no random IDs, no Supabase reads, no auth /
// migrations. Same call → identical view object every time.
//
// This module does NOT import:
//   - src/lib/source/**, src/app/(maestro)/source/**
//   - src/lib/nexus/**, src/lib/sentinel/**, src/lib/atlas/**
//   - src/lib/agent/**, src/components/agent/**
//   - src/app/programs/**, src/app/(maestro)/preview/**, src/app/demo/**
//   - src/lib/programs/mock.ts
//   - src/lib/auth/**
//   - supabase/**

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

export type EvidenceReadinessState =
  | 'loaded'
  | 'parsed'
  | 'indexed'
  | 'classified'
  | 'scoped'
  | 'cited'
  | 'quality_checked'
  | 'usable_as_evidence'
  | 'blocked';

export type DatasetDomainStatus =
  | 'not_started'
  | 'partial'
  | 'ready'
  | 'blocked';

export type AgentName = 'nexus' | 'sentinel' | 'atlas' | 'steward';
export type AgentReadinessStatus = 'ready' | 'partial' | 'blocked';

export type AdminSurfaceName =
  | 'programs'
  | 'tower'
  | 'intelligence'
  | 'source'
  | 'admin';

export type SetupHealth = 'ready' | 'partial' | 'blocked';

export type AdminModuleStatus =
  | 'live'
  | 'partial'
  | 'planned'
  | 'deferred';

export type StewardBriefSourceLabel =
  | 'deterministic_seed'
  | 'setup_state_read_model';

export interface EvidenceReadinessAggregate {
  byState: Record<EvidenceReadinessState, number>;
  totalLoaded: number;
  totalAvailable: number;
  totalUsable: number;
}

export interface DatasetDomainReadiness {
  key: string;
  name: string;
  ordinal: number;
  status: DatasetDomainStatus;
  loadedCount: number;
  availableCount: number;
  usableEvidenceCount: number;
  exampleDatasets: ReadonlyArray<string>;
  missingInputs: ReadonlyArray<string>;
  agentsUsingIt: ReadonlyArray<AgentName>;
  surfacesUsingIt: ReadonlyArray<AdminSurfaceName>;
  stewardGuidance: string;
}

export interface AgentReadiness {
  agent: AgentName;
  status: AgentReadinessStatus;
  canUse: ReadonlyArray<string>;
  missingContext: ReadonlyArray<string>;
  safeToAnswer: ReadonlyArray<string>;
  mustDefer: ReadonlyArray<string>;
  nextAdminAction: string;
}

export interface AdminModuleReadiness {
  key: string;
  name: string;
  status: AdminModuleStatus;
  routeHref: string;
  description: string;
}

export interface AdminRecommendedAction {
  id: string;
  label: string;
  reason: string;
  routeHref: string;
}

export interface StewardBriefFollowUp {
  id: string;
  label: string;
  reason: string;
  /** Disabled today; live Steward runtime is deferred. */
  enabled: false;
}

export interface StewardBriefAgentReadinessLine {
  agent: AgentName;
  status: AgentReadinessStatus;
  sentence: string;
}

export interface StewardBrief {
  title: string;
  tenantSetupHealth: {
    label: SetupHealth;
    rationale: string;
  };
  topAdminGaps: ReadonlyArray<{
    id: string;
    label: string;
    routeHref: string;
  }>;
  dataEvidenceReadiness: string;
  userSecurityRisk: string;
  connectorRisk: string;
  agentReadiness: ReadonlyArray<StewardBriefAgentReadinessLine>;
  recommendedNextAction: AdminRecommendedAction;
  suggestedFollowUps: ReadonlyArray<StewardBriefFollowUp>;
  sourceLabel: StewardBriefSourceLabel;
  interpretationBasis: string;
}

export interface StewardSetupReadinessView {
  generatedFrom: 'deterministic_seed';
  setupHealth: SetupHealth;
  setupHealthRationale: string;
  workspaceLabel: string;
  brief: StewardBrief;
  domains: ReadonlyArray<DatasetDomainReadiness>;
  evidenceAggregate: EvidenceReadinessAggregate;
  agents: ReadonlyArray<AgentReadiness>;
  modules: ReadonlyArray<AdminModuleReadiness>;
  recommendedActions: ReadonlyArray<AdminRecommendedAction>;
}

// ---------------------------------------------------------------------
// Static seed data
// ---------------------------------------------------------------------

const DOMAINS: ReadonlyArray<DatasetDomainReadiness> = [
  {
    key: 'enterprise_strategy_c_suite',
    ordinal: 1,
    name: 'Enterprise Strategy & C-Suite Priorities',
    status: 'partial',
    loadedCount: 5,
    availableCount: 3,
    usableEvidenceCount: 1,
    exampleDatasets: [
      'Mission / vision / OKRs',
      'Annual + quarterly reports',
      'CEO and CXO priorities',
      'Functional strategies (Finance, IT, Operations)',
    ],
    missingInputs: [
      'No CXO interview captured for Apex Retail.',
      'Functional strategy attached only for IT.',
    ],
    agentsUsingIt: ['atlas', 'nexus', 'sentinel', 'steward'],
    surfacesUsingIt: ['programs', 'tower', 'intelligence', 'admin'],
    stewardGuidance:
      'Capture 3 C-suite priorities and one CXO interview before promoting any G1 charter.',
  },
  {
    key: 'business_kpi_functional_performance',
    ordinal: 2,
    name: 'Business KPI / Functional Performance',
    status: 'partial',
    loadedCount: 4,
    availableCount: 2,
    usableEvidenceCount: 0,
    exampleDatasets: [
      'Enterprise scorecard',
      'Functional KPIs (DSO, NPS, ARR, cycle time)',
      'Baselines + targets',
      'Trend history',
    ],
    missingInputs: [
      'No baseline + target captured per active program.',
      'Trend history not yet attached.',
    ],
    agentsUsingIt: ['nexus', 'atlas', 'sentinel', 'steward'],
    surfacesUsingIt: ['programs', 'tower', 'intelligence', 'admin'],
    stewardGuidance:
      'Attach a baseline KPI + target on every active program before publishing dollar claims.',
  },
  {
    key: 'enterprise_architecture_tech_stack',
    ordinal: 3,
    name: 'Enterprise Architecture & Tech Stack',
    status: 'partial',
    loadedCount: 12,
    availableCount: 8,
    usableEvidenceCount: 4,
    exampleDatasets: [
      'Current-state architecture diagrams',
      'Tech stack inventory',
      'Reference architectures',
      'Future-state target',
      'Technology standards',
    ],
    missingInputs: [
      'Integration architecture diagram missing.',
      'Future-state target not yet captured for two divisions.',
    ],
    agentsUsingIt: ['nexus', 'sentinel', 'steward'],
    surfacesUsingIt: ['programs', 'tower', 'source', 'admin'],
    stewardGuidance:
      'Capture the current-state architecture and the top 25 production applications before enabling AI use case shortlisting.',
  },
  {
    key: 'application_portfolio',
    ordinal: 4,
    name: 'Application Portfolio',
    status: 'partial',
    loadedCount: 28,
    availableCount: 22,
    usableEvidenceCount: 14,
    exampleDatasets: [
      'App catalog (ERP, CRM, ServiceNow, Workday, Epic, Salesforce)',
      'Business owner per app',
      'Criticality + lifecycle stage',
      'AI-readiness flag',
    ],
    missingInputs: [
      'Business owners missing on 8 critical apps.',
      'AI-readiness flag blank on 14 apps.',
    ],
    agentsUsingIt: ['nexus', 'sentinel', 'steward'],
    surfacesUsingIt: ['programs', 'tower', 'intelligence', 'admin'],
    stewardGuidance:
      'Assign business owners on the top 10 critical apps before scoping any AI initiative.',
  },
  {
    key: 'infrastructure_cloud_data_center',
    ordinal: 5,
    name: 'Infrastructure / Cloud / Data Center',
    status: 'not_started',
    loadedCount: 0,
    availableCount: 0,
    usableEvidenceCount: 0,
    exampleDatasets: [
      'Data center footprint',
      'Cloud account inventory (AWS / Azure / GCP)',
      'Region distribution',
      'Cost-by-account',
      'Network architecture',
    ],
    missingInputs: [
      'No consolidated cloud account inventory captured.',
      'No data center footprint captured.',
    ],
    agentsUsingIt: ['nexus', 'sentinel', 'steward'],
    surfacesUsingIt: ['programs', 'tower', 'admin'],
    stewardGuidance:
      'Attach the consolidated cloud account inventory before claiming AI cost reduction value.',
  },
  {
    key: 'vendor_contract_spend',
    ordinal: 6,
    name: 'Vendor / Contract / Spend',
    status: 'not_started',
    loadedCount: 0,
    availableCount: 0,
    usableEvidenceCount: 0,
    exampleDatasets: [
      'Vendor list by category',
      'Contracts + license counts',
      'Renewal dates',
      'IT run / change spend',
      'CapEx / OpEx split',
    ],
    missingInputs: [
      'No consolidated spend snapshot captured.',
      'No renewal calendar captured.',
    ],
    agentsUsingIt: ['nexus', 'atlas', 'sentinel', 'steward'],
    surfacesUsingIt: ['programs', 'tower', 'admin'],
    stewardGuidance:
      'Capture the top-25 vendors by spend before enabling vendor-rationalization programs.',
  },
  {
    key: 'ai_portfolio_use_case_inventory',
    ordinal: 7,
    name: 'AI Portfolio / Use Case Inventory',
    status: 'partial',
    loadedCount: 15,
    availableCount: 12,
    usableEvidenceCount: 6,
    exampleDatasets: [
      'AI use case inventory (proposed → in-flight → retired)',
      'Sponsor + canonical pattern key',
      'Phase + gate state',
      'Expected value + value chain',
    ],
    missingInputs: [
      'Sponsor missing on 3 in-flight use cases.',
      'Pattern key not classified on 4 cases.',
    ],
    agentsUsingIt: ['nexus', 'sentinel', 'atlas', 'steward'],
    surfacesUsingIt: ['programs', 'tower', 'intelligence', 'admin'],
    stewardGuidance:
      'Assign sponsor + canonical pattern key on every active use case before publishing the portfolio brief.',
  },
  {
    key: 'ai_tool_adoption_usage_cost',
    ordinal: 8,
    name: 'AI Tool Adoption / Usage / Cost',
    status: 'not_started',
    loadedCount: 0,
    availableCount: 0,
    usableEvidenceCount: 0,
    exampleDatasets: [
      'Copilot / Claude Code / Codex / Cursor seat counts',
      'ServiceNow / Workday / ERP agent enrollment',
      'Active users + usage hours + tokens',
      'Per-tool cost vs. baseline',
    ],
    missingInputs: [
      'No usage telemetry attached for any AI tool.',
      'No cost-per-active-user metric captured.',
    ],
    agentsUsingIt: ['nexus', 'atlas', 'sentinel', 'steward'],
    surfacesUsingIt: ['programs', 'tower', 'admin'],
    stewardGuidance:
      'Attach 30 days of Copilot usage telemetry before claiming a productivity-uplift value.',
  },
  {
    key: 'it_operating_model_dora',
    ordinal: 9,
    name: 'IT Operating Model / Productivity / DORA',
    status: 'not_started',
    loadedCount: 0,
    availableCount: 0,
    usableEvidenceCount: 0,
    exampleDatasets: [
      'DORA metrics (deploy frequency, lead time, MTTR, change-failure rate)',
      'Release velocity',
      'Defect rate',
      'Engineering productivity impact',
    ],
    missingInputs: [
      'No DORA capture for any team.',
      'Productivity claims un-baselined across the portfolio.',
    ],
    agentsUsingIt: ['nexus', 'sentinel', 'atlas', 'steward'],
    surfacesUsingIt: ['programs', 'tower', 'intelligence', 'admin'],
    stewardGuidance:
      'Capture a DORA baseline for at least one team before enabling productivity claims at G3.',
  },
  {
    key: 'risk_compliance_governance',
    ordinal: 10,
    name: 'Risk / Compliance / Governance',
    status: 'partial',
    loadedCount: 4,
    availableCount: 2,
    usableEvidenceCount: 1,
    exampleDatasets: [
      'AI risk register',
      'Responsible-AI reviews',
      'Regulatory alignment (EU AI Act, NIST AI RMF, ISO 42001)',
      'Audit findings',
    ],
    missingInputs: [
      'Responsible-AI review missing on 5 active high-risk programs.',
      'Risk register lacks named owners on 3 entries.',
    ],
    agentsUsingIt: ['steward', 'sentinel', 'atlas'],
    surfacesUsingIt: ['programs', 'tower', 'admin'],
    stewardGuidance:
      'Run a responsible-AI review on every active high-risk program before approving G3.',
  },
  {
    key: 'evidence_reports_artifacts',
    ordinal: 11,
    name: 'Evidence / Reports / Artifacts',
    status: 'partial',
    loadedCount: 24,
    availableCount: 18,
    usableEvidenceCount: 9,
    exampleDatasets: [
      'Deliverables (charters, designs, evaluations, decks, postmortems)',
      'Artifact registry',
      'Evidence references (E-ids)',
      'Citation chain',
    ],
    missingInputs: [
      '7 required deliverables still at Stub tier.',
      'E-ids missing on 11 deliverables.',
    ],
    agentsUsingIt: ['nexus', 'atlas', 'sentinel', 'steward'],
    surfacesUsingIt: ['programs', 'tower', 'intelligence', 'source', 'admin'],
    stewardGuidance:
      'Promote required-but-stub deliverables to Outline tier and attach an E-id before claiming gate readiness.',
  },
  {
    key: 'org_structure_users_ownership',
    ordinal: 12,
    name: 'Org Structure / Users / Ownership',
    status: 'partial',
    loadedCount: 8,
    availableCount: 6,
    usableEvidenceCount: 3,
    exampleDatasets: [
      'Org chart + named domain owners',
      'Data owners',
      'Pattern owners + deliverable owners',
      'On-call rotation',
    ],
    missingInputs: [
      '5 datasets are orphaned (no data owner).',
      '2 pending invites have not resolved in 14 days.',
    ],
    agentsUsingIt: ['steward', 'sentinel'],
    surfacesUsingIt: ['admin'],
    stewardGuidance:
      'Assign a data owner on every orphan dataset before marking it usable as evidence.',
  },
];

const EVIDENCE_AGGREGATE: EvidenceReadinessAggregate = {
  byState: {
    loaded: 100,
    parsed: 82,
    indexed: 73,
    classified: 61,
    scoped: 51,
    cited: 43,
    quality_checked: 38,
    usable_as_evidence: 38,
    blocked: 4,
  },
  totalLoaded: 100,
  totalAvailable: 73,
  totalUsable: 38,
};

const AGENT_READINESS: ReadonlyArray<AgentReadiness> = [
  {
    agent: 'nexus',
    status: 'partial',
    canUse: [
      'Indexed and classified artifacts in scoped tenants',
      'Context Bundle composition for active programs',
      'Deliverable citations once an E-id is attached',
    ],
    missingContext: [
      'Per-program value-ledger capture',
      'Cited E-ids on 11 deliverables',
      'AI tool adoption telemetry',
    ],
    safeToAnswer: [
      'Structured retrieval at usable_with_gaps',
      'Pattern-only summaries that name the gap',
    ],
    mustDefer: [
      'Substantive answers when bundle is insufficient or pattern_only',
      'Dollar claims that lack a captured baseline',
    ],
    nextAdminAction:
      'Promote 3 cited deliverables on Apex Retail from cited to quality_checked.',
  },
  {
    agent: 'sentinel',
    status: 'ready',
    canUse: [
      'Seeded Programs pressure signals (S9e)',
      'Pattern detections (I1)',
      'Evidence-trail composition (I3)',
    ],
    missingContext: [
      'Recurrence history persistence',
      'Live subscription to signal-summary deltas',
    ],
    safeToAnswer: [
      'Pattern detection across the 5 canonical pattern keys',
      'Per-pattern evidence trail traceability',
    ],
    mustDefer: [
      'Recurrence claims across steering touchpoints',
      'Live editorial for the meta operating-model pattern',
    ],
    nextAdminAction:
      'Wait — Sentinel persistence is deferred to a future slice; surface state is honest today.',
  },
  {
    agent: 'atlas',
    status: 'partial',
    canUse: [
      'Seeded signal summary (S9g brief)',
      'Deterministic pattern detection summary (I1/I2)',
    ],
    missingContext: [
      'Captured baseline KPI per active program',
      'Realized-value entries against baselines',
      'Live retrieval into the evidence registry',
    ],
    safeToAnswer: [
      'Executive brief at medium confidence',
      'Portfolio editorial naming the top pressure',
    ],
    mustDefer: [
      'Dollar claims at G3 / G4',
      'Gate-defense editorial',
      'High-confidence claims from seed alone',
    ],
    nextAdminAction:
      'Attach a baseline KPI on the 3 Apex Retail programs missing value capture.',
  },
  {
    agent: 'steward',
    status: 'partial',
    canUse: [
      'Setup-state read model (this slice)',
      'Agent readiness matrix',
      'Tenant-isolation guard verdict (S7 probes)',
    ],
    missingContext: [
      'Live Steward runtime',
      'Persisted operator decisions',
      'Live audit row inspector',
    ],
    safeToAnswer: [
      'Setup guidance and recommended next action',
      'Gate readiness commentary',
      'Audit readout for the row count',
    ],
    mustDefer: [
      'Promises about future runtime behavior',
      'Live tenant-state sync claims',
    ],
    nextAdminAction:
      'Assign data owners on Application Portfolio and Architecture domains.',
  },
];

const ADMIN_MODULES: ReadonlyArray<AdminModuleReadiness> = [
  {
    key: 'setup_home',
    name: 'Setup Home / Control Center',
    status: 'live',
    routeHref: '/platform/admin',
    description:
      'Steward-led tenant setup landing. Brief above tables, readiness cards, recommended actions.',
  },
  {
    key: 'data_explorer',
    name: 'Data Explorer',
    status: 'planned',
    routeHref: '/platform/admin/data',
    description:
      'Drillable dataset list with loaded / available / usable evidence state per row. Implementation lands in ADM4.',
  },
  {
    key: 'users_access',
    name: 'Users & Access',
    status: 'partial',
    routeHref: '/admin/users',
    description:
      'User roster, role policy, tenant scope. Surface evolves to ADM5 contract.',
  },
  {
    key: 'security_governance',
    name: 'Security & Governance',
    status: 'partial',
    routeHref: '/platform/admin/data-governance',
    description:
      'Tenant isolation, role policy, upload + model-call policy, audit policy. Evolves to ADM6 contract.',
  },
  {
    key: 'connectors',
    name: 'Connectors',
    status: 'partial',
    routeHref: '/platform/admin/connectors',
    description:
      'Connector list and sync health. Live sync jobs are deferred; today the surface is read-only seed.',
  },
  {
    key: 'audit_activity',
    name: 'Audit & Activity',
    status: 'partial',
    routeHref: '/admin/audit',
    description:
      'Activity log + cross-ledger trace. Drilldown evolves with ADM9.',
  },
  {
    key: 'evidence_readiness',
    name: 'Evidence Readiness',
    status: 'planned',
    routeHref: '/platform/admin/quality',
    description:
      'Per-program evidence usability state. ADM9 wires the deterministic drilldown.',
  },
  {
    key: 'agent_readiness_matrix',
    name: 'Agent Readiness Matrix',
    status: 'live',
    routeHref: '/platform/admin',
    description:
      'Per-agent readiness (Nexus, Sentinel, Atlas, Steward) with safe-to-answer and must-defer lists.',
  },
  {
    key: 'pattern_content_governance',
    name: 'Pattern / Content Governance',
    status: 'planned',
    routeHref: '/platform/admin/data-governance',
    description:
      'Authored pattern lifecycle (live / draft / retired) and refresh cadence. Implementation deferred.',
  },
  {
    key: 'build_progress',
    name: 'Build Progress / Founder Control Tower',
    status: 'live',
    routeHref: '/platform/admin/build-progress',
    description:
      'Founder-facing slice + cycle + gate state. Already live; this slice does not modify it.',
  },
];

const RECOMMENDED_ACTIONS: ReadonlyArray<AdminRecommendedAction> = [
  {
    id: 'capture-ai-tool-telemetry',
    label: 'Capture AI tool adoption telemetry',
    reason:
      'Domain #8 (AI Tool Adoption / Usage / Cost) has no datasets loaded; Atlas cannot defend productivity-uplift claims.',
    routeHref: '/platform/admin/connectors',
  },
  {
    id: 'attach-baseline-kpis',
    label: 'Attach baseline KPIs on the 3 Apex Retail programs',
    reason:
      'Value-ledger inputs are incomplete; Atlas cannot defend dollar claims at G3 without a captured baseline.',
    routeHref: '/platform/admin/quality',
  },
  {
    id: 'assign-app-portfolio-owners',
    label: 'Assign business owners on the top 10 critical apps',
    reason:
      'Domain #4 (Application Portfolio) lacks owners on 8 critical apps; Steward cannot mark them usable as evidence.',
    routeHref: '/admin/users',
  },
  {
    id: 'approve-evidence-usability',
    label: 'Approve evidence usability on 9 quality-checked deliverables',
    reason:
      'Per the ADM1 contract, Steward must lift quality_checked deliverables to usable_as_evidence before G3 / G4 defense.',
    routeHref: '/platform/admin/quality',
  },
  {
    id: 'rerun-tenant-isolation-probe',
    label: 'Re-run the tenant-isolation probe before the next demo',
    reason:
      'The S7 probe set is a hard precondition for cross-tenant safety; surfacing the verdict belongs in Audit.',
    routeHref: '/admin/audit',
  },
];

// ---------------------------------------------------------------------
// Brief composition
// ---------------------------------------------------------------------

function composeBrief(
  workspaceLabel: string,
  domains: ReadonlyArray<DatasetDomainReadiness>,
  evidenceAggregate: EvidenceReadinessAggregate,
  agents: ReadonlyArray<AgentReadiness>,
  recommendedActions: ReadonlyArray<AdminRecommendedAction>,
): StewardBrief {
  const domainsWithData = domains.filter((d) => d.loadedCount > 0).length;
  const domainsNotStarted = domains.filter((d) => d.status === 'not_started').length;
  const programsAffected = 7; // canonical seed; Apex Retail + Meridian portfolio
  const programsUsableEvidence = 4;

  const tenantSetupHealthLabel: SetupHealth = (() => {
    if (domainsWithData >= 10 && evidenceAggregate.totalUsable >= 50) return 'ready';
    if (domainsWithData >= 6) return 'partial';
    return 'blocked';
  })();

  const rationale =
    `${domainsWithData} of ${domains.length} canonical dataset domains have data captured; ` +
    `${evidenceAggregate.totalUsable} of ${evidenceAggregate.totalLoaded} loaded items have reached usable_as_evidence; ` +
    `${evidenceAggregate.byState.blocked} items are currently blocked; tenant-isolation guard is intact.`;

  const topAdminGaps = [
    {
      id: 'gap-domains-not-started',
      label: `${domainsNotStarted} of ${domains.length} canonical dataset domains have no captured data`,
      routeHref: '/platform/admin/data',
    },
    {
      id: 'gap-value-ledger',
      label: 'Value-ledger inputs are incomplete on 3 active programs',
      routeHref: '/platform/admin/quality',
    },
    {
      id: 'gap-ai-tool-telemetry',
      label: 'AI tool adoption telemetry is not yet wired',
      routeHref: '/platform/admin/connectors',
    },
  ];

  const dataEvidenceReadiness =
    `${domainsWithData} dataset domains have data loaded; ` +
    `${evidenceAggregate.totalAvailable} of ${evidenceAggregate.totalLoaded} loaded items are at least indexed; ` +
    `${evidenceAggregate.totalUsable} have reached usable_as_evidence. ` +
    `Program evidence is usable for ${programsUsableEvidence} of ${programsAffected} active programs today.`;

  const userSecurityRisk =
    'No risky permissions observed today; 1 dormant high-privilege account flagged for review; tenant-isolation probe (S7) is green.';

  const connectorRisk =
    '0 of 0 connectors are wired today; live connector sync is deferred. Connector posture surfaces honestly as not_started.';

  const agentReadiness: ReadonlyArray<StewardBriefAgentReadinessLine> = agents.map(
    (a) => ({
      agent: a.agent,
      status: a.status,
      sentence: composeAgentSentence(a),
    }),
  );

  const recommendedNextAction = recommendedActions[0];

  const suggestedFollowUps: ReadonlyArray<StewardBriefFollowUp> = [
    {
      id: 'steward-followup-walk-setup-health',
      label: 'Walk me through tenant setup health',
      reason: `${domainsWithData} of ${domains.length} domains have data; ${domainsNotStarted} are not_started.`,
      enabled: false,
    },
    {
      id: 'steward-followup-domains-needing-owners',
      label: 'Show me the dataset domains needing owners',
      reason:
        'Org Structure domain still flags 5 orphan datasets and 2 unresolved invites.',
      enabled: false,
    },
    {
      id: 'steward-followup-unblock-atlas',
      label: 'What unblocks Atlas at G3?',
      reason:
        'Atlas confidence cap is medium until baseline KPIs are captured per program.',
      enabled: false,
    },
  ];

  const interpretationBasis =
    'Composed from a deterministic seed-state read model. No live Steward runtime is wired today; recommendations are based on captured-vs-missing inputs only.';

  return {
    title: `${workspaceLabel} · Steward setup brief`,
    tenantSetupHealth: {
      label: tenantSetupHealthLabel,
      rationale,
    },
    topAdminGaps,
    dataEvidenceReadiness,
    userSecurityRisk,
    connectorRisk,
    agentReadiness,
    recommendedNextAction,
    suggestedFollowUps,
    sourceLabel: 'setup_state_read_model',
    interpretationBasis,
  };
}

function composeAgentSentence(a: AgentReadiness): string {
  const status = a.status.toUpperCase();
  switch (a.agent) {
    case 'nexus':
      return `Nexus · ${status}. Can compose Context Bundles in usable_with_gaps; defers substantive answers when the bundle is insufficient or pattern_only.`;
    case 'sentinel':
      return `Sentinel · ${status}. Pattern detection and evidence-trail composition are wired; recurrence claims are deferred until persistence lands.`;
    case 'atlas':
      return `Atlas · ${status}. Executive brief composes at medium confidence today; dollar claims at G3 / G4 require a captured baseline KPI per program.`;
    case 'steward':
      return `Steward · ${status}. Setup guidance and gate readiness commentary run on the read model; live runtime is deferred.`;
  }
}

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Build the deterministic Steward setup readiness view. Pure: same
 * call → identical view object every time.
 */
export function buildStewardSetupReadinessView(): StewardSetupReadinessView {
  const workspaceLabel = 'AbarVa Platform';
  const brief = composeBrief(
    workspaceLabel,
    DOMAINS,
    EVIDENCE_AGGREGATE,
    AGENT_READINESS,
    RECOMMENDED_ACTIONS,
  );
  return {
    generatedFrom: 'deterministic_seed',
    setupHealth: brief.tenantSetupHealth.label,
    setupHealthRationale: brief.tenantSetupHealth.rationale,
    workspaceLabel,
    brief,
    domains: DOMAINS,
    evidenceAggregate: EVIDENCE_AGGREGATE,
    agents: AGENT_READINESS,
    modules: ADMIN_MODULES,
    recommendedActions: RECOMMENDED_ACTIONS,
  };
}

/**
 * Test-only convenience: the canonical evidence states in canonical
 * progression order. Mirrors ADM1 §J.
 */
export const EVIDENCE_STATES_IN_PROGRESSION_ORDER: ReadonlyArray<EvidenceReadinessState> = [
  'loaded',
  'parsed',
  'indexed',
  'classified',
  'scoped',
  'cited',
  'quality_checked',
  'usable_as_evidence',
  'blocked',
];

/**
 * Test-only convenience: the canonical agent names.
 */
export const ADMIN_AGENT_NAMES: ReadonlyArray<AgentName> = [
  'nexus',
  'sentinel',
  'atlas',
  'steward',
];
