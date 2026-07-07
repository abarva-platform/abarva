export const AI_CONTROL_TOWER_LENSES = [
  'value_adoption',
  'productivity',
  'agents',
  'spend',
  'risk',
  'evidence',
  'actions',
] as const;

export type AiControlTowerLens = (typeof AI_CONTROL_TOWER_LENSES)[number];

export const AI_CONTROL_TOWER_QUESTION_INTENTS = [
  'scale_or_hold',
  'spend_to_value',
  'adoption_gap',
  'productivity_before_after',
  'agent_outcome',
  'persona_uplift',
  'evidence_check',
  'latest_changes',
  'steering_actions',
  'freeform',
] as const;

export type AiControlTowerQuestionIntent = (typeof AI_CONTROL_TOWER_QUESTION_INTENTS)[number];

export type AiControlTowerVerdict =
  | 'scale'
  | 'hold'
  | 'prove'
  | 'reduce'
  | 'review'
  | 'insufficient_evidence';

export type AiControlTowerEvidenceStatus =
  | 'committed'
  | 'review_required'
  | 'missing'
  | 'retrieval_proven';

export interface AiControlTowerMetricDictionaryEntry {
  metricId: string;
  displayName: string;
  businessQuestion: string;
  formula: string;
  grain: string;
  ownerRole: string;
  sourceSystems: string[];
  defaultLens: AiControlTowerLens;
  commonQuestionIntents: AiControlTowerQuestionIntent[];
  evidenceRequired: boolean;
}

export const AI_CONTROL_TOWER_METRIC_DICTIONARY: AiControlTowerMetricDictionaryEntry[] = [
  {
    metricId: 'active_adoption_pct',
    displayName: 'Active adoption',
    businessQuestion: 'Are licensed users actively using the AI capability?',
    formula: 'active_users / licensed_seats',
    grain: 'client x tool x persona x month',
    ownerRole: 'Digital workplace or tool owner',
    sourceSystems: ['M365 Copilot', 'Workday', 'Oracle', 'ServiceNow', 'GitHub'],
    defaultLens: 'value_adoption',
    commonQuestionIntents: ['adoption_gap', 'spend_to_value', 'scale_or_hold'],
    evidenceRequired: true,
  },
  {
    metricId: 'monthly_ai_spend_usd',
    displayName: 'Monthly AI spend',
    businessQuestion: 'Which AI spend is converting into usage and measurable outcomes?',
    formula: 'sum(monthly_spend_usd)',
    grain: 'client x vendor/tool x month',
    ownerRole: 'CFO / FinOps',
    sourceSystems: ['Procurement', 'ERP', 'vendor invoices', 'usage exports'],
    defaultLens: 'spend',
    commonQuestionIntents: ['spend_to_value', 'scale_or_hold', 'steering_actions'],
    evidenceRequired: true,
  },
  {
    metricId: 'developer_lead_time_delta',
    displayName: 'Developer lead-time movement',
    businessQuestion: 'Did developer AI improve cycle time without hurting quality?',
    formula: 'lead_time_hours_before - lead_time_hours_after',
    grain: 'client x team x repo x month',
    ownerRole: 'VP Engineering',
    sourceSystems: ['GitHub', 'Jira', 'incident/change systems'],
    defaultLens: 'productivity',
    commonQuestionIntents: ['productivity_before_after', 'scale_or_hold', 'evidence_check'],
    evidenceRequired: true,
  },
  {
    metricId: 'agent_deflection_rate',
    displayName: 'Agent deflection rate',
    businessQuestion: 'Are embedded agents reducing work or only touching transactions?',
    formula: 'auto_resolved_volume / eligible_volume',
    grain: 'client x agent x workflow x month',
    ownerRole: 'Process owner',
    sourceSystems: ['ServiceNow', 'Workday', 'Oracle', 'SAP'],
    defaultLens: 'agents',
    commonQuestionIntents: ['agent_outcome', 'spend_to_value', 'scale_or_hold'],
    evidenceRequired: true,
  },
  {
    metricId: 'benefit_realization_usd',
    displayName: 'Realized benefit',
    businessQuestion: 'Which promised AI benefits are actually defensible?',
    formula: 'realized_annual_value_usd with confidence and evidence gate',
    grain: 'client x initiative x benefit x month',
    ownerRole: 'Business case owner',
    sourceSystems: ['PMO', 'Finance', 'governance tracker'],
    defaultLens: 'value_adoption',
    commonQuestionIntents: ['evidence_check', 'scale_or_hold', 'steering_actions'],
    evidenceRequired: true,
  },
  {
    metricId: 'review_required_count',
    displayName: 'Review required',
    businessQuestion: 'Which AI claims cannot be used until evidence or governance is fixed?',
    formula: 'count(evidence_state in review_required, low_confidence, missing)',
    grain: 'client x refresh month',
    ownerRole: 'AI governance lead',
    sourceSystems: ['governance tracker', 'risk register', 'evidence links'],
    defaultLens: 'risk',
    commonQuestionIntents: ['evidence_check', 'steering_actions', 'latest_changes'],
    evidenceRequired: false,
  },
];

