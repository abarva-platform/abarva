// SOL14 · Vendor / Startup Intelligence Contract.
//
// Pure deterministic library encoding the AbarVa point of view on how a
// tenant should classify, assess, and govern vendor and startup
// candidates across the canonical AI / data fabric / agent platform
// landscape. Programs, Atlas, Nexus, and Steward surfaces can subscribe
// to this contract to score, summarize, and reject vendor candidates
// without inventing the categories, the readiness model, or the
// evidence basis at runtime.
//
// This module is a *library*. It does NOT generate live vendor briefs,
// invoke models, read tenant state, fetch external data, or call any
// external API. Every helper is deterministic over a typed input.
//
// **No real vendor names** appear in this module. Placeholders use
// category-shaped opaque ids only (e.g. `vendor_cdp_001`,
// `vendor_ams_002`) so downstream surfaces never accidentally inherit
// a branded recommendation from the seed.
//
// This module does NOT import:
//   - src/lib/sentinel/**, src/lib/atlas/**, src/lib/nexus/**
//   - src/lib/agent/**, src/components/agent/**
//   - src/lib/source/**, src/app/(maestro)/source/**
//   - src/app/programs/**, src/app/(maestro)/preview/**, src/app/demo/**
//   - src/lib/programs/mock.ts
//   - src/lib/auth/**
//   - supabase/**

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

export const VENDOR_INTELLIGENCE_CATEGORIES = [
  'cdp',
  'cx_ai',
  'ams',
  'data_fabric',
  'agent_platform',
  'observability',
  'security',
  'evaluation',
  'other',
] as const;
export type VendorIntelligenceCategory =
  typeof VENDOR_INTELLIGENCE_CATEGORIES[number];

export const VENDOR_ASSESSMENT_READINESS_VALUES = [
  'unknown',
  'preliminary',
  'pilot_ready',
  'production_ready',
  'not_recommended',
] as const;
export type VendorAssessmentReadiness =
  typeof VENDOR_ASSESSMENT_READINESS_VALUES[number];

export const VENDOR_EVIDENCE_BASIS_VALUES = [
  'public_documentation',
  'tenant_observed_signal',
  'reference_call',
  'security_questionnaire',
  'hands_on_evaluation',
  'no_evidence',
] as const;
export type VendorEvidenceBasis =
  typeof VENDOR_EVIDENCE_BASIS_VALUES[number];

export interface VendorAssessment {
  vendorPlaceholderId: string;
  category: VendorIntelligenceCategory;
  readiness: VendorAssessmentReadiness;
  capabilityFitNote: string;
  evidenceBasis: VendorEvidenceBasis;
  redFlagSignals: readonly string[];
  greenFlagSignals: readonly string[];
  governanceConsiderations: readonly string[];
  notRecommendedReason: string | null;
}

export interface VendorIntelligenceCategoryMetadata {
  key: VendorIntelligenceCategory;
  name: string;
  description: string;
  exampleCapabilities: readonly string[];
}

export interface VendorIntelligenceSummary {
  totalAssessments: number;
  byCategory: Readonly<Record<VendorIntelligenceCategory, number>>;
  byReadiness: Readonly<Record<VendorAssessmentReadiness, number>>;
  notRecommendedCount: number;
  hasUnknownReadiness: boolean;
  pilotOrProductionReadyCount: number;
}

export interface VendorIntelligenceSeed {
  assessments: readonly VendorAssessment[];
  createdFrom: 'deterministic_vendor_startup_intelligence_seed';
}

// ---------------------------------------------------------------------
// Category pack
// ---------------------------------------------------------------------

const CATEGORY_PACK: Record<
  VendorIntelligenceCategory,
  VendorIntelligenceCategoryMetadata
