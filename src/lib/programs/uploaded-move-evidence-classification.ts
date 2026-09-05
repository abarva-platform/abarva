import type { EvidenceType } from './evidence-ingestion';

type MoveEvidenceType =
  | 'business_interview'
  | 'current_state_systems_data'
  | 'ticket_evidence'
  | 'control_evidence'
  | 'value_evidence'
  | 'kpi_value_baseline'
  | 'data_quality_governance'
  | 'solution_options_decision'
  | 'roadmap_estimation'
  | 'adoption_change'
  | 'approval'
  | 'other';

type MoveArtifactConsumer =
  | 'p2_discovery'
  | 'p3_solution_options'
  | 'p4_roadmap'
  | 'p4_business_case'
  | 'p5_handoff'
  | 'discovery_report'
  | 'solution_approach_options'
  | 'target_state_architecture'
  | 'execution_roadmap'
  | 'business_case'
  | 'handoff_package'
  | 'measurement_contract';

export interface UploadedMoveEvidenceClassification {
  evidenceType: MoveEvidenceType;
  sourceType: 'real_upload';
  slotIds: string[];
  artifactConsumers: MoveArtifactConsumer[];
  whatFound: string[];
  whereUsed: string[];
}

const DEFAULT_BY_PHASE: Record<number, UploadedMoveEvidenceClassification> = {
  2: {
    evidenceType: 'current_state_systems_data',
    sourceType: 'real_upload',
    slotIds: ['p2_business_current_state', 'p2_process_pain_points'],
    artifactConsumers: ['p2_discovery', 'discovery_report'],
    whatFound: ['current-state evidence'],
    whereUsed: ['P2 Discover & Diagnose', 'P3 Design Future State'],
  },
  3: {
    evidenceType: 'solution_options_decision',
    sourceType: 'real_upload',
    slotIds: ['p3_options_discovery_findings', 'p3_solution_principles', 'p3_two_options'],
    artifactConsumers: ['p3_solution_options', 'solution_approach_options'],
    whatFound: ['solution approach evidence'],
    whereUsed: ['P3 Design Future State', 'P4 Roadmap & Business Case'],
  },
  4: {
    evidenceType: 'roadmap_estimation',
    sourceType: 'real_upload',
    slotIds: ['p4_roadmap_workstreams', 'p4_roadmap_dependencies', 'p4_roadmap_owners'],
    artifactConsumers: ['p4_roadmap', 'execution_roadmap'],
    whatFound: ['roadmap and planning evidence'],
    whereUsed: ['P4 Roadmap & Business Case', 'P5 Approval & Mobilization'],
  },
  5: {
    evidenceType: 'adoption_change',
    sourceType: 'real_upload',
    slotIds: ['p5_raci_owner_model', 'p5_30_60_90_actions'],
    artifactConsumers: ['p5_handoff', 'handoff_package'],
    whatFound: ['execution readiness evidence'],
    whereUsed: ['P5 Approval & Mobilization', 'Tower Track Outcomes'],
  },
};