export interface AiControlTowerSurfaceContext {
  surface?: string;
  activeLens?: AiControlTowerLens;
  snapshotId?: string | null;
  snapshotMonth?: string | null;
  selectedMetricIds?: string[];
  selectedEntityIds?: string[];
  filters?: Record<string, unknown>;
}

export interface AiControlTowerContextFact {
  factId: string;
  clientId: string;
  refreshRunId: string;
  recordType: string;
  recordKey: string;
  factKey: string;
  factType: string;
  factText: string;
  confidence: number | null;
  evidenceStatus: AiControlTowerEvidenceStatus;
  evidenceIds: string[];
}

export interface AiControlTowerContextPack {
  packVersion: 'ai-control-tower-context-v1';
  clientId: string;
  refreshRunId: string | null;
  snapshotMonth: string | null;
  activeLens: AiControlTowerLens;
  intent: AiControlTowerQuestionIntent;
  question: string;
  metricDictionary: AiControlTowerMetricDictionaryEntry[];
  facts: AiControlTowerContextFact[];
  guardrails: {
    canClaimRealizedValue: boolean;
    missingInputs: string[];
    staleSources: string[];
    reviewRequiredFactIds: string[];
  };
}

export interface AiControlTowerStructuredAnswer {
  answerVersion: 'ai-control-tower-v1';
  clientId: string;
  snapshotId: string | null;
  snapshotMonth: string | null;
  activeLens: AiControlTowerLens;
  intent: AiControlTowerQuestionIntent;
  summary: {
    headline: string;
    verdict: AiControlTowerVerdict;
    confidence: 'high' | 'medium' | 'low';
    disclosure: string | null;
  };
  table?: {
    columns: Array<{
      key: string;
      label: string;
      type: 'text' | 'money' | 'percent' | 'number' | 'status';
    }>;
    rows: Array<Record<string, string | number | null>>;
  };
  metricCards?: Array<{
    metricId: string;
    label: string;
    value: string;
    trend?: 'up' | 'down' | 'flat';
    evidenceStatus: AiControlTowerEvidenceStatus;
  }>;
  choices: Array<{
    label: string;
    action: 'set_lens' | 'open_evidence' | 'ask_followup' | 'open_action' | 'open_source';
    target: string;
  }>;
  citations: Array<{
    evidenceId: string;
    sourceSystem: string;
    sourceLabel: string;
    sourceRef: string;
    confidence: 'high' | 'medium' | 'low';
  }>;
  dashboardPatch?: {
    setLens?: AiControlTowerLens;
    highlightMetricIds?: string[];
    highlightEntityIds?: string[];
    openDrawer?: 'evidence' | 'actions' | 'metric_detail' | null;
  };
  guardrails: {
    canClaimRealizedValue: boolean;
    missingInputs: string[];
    staleSources: string[];
  };
}

export const AI_CONTROL_TOWER_REQUIRED_SHEETS = [
  'Source Manifest',
  'Initiative Registry',
  'Tool Usage Monthly',
  'Persona Productivity',
  'DORA Metrics',
  'ServiceNow AI Agents',
  'ERP HR Finance Agents',
  'Benefit Realization',
  'Spend Contracts',
  'Risk Governance',
  'Evidence Links',
  'Refresh Log',
] as const;

export const AI_CONTROL_TOWER_OPTIONAL_SHEETS = [
  'Action Decision Log',
] as const;

export interface AiControlTowerSheetContract {
  sheetName:
    | (typeof AI_CONTROL_TOWER_REQUIRED_SHEETS)[number]
    | (typeof AI_CONTROL_TOWER_OPTIONAL_SHEETS)[number];
  requiredHeaders: string[];
  targetTable: string;
  required: boolean;
}

