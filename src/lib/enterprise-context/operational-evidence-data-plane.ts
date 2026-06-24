import { createHash } from 'node:crypto';

import {
  MINIMUM_OPERATIONAL_EVIDENCE_TEMPLATES,
  type SyntheticOperationalEvidencePack,
} from './operational-evidence-template-library';
import {
  automationOpportunityToMoveEvidenceItem,
  contextEvidenceTypeForSource,
  type AutomationOpportunity,
  type HumanAgentResponsibility,
  type OperationalEvent,
  type OperationalEvidenceSource,
  type OperationalSourceRef,
  type OpportunityValueEstimate,
  type ProcessFlowObservation,
  type SystemServiceMap,
  type WorkItem,
} from './operational-evidence';

export const OPERATIONAL_LOAD_STATES = [
  'registered',
  'uploaded',
  'staged',
  'parsed',
  'needs_mapping_review',
  'needs_sensitivity_review',
  'needs_owner_attestation',
  'reviewed',
  'committed',
  'indexed',
  'retrieval_proven',
  'parse_failed',
  'index_failed',
  'rejected',
] as const;

export type OperationalLoadState = (typeof OPERATIONAL_LOAD_STATES)[number];

export interface OperationalEvidenceFileManifestPlan {
  id: string;
  tenantKey: string;
  loadRunId: string;
  sourceFile: string;
  sourcePath: string;
  fileHash: string;
  mimeType: string;
  rowCount: number;
  sheetNames: string[];
  blobUri: string;
  redactionReceiptUri: string;
  uploadedBy: string;
  parserId: string;
  status: 'uploaded' | 'staged' | 'parsed' | 'review_required' | 'committed' | 'rejected';
  errors: string[];
}

export interface OperationalEvidenceLoadRunPlan {
  id: string;
  tenantKey: string;
  sourceId: string;
  runKey: string;
  loadMode: 'connector' | 'export' | 'upload' | 'manual' | 'synthetic_demo';
  state: OperationalLoadState;
  statesCompleted: OperationalLoadState[];
  templateVersion: string;
  parserId: string;
  recordsSeen: number;
  recordsLoaded: number;
  recordsRejected: number;
  reviewRequiredCount: number;
  sensitivityFindings: string[];
  errorSummary?: string;
}

export interface OperationalEvidenceRelationshipPlan {
  id: string;
  tenantKey: string;
  fromEntityType: string;
  fromEntityId: string;
  toEntityType: string;
  toEntityId: string;
  relationshipType: string;
  evidenceStrength: number;
  sourceRef: string;
}

export interface OperationalSemanticSnapshotPlan {
  id: string;
  tenantKey: string;
  moveId?: string | null;
  snapshotKey: string;
  viewId:
    | 'operational_process_friction_summary'
    | 'application_friction_leaderboard'
    | 'automation_opportunity_portfolio'
    | 'human_agent_control_matrix'
    | 'value_estimate_portfolio'
    | 'evidence_readiness_and_lineage'
    | 'source_health_and_load_status'
    | 'ninety_day_pilot_plan';
  inputHashes: string[];
  freshness: 'fresh' | 'attention' | 'stale' | 'unknown';
  confidence: number;
  caveats: string[];
  snapshotPayload: Record<string, unknown>;
}

export interface MoveEvidenceSlotCoveragePlan {
  id: string;
  tenantKey: string;
  moveId: string;
  phase: 'P2' | 'P3' | 'P4' | 'P5';
  slotId: string;
  readinessTier: 'minimum_draft' | 'recommended_executive' | 'optional_board';
  status: 'covered' | 'partial' | 'missing' | 'blocked';
  evidenceRefs: string[];
  sourceTypes: string[];
  confidence: number;
  caveats: string[];
  clientToComplete: string[];
}

export interface SanitizedSearchChunkPlan {
  chunkId: string;
  tenantKey: string;
  sourceEntityType: string;
  sourceEntityId: string;
  title: string;
  sanitizedSummary: string;
  citation: string;
  confidence: number;
  caveats: string[];
  indexName: 'enterprise-context-azure-search';
}

export interface OperationalReviewItemPlan {
  id: string;
  tenantKey: string;
  reason:
    | 'sensitivity_review'
    | 'mapping_review'
    | 'owner_attestation'
    | 'finance_validation'
    | 'human_approval_boundary'
    | 'synthetic_demo_label';
  sourceEntityType: string;
  sourceEntityId: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
}

