/**
 * SOL15 · Solution Pattern Playbook
 *
 * Deterministic playbook generator that maps solution archetypes to
 * recommended workshops, key deliverables, and risk flags.
 *
 * No model calls. No DB writes. No React hooks.
 */

import {
  SOLUTION_ARCHETYPE_KEYS,
  SOLUTION_ARCHETYPES,
  type SolutionArchetypeKey,
} from '@/lib/solutions/solution-archetype-registry';
import { buildWorkshopTemplateLibrary } from '@/lib/programs/workshop-template-library';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface PatternPlaybookWorkshop {
  templateId: string;
  templateName: string;
  rationale: string;
}

export interface PatternPlaybookDeliverable {
  id: string;
  label: string;
  phase: string;
}

export interface PatternPlaybookRiskFlag {
  id: string;
  label: string;
  severity: 'high' | 'medium' | 'low';
}

export interface PatternPlaybook {
  archetypeId: string;
  archetypeLabel: string;
  recommendedWorkshops: ReadonlyArray<PatternPlaybookWorkshop>;
  keyDeliverables: ReadonlyArray<PatternPlaybookDeliverable>;
  riskFlags: ReadonlyArray<PatternPlaybookRiskFlag>;
  coverageScore: number;
  createdFrom: 'sol15_pattern_playbook';
}

// ---------------------------------------------------------------------------
// Canonical total workshop count (7 canonical templates in the library)
// ---------------------------------------------------------------------------

const CANONICAL_WORKSHOP_COUNT = 7;

// ---------------------------------------------------------------------------
// Deliverable catalogue (canonical IDs)
// ---------------------------------------------------------------------------

const DELIVERABLES: Record<string, PatternPlaybookDeliverable> = {
  executive_brief: {
    id: 'executive_brief',
    label: 'Executive Brief',
    phase: 'Framing',
  },
  architecture_draft: {
    id: 'architecture_draft',
    label: 'Architecture Draft',
    phase: 'Design',
  },
  program_charter: {
    id: 'program_charter',
    label: 'Program Charter',
    phase: 'Discovery',
  },
  solution_summary: {
    id: 'solution_summary',
    label: 'Solution Summary',
    phase: 'Framing',
  },
  roi_model: {
    id: 'roi_model',
    label: 'ROI Model',
    phase: 'Value',
  },
};

// ---------------------------------------------------------------------------
// Static per-archetype workshop selections (templateId → rationale)
// Workshop template IDs from the canonical library:
//   wstpl:discovery:current_state_walk
//   wstpl:discovery:opportunity_map
//   wstpl:framing:use_case_prioritization
//   wstpl:value:baseline_and_target
//   wstpl:governance:risk_review
//   wstpl:architecture:solution_design
//   wstpl:adoption:change_readiness
//   wstpl:executive_review:decision_review
// ---------------------------------------------------------------------------

interface WorkshopSelection {
  templateId: string;
  rationale: string;
}

