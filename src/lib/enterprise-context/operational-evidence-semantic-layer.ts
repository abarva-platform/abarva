import type { OperationalEvidenceRecordType } from './operational-evidence';

export type OperationalSemanticConsumerModule =
  | 'home'
  | 'intelligence'
  | 'moves'
  | 'context_layer_admin'
  | 'tower'
  | 'source'
  | 'ava';

export type OperationalSemanticViewId =
  | 'operational_process_friction_summary'
  | 'application_friction_leaderboard'
  | 'automation_opportunity_portfolio'
  | 'human_agent_control_matrix'
  | 'value_estimate_portfolio'
  | 'evidence_readiness_and_lineage'
  | 'source_health_and_load_status'
  | 'ninety_day_pilot_plan';

export type OperationalInsightCardType =
  | 'bottleneck'
  | 'repetitive_work'
  | 'application_friction'
  | 'automation_priority'
  | 'human_approval_boundary'
  | 'value_case'
  | 'evidence_gap'
  | 'pilot_next_step';

export interface OperationalSemanticMetric {
  key: string;
  label: string;
  description: string;
  unit: 'count' | 'percent' | 'currency' | 'hours' | 'days' | 'score' | 'text';
}

export interface OperationalSemanticDimension {
  key: string;
  label: string;
  description: string;
}

export interface OperationalSemanticView {
  id: OperationalSemanticViewId;
  label: string;
  purpose: string;
  sourceEntities: OperationalEvidenceRecordType[];
  metrics: OperationalSemanticMetric[];
  dimensions: OperationalSemanticDimension[];
  consumerModules: OperationalSemanticConsumerModule[];
  defaultQuestions: string[];
  defaultInsightCards: OperationalInsightCardType[];
}

export interface OperationalModuleVisibilityContract {
  module: OperationalSemanticConsumerModule;
  visibleViews: OperationalSemanticViewId[];
  primaryQuestions: string[];
  defaultActions: string[];
  displayMode: 'executive_summary' | 'analyst_workspace' | 'gate_panel' | 'admin_lineage' | 'portfolio_dashboard' | 'answer_card';
}

export interface OperationalInsightCard {
  id: string;
  type: OperationalInsightCardType;
  title: string;
  summary: string;
  evidenceRefs: string[];
  affectedApplications: string[];
  affectedTeams: string[];
  recommendedAction: string;
  confidence: number;
  caveat?: string;
}

const metric = (
  key: string,
  label: string,
  description: string,
  unit: OperationalSemanticMetric['unit'],
): OperationalSemanticMetric => ({ key, label, description, unit });

const dimension = (
  key: string,
  label: string,
  description: string,
): OperationalSemanticDimension => ({ key, label, description });

