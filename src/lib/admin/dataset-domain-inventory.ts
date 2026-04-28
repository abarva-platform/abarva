// ADM3 · Dataset Domain Inventory Read Model.
//
// Pure deterministic seed-driven inventory of dataset items that
// could power the future Dataset Explorer UI (ADM4). Implements the
// ADM1 §I (Data Explorer field set) and ADM1 §J (loaded → usable
// evidence states) contracts.
//
// No live connector sync, no real upload pipeline, no production
// evidence registry, no DB persistence, no Date.now() reads, no
// random IDs, no model calls.
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

export type DatasetSourceType =
  | 'upload'
  | 'connector'
  | 'authored'
  | 'generated'
  | 'source_event';

export type DatasetParseStatus =
  | 'unparsed'
  | 'parsed'
  | 'failed'
  | 'pending';

export type DatasetFreshnessState =
  | 'today'
  | 'this_week'
  | 'stale'
  | 'unknown';

export type DatasetEvidenceUsability =
  | 'loaded'
  | 'parsed'
  | 'indexed'
  | 'classified'
  | 'scoped'
  | 'cited'
  | 'quality_checked'
  | 'usable_as_evidence'
  | 'blocked';

export type DatasetAgentUsePermission =
  | 'nexus'
  | 'sentinel'
  | 'atlas'
  | 'steward';

export type DatasetDomainKey =
  | 'enterprise_strategy_c_suite'
  | 'business_kpi_functional_performance'
  | 'enterprise_architecture_tech_stack'
  | 'application_portfolio'
  | 'infrastructure_cloud_data_center'
  | 'vendor_contract_spend'
  | 'ai_portfolio_use_case_inventory'
  | 'ai_tool_adoption_usage_cost'
  | 'it_operating_model_dora'
  | 'risk_compliance_governance'
  | 'evidence_reports_artifacts'
  | 'org_structure_users_ownership';

export interface DatasetInventoryItem {
  id: string;
  domainKey: DatasetDomainKey;
  domainName: string;
  name: string;
  sourceType: DatasetSourceType;
  /** Named human owner; null = orphan (no data owner assigned). */
  owner: string | null;
  /** Tenant key the item is scoped to; "platform" for cross-tenant. */
  tenantScope: string;
  /** Connector identifier (null for upload / authored / generated). */
  connector: string | null;
  parseStatus: DatasetParseStatus;
  freshnessState: DatasetFreshnessState;
  /** Honest count when known; null when not yet determinable. */
  recordOrChunkCount: number | null;
  /** Program codes that reference this item. */
  linkedPrograms: ReadonlyArray<string>;
  /** Sentinel pattern keys (I1) that this item could feed. */
  linkedPatterns: ReadonlyArray<string>;
  /** S9e signal ids that depend on this item. */
  linkedTowerSignals: ReadonlyArray<string>;
  evidenceUsabilityState: DatasetEvidenceUsability;
  agentsAllowedToUse: ReadonlyArray<DatasetAgentUsePermission>;
  /** Field-level gaps (e.g., "no owner", "no tenant scope"). */
  missingMetadata: ReadonlyArray<string>;
  /** Single-sentence Steward recommendation for this row. */
  stewardGuidance: string;
  createdFrom: 'deterministic_seed';
}

export interface DatasetDomainInventorySummary {
  totalItems: number;
  byDomain: Record<DatasetDomainKey, number>;
  byUsability: Record<DatasetEvidenceUsability, number>;
  byParseStatus: Record<DatasetParseStatus, number>;
  loadedTotal: number;
  availableTotal: number;
  usableTotal: number;
  orphanCount: number;
}

export interface DatasetDomainInventory {
  generatedFrom: 'deterministic_seed';
  items: ReadonlyArray<DatasetInventoryItem>;
  summary: DatasetDomainInventorySummary;
}

// ---------------------------------------------------------------------
// Canonical domain metadata
// ---------------------------------------------------------------------