export interface OperationalEvidenceDataPlanePlan {
  tenantKey: string;
  moveId: string;
  syntheticLabel?: string;
  source: OperationalEvidenceSource;
  loadRun: OperationalEvidenceLoadRunPlan;
  fileManifests: OperationalEvidenceFileManifestPlan[];
  normalized: {
    workItems: WorkItem[];
    events: OperationalEvent[];
    processObservations: ProcessFlowObservation[];
    systemServiceMaps: SystemServiceMap[];
    automationOpportunities: AutomationOpportunity[];
    humanAgentResponsibilities: HumanAgentResponsibility[];
    valueEstimates: OpportunityValueEstimate[];
  };
  relationships: OperationalEvidenceRelationshipPlan[];
  semanticSnapshots: OperationalSemanticSnapshotPlan[];
  moveEvidenceSlotCoverage: MoveEvidenceSlotCoveragePlan[];
  moveEvidenceItems: ReturnType<typeof automationOpportunityToMoveEvidenceItem>[];
  searchChunks: SanitizedSearchChunkPlan[];
  reviewItems: OperationalReviewItemPlan[];
  proof: {
    sourceRegistered: boolean;
    filesStagedWithHashes: boolean;
    templatesValidated: boolean;
    sensitivityReviewed: boolean;
    normalizedTypedRows: boolean;
    relationshipsCreated: boolean;
    movesProjectionCreated: boolean;
    sanitizedSearchChunksCreated: boolean;
    retrievalReady: boolean;
  };
}

const stableHash = (value: unknown): string =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const splitList = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value !== 'string') return [];
  return value
    .split(/[;,]/)
    .map((part) => part.trim())
    .filter(Boolean);
};

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[$,%a-zA-Z,\s-]+/g, ''));
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const confidenceFromText = (value: unknown, fallback = 0.72): number => {
  const normalized = String(value ?? '').toLowerCase();
  if (normalized.includes('high')) return 0.86;
  if (normalized.includes('medium')) return 0.72;
  if (normalized.includes('low')) return 0.58;
  return fallback;
};

const sourceRef = (args: {
  sourceSystem: string;
  sourceRecordId: string;
  sourceFile: string;
  row: number;
  evidencePointer?: string;
}): OperationalSourceRef => ({
  sourceSystem: args.sourceSystem,
  sourceRecordId: args.sourceRecordId,
  sourceFile: args.sourceFile,
  sourceRowNumber: args.row,
  evidencePointer: args.evidencePointer ?? `${args.sourceFile}#row-${args.row}`,
  rawPayloadStored: false,
  redactionApplied: true,
});

const minutesToHours = (minutes: unknown): number | undefined => {
  const n = toNumber(minutes);
  return n === undefined ? undefined : Number((n / 60).toFixed(2));
};

const hoursFromText = (value: unknown): number | undefined => {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return undefined;
  const match = value.match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : undefined;
};

function validateMinimumTemplates(pack: SyntheticOperationalEvidencePack): string[] {
  const missing: string[] = [];
  const used = new Set(pack.templatesUsed);
  for (const template of MINIMUM_OPERATIONAL_EVIDENCE_TEMPLATES) {
    if (!used.has(template.templateId)) missing.push(template.templateId);
  }
  return missing;
}

function buildFileManifests(pack: SyntheticOperationalEvidencePack, loadRunId: string): OperationalEvidenceFileManifestPlan[] {
  const groups: Array<[string, Record<string, unknown> | Record<string, unknown>[]]> = [
    ['operational_use_case_intake.json', pack.records.operationalUseCaseIntake],
    ['servicenow_ticket_extract.csv', pack.records.serviceNowTickets],
    ['jira_delivery_extract.csv', pack.records.jiraDeliveryItems],
    ['app_cmdb_inventory.csv', pack.records.appCmdbInventory],
    ['log_event_summary.csv', pack.records.logEventSummaries],
    ['process_flow_observation.csv', pack.records.processFlowObservations],
    ['ai_opportunity_backlog.csv', pack.records.aiOpportunityBacklog],
    ['value_effort_estimate.csv', pack.records.valueEffortEstimates],
  ];
  return groups.map(([file, records], index) => {
    const rowCount = Array.isArray(records) ? records.length : 1;
    return {
      id: `file-${slug(file)}`,
      tenantKey: pack.tenantId,
      loadRunId,
      sourceFile: file,
      sourcePath: `synthetic-demo/${pack.tenantId}/${file}`,
      fileHash: stableHash(records),
      mimeType: file.endsWith('.json') ? 'application/json' : 'text/csv',
      rowCount,
      sheetNames: [],
      blobUri: `https://private.blob.local/${pack.tenantId}/operational-evidence/${file}`,
      redactionReceiptUri: `https://private.blob.local/${pack.tenantId}/operational-evidence/redaction/${file}.receipt.json`,
      uploadedBy: 'synthetic_demo_factory',
      parserId: 'operational-evidence-minimum-v1',
      status: 'committed',
      errors: index === 0 ? validateMinimumTemplates(pack) : [],
    };
  });
}