export const OPERATIONAL_SEMANTIC_VIEWS: OperationalSemanticView[] = [
  {
    id: 'operational_process_friction_summary',
    label: 'Operational Process Friction Summary',
    purpose: 'Show where work waits, loops, reopens, breaches SLA, or crosses too many teams.',
    sourceEntities: ['work_item', 'process_flow_observation', 'operational_event', 'operational_evidence_insight'],
    metrics: [
      metric('work_item_volume', 'Work item volume', 'Tickets, requests, issues, changes, or defects in scope.', 'count'),
      metric('sla_breach_rate', 'SLA breach rate', 'Share of work items breaching target service levels.', 'percent'),
      metric('reopen_rate', 'Reopen rate', 'Share of records reopened after closure or resolution.', 'percent'),
      metric('handoff_count_avg', 'Average handoffs', 'Average resolver/team reassignment count.', 'count'),
      metric('cycle_time_p50', 'Median cycle time', 'Median elapsed time from open to resolution.', 'hours'),
      metric('cycle_time_p90', 'P90 cycle time', 'Slow-path elapsed time from open to resolution.', 'hours'),
    ],
    dimensions: [
      dimension('process_name', 'Process', 'Business or operational process name.'),
      dimension('business_domain', 'Business domain', 'Business domain or function.'),
      dimension('owner_team', 'Owner team', 'Team currently accountable for work.'),
      dimension('queue_or_status', 'Queue/status', 'Workflow status or queue where work waits.'),
      dimension('evidence_confidence', 'Evidence confidence', 'Confidence band for the evidence behind the metric.'),
    ],
    consumerModules: ['home', 'intelligence', 'moves', 'tower', 'ava'],
    defaultQuestions: [
      'Where are the bottlenecks?',
      'What work is repetitive?',
      'Which process steps cause handoffs or rework?',
    ],
    defaultInsightCards: ['bottleneck', 'repetitive_work', 'pilot_next_step'],
  },
  {
    id: 'application_friction_leaderboard',
    label: 'Application Friction Leaderboard',
    purpose: 'Rank applications and services by operational friction, incident recurrence, change load, and ownership clarity.',
    sourceEntities: ['system_service_map', 'work_item', 'operational_event', 'operational_evidence_insight'],
    metrics: [
      metric('incident_volume_12m', 'Incident volume', 'Trailing 12-month incident count.', 'count'),
      metric('change_volume_12m', 'Change volume', 'Trailing 12-month change count.', 'count'),
      metric('linked_event_count', 'Linked event count', 'Log/alert summaries tied to the app/service.', 'count'),
      metric('ownership_completeness', 'Ownership completeness', 'Owner/support/dependency fields present and usable.', 'percent'),
      metric('friction_score', 'Friction score', 'Composite friction score used for prioritization.', 'score'),
    ],
    dimensions: [
      dimension('application_id', 'Application ID', 'Stable app or CI identifier.'),
      dimension('application_name', 'Application', 'Application or service display name.'),
      dimension('business_service', 'Business service', 'Business service supported.'),
      dimension('criticality', 'Criticality', 'Operational criticality tier.'),
      dimension('support_group', 'Support group', 'Operational support group.'),
    ],
    consumerModules: ['home', 'intelligence', 'moves', 'tower', 'source', 'ava'],
    defaultQuestions: [
      'Which apps create the most operational friction?',
      'Which systems should be included in the pilot?',
      'Which owners need to be involved?',
    ],
    defaultInsightCards: ['application_friction', 'evidence_gap', 'pilot_next_step'],
  },
  {
    id: 'automation_opportunity_portfolio',
    label: 'Automation Opportunity Portfolio',
    purpose: 'Prioritize AI/automation opportunities by evidence, value, feasibility, risk, readiness, controls, and pilot fit.',
    sourceEntities: ['automation_opportunity', 'operational_evidence_insight', 'opportunity_value_estimate'],
    metrics: [
      metric('value_score', 'Value score', 'Relative business value score.', 'score'),
      metric('feasibility_score', 'Feasibility score', 'Relative feasibility score.', 'score'),
      metric('risk_score', 'Risk score', 'Relative control/risk score.', 'score'),
      metric('readiness_score', 'Readiness score', 'Relative data/process/control readiness score.', 'score'),
      metric('pilot_fit', '90-day pilot fit', 'Whether the opportunity can be piloted in 90 days.', 'text'),
    ],
    dimensions: [
      dimension('opportunity_id', 'Opportunity ID', 'Stable opportunity identifier.'),
      dimension('opportunity_type', 'Opportunity type', 'Triage, routing, summarization, KB generation, approval, reporting, etc.'),
      dimension('affected_process', 'Affected process', 'Process where the opportunity applies.'),
      dimension('automation_level', 'Automation level', 'Assist, recommend, automate with approval, or automate.'),
      dimension('priority', 'Priority', 'P1/P2/P3 style opportunity priority.'),
    ],
    consumerModules: ['home', 'intelligence', 'moves', 'tower', 'source', 'ava'],
    defaultQuestions: [
      'What should we automate first?',
      'Which opportunities are safe for a 90-day pilot?',
      'Which opportunities need more evidence before funding?',
    ],
    defaultInsightCards: ['automation_priority', 'human_approval_boundary', 'value_case'],
  },
  {
    id: 'human_agent_control_matrix',
    label: 'Human-Agent Control Matrix',
    purpose: 'Make human-owned, agent-assisted, automated, approval, exception, and audit boundaries visible.',
    sourceEntities: ['human_agent_responsibility', 'automation_opportunity'],
    metrics: [
      metric('human_approval_required', 'Human approval required', 'Whether human approval is required before action.', 'text'),
      metric('automation_level', 'Automation level', 'Assist/recommend/automate with approval/automate.', 'text'),
      metric('risk_level', 'Risk level', 'Risk tier for the process step.', 'text'),
      metric('control_count', 'Control count', 'Controls required for the opportunity or process step.', 'count'),
    ],
    dimensions: [
      dimension('process_step', 'Process step', 'Step where human/agent responsibility changes.'),
      dimension('current_owner', 'Current owner', 'Current human/team owner.'),
      dimension('future_human_role', 'Future human role', 'Human role in target operating model.'),
      dimension('future_agent_role', 'Future agent role', 'Agent role in target operating model.'),
      dimension('guardrail', 'Guardrail', 'Control or guardrail required.'),
    ],
    consumerModules: ['intelligence', 'moves', 'tower', 'source', 'ava'],
    defaultQuestions: [
      'What stays human-approved?',
      'What can the agent safely recommend?',
      'What controls are required before scaling?',
    ],
    defaultInsightCards: ['human_approval_boundary', 'evidence_gap', 'pilot_next_step'],
  },
  {
    id: 'value_estimate_portfolio',
    label: 'Value Estimate Portfolio',
    purpose: 'Show ROM savings, implementation cost, run cost, rate-card provenance, confidence, and finance validation status.',
    sourceEntities: ['opportunity_value_estimate', 'automation_opportunity'],
    metrics: [
      metric('baseline_volume', 'Baseline volume', 'Baseline annual/period volume.', 'count'),
      metric('baseline_effort', 'Baseline effort', 'Baseline human effort per unit or total.', 'hours'),
      metric('estimated_savings', 'Estimated savings', 'ROM savings or value range.', 'currency'),
      metric('implementation_cost', 'Implementation cost', 'One-time implementation cost range.', 'currency'),
      metric('run_cost', 'Run cost', 'Recurring run cost.', 'currency'),
      metric('payback_period', 'Payback period', 'Estimated payback period.', 'text'),
    ],
    dimensions: [
      dimension('opportunity_id', 'Opportunity ID', 'Opportunity linked to value estimate.'),
      dimension('rate_card_source', 'Rate-card source', 'Client/vendor/internal/benchmark/fallback rate source.'),
      dimension('finance_validation_status', 'Finance validation status', 'Finance/client validation state.'),
      dimension('confidence', 'Confidence', 'Confidence level for the estimate.'),
    ],
    consumerModules: ['home', 'intelligence', 'moves', 'tower', 'ava'],
    defaultQuestions: [
      'What value can we expect?',
      'Which estimates need finance validation?',
      'What is the human vs agent effort shift?',
    ],
    defaultInsightCards: ['value_case', 'evidence_gap'],
  },
  {
    id: 'evidence_readiness_and_lineage',
    label: 'Evidence Readiness and Lineage',
    purpose: 'Show whether evidence is sufficient for draft, executive review, board readiness, and artifact generation.',
    sourceEntities: ['operational_evidence_source', 'operational_evidence_insight', 'automation_opportunity'],
    metrics: [
      metric('coverage_score', 'Coverage score', 'Evidence-slot coverage score.', 'score'),
      metric('confidence_avg', 'Average confidence', 'Average usable evidence confidence.', 'score'),
      metric('synthetic_flag', 'Synthetic flag', 'Whether synthetic/demo evidence is used.', 'text'),
      metric('missing_required_count', 'Missing required count', 'Missing minimum evidence slots.', 'count'),
      metric('trace_count', 'Trace count', 'Evidence-to-insight-to-opportunity trace rows.', 'count'),
    ],
    dimensions: [
      dimension('phase', 'Moves phase', 'P0-P5 phase.'),
      dimension('artifact_type', 'Artifact type', 'Moves artifact consumer.'),
      dimension('evidence_type', 'Evidence type', 'Move/Context evidence category.'),
      dimension('source_system', 'Source system', 'System of record or upload source.'),
    ],
    consumerModules: ['context_layer_admin', 'moves', 'ava'],
    defaultQuestions: [
      'Is this artifact ready to generate?',
      'What evidence is missing?',
      'Can this insight be traced back to source records?',
    ],
    defaultInsightCards: ['evidence_gap', 'pilot_next_step'],
  },
  {
    id: 'source_health_and_load_status',
    label: 'Source Health and Load Status',
    purpose: 'Make operational data load status, validation status, parser results, review state, and indexing status visible.',
    sourceEntities: ['operational_evidence_source'],
    metrics: [
      metric('source_count', 'Source count', 'Registered operational sources.', 'count'),
      metric('file_count', 'File count', 'Files or exports staged.', 'count'),
      metric('parsed_record_count', 'Parsed record count', 'Records parsed from staged evidence.', 'count'),
      metric('review_required_count', 'Review required count', 'Low-confidence/sensitive mappings requiring review.', 'count'),
      metric('indexed_chunk_count', 'Indexed chunk count', 'Sanitized chunks indexed for retrieval.', 'count'),
    ],
    dimensions: [
      dimension('source_system', 'Source system', 'ServiceNow, Jira, logs, CMDB, KB, etc.'),
      dimension('load_state', 'Load state', 'Uploaded, staged, parsed, reviewed, committed, indexed, retrievable.'),
      dimension('parser_id', 'Parser', 'Parser/template used.'),
      dimension('owner', 'Owner', 'Source or data owner.'),
    ],
    consumerModules: ['context_layer_admin', 'moves', 'ava'],
    defaultQuestions: [
      'What has been loaded?',
      'What is committed to the data plane?',
      'What is retrievable by aVa?',
    ],
    defaultInsightCards: ['evidence_gap'],
  },
  {
    id: 'ninety_day_pilot_plan',
    label: '90-Day Pilot Plan',
    purpose: 'Translate evidence-backed opportunities into data, control, delivery, adoption, and value gates over 90 days.',
    sourceEntities: ['automation_opportunity', 'human_agent_responsibility', 'opportunity_value_estimate', 'operational_evidence_insight'],
    metrics: [
      metric('pilot_candidate_count', 'Pilot candidate count', 'Opportunities suitable for first pilot wave.', 'count'),
      metric('value_gate_count', 'Value gate count', 'Measurement gates in the pilot plan.', 'count'),
      metric('control_gate_count', 'Control gate count', 'Governance/security/control gates.', 'count'),
      metric('owner_coverage', 'Owner coverage', 'Share of pilot workstreams with named owners.', 'percent'),
    ],
    dimensions: [
      dimension('pilot_window', 'Pilot window', '0-30, 31-60, 61-90 days.'),
      dimension('workstream', 'Workstream', 'Data, controls, delivery, adoption, value.'),
      dimension('owner', 'Owner', 'Pilot workstream owner.'),
      dimension('acceptance_criteria', 'Acceptance criteria', 'Gate or success condition.'),
    ],
    consumerModules: ['home', 'intelligence', 'moves', 'tower', 'ava'],
    defaultQuestions: [
      'What is the 90-day pilot roadmap?',
      'Which gates decide scale/no-scale?',
      'Who owns each workstream?',
    ],
    defaultInsightCards: ['pilot_next_step', 'automation_priority', 'value_case'],
  },
];