> = {
  cdp: {
    key: 'cdp',
    name: 'Customer data platforms',
    description:
      'Identity resolution, profile assembly, consent enforcement, and audience activation across customer touch points.',
    exampleCapabilities: [
      'identity_graph_resolution',
      'consent_state_propagation',
      'audience_activation_to_destinations',
    ],
  },
  cx_ai: {
    key: 'cx_ai',
    name: 'Customer experience AI',
    description:
      'Conversational, recommendation, and journey-orchestration capabilities applied to customer-facing experiences.',
    exampleCapabilities: [
      'conversational_assistance',
      'next_best_experience_recommendation',
      'journey_orchestration_with_human_handoff',
    ],
  },
  ams: {
    key: 'ams',
    name: 'Agentic management systems',
    description:
      'Vendor-supplied frameworks that compose, run, observe, and govern multi-agent work over enterprise tools.',
    exampleCapabilities: [
      'agent_composition_and_handoff',
      'tool_invocation_with_audit_trail',
      'human_in_loop_checkpoint_orchestration',
    ],
  },
  data_fabric: {
    key: 'data_fabric',
    name: 'Data and knowledge fabric',
    description:
      'Storage, retrieval, semantic, and graph layers that supply trustworthy context to AI and analytic workloads.',
    exampleCapabilities: [
      'governed_retrieval_over_tenant_corpora',
      'semantic_layer_with_lineage',
      'graph_or_vector_index_with_residency_controls',
    ],
  },
  agent_platform: {
    key: 'agent_platform',
    name: 'Agent runtime platforms',
    description:
      'Vendor-supplied runtime substrates for hosting, scheduling, and isolating agent workloads with policy controls.',
    exampleCapabilities: [
      'isolated_agent_runtime_with_resource_quotas',
      'policy_engine_for_tool_access',
      'durable_execution_and_replay',
    ],
  },
  observability: {
    key: 'observability',
    name: 'AI and agent observability',
    description:
      'Telemetry, tracing, evaluation, and incident-response surfaces specific to AI and agent workloads.',
    exampleCapabilities: [
      'prompt_and_tool_trace_capture',
      'cost_and_latency_attribution',
      'regression_alerting_against_baselines',
    ],
  },
  security: {
    key: 'security',
    name: 'AI security and trust',
    description:
      'Prompt-injection defense, data exfiltration controls, model jailbreak posture, and tenant-isolation guardrails.',
    exampleCapabilities: [
      'prompt_injection_detection',
      'output_redaction_and_dlp',
      'tenant_isolation_envelope_assertions',
    ],
  },
  evaluation: {
    key: 'evaluation',
    name: 'Evaluation and benchmarks',
    description:
      'Evaluation harnesses, regression suites, golden-set management, and benchmark-driven gating for AI systems.',
    exampleCapabilities: [
      'tenant_runnable_eval_harness',
      'golden_set_curation_and_drift_detection',
      'benchmark_gating_for_release_decisions',
    ],
  },
  other: {
    key: 'other',
    name: 'Other AI-adjacent capabilities',
    description:
      'Vendor capabilities that do not fit the eight named categories yet warrant explicit documentation and review.',
    exampleCapabilities: [
      'specialty_modality_handlers',
      'ecosystem_glue_capabilities',
      'vertical_specific_accelerators',
    ],
  },
};

const CATEGORY_LIST: readonly VendorIntelligenceCategoryMetadata[] =
  VENDOR_INTELLIGENCE_CATEGORIES.map((k) => CATEGORY_PACK[k]);

// ---------------------------------------------------------------------
// Deterministic assessment seed
// ---------------------------------------------------------------------
//
// Vendor placeholder ids follow the shape `vendor_<category>_<NNN>`
// where the category token is one of the canonical category keys and
// the NNN segment is a stable three-digit ordinal. **No real vendor
// names** are used.