const PHASE_TWO_RULES: Array<[RegExp, UploadedMoveEvidenceClassification]> = [
  [
    /contract request|request log|legal work queue|work queue/i,
    {
      evidenceType: 'ticket_evidence',
      sourceType: 'real_upload',
      slotIds: [
        'p2_business_current_state',
        'p2_process_pain_points',
        'p2_volumetrics_baseline',
        'p2_operational_work_item_evidence',
      ],
      artifactConsumers: ['p2_discovery', 'discovery_report', 'business_case'],
      whatFound: ['request volume', 'queue aging', 'status and bottleneck signals'],
      whereUsed: ['P2 current-state diagnosis', 'P4 value baseline'],
    },
  ],
  [
    /cycle time|baseline|metric|kpi/i,
    {
      evidenceType: 'kpi_value_baseline',
      sourceType: 'real_upload',
      slotIds: ['p2_process_pain_points', 'p2_volumetrics_baseline', 'p2_data_quality_signal'],
      artifactConsumers: ['p2_discovery', 'discovery_report', 'business_case', 'measurement_contract'],
      whatFound: ['cycle-time baseline', 'volume trend', 'metric confidence signal'],
      whereUsed: ['P2 diagnosis', 'P4 business case', 'Tower measurement'],
    },
  ],
  [
    /missing intake|missing field|obligation gap|policy exception/i,
    {
      evidenceType: 'data_quality_governance',
      sourceType: 'real_upload',
      slotIds: ['p2_data_quality_signal', 'p2_governance_ownership_signal', 'p2_process_pain_points'],
      artifactConsumers: ['p2_discovery', 'discovery_report', 'target_state_architecture'],
      whatFound: ['missing required fields', 'ownership gaps', 'control or exception signals'],
      whereUsed: ['P2 root-cause analysis', 'P3 controls and operating model'],
    },
  ],
  [
    /systems|data source|source list|integration|application/i,
    {
      evidenceType: 'current_state_systems_data',
      sourceType: 'real_upload',
      slotIds: [
        'p2_it_system_landscape',
        'p2_data_lineage_inventory',
        'p2_operational_cmdb_app_inventory',
        'p2_current_state_process_map',
      ],
      artifactConsumers: ['p2_discovery', 'discovery_report', 'target_state_architecture'],
      whatFound: ['systems involved', 'data sources', 'integration readiness'],
      whereUsed: ['P2 context', 'P3 architecture'],
    },
  ],
  [
    /workshop|interview|current-state view|current state/i,
    {
      evidenceType: 'business_interview',
      sourceType: 'real_upload',
      slotIds: ['p2_business_current_state', 'p2_process_pain_points', 'p2_governance_ownership_signal'],
      artifactConsumers: ['p2_discovery', 'discovery_report', 'execution_roadmap'],
      whatFound: ['stakeholder observations', 'root-cause candidates', 'review decisions'],
      whereUsed: ['P2 final current-state view', 'P3 solution framing'],
    },
  ],
];

const PHASE_THREE_RULES: Array<[RegExp, UploadedMoveEvidenceClassification]> = [
  [
    /solution option|decision matrix|approach|solution design/i,
    {
      evidenceType: 'solution_options_decision',
      sourceType: 'real_upload',
      slotIds: [
        'p3_options_discovery_findings',
        'p3_solution_principles',
        'p3_two_options',
        'p3_evaluation_criteria',
        'p3_decision_owner',
        'p3_weighted_decision_matrix',
        'p3_arch_chosen_option',
      ],
      artifactConsumers: ['p3_solution_options', 'solution_approach_options', 'target_state_architecture'],
      whatFound: ['solution options', 'selected approach', 'rejected approach', 'decision criteria'],
      whereUsed: ['P3 solution approach', 'P4 roadmap planning'],
    },
  ],
  [
    /human.*ai|ai.*human|work split|controls|governance/i,
    {
      evidenceType: 'control_evidence',
      sourceType: 'real_upload',
      slotIds: ['p3_operational_human_agent_model', 'p3_arch_security_privacy', 'p3_operational_human_agent_architecture'],
      artifactConsumers: ['p3_solution_options', 'target_state_architecture', 'execution_roadmap'],
      whatFound: ['human and AI work split', 'approval controls', 'risk guardrails'],
      whereUsed: ['P3 operating model', 'P3 architecture', 'P4 controls'],
    },
  ],
];

const PHASE_FOUR_RULES: Array<[RegExp, UploadedMoveEvidenceClassification]> = [
  [
    /business case|value|finance|assumption/i,
    {
      evidenceType: 'value_evidence',
      sourceType: 'real_upload',
      slotIds: [
        'p4_case_value_levers',
        'p4_case_kpi_baseline_target',
        'p4_case_cost_baseline',
        'p4_case_finance_validation',
        'p4_operational_value_estimate',
      ],
      artifactConsumers: ['p4_business_case', 'business_case', 'measurement_contract'],
      whatFound: ['value assumptions', 'finance caveats', 'baseline and target signals'],
      whereUsed: ['P4 business case', 'Tower value tracking'],
    },
  ],
  [
    /roadmap|workstream|dependency|plan/i,
    {
      evidenceType: 'roadmap_estimation',
      sourceType: 'real_upload',
      slotIds: [
        'p4_roadmap_workstreams',
        'p4_roadmap_dependencies',
        'p4_roadmap_constraints',
        'p4_roadmap_owners',
        'p4_roadmap_value_milestones',
      ],
      artifactConsumers: ['p4_roadmap', 'execution_roadmap', 'handoff_package'],
      whatFound: ['workstreams', 'dependencies', 'owners', 'timeline assumptions'],
      whereUsed: ['P4 roadmap', 'P5 execution handoff'],
    },
  ],
  [
    /tower|metric|measurement/i,
    {
      evidenceType: 'kpi_value_baseline',
      sourceType: 'real_upload',
      slotIds: ['p4_roadmap_value_milestones', 'p4_case_kpi_baseline_target', 'p5_measurement_contract'],
      artifactConsumers: ['p4_roadmap', 'p4_business_case', 'measurement_contract'],
      whatFound: ['Tower metrics', 'baseline/target definitions', 'review cadence'],
      whereUsed: ['P4 value plan', 'P5/Tower handoff'],
    },
  ],
];