export const OPERATIONAL_MODULE_VISIBILITY: OperationalModuleVisibilityContract[] = [
  {
    module: 'home',
    visibleViews: [
      'operational_process_friction_summary',
      'application_friction_leaderboard',
      'automation_opportunity_portfolio',
      'value_estimate_portfolio',
      'ninety_day_pilot_plan',
    ],
    primaryQuestions: [
      'Where is operational friction highest?',
      'Which AI opportunities are ready for sponsor attention?',
      'What value can we expect in the next 90 days?',
    ],
    defaultActions: ['Open Move', 'Ask aVa', 'Review pilot candidates'],
    displayMode: 'executive_summary',
  },
  {
    module: 'intelligence',
    visibleViews: [
      'operational_process_friction_summary',
      'application_friction_leaderboard',
      'automation_opportunity_portfolio',
      'human_agent_control_matrix',
      'value_estimate_portfolio',
      'ninety_day_pilot_plan',
    ],
    primaryQuestions: [
      'What patterns are emerging from operational evidence?',
      'What should we automate first and why?',
      'What evidence supports this recommendation?',
    ],
    defaultActions: ['Explore evidence graph', 'Open trace', 'Send to Moves'],
    displayMode: 'analyst_workspace',
  },
  {
    module: 'moves',
    visibleViews: [
      'operational_process_friction_summary',
      'automation_opportunity_portfolio',
      'human_agent_control_matrix',
      'value_estimate_portfolio',
      'evidence_readiness_and_lineage',
      'ninety_day_pilot_plan',
    ],
    primaryQuestions: [
      'Is the phase ready to generate?',
      'Which evidence should bind into this artifact?',
      'What decisions and client-to-complete fields remain?',
    ],
    defaultActions: ['Generate draft', 'Upload evidence', 'Regenerate with feedback', 'Approve gate'],
    displayMode: 'gate_panel',
  },
  {
    module: 'context_layer_admin',
    visibleViews: [
      'evidence_readiness_and_lineage',
      'source_health_and_load_status',
      'application_friction_leaderboard',
    ],
    primaryQuestions: [
      'What has been uploaded, parsed, committed, indexed, and retrieval-proven?',
      'Which mappings need review?',
      'Which semantic views are ready for frontend modules?',
    ],
    defaultActions: ['Review load receipt', 'Approve mappings', 'Refresh search index'],
    displayMode: 'admin_lineage',
  },
  {
    module: 'tower',
    visibleViews: [
      'operational_process_friction_summary',
      'application_friction_leaderboard',
      'automation_opportunity_portfolio',
      'value_estimate_portfolio',
      'ninety_day_pilot_plan',
    ],
    primaryQuestions: [
      'Which operational AI opportunities are in the portfolio?',
      'Where is value at risk?',
      'Which pilots are blocked by evidence, control, or owner gaps?',
    ],
    defaultActions: ['Track value gate', 'Escalate blocker', 'Open Move'],
    displayMode: 'portfolio_dashboard',
  },
  {
    module: 'source',
    visibleViews: [
      'application_friction_leaderboard',
      'automation_opportunity_portfolio',
      'human_agent_control_matrix',
    ],
    primaryQuestions: [
      'Which solution/vendor capabilities are required by evidence?',
      'Which controls must be in the RFP or BAFO?',
      'Which operational outcomes must vendors prove?',
    ],
    defaultActions: ['Create sourcing requirement', 'Add control to RFP', 'Create demo scenario'],
    displayMode: 'analyst_workspace',
  },
  {
    module: 'ava',
    visibleViews: [
      'operational_process_friction_summary',
      'application_friction_leaderboard',
      'automation_opportunity_portfolio',
      'human_agent_control_matrix',
      'value_estimate_portfolio',
      'evidence_readiness_and_lineage',
      'source_health_and_load_status',
      'ninety_day_pilot_plan',
    ],
    primaryQuestions: [
      'What work is repetitive?',
      'Where are the bottlenecks?',
      'Which apps create the most operational friction?',
      'What should we automate first?',
      'What stays human-approved?',
      'What is the 90-day pilot roadmap?',
      'What value can we expect?',
    ],
    defaultActions: ['Answer with evidence', 'Show trace', 'Create Move artifact section'],
    displayMode: 'answer_card',
  },
];