const ASSESSMENT_SEED: readonly VendorAssessment[] = [
  {
    vendorPlaceholderId: 'vendor_cdp_001',
    category: 'cdp',
    readiness: 'pilot_ready',
    capabilityFitNote:
      'Placeholder profile representing a CDP candidate that maps to the tenant identity-graph and consent requirements without bespoke integration.',
    evidenceBasis: 'public_documentation',
    redFlagSignals: [
      'Identity graph relies on shared training across tenants',
      'Consent state propagation is best-effort rather than transactional',
    ],
    greenFlagSignals: [
      'Documented consent propagation contract with downstream destinations',
      'Tenant-isolated identity graph with residency controls',
    ],
    governanceConsiderations: [
      'Require tenant-isolated identity graph and exportable profile records',
      'Require consent state retention aligned to record-management policy',
    ],
    notRecommendedReason: null,
  },
  {
    vendorPlaceholderId: 'vendor_cdp_002',
    category: 'cdp',
    readiness: 'preliminary',
    capabilityFitNote:
      'Placeholder profile representing an emerging CDP candidate with promising audience activation surface but unverified enterprise posture.',
    evidenceBasis: 'public_documentation',
    redFlagSignals: [
      'Sub-processor list is undisclosed for the required jurisdictions',
      'No documented incident-response playbook for identity-graph corruption',
    ],
    greenFlagSignals: [
      'Open audience activation surface with documented webhook contracts',
    ],
    governanceConsiderations: [
      'Require sub-processor disclosure with change-notice window before pilot',
    ],
    notRecommendedReason: null,
  },
  {
    vendorPlaceholderId: 'vendor_cx_ai_001',
    category: 'cx_ai',
    readiness: 'pilot_ready',
    capabilityFitNote:
      'Placeholder profile representing a customer experience AI candidate with conversational assistance plus documented handoff to human agents.',
    evidenceBasis: 'reference_call',
    redFlagSignals: [
      'Tenant-supplied evaluation data is restricted by default',
    ],
    greenFlagSignals: [
      'Documented human-in-loop handoff contract with escalation matrix',
      'Reference customer at peer maturity willing to discuss live operations',
    ],
    governanceConsiderations: [
      'Require eval harness that the tenant can run against tenant data before pilot',
      'Require redaction policy on conversational logs and tool traces',
    ],
    notRecommendedReason: null,
  },
  {
    vendorPlaceholderId: 'vendor_ams_001',
    category: 'ams',
    readiness: 'preliminary',
    capabilityFitNote:
      'Placeholder profile representing an agentic management system candidate that exposes composition, handoff, and audit primitives at the framework level.',
    evidenceBasis: 'public_documentation',
    redFlagSignals: [
      'Audit trail granularity is documented but not yet tenant-runnable',
      'Multi-tenant isolation posture relies on shared model gateway',
    ],
    greenFlagSignals: [
      'Composition primitives align to documented agent handoff patterns',
    ],
    governanceConsiderations: [
      'Require an immutable audit export that the tenant can attach to its own log destinations',
    ],
    notRecommendedReason: null,
  },
  {
    vendorPlaceholderId: 'vendor_ams_002',
    category: 'ams',
    readiness: 'not_recommended',
    capabilityFitNote:
      'Placeholder profile representing an AMS candidate whose claims rest on demoware that has not survived independent evaluation.',
    evidenceBasis: 'no_evidence',
    redFlagSignals: [
      'Quality claims rest on unrepeatable demo screenshots',
      'No documented evaluation harness or regression suite',
      'Single named engineer carries the differentiating capability',
    ],
    greenFlagSignals: [],
    governanceConsiderations: [
      'Reject for tenant pilot until an independent evaluation harness exists',
    ],
    notRecommendedReason:
      'No documented evaluation evidence, no regression posture, and a single point of failure on the differentiating capability.',
  },
  {
    vendorPlaceholderId: 'vendor_data_fabric_001',
    category: 'data_fabric',
    readiness: 'production_ready',
    capabilityFitNote:
      'Placeholder profile representing a data fabric candidate with mature governed retrieval, semantic layer, and residency controls.',
    evidenceBasis: 'security_questionnaire',
    redFlagSignals: [],
    greenFlagSignals: [
      'Tenant-isolated retrieval indexes with residency pinning',
      'Semantic layer with documented lineage and audit export',
    ],
    governanceConsiderations: [
      'Require export-on-exit clauses for tenant-owned indexes and embeddings',
    ],
    notRecommendedReason: null,
  },
  {
    vendorPlaceholderId: 'vendor_data_fabric_002',
    category: 'data_fabric',
    readiness: 'unknown',
    capabilityFitNote:
      'Placeholder profile representing a data fabric candidate whose capability fit is asserted but not yet verified through any documented basis.',
    evidenceBasis: 'no_evidence',
    redFlagSignals: [
      'No tenant-runnable proof of governed retrieval over tenant corpora',
    ],
    greenFlagSignals: [],
    governanceConsiderations: [
      'Treat readiness as unknown until a hands-on evaluation produces signal',
    ],
    notRecommendedReason: null,
  },
  {
    vendorPlaceholderId: 'vendor_agent_platform_001',
    category: 'agent_platform',
    readiness: 'pilot_ready',
    capabilityFitNote:
      'Placeholder profile representing an agent runtime platform candidate that isolates agent workloads with policy controls and durable execution.',
    evidenceBasis: 'hands_on_evaluation',
    redFlagSignals: [
      'Policy engine for tool access does not yet expose tenant-editable rules',
    ],
    greenFlagSignals: [
      'Durable execution with replay across crash boundaries',
      'Resource quotas enforced per tenant agent',
    ],
    governanceConsiderations: [
      'Require tenant-editable policy rules before production promotion',
    ],
    notRecommendedReason: null,
  },
  {
    vendorPlaceholderId: 'vendor_observability_001',
    category: 'observability',
    readiness: 'pilot_ready',
    capabilityFitNote:
      'Placeholder profile representing an AI / agent observability candidate with prompt and tool trace capture plus cost attribution.',
    evidenceBasis: 'tenant_observed_signal',
    redFlagSignals: [
      'Regression alerting requires manual baseline curation',
    ],
    greenFlagSignals: [
      'Cost and latency attribution at the per-trace level',
    ],
    governanceConsiderations: [
      'Require redacted-trace storage aligned to tenant retention policy',
    ],
    notRecommendedReason: null,
  },
  {
    vendorPlaceholderId: 'vendor_security_001',
    category: 'security',
    readiness: 'preliminary',
    capabilityFitNote:
      'Placeholder profile representing an AI security candidate with prompt injection detection and output redaction primitives.',
    evidenceBasis: 'security_questionnaire',
    redFlagSignals: [
      'Detection coverage skewed to known patterns; novel attack class evidence is thin',
    ],
    greenFlagSignals: [
      'Output redaction integrated with tenant DLP policies',
    ],
    governanceConsiderations: [
      'Require red-team evidence covering tenant-relevant attack classes before pilot',
    ],
    notRecommendedReason: null,
  },
  {
    vendorPlaceholderId: 'vendor_security_002',
    category: 'security',
    readiness: 'not_recommended',
    capabilityFitNote:
      'Placeholder profile representing an AI security candidate whose marketing claims outrun documented controls.',
    evidenceBasis: 'no_evidence',
    redFlagSignals: [
      'No documented red-team posture',
      'No tenant-isolation envelope assertions',
      'Incident history is undisclosed or marketing-curated',
    ],
    greenFlagSignals: [],
    governanceConsiderations: [
      'Reject for tenant pilot until controls are documented and independently attested',
    ],
    notRecommendedReason:
      'No documented red-team posture, no tenant-isolation envelope assertions, and no transparent incident history.',
  },
  {
    vendorPlaceholderId: 'vendor_evaluation_001',
    category: 'evaluation',
    readiness: 'pilot_ready',
    capabilityFitNote:
      'Placeholder profile representing an evaluation harness candidate with golden-set management and benchmark gating primitives.',
    evidenceBasis: 'hands_on_evaluation',
    redFlagSignals: [
      'Drift detection requires manual configuration per workload',
    ],
    greenFlagSignals: [
      'Tenant-runnable eval harness with documented methodology',
      'Benchmark gating for release decisions integrated with CI',
    ],
    governanceConsiderations: [
      'Require eval data residency controls aligned to tenant policy',
    ],
    notRecommendedReason: null,
  },
  {
    vendorPlaceholderId: 'vendor_other_001',
    category: 'other',
    readiness: 'unknown',
    capabilityFitNote:
      'Placeholder profile representing a specialty modality vendor whose category fit is documented but whose enterprise posture is unverified.',
    evidenceBasis: 'public_documentation',
    redFlagSignals: [
      'No documented enterprise support tiering or escalation matrix',
    ],
    greenFlagSignals: [],
    governanceConsiderations: [
      'Treat as out-of-scope for tenant pilot until enterprise readiness is documented',
    ],
    notRecommendedReason: null,
  },
];