function normalizeWorkItems(pack: SyntheticOperationalEvidencePack, sourceId: string): WorkItem[] {
  const serviceNow = pack.records.serviceNowTickets.map((row, index): WorkItem => ({
    id: String(row.ticket_id),
    tenantId: pack.tenantId,
    sourceId,
    externalId: String(row.ticket_id),
    workItemType: String(row.ticket_type) as WorkItem['workItemType'],
    title: String(row.short_description),
    summary: String(row.resolution_summary ?? row.short_description),
    businessService: String(row.business_service ?? ''),
    applicationId: String(row.application_or_CI ?? ''),
    category: String(row.category ?? ''),
    subcategory: String(row.subcategory ?? ''),
    priority: String(row.priority ?? ''),
    severity: String(row.severity ?? ''),
    status: String(row.status ?? ''),
    assignmentGroup: String(row.assignment_group ?? ''),
    ownerTeam: String(row.assignment_group ?? ''),
    openedAt: String(row.opened_at ?? ''),
    resolvedAt: String(row.resolved_at ?? ''),
    cycleTimeHours: undefined,
    reopenCount: toNumber(row.reopen_count) ?? 0,
    handoffCount: toNumber(row.reassignment_count) ?? 0,
    slaBreached: Boolean(row.sla_breached),
    linkedWorkItems: splitList(row.linked_jira_key),
    evidenceConfidence: 0.78,
    sourceRef: sourceRef({
      sourceSystem: 'servicenow',
      sourceRecordId: String(row.ticket_id),
      sourceFile: 'servicenow_ticket_extract.csv',
      row: index + 1,
    }),
  }));

  const jira = pack.records.jiraDeliveryItems.map((row, index): WorkItem => ({
    id: String(row.issue_key),
    tenantId: pack.tenantId,
    sourceId,
    externalId: String(row.issue_key),
    workItemType: String(row.issue_type).toLowerCase() as WorkItem['workItemType'],
    title: String(row.summary),
    summary: String(row.blocker_reason ?? row.summary),
    businessService: String(row.business_domain ?? ''),
    applicationId: String(row.application ?? ''),
    category: String(row.component ?? ''),
    priority: String(row.priority ?? ''),
    status: String(row.status ?? ''),
    ownerTeam: String(row.assignee_team ?? ''),
    openedAt: String(row.created_at ?? ''),
    resolvedAt: String(row.resolved_at ?? ''),
    cycleTimeHours: hoursFromText(row.cycle_time_days) ? Number((hoursFromText(row.cycle_time_days)! * 24).toFixed(2)) : undefined,
    reopenCount: row.reopened_flag === true ? 1 : 0,
    handoffCount: row.blocked_flag === true ? 1 : 0,
    slaBreached: Boolean(row.blocked_flag),
    linkedWorkItems: splitList(row.linked_incident_or_request),
    evidenceConfidence: 0.74,
    sourceRef: sourceRef({
      sourceSystem: 'jira',
      sourceRecordId: String(row.issue_key),
      sourceFile: 'jira_delivery_extract.csv',
      row: index + 1,
    }),
  }));

  return [...serviceNow, ...jira];
}

function normalizeEvents(pack: SyntheticOperationalEvidencePack, sourceId: string): OperationalEvent[] {
  return pack.records.logEventSummaries.map((row, index): OperationalEvent => ({
    id: String(row.event_id),
    tenantId: pack.tenantId,
    sourceId,
    eventTime: String(row.event_time_bucket),
    eventType: String(row.event_type) as OperationalEvent['eventType'],
    applicationId: String(row.application_or_service ?? ''),
    serviceName: String(row.application_or_service ?? ''),
    environment: String(row.environment ?? ''),
    severity: String(row.severity ?? ''),
    eventClass: String(row.event_class ?? ''),
    messageSummary: String(row.message_summary ?? ''),
    count: toNumber(row.count),
    frequency: toNumber(row.frequency),
    latencyMs: toNumber(row.average_latency_ms),
    linkedWorkItemId: String(row.linked_ticket_id ?? ''),
    impactSummary: String(row.affected_transaction_or_job ?? ''),
    sourceRef: sourceRef({
      sourceSystem: 'observability',
      sourceRecordId: String(row.event_id),
      sourceFile: 'log_event_summary.csv',
      row: index + 1,
    }),
    confidence: 0.76,
  }));
}