export const AI_CONTROL_TOWER_SHEET_CONTRACTS: AiControlTowerSheetContract[] = [
  {
    sheetName: 'Source Manifest',
    targetTable: 'ai_control_sources',
    required: true,
    requiredHeaders: ['source_id', 'source_system', 'owner_role', 'cadence', 'period_end', 'refresh_status', 'data_class'],
  },
  {
    sheetName: 'Initiative Registry',
    targetTable: 'ai_control_initiatives',
    required: true,
    requiredHeaders: ['initiative_id', 'initiative_name', 'category', 'stage', 'owner', 'sponsor', 'vendor', 'tool_or_system', 'target_metric_key', 'status_flag'],
  },
  {
    sheetName: 'Tool Usage Monthly',
    targetTable: 'ai_control_tool_usage_monthly',
    required: true,
    requiredHeaders: ['tool_id', 'tool_name', 'vendor', 'team', 'persona', 'period_start', 'period_end', 'licensed_seats', 'active_users', 'usage_events', 'accepted_events', 'monthly_spend_usd'],
  },
  {
    sheetName: 'Persona Productivity',
    targetTable: 'ai_control_persona_productivity',
    required: true,
    requiredHeaders: ['persona_id', 'persona_name', 'function', 'workflow', 'metric_key', 'baseline_value', 'current_value', 'target_value', 'confidence'],
  },
  {
    sheetName: 'DORA Metrics',
    targetTable: 'ai_control_dora_metrics',
    required: true,
    requiredHeaders: ['team', 'repo', 'tool_id', 'lead_time_hours_before', 'lead_time_hours_after', 'change_failure_rate_pct_before', 'change_failure_rate_pct_after', 'mttr_hours_before', 'mttr_hours_after', 'sample_size_deploys'],
  },
  {
    sheetName: 'ServiceNow AI Agents',
    targetTable: 'ai_control_agent_outcomes',
    required: true,
    requiredHeaders: ['agent_id', 'vendor', 'module', 'agent_name', 'workflow', 'eligible_volume', 'ai_touched_volume', 'auto_resolved_volume'],
  },
  {
    sheetName: 'ERP HR Finance Agents',
    targetTable: 'ai_control_agent_outcomes',
    required: true,
    requiredHeaders: ['agent_id', 'vendor', 'module', 'agent_name', 'workflow', 'eligible_volume', 'ai_touched_volume'],
  },
  {
    sheetName: 'Benefit Realization',
    targetTable: 'ai_control_benefit_realization',
    required: true,
    requiredHeaders: ['benefit_id', 'initiative_id', 'metric_key', 'promised_annual_value_usd', 'confidence', 'readiness_state'],
  },
  {
    sheetName: 'Spend Contracts',
    targetTable: 'ai_control_spend_contracts',
    required: true,
    requiredHeaders: ['spend_id', 'initiative_id', 'vendor', 'product_or_service', 'monthly_spend_usd', 'annualized_spend_usd', 'renewal_date', 'unit_economics_metric'],
  },
  {
    sheetName: 'Risk Governance',
    targetTable: 'ai_control_risk_governance',
    required: true,
    requiredHeaders: ['risk_id', 'initiative_id', 'dimension', 'severity', 'status', 'governance_gate', 'required_action', 'owner_role'],
  },
  {
    sheetName: 'Action Decision Log',
    targetTable: 'ai_control_actions',
    required: false,
    requiredHeaders: ['action_id', 'lens', 'decision_type', 'recommendation', 'owner_role', 'due_date', 'status', 'evidence_id', 'impact_usd', 'confidence'],
  },
  {
    sheetName: 'Evidence Links',
    targetTable: 'ai_control_evidence_items',
    required: true,
    requiredHeaders: ['evidence_id', 'source_id', 'source_sheet', 'source_row_number', 'citation_label', 'evidence_state', 'confidence'],
  },
  {
    sheetName: 'Refresh Log',
    targetTable: 'ai_control_refresh_runs',
    required: true,
    requiredHeaders: ['refresh_run_id', 'run_type', 'started_at', 'status', 'rows_seen', 'rows_valid', 'rows_rejected', 'review_required', 'operator'],
  },
];

export function normalizeAiControlHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export function classifyAiControlTowerIntent(question: string): AiControlTowerQuestionIntent {
  const q = question.toLowerCase();
  if (q.includes('steering') || q.includes('action') || q.includes('decision') || q.includes('next')) return 'steering_actions';
  if (q.includes('changed') || q.includes('latest') || q.includes('refresh') || q.includes('month')) return 'latest_changes';
  if (q.includes('evidence') || q.includes('defensible') || q.includes('cite') || q.includes('proof')) return 'evidence_check';
  if (q.includes('agent') || q.includes('servicenow') || q.includes('workday') || q.includes('oracle') || q.includes('sap')) return 'agent_outcome';
  if (q.includes('developer') || q.includes('dora') || q.includes('lead time') || q.includes('change failure')) return 'productivity_before_after';
  if (q.includes('recruiter') || q.includes('analyst') || q.includes('persona')) return 'persona_uplift';
  if (q.includes('spend') || q.includes('cost') || q.includes('renew') || q.includes('license')) return 'spend_to_value';
  if (q.includes('adoption') || q.includes('usage') || q.includes('seat')) return 'adoption_gap';
  if (q.includes('scale') || q.includes('hold') || q.includes('pause')) return 'scale_or_hold';
  return 'freeform';
}

export function lensForAiControlIntent(
  intent: AiControlTowerQuestionIntent,
  fallback: AiControlTowerLens = 'value_adoption',
): AiControlTowerLens {
  switch (intent) {
    case 'steering_actions':
      return 'actions';
    case 'latest_changes':
    case 'evidence_check':
      return 'evidence';
    case 'agent_outcome':
      return 'agents';
    case 'productivity_before_after':
    case 'persona_uplift':
      return 'productivity';
    case 'spend_to_value':
      return 'spend';
    case 'adoption_gap':
    case 'scale_or_hold':
      return 'value_adoption';
    default:
      return fallback;
  }
}