export function getOperationalSemanticViewsForModule(
  module: OperationalSemanticConsumerModule,
): OperationalSemanticView[] {
  const contract = OPERATIONAL_MODULE_VISIBILITY.find((entry) => entry.module === module);
  if (!contract) return [];
  const visible = new Set(contract.visibleViews);
  return OPERATIONAL_SEMANTIC_VIEWS.filter((view) => visible.has(view.id));
}

export function getOperationalModuleVisibility(
  module: OperationalSemanticConsumerModule,
): OperationalModuleVisibilityContract | null {
  return OPERATIONAL_MODULE_VISIBILITY.find((entry) => entry.module === module) ?? null;
}

export function buildOperationalInsightCards(input: {
  opportunities: Array<{
    opportunityId: string;
    opportunityName: string;
    sourceEvidence: string[];
    pattern: string;
    humanRole: string;
    agentRole: string;
    controls: string[];
    valueEstimate?: string;
    affectedApplications?: string[];
    affectedTeams?: string[];
    confidence?: number;
  }>;
  caveat?: string;
}): OperationalInsightCard[] {
  return input.opportunities.slice(0, 8).map((opportunity, index) => ({
    id: `operational-insight-${opportunity.opportunityId}`,
    type: index === 0 ? 'automation_priority' : index === 1 ? 'human_approval_boundary' : 'value_case',
    title: opportunity.opportunityName,
    summary: `${opportunity.pattern} Human role: ${opportunity.humanRole}. Agent role: ${opportunity.agentRole}.`,
    evidenceRefs: opportunity.sourceEvidence,
    affectedApplications: opportunity.affectedApplications ?? [],
    affectedTeams: opportunity.affectedTeams ?? [],
    recommendedAction: index < 3 ? 'Validate as 90-day pilot candidate.' : 'Keep in backlog for wave 2 evidence review.',
    confidence: opportunity.confidence ?? 0.72,
    caveat: input.caveat,
  }));
}