const ARCHETYPE_WORKSHOP_MAP: Record<SolutionArchetypeKey, ReadonlyArray<WorkshopSelection>> = {
  ai_led_pdlc_transformation: [
    {
      templateId: 'wstpl:discovery:current_state_walk',
      rationale: 'Map current PDLC toolchain and handoff friction before introducing AI layers.',
    },
    {
      templateId: 'wstpl:framing:use_case_prioritization',
      rationale: 'Rank AI-assist opportunities across PDLC phases by impact and feasibility.',
    },
    {
      templateId: 'wstpl:architecture:solution_design',
      rationale: 'Design the AI-augmented PDLC pipeline and integration touch-points.',
    },
    {
      templateId: 'wstpl:adoption:change_readiness',
      rationale: 'Assess team readiness and build adoption plan for AI-assisted workflows.',
    },
  ],

  analytics_modernization: [
    {
      templateId: 'wstpl:discovery:current_state_walk',
      rationale: 'Baseline existing analytics stack, data lineage, and reporting gaps.',
    },
    {
      templateId: 'wstpl:value:baseline_and_target',
      rationale: 'Quantify analytics latency and accuracy improvements expected post-migration.',
    },
    {
      templateId: 'wstpl:architecture:solution_design',
      rationale: 'Design modern lakehouse or semantic-layer target architecture.',
    },
  ],

  healthcare_ambient_clinical_value_chain: [
    {
      templateId: 'wstpl:discovery:current_state_walk',
      rationale: 'Walk the clinical encounter workflow to identify ambient-capture integration points.',
    },
    {
      templateId: 'wstpl:governance:risk_review',
      rationale: 'Surface HIPAA, PHI handling, and ambient-consent governance requirements early.',
    },
    {
      templateId: 'wstpl:architecture:solution_design',
      rationale: 'Define ambient-capture-to-EHR pipeline and NLP post-processing architecture.',
    },
    {
      templateId: 'wstpl:adoption:change_readiness',
      rationale: 'Assess clinician readiness and malpractice/liability considerations.',
    },
  ],

  hcc_risk_adjustment_coding_accuracy: [
    {
      templateId: 'wstpl:discovery:opportunity_map',
      rationale: 'Identify high-value HCC coding gaps across payer and provider segments.',
    },
    {
      templateId: 'wstpl:value:baseline_and_target',
      rationale: 'Establish baseline RAF capture rate and model improvement target.',
    },
    {
      templateId: 'wstpl:governance:risk_review',
      rationale: 'Review CMS audit exposure and AI model explainability requirements.',
    },
  ],

  prior_authorization_utilization_management: [
    {
      templateId: 'wstpl:discovery:current_state_walk',
      rationale: 'Map current PA workflow, denial patterns, and manual review bottlenecks.',
    },
    {
      templateId: 'wstpl:framing:use_case_prioritization',
      rationale: 'Prioritize automation targets by denial rate and clinical complexity.',
    },
    {
      templateId: 'wstpl:governance:risk_review',
      rationale: 'Address CMS real-time PA mandates and adverse-action explainability.',
    },
    {
      templateId: 'wstpl:executive_review:decision_review',
      rationale: 'Align payer leadership on auto-approval thresholds and override workflows.',
    },
  ],

  kyc_customer_onboarding_ai: [
    {
      templateId: 'wstpl:discovery:current_state_walk',
      rationale: 'Document current KYC document-review steps and manual verification latency.',
    },
    {
      templateId: 'wstpl:governance:risk_review',
      rationale: 'Identify AML/BSA regulatory constraints on automated identity decisions.',
    },
    {
      templateId: 'wstpl:architecture:solution_design',
      rationale: 'Design AI-assisted document-extraction and identity-matching pipeline.',
    },
  ],

  predictive_maintenance_modernization: [
    {
      templateId: 'wstpl:discovery:opportunity_map',
      rationale: 'Map asset classes, sensor coverage, and failure-mode history.',
    },
    {
      templateId: 'wstpl:value:baseline_and_target',
      rationale: 'Baseline unplanned downtime cost and set predictive-model precision targets.',
    },
    {
      templateId: 'wstpl:architecture:solution_design',
      rationale: 'Architect IoT ingestion, feature engineering, and inference-at-edge pipeline.',
    },
    {
      templateId: 'wstpl:adoption:change_readiness',
      rationale: 'Prepare maintenance crews for AI-driven work-order generation.',
    },
  ],

  build_buy_partner_evaluation: [
    {
      templateId: 'wstpl:discovery:opportunity_map',
      rationale: 'Enumerate capability gaps that drive the build / buy / partner decision.',
    },
    {
      templateId: 'wstpl:framing:use_case_prioritization',
      rationale: 'Score and rank options across strategic fit, time-to-value, and total cost.',
    },
    {
      templateId: 'wstpl:executive_review:decision_review',
      rationale: 'Present scorecard findings to leadership and land the go-forward decision.',
    },
  ],

  service_operations_agentic_automation: [
    {
      templateId: 'wstpl:discovery:current_state_walk',
      rationale: 'Walk the service-desk ticket lifecycle to identify repetitive agent tasks.',
    },
    {
      templateId: 'wstpl:framing:use_case_prioritization',
      rationale: 'Rank agentic automation candidates by volume, resolution rate, and CSAT impact.',
    },
    {
      templateId: 'wstpl:governance:risk_review',
      rationale: 'Define human-in-the-loop escalation policy and audit requirements for autonomous actions.',
    },
    {
      templateId: 'wstpl:architecture:solution_design',
      rationale: 'Design multi-agent orchestration, tool-use surface, and CRM integration layer.',
    },
  ],

  ai_governance_operating_model: [
    {
      templateId: 'wstpl:discovery:opportunity_map',
      rationale: 'Inventory active AI/ML initiatives and governance gaps across the enterprise.',
    },
    {
      templateId: 'wstpl:governance:risk_review',
      rationale: 'Assess regulatory exposure (EU AI Act, NIST RMF) and model-risk policy readiness.',
    },
    {
      templateId: 'wstpl:executive_review:decision_review',
      rationale: 'Secure executive commitment to AI governance charter and RACI structure.',
    },
  ],

  contact_center_ai_transformation: [
    {
      templateId: 'wstpl:discovery:current_state_walk',
      rationale: 'Map IVR flows, agent desktop, and escalation paths to find automation seams.',
    },
    {
      templateId: 'wstpl:value:baseline_and_target',
      rationale: 'Baseline AHT, CSAT, and containment rate; set improvement targets.',
    },
    {
      templateId: 'wstpl:architecture:solution_design',
      rationale: 'Design conversational-AI and agent-assist integration architecture.',
    },
  ],

  finance_fpna_ai_automation: [
    {
      templateId: 'wstpl:discovery:current_state_walk',
      rationale: 'Document current FP&A cycle: data pulls, model maintenance, and narrative drafting.',
    },
    {
      templateId: 'wstpl:value:baseline_and_target',
      rationale: 'Quantify cycle-time reduction and analyst-hour savings from AI-assisted forecasting.',
    },
    {
      templateId: 'wstpl:governance:risk_review',
      rationale: 'Address SOX controls and auditability requirements for AI-generated financial outputs.',
    },
    {
      templateId: 'wstpl:adoption:change_readiness',
      rationale: 'Prepare finance team for co-pilot workflow and model-output review practices.',
    },
  ],
};