function normalizeProcessObservations(pack: SyntheticOperationalEvidencePack): ProcessFlowObservation[] {
  return pack.records.processFlowObservations.map((row, index): ProcessFlowObservation => ({
    id: `PROC-${index + 1}-${slug(String(row.process_step))}`,
    tenantId: pack.tenantId,
    processName: String(row.process_name),
    businessDomain: String(row.business_domain ?? ''),
    sourceEvidenceRefs: splitList(row.evidence_source),
    startEvent: String(row.start_event ?? ''),
    endEvent: String(row.end_event ?? ''),
    steps: [String(row.process_step)],
    handoffs: splitList(row.handoff_to),
    queues: splitList(row.queue_or_status),
    approvals: row.approval_required ? [String(row.process_step)] : [],
    bottlenecks: [String(row.pain_point ?? row.queue_or_status ?? '')].filter(Boolean),
    reworkLoops: row.rework_loop_flag ? [String(row.process_step)] : [],
    averageCycleTime: hoursFromText(row.average_wait_time),
    manualEffortEstimate: minutesToHours(row.average_work_time),
    confidence: 0.75,
  }));
}

function normalizeServiceMaps(pack: SyntheticOperationalEvidencePack): SystemServiceMap[] {
  return pack.records.appCmdbInventory.map((row): SystemServiceMap => ({
    id: String(row.application_id),
    tenantId: pack.tenantId,
    applicationId: String(row.application_id),
    businessService: String(row.business_service ?? ''),
    businessProcess: String(row.business_domain ?? ''),
    ownerBusiness: String(row.business_owner ?? ''),
    ownerTechnical: String(row.technical_owner ?? ''),
    supportGroup: String(row.support_group ?? ''),
    criticality: String(row.criticality ?? ''),
    upstreamDependencies: splitList(row.upstream_dependencies),
    downstreamDependencies: splitList(row.downstream_dependencies),
    integrationPoints: splitList(row.technology_stack),
    confidence: 0.82,
  }));
}

function normalizeOpportunities(pack: SyntheticOperationalEvidencePack): AutomationOpportunity[] {
  return pack.records.aiOpportunityBacklog.map((row): AutomationOpportunity => ({
    id: String(row.opportunity_id),
    tenantId: pack.tenantId,
    moveId: 'move-operational-proof',
    opportunityName: String(row.opportunity_name),
    opportunityType: String(row.opportunity_type) as AutomationOpportunity['opportunityType'],
    sourcePatterns: [String(row.source_pattern)],
    affectedProcess: String(row.affected_process ?? ''),
    affectedApplications: splitList(row.affected_applications),
    affectedTeams: splitList(row.affected_teams),
    currentPain: String(row.current_pain),
    proposedAiCapability: String(row.proposed_ai_capability),
    humanRole: String(row.human_role),
    agentRole: String(row.agent_role),
    automationLevel: String(row.automation_level) as AutomationOpportunity['automationLevel'],
    estimatedVolume: toNumber(row.estimated_volume),
    estimatedEffortSaved: toNumber(row.estimated_effort_saved),
    estimatedCycleTimeReduction: toNumber(row.cycle_time_reduction),
    valueScore: toNumber(row.value_score) ?? 0,
    feasibilityScore: toNumber(row.feasibility_score) ?? 0,
    riskScore: toNumber(row.risk_score) ?? 0,
    readinessScore: toNumber(row.readiness_score) ?? 0,
    priority: String(row.priority) as AutomationOpportunity['priority'],
    requiredControls: splitList(row.required_controls),
    evidenceRefs: splitList(row.evidence_refs),
    confidence: 0.8,
  }));
}

function normalizeResponsibilities(opportunities: AutomationOpportunity[]): HumanAgentResponsibility[] {
  return opportunities.map((opportunity): HumanAgentResponsibility => ({
    id: `HAR-${opportunity.id}`,
    tenantId: opportunity.tenantId,
    opportunityId: opportunity.id,
    processStep: opportunity.affectedProcess ?? opportunity.opportunityName,
    currentOwner: opportunity.affectedTeams[0] ?? 'Business owner',
    futureHumanRole: opportunity.humanRole,
    futureAgentRole: opportunity.agentRole,
    automationLevel: opportunity.automationLevel,
    humanApprovalRequired: opportunity.automationLevel !== 'automate',
    riskLevel: opportunity.riskScore >= 4 ? 'high' : opportunity.riskScore >= 3 ? 'medium' : 'low',
    evidenceRequired: opportunity.evidenceRefs,
    guardrail: opportunity.requiredControls.join('; '),
    auditRequirement: 'Audit log with recommendation, evidence, human decision, and override reason.',
    estimateImpact: `${opportunity.estimatedEffortSaved ?? 'TBD'} effort saved`,
    runCostImpact: 'Requires run-cost validation before funding approval.',
  }));
}