// ---------------------------------------------------------------------
// Listing helpers
// ---------------------------------------------------------------------

export function listVendorCategories(): readonly VendorIntelligenceCategoryMetadata[] {
  return CATEGORY_LIST;
}

// ---------------------------------------------------------------------
// Seed builder
// ---------------------------------------------------------------------

export function buildVendorAssessmentSeed(): VendorIntelligenceSeed {
  return {
    assessments: ASSESSMENT_SEED,
    createdFrom: 'deterministic_vendor_startup_intelligence_seed',
  };
}

// ---------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------

function emptyCategoryCounts(): Record<VendorIntelligenceCategory, number> {
  return {
    cdp: 0,
    cx_ai: 0,
    ams: 0,
    data_fabric: 0,
    agent_platform: 0,
    observability: 0,
    security: 0,
    evaluation: 0,
    other: 0,
  };
}

function emptyReadinessCounts(): Record<VendorAssessmentReadiness, number> {
  return {
    unknown: 0,
    preliminary: 0,
    pilot_ready: 0,
    production_ready: 0,
    not_recommended: 0,
  };
}

export function summarizeVendorAssessments(
  assessments: readonly VendorAssessment[],
): VendorIntelligenceSummary {
  const byCategory = emptyCategoryCounts();
  const byReadiness = emptyReadinessCounts();
  let notRecommendedCount = 0;
  let hasUnknownReadiness = false;
  let pilotOrProductionReadyCount = 0;

  for (const a of assessments) {
    byCategory[a.category] += 1;
    byReadiness[a.readiness] += 1;
    if (a.readiness === 'not_recommended') {
      notRecommendedCount += 1;
    }
    if (a.readiness === 'unknown') {
      hasUnknownReadiness = true;
    }
    if (a.readiness === 'pilot_ready' || a.readiness === 'production_ready') {
      pilotOrProductionReadyCount += 1;
    }
  }

  return {
    totalAssessments: assessments.length,
    byCategory,
    byReadiness,
    notRecommendedCount,
    hasUnknownReadiness,
    pilotOrProductionReadyCount,
  };
}

// ---------------------------------------------------------------------
// Filter helpers
// ---------------------------------------------------------------------

export function getNotRecommendedVendors(
  assessments: readonly VendorAssessment[],
): readonly VendorAssessment[] {
  return assessments.filter((a) => a.readiness === 'not_recommended');
}