const DOMAIN_NAME: Record<DatasetDomainKey, string> = {
  enterprise_strategy_c_suite: 'Enterprise Strategy & C-Suite Priorities',
  business_kpi_functional_performance: 'Business KPI / Functional Performance',
  enterprise_architecture_tech_stack: 'Enterprise Architecture & Tech Stack',
  application_portfolio: 'Application Portfolio',
  infrastructure_cloud_data_center: 'Infrastructure / Cloud / Data Center',
  vendor_contract_spend: 'Vendor / Contract / Spend',
  ai_portfolio_use_case_inventory: 'AI Portfolio / Use Case Inventory',
  ai_tool_adoption_usage_cost: 'AI Tool Adoption / Usage / Cost',
  it_operating_model_dora: 'IT Operating Model / Productivity / DORA',
  risk_compliance_governance: 'Risk / Compliance / Governance',
  evidence_reports_artifacts: 'Evidence / Reports / Artifacts',
  org_structure_users_ownership: 'Org Structure / Users / Ownership',
};

const ALL_DOMAIN_KEYS: ReadonlyArray<DatasetDomainKey> = [
  'enterprise_strategy_c_suite',
  'business_kpi_functional_performance',
  'enterprise_architecture_tech_stack',
  'application_portfolio',
  'infrastructure_cloud_data_center',
  'vendor_contract_spend',
  'ai_portfolio_use_case_inventory',
  'ai_tool_adoption_usage_cost',
  'it_operating_model_dora',
  'risk_compliance_governance',
  'evidence_reports_artifacts',
  'org_structure_users_ownership',
];