function normalizeValueEstimates(pack: SyntheticOperationalEvidencePack): OpportunityValueEstimate[] {
  return pack.records.valueEffortEstimates.map((row): OpportunityValueEstimate => ({
    id: `VAL-${String(row.opportunity_id)}`,
    tenantId: pack.tenantId,
    opportunityId: String(row.opportunity_id),
    valueDriver: String(row.value_driver),
    baselineVolume: toNumber(row.baseline_volume),
    baselineEffortHours: minutesToHours(row.baseline_effort_minutes),
    baselineCycleTime: hoursFromText(row.baseline_cycle_time),
    baselineCost: toNumber(row.baseline_cost),
    targetReductionPercent: toNumber(row.target_reduction_percent),
    estimatedSavings: toNumber(row.estimated_savings),
    implementationCost: toNumber(row.implementation_cost),
    runCost: toNumber(row.run_cost),
    paybackPeriod: String(row.payback_period ?? ''),
    confidence: confidenceFromText(row.confidence),
    assumptions: splitList(row.assumptions),
    rateCardRef: String(row.rate_card_source ?? ''),
    financeValidationStatus: String(row.finance_validation_status).toLowerCase().includes('required') ? 'required' : 'not_started',
  }));
}

function buildRelationships(plan: {
  tenantKey: string;
  workItems: WorkItem[];
  events: OperationalEvent[];
  processes: ProcessFlowObservation[];
  opportunities: AutomationOpportunity[];
  values: OpportunityValueEstimate[];
}): OperationalEvidenceRelationshipPlan[] {
  const relationships: OperationalEvidenceRelationshipPlan[] = [];
  const add = (fromType: string, fromId: string, toType: string, toId: string, type: string, sourceRefValue: string, strength = 0.78): void => {
    relationships.push({
      id: `rel-${slug(`${fromType}-${fromId}-${type}-${toType}-${toId}`)}`,
      tenantKey: plan.tenantKey,
      fromEntityType: fromType,
      fromEntityId: fromId,
      toEntityType: toType,
      toEntityId: toId,
      relationshipType: type,
      evidenceStrength: strength,
      sourceRef: sourceRefValue,
    });
  };

  for (const item of plan.workItems) {
    if (item.applicationId) add('work_item', item.id, 'application', item.applicationId, 'affects', item.sourceRef.evidencePointer);
  }
  for (const event of plan.events) {
    if (event.linkedWorkItemId) add('operational_event', event.id, 'work_item', event.linkedWorkItemId, 'corroborates', event.sourceRef.evidencePointer);
    if (event.applicationId) add('operational_event', event.id, 'application', event.applicationId, 'observed_on', event.sourceRef.evidencePointer);
  }
  for (const process of plan.processes) {
    for (const ref of process.sourceEvidenceRefs) add('process_observation', process.id, 'source_evidence', ref, 'derived_from', ref, 0.72);
  }
  for (const opportunity of plan.opportunities) {
    for (const ref of opportunity.evidenceRefs) add('automation_opportunity', opportunity.id, 'source_evidence', ref, 'supported_by', ref, opportunity.confidence);
    if (opportunity.affectedProcess) add('automation_opportunity', opportunity.id, 'process', opportunity.affectedProcess, 'improves', opportunity.id, opportunity.confidence);
  }
  for (const value of plan.values) add('value_estimate', value.id, 'automation_opportunity', value.opportunityId, 'estimates_value_for', value.id, value.confidence);
  return relationships;
}

function buildSemanticSnapshots(args: {
  tenantKey: string;
  moveId: string;
  fileHashes: string[];
  workItems: WorkItem[];
  opportunities: AutomationOpportunity[];
  values: OpportunityValueEstimate[];
  caveats: string[];
}): OperationalSemanticSnapshotPlan[] {
  const topOpportunity = [...args.opportunities].sort((a, b) => b.valueScore + b.readinessScore - (a.valueScore + a.readinessScore))[0];
  const confidence = args.opportunities.length > 0 ? 0.78 : 0.5;
  return [
    {
      id: 'snapshot-app-friction',
      tenantKey: args.tenantKey,
      moveId: args.moveId,
      snapshotKey: `${args.moveId}:application_friction_leaderboard`,
      viewId: 'application_friction_leaderboard',
      inputHashes: args.fileHashes,
      freshness: 'fresh',
      confidence,
      caveats: args.caveats,
      snapshotPayload: {
        workItemCount: args.workItems.length,
        topApplications: [...new Set(args.workItems.map((item) => item.applicationId).filter(Boolean))],
      },
    },
    {
      id: 'snapshot-opportunity-portfolio',
      tenantKey: args.tenantKey,
      moveId: args.moveId,
      snapshotKey: `${args.moveId}:automation_opportunity_portfolio`,
      viewId: 'automation_opportunity_portfolio',
      inputHashes: args.fileHashes,
      freshness: 'fresh',
      confidence,
      caveats: args.caveats,
      snapshotPayload: {
        opportunityCount: args.opportunities.length,
        topOpportunity: topOpportunity?.opportunityName,
        priorities: args.opportunities.map((opportunity) => ({ id: opportunity.id, priority: opportunity.priority })),
      },
    },
    {
      id: 'snapshot-value-estimates',
      tenantKey: args.tenantKey,
      moveId: args.moveId,
      snapshotKey: `${args.moveId}:value_estimate_portfolio`,
      viewId: 'value_estimate_portfolio',
      inputHashes: args.fileHashes,
      freshness: 'fresh',
      confidence,
      caveats: [...args.caveats, 'Finance/client validation required when benchmark rates are used.'],
      snapshotPayload: {
        estimateCount: args.values.length,
        rateCardSources: [...new Set(args.values.map((value) => value.rateCardRef).filter(Boolean))],
        financeValidation: [...new Set(args.values.map((value) => value.financeValidationStatus))],
      },
    },
  ];
}