// ---------------------------------------------------------------------------
// Per-archetype deliverable selections (3–5 entries each)
// ---------------------------------------------------------------------------

const ARCHETYPE_DELIVERABLE_MAP: Record<SolutionArchetypeKey, ReadonlyArray<string>> = {
  ai_led_pdlc_transformation: ['program_charter', 'architecture_draft', 'executive_brief', 'solution_summary'],
  analytics_modernization: ['architecture_draft', 'roi_model', 'executive_brief', 'solution_summary'],
  healthcare_ambient_clinical_value_chain: ['program_charter', 'architecture_draft', 'executive_brief', 'solution_summary', 'roi_model'],
  hcc_risk_adjustment_coding_accuracy: ['solution_summary', 'roi_model', 'executive_brief'],
  prior_authorization_utilization_management: ['program_charter', 'solution_summary', 'roi_model', 'executive_brief'],
  kyc_customer_onboarding_ai: ['architecture_draft', 'solution_summary', 'executive_brief'],
  predictive_maintenance_modernization: ['architecture_draft', 'roi_model', 'program_charter', 'executive_brief'],
  build_buy_partner_evaluation: ['executive_brief', 'solution_summary', 'roi_model'],
  service_operations_agentic_automation: ['program_charter', 'architecture_draft', 'solution_summary', 'roi_model'],
  ai_governance_operating_model: ['executive_brief', 'solution_summary', 'program_charter'],
  contact_center_ai_transformation: ['architecture_draft', 'roi_model', 'executive_brief', 'solution_summary'],
  finance_fpna_ai_automation: ['solution_summary', 'roi_model', 'executive_brief', 'program_charter'],
};

// ---------------------------------------------------------------------------
// Per-archetype risk flags (2–3 entries each)
// ---------------------------------------------------------------------------