const PHASE_FIVE_RULES: Array<[RegExp, UploadedMoveEvidenceClassification]> = [
  [
    /raci|owner|launch|readiness|training|handoff|execution/i,
    {
      evidenceType: 'adoption_change',
      sourceType: 'real_upload',
      slotIds: [
        'p5_approved_roadmap',
        'p5_raci_owner_model',
        'p5_governance_cadence',
        'p5_open_risks_dependencies',
        'p5_30_60_90_actions',
        'p5_acceptance_criteria',
      ],
      artifactConsumers: ['p5_handoff', 'handoff_package', 'measurement_contract'],
      whatFound: ['owner model', 'readiness checklist', 'launch actions', 'open decisions'],
      whereUsed: ['P5 execution handoff', 'Tower acceptance'],
    },
  ],
];

function rulesForPhase(phase: number | null | undefined): Array<[RegExp, UploadedMoveEvidenceClassification]> {
  if (phase === 2) return PHASE_TWO_RULES;
  if (phase === 3) return PHASE_THREE_RULES;
  if (phase === 4) return PHASE_FOUR_RULES;
  if (phase === 5) return PHASE_FIVE_RULES;
  return [];
}

function fallbackEvidenceType(evidenceType: EvidenceType): MoveEvidenceType {
  if (evidenceType === 'baseline_evidence') return 'kpi_value_baseline';
  if (evidenceType === 'architecture_inventory') return 'current_state_systems_data';
  if (evidenceType === 'decision_log') return 'approval';
  if (evidenceType === 'meeting_notes' || evidenceType === 'workshop_output') return 'business_interview';
  return 'other';
}

export function classifyUploadedMoveEvidence(input: {
  filename: string;
  phase?: number | null;
  extractedText?: string | null;
  originalEvidenceType: EvidenceType;
}): UploadedMoveEvidenceClassification {
  const haystack = `${input.filename}\n${input.extractedText ?? ''}`.slice(0, 10000);
  for (const [pattern, classification] of rulesForPhase(input.phase)) {
    if (pattern.test(haystack)) return classification;
  }

  const fallback = DEFAULT_BY_PHASE[input.phase ?? 0];
  if (fallback) return {
    ...fallback,
    evidenceType: fallback.evidenceType === 'current_state_systems_data'
      ? fallbackEvidenceType(input.originalEvidenceType)
      : fallback.evidenceType,
  };

  return {
    evidenceType: fallbackEvidenceType(input.originalEvidenceType),
    sourceType: 'real_upload',
    slotIds: [],
    artifactConsumers: [],
    whatFound: ['uploaded evidence captured'],
    whereUsed: ['Move workspace'],
  };
}

export function mergeMoveEvidenceClassification<T extends {
  extractedStructured: Record<string, unknown> & { warnings: string[] };
}>(input: {
  evidence: T;
  classification: UploadedMoveEvidenceClassification;
  filename: string;
}): T {
  return {
    ...input.evidence,
    extractedStructured: {
      ...input.evidence.extractedStructured,
      source_type: input.classification.sourceType,
      evidence_type: input.classification.evidenceType,
      slot_ids: input.classification.slotIds,
      artifact_consumers: input.classification.artifactConsumers,
      what_found: input.classification.whatFound,
      where_used: input.classification.whereUsed,
      citation: input.filename,
    },
  };
}