function buildMoveSlotCoverage(args: {
  tenantKey: string;
  moveId: string;
  opportunities: AutomationOpportunity[];
  values: OpportunityValueEstimate[];
  caveats: string[];
}): MoveEvidenceSlotCoveragePlan[] {
  const evidenceRefs = [...new Set(args.opportunities.flatMap((opportunity) => opportunity.evidenceRefs))];
  return [
    {
      id: 'slot-p2-operational-current-state',
      tenantKey: args.tenantKey,
      moveId: args.moveId,
      phase: 'P2',
      slotId: 'p2_operational_current_state',
      readinessTier: 'minimum_draft',
      status: evidenceRefs.length > 0 ? 'covered' : 'missing',
      evidenceRefs,
      sourceTypes: ['ticket_evidence', 'delivery_evidence', 'observability_evidence', 'process_evidence'],
      confidence: 0.76,
      caveats: args.caveats,
      clientToComplete: [],
    },
    {
      id: 'slot-p3-operational-automation-opportunities',
      tenantKey: args.tenantKey,
      moveId: args.moveId,
      phase: 'P3',
      slotId: 'p3_operational_automation_opportunities',
      readinessTier: 'recommended_executive',
      status: args.opportunities.length > 0 ? 'covered' : 'missing',
      evidenceRefs,
      sourceTypes: ['automation_opportunity_evidence', 'control_evidence'],
      confidence: 0.78,
      caveats: args.caveats,
      clientToComplete: ['Client should confirm human approval boundaries before production automation.'],
    },
    {
      id: 'slot-p4-operational-value-estimate',
      tenantKey: args.tenantKey,
      moveId: args.moveId,
      phase: 'P4',
      slotId: 'p4_operational_value_estimate',
      readinessTier: 'recommended_executive',
      status: args.values.length > 0 ? 'partial' : 'missing',
      evidenceRefs: args.values.map((value) => value.id),
      sourceTypes: ['value_evidence'],
      confidence: 0.68,
      caveats: [...args.caveats, 'Finance/client rate validation required before funding approval.'],
      clientToComplete: ['Upload or approve client rate card and finance assumptions.'],
    },
  ];
}

function buildSearchChunks(args: {
  tenantKey: string;
  opportunities: AutomationOpportunity[];
  processes: ProcessFlowObservation[];
  values: OpportunityValueEstimate[];
  caveats: string[];
}): SanitizedSearchChunkPlan[] {
  const opportunityChunks = args.opportunities.map((opportunity): SanitizedSearchChunkPlan => ({
    chunkId: `chunk-${opportunity.id}`,
    tenantKey: args.tenantKey,
    sourceEntityType: 'automation_opportunity',
    sourceEntityId: opportunity.id,
    title: opportunity.opportunityName,
    sanitizedSummary: `${opportunity.opportunityName}: ${opportunity.currentPain} Proposed AI capability: ${opportunity.proposedAiCapability}. Human role: ${opportunity.humanRole}. Agent role: ${opportunity.agentRole}.`,
    citation: opportunity.evidenceRefs.join(', '),
    confidence: opportunity.confidence,
    caveats: args.caveats,
    indexName: 'enterprise-context-azure-search',
  }));
  const processChunks = args.processes.map((process): SanitizedSearchChunkPlan => ({
    chunkId: `chunk-${process.id}`,
    tenantKey: args.tenantKey,
    sourceEntityType: 'process_flow_observation',
    sourceEntityId: process.id,
    title: process.processName,
    sanitizedSummary: `${process.processName}: bottlenecks include ${process.bottlenecks.join('; ')}. Handoffs: ${process.handoffs.join('; ')}.`,
    citation: process.sourceEvidenceRefs.join(', '),
    confidence: process.confidence,
    caveats: args.caveats,
    indexName: 'enterprise-context-azure-search',
  }));
  const valueChunks = args.values.map((value): SanitizedSearchChunkPlan => ({
    chunkId: `chunk-${value.id}`,
    tenantKey: args.tenantKey,
    sourceEntityType: 'opportunity_value_estimate',
    sourceEntityId: value.id,
    title: value.valueDriver,
    sanitizedSummary: `${value.valueDriver}. Rate source: ${value.rateCardRef ?? 'unknown'}. Finance validation status: ${value.financeValidationStatus}.`,
    citation: value.id,
    confidence: value.confidence,
    caveats: [...args.caveats, 'ROM estimate only until finance/client validation is complete.'],
    indexName: 'enterprise-context-azure-search',
  }));
  return [...opportunityChunks, ...processChunks, ...valueChunks];
}

