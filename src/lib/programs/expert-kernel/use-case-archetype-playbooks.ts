// Moves Expert Kernel — use-case archetype depth.
//
// This closes the "industry-specific depth" gap at the kernel layer. These are
// not UI cards; they are expert priors the agent must use before it sizes or
// shapes a Move. Each archetype names the diagnostic questions, baseline
// metrics, kill logic, and Tower measurement spine.

export type MovesUseCaseArchetype =
  | 'contact_center_ai'
  | 'pricing_margin_ai'
  | 'clinical_workflow_ai'
  | 'model_risk_ai'
  | 'workforce_automation'
  | 'document_intelligence'
  | 'analytics_modernization'
  | 'marketing_personalization';

export interface ArchetypePlaybook {
  archetype: MovesUseCaseArchetype;
  label: string;
  primaryDecision: string;
  diagnosticQuestions: string[];
  requiredBaselineMetrics: string[];
  killConditions: string[];
  valueDrivers: string[];
  towerMeasurements: string[];
}

export const MOVES_ARCHETYPE_PLAYBOOKS: Record<MovesUseCaseArchetype, ArchetypePlaybook> = {
  contact_center_ai: {
    archetype: 'contact_center_ai',
    label: 'Contact center AI',
    primaryDecision: 'Should we fund agent-assist, routing, or autonomous resolution?',
    diagnosticQuestions: [
      'What is annual contact volume by channel and intent?',
      'What is fully loaded cost per contact and cost per agent hour?',
      'Where are AHT, containment, FCR, transfer, and QA defects off target?',
      'Which intents are eligible for automation versus human approval?',
      'What transcript, privacy, and workforce constraints limit autonomy?',
    ],
    requiredBaselineMetrics: [
      'contact_volume_annual',
      'cost_per_contact_usd',
      'aht_minutes',
      'containment_pct',
      'fcr_pct',
      'qa_error_rate_pct',
      'channel_mix',
    ],
    killConditions: [
      'No contact volume or cost-per-contact baseline exists.',
      'Privacy review blocks the transcript or routing signals needed for the use case.',
      'Containment target depends on intents that policy requires humans to handle.',
    ],
    valueDrivers: ['labour capacity', 'containment', 'transfer reduction', 'quality consistency'],
    towerMeasurements: ['cost_per_contact_usd', 'containment_pct', 'fcr_pct', 'csat', 'qa_error_rate_pct'],
  },
  pricing_margin_ai: {
    archetype: 'pricing_margin_ai',
    label: 'Pricing and margin AI',
    primaryDecision: 'Should we fund pricing intelligence, markdown optimization, or margin recovery?',
    diagnosticQuestions: [
      'Which category, channel, or customer segment carries the margin gap?',
      'What is the baseline price elasticity and promo depth by segment?',
      'Which constraints are hard: vendor funding, MAP, inventory, brand equity, legal?',
      'What decision cadence and override rate exist today?',
    ],
    requiredBaselineMetrics: [
      'gross_margin_bps',
      'promo_depth_pct',
      'markdown_rate_pct',
      'inventory_turns',
      'override_rate_pct',
    ],
    killConditions: [
      'Finance cannot reconcile baseline margin to the P&L.',
      'The forecast depends on elasticity assumptions not observed in the tenant data.',
      'Brand or legal constraints prevent the recommended price action.',
    ],
    valueDrivers: ['margin recovery', 'markdown avoidance', 'promo efficiency', 'inventory productivity'],
    towerMeasurements: ['gross_margin_bps', 'markdown_rate_pct', 'sell_through_pct', 'promo_roi'],
  },
  clinical_workflow_ai: {
    archetype: 'clinical_workflow_ai',
    label: 'Clinical workflow AI',
    primaryDecision: 'Should we fund a clinician workflow assistant, routing agent, or documentation copilot?',
    diagnosticQuestions: [
      'Which clinician workflow has measurable delay, rework, or burnout pressure?',
      'What EHR integration, safety, and clinical-governance gates are mandatory?',
      'Which decisions stay with licensed clinicians?',
      'What operational metric proves value without requiring PHI in the product layer?',
    ],
    requiredBaselineMetrics: [
      'clinician_minutes_per_case',
      'documentation_lag_hours',
      'queue_backlog',
      'rework_rate_pct',
      'adoption_rate_pct',
    ],
    killConditions: [
      'The use case requires patient-level PHI where the deployment lane forbids it.',
      'Clinical governance cannot name accountable human decision rights.',
      'The EHR integration path is unresolved at funding gate.',
    ],
    valueDrivers: ['time back to clinicians', 'queue reduction', 'coding quality', 'workflow consistency'],
    towerMeasurements: ['documentation_lag_hours', 'clinician_minutes_per_case', 'adoption_rate_pct'],
  },
  model_risk_ai: {
    archetype: 'model_risk_ai',
    label: 'Model risk and regulated AI',
    primaryDecision: 'Should we fund a regulated model, surveillance agent, or model-risk control capability?',
    diagnosticQuestions: [
      'Which regulation or consent-order obligation creates the business need?',
      'What model inventory, validation, monitoring, and issue-management evidence exists?',
      'Which decisions require human approval under SR 11-7 or equivalent policy?',
      'What audit evidence must be generated by design?',
    ],
    requiredBaselineMetrics: [
      'model_inventory_coverage_pct',
      'validation_cycle_time_days',
      'issue_backlog',
      'false_positive_rate_pct',
      'audit_findings_open',
    ],
    killConditions: [
      'No model owner or independent validator is named.',
      'The solution cannot produce audit evidence for recommendations and overrides.',
      'The vendor or internal model fails mandatory validation criteria.',
    ],
    valueDrivers: ['risk reduction', 'investigation productivity', 'audit readiness', 'control consistency'],
    towerMeasurements: ['validation_cycle_time_days', 'issue_backlog', 'audit_findings_open'],
  },
  workforce_automation: {
    archetype: 'workforce_automation',
    label: 'Workforce automation',
    primaryDecision: 'Should we fund scheduling, task allocation, or operational workforce automation?',
    diagnosticQuestions: [
      'Where is the labour variance: overtime, shrinkage, fill rate, service level, or attrition?',
      'What labour rules, union constraints, or manager overrides shape the decision?',
      'What intervention is acceptable to frontline leaders?',
    ],
    requiredBaselineMetrics: [
      'overtime_hours',
      'schedule_adherence_pct',
      'fill_rate_pct',
      'manager_override_rate_pct',
      'service_level_pct',
    ],
    killConditions: [
      'Labour-rule constraints are not encoded or owned.',
      'The value case assumes adoption by managers who are not accountable for the metric.',
    ],
    valueDrivers: ['overtime reduction', 'service-level recovery', 'manager productivity'],
    towerMeasurements: ['overtime_hours', 'schedule_adherence_pct', 'service_level_pct'],
  },
  document_intelligence: {
    archetype: 'document_intelligence',
    label: 'Document intelligence',
    primaryDecision: 'Should we fund extraction, review, or workflow routing over documents?',
    diagnosticQuestions: [
      'What document classes, volumes, and exception rates define the workload?',
      'What is the current manual review cost and cycle time?',
      'Which fields require human attestation or legal review?',
    ],
    requiredBaselineMetrics: [
      'document_volume',
      'manual_review_minutes',
      'exception_rate_pct',
      'straight_through_rate_pct',
      'error_rate_pct',
    ],
    killConditions: [
      'Document volume or exception rate is not recorded.',
      'Required review decisions cannot be safely bounded for human approval.',
    ],
    valueDrivers: ['cycle-time reduction', 'review capacity', 'error reduction'],
    towerMeasurements: ['straight_through_rate_pct', 'manual_review_minutes', 'error_rate_pct'],
  },
  analytics_modernization: {
    archetype: 'analytics_modernization',
    label: 'Analytics modernization',
    primaryDecision: 'Should we fund data platform, semantic layer, or decision-intelligence modernization?',
    diagnosticQuestions: [
      'Which executive decision is delayed or distrusted because of analytics gaps?',
      'What duplicated stack, manual reporting, or reconciliation burden exists today?',
      'What data ownership and quality controls are missing?',
    ],
    requiredBaselineMetrics: [
      'report_cycle_time_days',
      'manual_reconciliation_hours',
      'data_quality_defects',
      'platform_run_cost_usd',
      'decision_latency_days',
    ],
    killConditions: [
      'No named executive decision depends on the modernization.',
      'Data ownership is unresolved across source systems.',
    ],
    valueDrivers: ['decision speed', 'run-cost reduction', 'trust in metrics', 'data-product reuse'],
    towerMeasurements: ['report_cycle_time_days', 'manual_reconciliation_hours', 'data_quality_defects'],
  },
  marketing_personalization: {
    archetype: 'marketing_personalization',
    label: 'Marketing personalization',
    primaryDecision: 'Should we fund next-best-action, offer decisioning, or personalization?',
    diagnosticQuestions: [
      'Which customer segment and journey moment carries the conversion or retention gap?',
      'What consent, channel, and margin guardrails constrain activation?',
      'What is the baseline lift, holdout discipline, and offer economics?',
    ],
    requiredBaselineMetrics: [
      'conversion_rate_pct',
      'retention_rate_pct',
      'offer_margin_usd',
      'consent_coverage_pct',
      'holdout_lift_pct',
    ],
    killConditions: [
      'No holdout or measurement design exists.',
      'Consent coverage or margin guardrails block activation.',
    ],
    valueDrivers: ['conversion lift', 'retention lift', 'offer margin', 'media efficiency'],
    towerMeasurements: ['conversion_rate_pct', 'holdout_lift_pct', 'offer_margin_usd'],
  },
};

export function getMovesArchetypePlaybook(
  archetype: MovesUseCaseArchetype,
): ArchetypePlaybook {
  return MOVES_ARCHETYPE_PLAYBOOKS[archetype];
}