const ALL_USABILITY_STATES: ReadonlyArray<DatasetEvidenceUsability> = [
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

const ALL_PARSE_STATES: ReadonlyArray<DatasetParseStatus> = [
  'unparsed',
  'parsed',
  'failed',
  'pending',
];

// ---------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------

const ITEMS: ReadonlyArray<DatasetInventoryItem> = [
  // ── Domain 1 · Strategy ────────────────────────────────────────────
  {
    id: 'ds:enterprise_strategy_c_suite:apexretail-mission-okrs',
    domainKey: 'enterprise_strategy_c_suite',
    domainName: DOMAIN_NAME.enterprise_strategy_c_suite,
    name: 'Apex Retail · mission and OKRs (FY26).pdf',
    sourceType: 'upload',
    owner: 'Anand Sundaram',
    tenantScope: 'apexretail',
    connector: null,
    parseStatus: 'parsed',
    freshnessState: 'this_week',
    recordOrChunkCount: 18,
    linkedPrograms: ['APX-01', 'APX-02'],
    linkedPatterns: ['ai_governance_operating_model_gap'],
    linkedTowerSignals: [],
    evidenceUsabilityState: 'classified',
    agentsAllowedToUse: ['nexus', 'atlas', 'steward'],
    missingMetadata: [
      'No tenant-scope tag on chunk-level chunks 12-18.',
    ],
    stewardGuidance:
      'Promote scoped → cited by attaching an E-id when this is referenced from a deliverable.',
    createdFrom: 'deterministic_seed',
  },
  {
    id: 'ds:enterprise_strategy_c_suite:apexretail-board-deck-q4',
    domainKey: 'enterprise_strategy_c_suite',
    domainName: DOMAIN_NAME.enterprise_strategy_c_suite,
    name: 'Apex Retail · FY26 Q4 board deck.pdf',
    sourceType: 'upload',
    owner: 'Anand Sundaram',
    tenantScope: 'apexretail',
    connector: null,
    parseStatus: 'parsed',
    freshnessState: 'today',
    recordOrChunkCount: 42,
    linkedPrograms: ['APX-01', 'APX-03', 'APX-04'],
    linkedPatterns: ['ai_governance_operating_model_gap'],
    linkedTowerSignals: [],
    evidenceUsabilityState: 'scoped',
    agentsAllowedToUse: ['nexus', 'atlas', 'steward'],
    missingMetadata: [],
    stewardGuidance:
      'Attach an E-id citation from the next steering deck so this can promote to cited.',
    createdFrom: 'deterministic_seed',
  },
  {
    id: 'ds:enterprise_strategy_c_suite:cxo-priorities-q4-interview',
    domainKey: 'enterprise_strategy_c_suite',
    domainName: DOMAIN_NAME.enterprise_strategy_c_suite,
    name: 'CXO priorities Q4 · authored interview note',
    sourceType: 'authored',
    owner: null,
    tenantScope: 'apexretail',
    connector: null,
    parseStatus: 'parsed',
    freshnessState: 'stale',
    recordOrChunkCount: 6,
    linkedPrograms: [],
    linkedPatterns: ['ai_governance_operating_model_gap'],
    linkedTowerSignals: [],
    evidenceUsabilityState: 'blocked',
    agentsAllowedToUse: ['steward'],
    missingMetadata: [
      'No data owner assigned (orphan).',
      'Freshness is stale; CXO interview was last refreshed >30 days ago.',
    ],
    stewardGuidance:
      'Assign a data owner and refresh the CXO interview before promoting to cited.',
    createdFrom: 'deterministic_seed',
  },

  // ── Domain 2 · KPI ─────────────────────────────────────────────────
  {
    id: 'ds:business_kpi_functional_performance:apexretail-kpi-baseline',
    domainKey: 'business_kpi_functional_performance',
    domainName: DOMAIN_NAME.business_kpi_functional_performance,
    name: 'Apex Retail · KPI baseline.csv',
    sourceType: 'upload',
    owner: null,
    tenantScope: 'apexretail',
    connector: null,
    parseStatus: 'parsed',
    freshnessState: 'this_week',
    recordOrChunkCount: 124,
    linkedPrograms: ['APX-01', 'APX-02', 'APX-03'],
    linkedPatterns: ['value_ledger_incompleteness'],
    linkedTowerSignals: ['sig:apexretail:apex-retail-cdp:value_not_ready:value'],
    evidenceUsabilityState: 'parsed',
    agentsAllowedToUse: ['nexus', 'sentinel'],
    missingMetadata: [
      'No data owner assigned (orphan).',
      'No baseline + target attached to active programs.',
    ],
    stewardGuidance:
      'Assign a data owner and attach baseline + target to APX-01 / 02 / 03 before publishing dollar claims.',
    createdFrom: 'deterministic_seed',
  },
  {
    id: 'ds:business_kpi_functional_performance:quarterly-kpi-snapshot-q3',
    domainKey: 'business_kpi_functional_performance',
    domainName: DOMAIN_NAME.business_kpi_functional_performance,
    name: 'Apex Retail · Quarterly KPI snapshot Q3.json',
    sourceType: 'generated',
    owner: 'Apex Retail FP&A',
    tenantScope: 'apexretail',
    connector: null,
    parseStatus: 'failed',
    freshnessState: 'stale',
    recordOrChunkCount: null,
    linkedPrograms: [],
    linkedPatterns: ['value_ledger_incompleteness'],
    linkedTowerSignals: [],
    evidenceUsabilityState: 'blocked',
    agentsAllowedToUse: [],
    missingMetadata: [
      'Parse failed; no parsed representation available.',
    ],
    stewardGuidance:
      'Re-run parse before this can advance past loaded; retry the parse job.',
    createdFrom: 'deterministic_seed',
  },

  // ── Domain 3 · Architecture ────────────────────────────────────────
  {
    id: 'ds:enterprise_architecture_tech_stack:apexretail-current-state-arch',
    domainKey: 'enterprise_architecture_tech_stack',
    domainName: DOMAIN_NAME.enterprise_architecture_tech_stack,
    name: 'Apex Retail · current-state architecture (logical).pdf',
    sourceType: 'upload',
    owner: 'Apex Retail IT',
    tenantScope: 'apexretail',
    connector: null,
    parseStatus: 'parsed',
    freshnessState: 'today',
    recordOrChunkCount: 36,
    linkedPrograms: ['APX-02', 'APX-04'],
    linkedPatterns: ['program_context_sparsity'],
    linkedTowerSignals: [],
    evidenceUsabilityState: 'classified',
    agentsAllowedToUse: ['nexus', 'sentinel', 'steward'],
    missingMetadata: [],
    stewardGuidance:
      'Attach an E-id when referenced from a Diagnose-phase deliverable to promote to cited.',
    createdFrom: 'deterministic_seed',
  },
  {
    id: 'ds:enterprise_architecture_tech_stack:tech-stack-inventory-v3',
    domainKey: 'enterprise_architecture_tech_stack',
    domainName: DOMAIN_NAME.enterprise_architecture_tech_stack,
    name: 'Apex Retail · tech stack inventory v3.xlsx',
    sourceType: 'upload',
    owner: 'Apex Retail IT',
    tenantScope: 'apexretail',
    connector: null,
    parseStatus: 'parsed',
    freshnessState: 'this_week',
    recordOrChunkCount: 148,
    linkedPrograms: ['APX-01', 'APX-02', 'APX-03', 'APX-04'],
    linkedPatterns: ['program_context_sparsity'],
    linkedTowerSignals: [],
    evidenceUsabilityState: 'usable_as_evidence',
    agentsAllowedToUse: ['nexus', 'sentinel', 'atlas', 'steward'],
    missingMetadata: [],
    stewardGuidance:
      'Healthy. No action required; refresh quarterly.',
    createdFrom: 'deterministic_seed',
  },
  {
    id: 'ds:enterprise_architecture_tech_stack:integration-arch-diagram',
    domainKey: 'enterprise_architecture_tech_stack',
    domainName: DOMAIN_NAME.enterprise_architecture_tech_stack,
    name: 'Apex Retail · integration architecture diagram.png',
    sourceType: 'upload',
    owner: 'Apex Retail IT',
    tenantScope: 'apexretail',
    connector: null,
    parseStatus: 'unparsed',
    freshnessState: 'this_week',
    recordOrChunkCount: null,
    linkedPrograms: ['APX-02'],
    linkedPatterns: [],
    linkedTowerSignals: [],
    evidenceUsabilityState: 'loaded',
    agentsAllowedToUse: [],
    missingMetadata: [
      'Image-only artifact; OCR / parse not yet enqueued.',
    ],
    stewardGuidance:
      'Enqueue OCR + parse before this can advance to indexed.',
    createdFrom: 'deterministic_seed',
  },

  // ── Domain 4 · Application Portfolio ───────────────────────────────
  {
    id: 'ds:application_portfolio:apex-app-catalog',
    domainKey: 'application_portfolio',
    domainName: DOMAIN_NAME.application_portfolio,
    name: 'Apex Retail · application catalog (top 30).csv',
    sourceType: 'upload',
    owner: 'Apex Retail IT',
    tenantScope: 'apexretail',
    connector: null,
    parseStatus: 'parsed',
    freshnessState: 'today',
    recordOrChunkCount: 30,
    linkedPrograms: ['APX-01', 'APX-02', 'APX-03', 'APX-04'],
    linkedPatterns: ['program_context_sparsity'],
    linkedTowerSignals: [],
    evidenceUsabilityState: 'cited',
    agentsAllowedToUse: ['nexus', 'sentinel', 'atlas', 'steward'],
    missingMetadata: [
      'Business owners blank on 8 critical apps.',
      'AI-readiness flag blank on 14 apps.',
    ],
    stewardGuidance:
      'Assign business owners on the 10 most critical apps before promoting to quality_checked.',
    createdFrom: 'deterministic_seed',
  },
  {
    id: 'ds:application_portfolio:meridian-clinical-apps',
    domainKey: 'application_portfolio',
    domainName: DOMAIN_NAME.application_portfolio,
    name: 'Meridian Health · clinical app catalog.csv',
    sourceType: 'upload',
    owner: 'Meridian CIO Office',
    tenantScope: 'meridian',
    connector: null,
    parseStatus: 'parsed',
    freshnessState: 'this_week',
    recordOrChunkCount: 22,
    linkedPrograms: ['MER-01', 'MER-02'],
    linkedPatterns: ['program_context_sparsity'],
    linkedTowerSignals: [],
    evidenceUsabilityState: 'quality_checked',
    agentsAllowedToUse: ['nexus', 'sentinel', 'atlas', 'steward'],
    missingMetadata: [],
    stewardGuidance:
      'Approve evidence usability to lift quality_checked → usable_as_evidence.',
    createdFrom: 'deterministic_seed',
  },

  // ── Domain 7 · AI Portfolio ────────────────────────────────────────
  {
    id: 'ds:ai_portfolio_use_case_inventory:apex-ai-use-cases',
    domainKey: 'ai_portfolio_use_case_inventory',
    domainName: DOMAIN_NAME.ai_portfolio_use_case_inventory,
    name: 'Apex Retail · AI use case inventory.xlsx',
    sourceType: 'upload',
    owner: 'Anand Sundaram',
    tenantScope: 'apexretail',
    connector: null,
    parseStatus: 'parsed',
    freshnessState: 'today',
    recordOrChunkCount: 15,
    linkedPrograms: ['APX-01', 'APX-02', 'APX-03', 'APX-04'],
    linkedPatterns: ['ai_governance_operating_model_gap'],
    linkedTowerSignals: [],
    evidenceUsabilityState: 'usable_as_evidence',
    agentsAllowedToUse: ['nexus', 'sentinel', 'atlas', 'steward'],
    missingMetadata: [
      'Sponsor missing on 3 in-flight cases.',
      'Pattern key not classified on 4 cases.',
    ],
    stewardGuidance:
      'Assign sponsor + pattern key on the 4 unclassified cases before publishing the portfolio brief.',
    createdFrom: 'deterministic_seed',
  },
  {
    id: 'ds:ai_portfolio_use_case_inventory:apex-ai-shortlist-q4',
    domainKey: 'ai_portfolio_use_case_inventory',
    domainName: DOMAIN_NAME.ai_portfolio_use_case_inventory,
    name: 'Apex Retail · Q4 AI shortlist (proposed).md',
    sourceType: 'authored',
    owner: 'Anand Sundaram',
    tenantScope: 'apexretail',
    connector: null,
    parseStatus: 'parsed',
    freshnessState: 'this_week',
    recordOrChunkCount: 12,
    linkedPrograms: [],
    linkedPatterns: ['ai_governance_operating_model_gap'],
    linkedTowerSignals: [],
    evidenceUsabilityState: 'scoped',
    agentsAllowedToUse: ['nexus', 'atlas', 'steward'],
    missingMetadata: [],
    stewardGuidance:
      'Promote to cited when referenced from a Q4 steering deck.',
    createdFrom: 'deterministic_seed',
  },

  // ── Domain 10 · Risk / Compliance / Governance ─────────────────────
  {
    id: 'ds:risk_compliance_governance:apex-ai-risk-register',
    domainKey: 'risk_compliance_governance',
    domainName: DOMAIN_NAME.risk_compliance_governance,
    name: 'Apex Retail · AI risk register.xlsx',
    sourceType: 'upload',
    owner: 'Apex Retail Compliance',
    tenantScope: 'apexretail',
    connector: null,
    parseStatus: 'parsed',
    freshnessState: 'this_week',
    recordOrChunkCount: 24,
    linkedPrograms: ['APX-01', 'APX-02', 'APX-03', 'APX-04'],
    linkedPatterns: ['gate_governance_gap'],
    linkedTowerSignals: [],
    evidenceUsabilityState: 'cited',
    agentsAllowedToUse: ['steward', 'sentinel', 'atlas'],
    missingMetadata: [
      'Named owners blank on 3 risk entries.',
    ],
    stewardGuidance:
      'Assign named owners on the 3 unowned risk entries before approving G3.',
    createdFrom: 'deterministic_seed',
  },
  {
    id: 'ds:risk_compliance_governance:responsible-ai-review-apx02',
    domainKey: 'risk_compliance_governance',
    domainName: DOMAIN_NAME.risk_compliance_governance,
    name: 'APX-02 · responsible-AI review (initial).md',
    sourceType: 'authored',
    owner: 'Apex Retail Compliance',
    tenantScope: 'apexretail',
    connector: null,
    parseStatus: 'parsed',
    freshnessState: 'today',
    recordOrChunkCount: 8,
    linkedPrograms: ['APX-02'],
    linkedPatterns: ['gate_governance_gap'],
    linkedTowerSignals: [],
    evidenceUsabilityState: 'usable_as_evidence',
    agentsAllowedToUse: ['nexus', 'sentinel', 'atlas', 'steward'],
    missingMetadata: [],
    stewardGuidance:
      'Healthy. No action required; refresh before each gate review.',
    createdFrom: 'deterministic_seed',
  },

  // ── Domain 11 · Evidence / Reports / Artifacts ─────────────────────
  {
    id: 'ds:evidence_reports_artifacts:apx01-charter-deliverable',
    domainKey: 'evidence_reports_artifacts',
    domainName: DOMAIN_NAME.evidence_reports_artifacts,
    name: 'APX-01 · Charter deliverable (D01 Tension).md',
    sourceType: 'authored',
    owner: 'Anand Sundaram',
    tenantScope: 'apexretail',
    connector: null,
    parseStatus: 'parsed',
    freshnessState: 'today',
    recordOrChunkCount: 14,
    linkedPrograms: ['APX-01'],
    linkedPatterns: ['evidence_chain_gap'],
    linkedTowerSignals: [
      'sig:apexretail:apex-retail-contact-center-ai:evidence_not_ready:evidence',
    ],
    evidenceUsabilityState: 'cited',
    agentsAllowedToUse: ['nexus', 'sentinel', 'atlas', 'steward'],
    missingMetadata: [
      'Quality check pending.',
    ],
    stewardGuidance:
      'Run the deliverable quality check to lift cited → quality_checked.',
    createdFrom: 'deterministic_seed',
  },
  {
    id: 'ds:evidence_reports_artifacts:apx03-evaluation-postmortem',
    domainKey: 'evidence_reports_artifacts',
    domainName: DOMAIN_NAME.evidence_reports_artifacts,
    name: 'APX-03 · Evaluation postmortem (Stub tier).md',
    sourceType: 'authored',
    owner: null,
    tenantScope: 'apexretail',
    connector: null,
    parseStatus: 'parsed',
    freshnessState: 'stale',
    recordOrChunkCount: 4,
    linkedPrograms: ['APX-03'],
    linkedPatterns: ['evidence_chain_gap'],
    linkedTowerSignals: [
      'sig:apexretail:apex-retail-cdp:evidence_not_ready:evidence',
    ],
    evidenceUsabilityState: 'blocked',
    agentsAllowedToUse: ['steward'],
    missingMetadata: [
      'Required deliverable still at Stub tier.',
      'No data owner assigned (orphan).',
      'No E-id attached.',
    ],
    stewardGuidance:
      'Promote from Stub to Outline tier and assign an owner before this can promote past blocked.',
    createdFrom: 'deterministic_seed',
  },
  {
    id: 'ds:evidence_reports_artifacts:meridian-decision-rcm-design',
    domainKey: 'evidence_reports_artifacts',
    domainName: DOMAIN_NAME.evidence_reports_artifacts,
    name: 'MER-01 · RCM design decision deck.pdf',
    sourceType: 'upload',
    owner: 'Meridian CIO Office',
    tenantScope: 'meridian',
    connector: null,
    parseStatus: 'parsed',
    freshnessState: 'this_week',
    recordOrChunkCount: 28,
    linkedPrograms: ['MER-01'],
    linkedPatterns: ['evidence_chain_gap', 'value_ledger_incompleteness'],
    linkedTowerSignals: [],
    evidenceUsabilityState: 'usable_as_evidence',
    agentsAllowedToUse: ['nexus', 'sentinel', 'atlas', 'steward'],
    missingMetadata: [],
    stewardGuidance:
      'Healthy. No action required; refresh before each gate review.',
    createdFrom: 'deterministic_seed',
  },

  // ── Domain 12 · Org Structure / Users / Ownership ──────────────────
  {
    id: 'ds:org_structure_users_ownership:apex-org-chart',
    domainKey: 'org_structure_users_ownership',
    domainName: DOMAIN_NAME.org_structure_users_ownership,
    name: 'Apex Retail · org chart (snapshot).pdf',
    sourceType: 'upload',
    owner: 'Apex Retail HR',
    tenantScope: 'apexretail',
    connector: null,
    parseStatus: 'parsed',
    freshnessState: 'this_week',
    recordOrChunkCount: 56,
    linkedPrograms: ['APX-01', 'APX-02', 'APX-03', 'APX-04'],
    linkedPatterns: [],
    linkedTowerSignals: [],
    evidenceUsabilityState: 'classified',
    agentsAllowedToUse: ['steward', 'sentinel'],
    missingMetadata: [],
    stewardGuidance:
      'Promote to scoped by attaching a tenant-scope tag explicitly.',
    createdFrom: 'deterministic_seed',
  },
  {
    id: 'ds:org_structure_users_ownership:apex-data-owners-registry',
    domainKey: 'org_structure_users_ownership',
    domainName: DOMAIN_NAME.org_structure_users_ownership,
    name: 'Apex Retail · data owner registry.csv',
    sourceType: 'authored',
    owner: 'Anand Sundaram',
    tenantScope: 'apexretail',
    connector: null,
    parseStatus: 'parsed',
    freshnessState: 'today',
    recordOrChunkCount: 12,
    linkedPrograms: [],
    linkedPatterns: [],
    linkedTowerSignals: [],
    evidenceUsabilityState: 'usable_as_evidence',
    agentsAllowedToUse: ['steward'],
    missingMetadata: [
      '5 datasets reference owners not on this registry.',
    ],
    stewardGuidance:
      'Reconcile orphan datasets against the owner registry before the next steering touchpoint.',
    createdFrom: 'deterministic_seed',
  },

  // Note: domains 5 (infra), 6 (vendor), 8 (AI tool adoption), and 9
  // (DORA) remain not_started in the seed today; they appear in the
  // summary's byDomain map with count 0 but emit no items. This is
  // honest — the seed has not captured those datasets yet.
];

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Build the deterministic dataset domain inventory across all 12
 * canonical domains. Pure: same call → identical output.
 */
export function buildDatasetDomainInventory(): DatasetDomainInventory {
  const items = ITEMS;
  const summary = summarizeDatasetDomainInventory(items);
  return {
    generatedFrom: 'deterministic_seed',
    items,
    summary,
  };
}

/**
 * Build the inventory restricted to a single canonical domain.
 * Returns an empty list for not_started domains. Pure.
 */
export function buildDatasetDomainInventoryForDomain(
  domainKey: string,
): ReadonlyArray<DatasetInventoryItem> {
  if (!isDatasetDomainKey(domainKey)) return [];
  return ITEMS.filter((it) => it.domainKey === domainKey);
}

/**
 * Aggregate counts by domain, usability, parse status, and orphan
 * tally. Pure.
 */
export function summarizeDatasetDomainInventory(
  items: ReadonlyArray<DatasetInventoryItem>,
): DatasetDomainInventorySummary {
  const byDomain = emptyByDomain();
  const byUsability = emptyByUsability();
  const byParseStatus = emptyByParseStatus();
  let orphanCount = 0;
  for (const it of items) {
    byDomain[it.domainKey] += 1;
    byUsability[it.evidenceUsabilityState] += 1;
    byParseStatus[it.parseStatus] += 1;
    if (it.owner === null) orphanCount += 1;
  }
  const loadedTotal = items.length;
  const availableTotal = items.filter((it) =>
    USABILITY_AT_OR_ABOVE_INDEXED.has(it.evidenceUsabilityState),
  ).length;
  const usableTotal = items.filter(
    (it) => it.evidenceUsabilityState === 'usable_as_evidence',
  ).length;
  return {
    totalItems: items.length,
    byDomain,
    byUsability,
    byParseStatus,
    loadedTotal,
    availableTotal,
    usableTotal,
    orphanCount,
  };
}

// ---------------------------------------------------------------------
// Re-exports for test introspection
// ---------------------------------------------------------------------

export const DATASET_DOMAIN_KEYS_IN_ORDER: ReadonlyArray<DatasetDomainKey> =
  ALL_DOMAIN_KEYS;

export const DATASET_USABILITY_STATES_IN_ORDER: ReadonlyArray<DatasetEvidenceUsability> =
  ALL_USABILITY_STATES;

export const DATASET_PARSE_STATES_IN_ORDER: ReadonlyArray<DatasetParseStatus> =
  ALL_PARSE_STATES;

// ---------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------

function isDatasetDomainKey(value: string): value is DatasetDomainKey {
  return (ALL_DOMAIN_KEYS as ReadonlyArray<string>).includes(value);
}

const USABILITY_AT_OR_ABOVE_INDEXED: ReadonlySet<DatasetEvidenceUsability> = new Set([
  'indexed',
  'classified',
  'scoped',
  'cited',
  'quality_checked',
  'usable_as_evidence',
]);

function emptyByDomain(): Record<DatasetDomainKey, number> {
  return {
    enterprise_strategy_c_suite: 0,
    business_kpi_functional_performance: 0,
    enterprise_architecture_tech_stack: 0,
    application_portfolio: 0,
    infrastructure_cloud_data_center: 0,
    vendor_contract_spend: 0,
    ai_portfolio_use_case_inventory: 0,
    ai_tool_adoption_usage_cost: 0,
    it_operating_model_dora: 0,
    risk_compliance_governance: 0,
    evidence_reports_artifacts: 0,
    org_structure_users_ownership: 0,
  };
}

function emptyByUsability(): Record<DatasetEvidenceUsability, number> {
  return {
    loaded: 0,
    parsed: 0,
    indexed: 0,
    classified: 0,
    scoped: 0,
    cited: 0,
    quality_checked: 0,
    usable_as_evidence: 0,
    blocked: 0,
  };
}

function emptyByParseStatus(): Record<DatasetParseStatus, number> {
  return {
    unparsed: 0,
    parsed: 0,
    failed: 0,
    pending: 0,
  };
}