const ARCHETYPE_RISK_MAP: Record<SolutionArchetypeKey, ReadonlyArray<PatternPlaybookRiskFlag>> = {
  ai_led_pdlc_transformation: [
    { id: 'toolchain_lock_in', label: 'AI toolchain vendor lock-in risk', severity: 'medium' },
    { id: 'developer_adoption_lag', label: 'Developer adoption lag without structured change management', severity: 'high' },
    { id: 'quality_gate_bypass', label: 'Quality gates bypassed if AI output is auto-merged', severity: 'medium' },
  ],
  analytics_modernization: [
    { id: 'data_lineage_gaps', label: 'Data lineage gaps increase compliance exposure', severity: 'high' },
    { id: 'migration_downtime', label: 'Analytics downtime during cutover affects reporting cadence', severity: 'medium' },
  ],
  healthcare_ambient_clinical_value_chain: [
    { id: 'phi_exposure', label: 'PHI exposure through ambient audio capture', severity: 'high' },
    { id: 'clinical_trust_deficit', label: 'Clinician trust deficit in AI-generated notes', severity: 'high' },
    { id: 'hipaa_consent_gaps', label: 'Ambient consent workflow gaps under HIPAA', severity: 'medium' },
  ],
  hcc_risk_adjustment_coding_accuracy: [
    { id: 'cms_audit_risk', label: 'CMS audit risk from over-coded HCC categories', severity: 'high' },
    { id: 'model_explainability', label: 'Lack of model explainability for payer audits', severity: 'medium' },
  ],
  prior_authorization_utilization_management: [
    { id: 'cms_mandate_compliance', label: 'Non-compliance with CMS real-time PA mandates', severity: 'high' },
    { id: 'adverse_action_liability', label: 'Liability from unexplained automated denials', severity: 'high' },
    { id: 'override_workflow_gaps', label: 'Clinician override workflow not designed upfront', severity: 'medium' },
  ],
  kyc_customer_onboarding_ai: [
    { id: 'false_positive_friction', label: 'High false-positive rate increases onboarding friction', severity: 'medium' },
    { id: 'regulatory_model_risk', label: 'Regulatory model-risk requirements for automated ID decisions', severity: 'high' },
  ],
  predictive_maintenance_modernization: [
    { id: 'sensor_coverage_gaps', label: 'Incomplete sensor coverage limits model accuracy', severity: 'medium' },
    { id: 'false_alarm_fatigue', label: 'Alert fatigue from high false-positive maintenance triggers', severity: 'medium' },
    { id: 'integration_complexity', label: 'Legacy CMMS integration complexity delays time-to-value', severity: 'low' },
  ],
  build_buy_partner_evaluation: [
    { id: 'evaluation_bias', label: 'Evaluation bias toward existing vendor relationships', severity: 'medium' },
    { id: 'tco_underestimation', label: 'TCO underestimation for build option', severity: 'high' },
  ],
  service_operations_agentic_automation: [
    { id: 'agent_hallucination', label: 'Agentic hallucination in customer-facing resolutions', severity: 'high' },
    { id: 'escalation_policy_gaps', label: 'Undefined human-in-the-loop escalation triggers', severity: 'high' },
    { id: 'audit_trail_completeness', label: 'Incomplete audit trail for autonomous agent actions', severity: 'medium' },
  ],
  ai_governance_operating_model: [
    { id: 'shadow_ai_proliferation', label: 'Shadow AI initiatives proliferate outside governance scope', severity: 'high' },
    { id: 'raci_clarity', label: 'Unclear RACI for model risk ownership across business units', severity: 'medium' },
  ],
  contact_center_ai_transformation: [
    { id: 'ivr_containment_overfit', label: 'Over-optimization for containment reduces CSAT', severity: 'medium' },
    { id: 'agent_displacement_backlash', label: 'Agent displacement concerns hinder adoption', severity: 'high' },
  ],
  finance_fpna_ai_automation: [
    { id: 'sox_auditability', label: 'AI-generated forecasts lack SOX-compliant audit trail', severity: 'high' },
    { id: 'model_drift', label: 'Forecast model drift during macroeconomic regime changes', severity: 'medium' },
    { id: 'analyst_over_reliance', label: 'Analyst over-reliance on AI narratives without critical review', severity: 'low' },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveWorkshopName(templateId: string): string {
  const templates = buildWorkshopTemplateLibrary();
  const match = templates.find((t) => t.id === templateId);
  return match ? match.title : templateId;
}

// ---------------------------------------------------------------------------
// Core builder
// ---------------------------------------------------------------------------

/**
 * Build a deterministic `PatternPlaybook` for the given archetype ID.
 * Returns `null` if the ID is not in the canonical archetype list.
 */
export function buildPatternPlaybook(archetypeId: string): PatternPlaybook | null {
  const key = archetypeId as SolutionArchetypeKey;
  if (!SOLUTION_ARCHETYPE_KEYS.includes(key)) return null;

  const archetype = SOLUTION_ARCHETYPES[key];
  const workshopSelections = ARCHETYPE_WORKSHOP_MAP[key];
  const deliverableIds = ARCHETYPE_DELIVERABLE_MAP[key];
  const riskFlags = ARCHETYPE_RISK_MAP[key];

  const recommendedWorkshops: PatternPlaybookWorkshop[] = workshopSelections.map((ws) => ({
    templateId: ws.templateId,
    templateName: resolveWorkshopName(ws.templateId),
    rationale: ws.rationale,
  }));

  const keyDeliverables: PatternPlaybookDeliverable[] = deliverableIds.map(
    (id) => DELIVERABLES[id],
  );

  const coverageScore = recommendedWorkshops.length / CANONICAL_WORKSHOP_COUNT;

  return {
    archetypeId: key,
    archetypeLabel: archetype.name,
    recommendedWorkshops,
    keyDeliverables,
    riskFlags: [...riskFlags],
    coverageScore,
    createdFrom: 'sol15_pattern_playbook',
  };
}

/**
 * Build playbooks for all 12 canonical archetypes, sorted by `archetypeId`.
 */
export function buildPatternPlaybookSummary(): ReadonlyArray<PatternPlaybook> {
  return [...SOLUTION_ARCHETYPE_KEYS]
    .map((key) => buildPatternPlaybook(key))
    .filter((pb): pb is PatternPlaybook => pb !== null)
    .sort((a, b) => a.archetypeId.localeCompare(b.archetypeId));
}