function buildReviewItems(args: {
  tenantKey: string;
  pack: SyntheticOperationalEvidencePack;
  values: OpportunityValueEstimate[];
  responsibilities: HumanAgentResponsibility[];
}): OperationalReviewItemPlan[] {
  const review: OperationalReviewItemPlan[] = [];
  if (args.pack.sourceType === 'synthetic_demo') {
    review.push({
      id: 'review-synthetic-demo-label',
      tenantKey: args.tenantKey,
      reason: 'synthetic_demo_label',
      sourceEntityType: 'evidence_pack',
      sourceEntityId: args.pack.useCaseName,
      message: 'Synthetic demo evidence is usable for proof/draft only and must not override production truth.',
      severity: 'info',
    });
  }
  for (const value of args.values) {
    if (value.financeValidationStatus !== 'validated') {
      review.push({
        id: `review-finance-${value.id}`,
        tenantKey: args.tenantKey,
        reason: 'finance_validation',
        sourceEntityType: 'opportunity_value_estimate',
        sourceEntityId: value.id,
        message: 'Finance/client validation required before funding approval.',
        severity: 'warning',
      });
    }
  }
  for (const responsibility of args.responsibilities) {
    if (responsibility.humanApprovalRequired && !responsibility.guardrail) {
      review.push({
        id: `review-approval-${responsibility.id}`,
        tenantKey: args.tenantKey,
        reason: 'human_approval_boundary',
        sourceEntityType: 'human_agent_responsibility',
        sourceEntityId: responsibility.id,
        message: 'Human approval boundary is required before automation can proceed.',
        severity: 'error',
      });
    }
  }
  return review;
}

export function buildOperationalEvidenceDataPlanePlan(input: {
  pack: SyntheticOperationalEvidencePack;
  moveId?: string;
}): OperationalEvidenceDataPlanePlan {
  const pack = input.pack;
  const moveId = input.moveId ?? 'move-operational-proof';
  const sourceId = `src-${pack.tenantId}-operational-evidence`;
  const loadRunId = `run-${pack.tenantId}-${slug(pack.generatedAt)}`;
  const fileManifests = buildFileManifests(pack, loadRunId);
  const templateGaps = validateMinimumTemplates(pack);
  const source: OperationalEvidenceSource = {
    id: sourceId,
    tenantId: pack.tenantId,
    sourceType: 'manual_upload',
    sourceName: pack.useCaseName,
    connectionMode: 'synthetic_demo',
    dataClassification: 'Internal',
    piiPhiFlag: true,
    retentionPolicy: 'synthetic_demo_retention',
    ingestionStatus: templateGaps.length > 0 ? 'needs_review' : 'loaded',
    lastIngestedAt: pack.generatedAt,
    owner: String(pack.records.operationalUseCaseIntake.business_owner ?? 'Business owner'),
    confidence: 0.72,
  };

  const workItems = normalizeWorkItems(pack, sourceId);
  const events = normalizeEvents(pack, sourceId);
  const processObservations = normalizeProcessObservations(pack);
  const systemServiceMaps = normalizeServiceMaps(pack);
  const automationOpportunities = normalizeOpportunities(pack).map((opportunity) => ({ ...opportunity, moveId }));
  const humanAgentResponsibilities = normalizeResponsibilities(automationOpportunities);
  const valueEstimates = normalizeValueEstimates(pack);
  const relationships = buildRelationships({
    tenantKey: pack.tenantId,
    workItems,
    events,
    processes: processObservations,
    opportunities: automationOpportunities,
    values: valueEstimates,
  });
  const caveats = [pack.syntheticLabel, 'Raw files remain in controlled storage; only structured evidence and sanitized summaries feed aVa/Claude.'];
  const semanticSnapshots = buildSemanticSnapshots({
    tenantKey: pack.tenantId,
    moveId,
    fileHashes: fileManifests.map((file) => file.fileHash),
    workItems,
    opportunities: automationOpportunities,
    values: valueEstimates,
    caveats,
  });
  const moveEvidenceSlotCoverage = buildMoveSlotCoverage({
    tenantKey: pack.tenantId,
    moveId,
    opportunities: automationOpportunities,
    values: valueEstimates,
    caveats,
  });
  const searchChunks = buildSearchChunks({
    tenantKey: pack.tenantId,
    opportunities: automationOpportunities,
    processes: processObservations,
    values: valueEstimates,
    caveats,
  });
  const reviewItems = buildReviewItems({ tenantKey: pack.tenantId, pack, values: valueEstimates, responsibilities: humanAgentResponsibilities });
  const normalizedCount =
    workItems.length +
    events.length +
    processObservations.length +
    systemServiceMaps.length +
    automationOpportunities.length +
    humanAgentResponsibilities.length +
    valueEstimates.length;

  return {
    tenantKey: pack.tenantId,
    moveId,
    syntheticLabel: pack.syntheticLabel,
    source,
    loadRun: {
      id: loadRunId,
      tenantKey: pack.tenantId,
      sourceId,
      runKey: loadRunId,
      loadMode: 'synthetic_demo',
      state: templateGaps.length > 0 ? 'needs_mapping_review' : 'retrieval_proven',
      statesCompleted: ['registered', 'uploaded', 'staged', 'parsed', 'reviewed', 'committed', 'indexed', 'retrieval_proven'],
      templateVersion: 'minimum-operational-evidence-v1',
      parserId: 'operational-evidence-minimum-v1',
      recordsSeen: normalizedCount,
      recordsLoaded: normalizedCount,
      recordsRejected: 0,
      reviewRequiredCount: reviewItems.length,
      sensitivityFindings: ['synthetic_demo', 'pii_phi_possible_fields_redacted', 'raw_comments_not_loaded', 'raw_logs_not_loaded'],
    },
    fileManifests,
    normalized: {
      workItems,
      events,
      processObservations,
      systemServiceMaps,
      automationOpportunities,
      humanAgentResponsibilities,
      valueEstimates,
    },
    relationships,
    semanticSnapshots,
    moveEvidenceSlotCoverage,
    moveEvidenceItems: automationOpportunities.map((opportunity) => automationOpportunityToMoveEvidenceItem(opportunity)),
    searchChunks,
    reviewItems,
    proof: {
      sourceRegistered: Boolean(source.id),
      filesStagedWithHashes: fileManifests.every((file) => file.blobUri && file.fileHash),
      templatesValidated: templateGaps.length === 0,
      sensitivityReviewed: reviewItems.some((item) => item.reason === 'synthetic_demo_label') && fileManifests.every((file) => file.redactionReceiptUri),
      normalizedTypedRows: normalizedCount > 0,
      relationshipsCreated: relationships.length > 0,
      movesProjectionCreated: moveEvidenceSlotCoverage.length > 0 && automationOpportunities.length > 0,
      sanitizedSearchChunksCreated: searchChunks.length > 0 && searchChunks.every((chunk) => !/password|token|secret/i.test(chunk.sanitizedSummary)),
      retrievalReady: searchChunks.length > 0 && semanticSnapshots.length > 0,
    },
  };
}

export function getOperationalEvidenceTableTargets(): Record<string, string> {
  return {
    sourceRegistry: 'operational_evidence_sources',
    fileLineage: 'operational_evidence_file_manifests',
    loadRuns: 'operational_evidence_load_runs',
    workItems: 'operational_work_items',
    events: 'operational_events',
    processObservations: 'operational_process_observations',
    systemServiceMaps: 'operational_system_service_maps',
    automationOpportunities: 'operational_automation_opportunities',
    humanAgentResponsibilities: 'operational_human_agent_responsibilities',
    valueEstimates: 'operational_value_estimates',
    insights: 'operational_evidence_insights',
    evidenceGraph: 'operational_evidence_relationships',
    semanticSnapshots: 'operational_semantic_snapshots',
    movesProjection: 'move_evidence_slot_coverage',
    searchQueue: 'enterprise_context_chunks',
  };
}

export function summarizeOperationalDataPlanePlan(plan: OperationalEvidenceDataPlanePlan): string[] {
  return [
    `Source registered: ${plan.source.sourceName} (${plan.source.connectionMode})`,
    `Files staged: ${plan.fileManifests.length} with immutable hashes`,
    `Typed rows: ${Object.values(plan.normalized).reduce((sum, rows) => sum + rows.length, 0)}`,
    `Relationships: ${plan.relationships.length}`,
    `Moves slots: ${plan.moveEvidenceSlotCoverage.length}`,
    `Search chunks: ${plan.searchChunks.length}`,
    `Review items: ${plan.reviewItems.length}`,
    `Evidence type for source: ${contextEvidenceTypeForSource(plan.source.sourceType)}`,
  ];
}
