import type { MoveArtifactConsumer, MoveEvidenceItem, MoveEvidenceType } from '@/lib/programs/evidence-readiness/types';

export const OPERATIONAL_EVIDENCE_SOURCE_TYPES = [
  'servicenow',
  'jira',
  'app_log',
  'observability',
  'cmdb',
  'app_inventory',
  'manual_upload',
  'other',
] as const;

export type OperationalEvidenceSourceType = (typeof OPERATIONAL_EVIDENCE_SOURCE_TYPES)[number];

export const OPERATIONAL_CONNECTION_MODES = [
  'connector',
  'export',
  'upload',
  'manual',
  'synthetic_demo',
] as const;

export type OperationalConnectionMode = (typeof OPERATIONAL_CONNECTION_MODES)[number];

export const OPERATIONAL_EVIDENCE_RECORD_TYPES = [
  'operational_evidence_source',
  'work_item',
  'operational_event',
  'process_flow_observation',
  'system_service_map',
  'automation_opportunity',
  'human_agent_responsibility',
  'opportunity_value_estimate',
  'operational_evidence_insight',
] as const;

export type OperationalEvidenceRecordType = (typeof OPERATIONAL_EVIDENCE_RECORD_TYPES)[number];

export const OPERATIONAL_CONTEXT_EVIDENCE_TYPES = [
  'ticket_evidence',
  'delivery_evidence',
  'observability_evidence',
  'process_evidence',
  'automation_opportunity_evidence',
  'control_evidence',
  'value_evidence',
  'ownership_evidence',
] as const;

export type OperationalContextEvidenceType = (typeof OPERATIONAL_CONTEXT_EVIDENCE_TYPES)[number];

export interface OperationalSourceRef {
  sourceSystem: string;
  sourceRecordId: string;
  sourceUrl?: string;
  sourceFile?: string;
  sourceSheet?: string;
  sourceRowNumber?: number;
  evidencePointer: string;
  rawPayloadRef?: string;
  rawPayloadStored: boolean;
  redactionApplied: boolean;
}

export interface OperationalEvidenceSource {
  id: string;
  tenantId: string;
  sourceType: OperationalEvidenceSourceType;
  sourceName: string;
  connectionMode: OperationalConnectionMode;
  dataClassification: 'Public' | 'Internal' | 'Confidential' | 'Restricted';
  piiPhiFlag: boolean;
  retentionPolicy: string;
  ingestionStatus: 'pending' | 'ingesting' | 'loaded' | 'needs_review' | 'failed';
  lastIngestedAt?: string;
  owner: string;
  confidence: number;
}

export interface WorkItem {
  id: string;
  tenantId: string;
  sourceId: string;
  externalId: string;
  workItemType: 'incident' | 'request' | 'change' | 'problem' | 'story' | 'bug' | 'epic' | 'task';
  title: string;
  summary: string;
  rawDescriptionRef?: string;
  businessService?: string;
  applicationId?: string;
  ciId?: string;
  category?: string;
  subcategory?: string;
  priority?: string;
  severity?: string;
  status: string;
  assignmentGroup?: string;
  ownerTeam?: string;
  assigneeRole?: string;
  openedAt?: string;
  resolvedAt?: string;
  cycleTimeHours?: number;
  reopenCount?: number;
  handoffCount?: number;
  slaBreached?: boolean;
  linkedWorkItems?: string[];
  evidenceConfidence: number;
  sourceRef: OperationalSourceRef;
}

export interface OperationalEvent {
  id: string;
  tenantId: string;
  sourceId: string;
  eventTime: string;
  eventType: 'error' | 'alert' | 'latency' | 'api_failure' | 'batch_failure' | 'security_signal' | 'performance' | 'availability' | 'other';
  applicationId?: string;
  serviceName?: string;
  environment?: string;
  severity?: string;
  eventClass?: string;
  messageSummary: string;
  count?: number;
  frequency?: number;
  latencyMs?: number;
  correlationId?: string;
  linkedWorkItemId?: string;
  impactSummary?: string;
  sourceRef: OperationalSourceRef;
  confidence: number;
}

export interface ProcessFlowObservation {
  id: string;
  tenantId: string;
  processName: string;
  businessDomain?: string;
  sourceEvidenceRefs: string[];
  startEvent?: string;
  endEvent?: string;
  steps: string[];
  handoffs: string[];
  queues: string[];
  approvals: string[];
  bottlenecks: string[];
  reworkLoops: string[];
  averageCycleTime?: number;
  p90CycleTime?: number;
  slaBreachRate?: number;
  exceptionRate?: number;
  manualEffortEstimate?: number;
  confidence: number;
}

export interface SystemServiceMap {
  id: string;
  tenantId: string;
  applicationId?: string;
  ciId?: string;
  businessService?: string;
  businessProcess?: string;
  ownerBusiness?: string;
  ownerTechnical?: string;
  supportGroup?: string;
  criticality?: string;
  upstreamDependencies: string[];
  downstreamDependencies: string[];
  integrationPoints: string[];
  confidence: number;
}

export interface AutomationOpportunity {
  id: string;
  tenantId: string;
  moveId?: string | null;
  opportunityName: string;
  opportunityType: 'triage' | 'routing' | 'summarization' | 'knowledge' | 'root_cause' | 'release_risk' | 'approval' | 'reporting' | 'process_mining' | 'policy_assistant' | 'agentic_workflow' | 'other';
  sourcePatterns: string[];
  affectedProcess?: string;
  affectedApplications: string[];
  affectedTeams: string[];
  currentPain: string;
  proposedAiCapability: string;
  humanRole: string;
  agentRole: string;
  automationLevel: 'assist' | 'recommend' | 'automate_with_approval' | 'automate';
  estimatedVolume?: number;
  estimatedEffortSaved?: number;
  estimatedCycleTimeReduction?: number;
  valueScore: number;
  feasibilityScore: number;
  riskScore: number;
  readinessScore: number;
  priority: 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
  requiredControls: string[];
  evidenceRefs: string[];
  confidence: number;
}

export interface HumanAgentResponsibility {
  id: string;
  tenantId: string;
  opportunityId: string;
  processStep: string;
  currentOwner: string;
  futureHumanRole: string;
  futureAgentRole: string;
  automationLevel: AutomationOpportunity['automationLevel'];
  humanApprovalRequired: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  evidenceRequired: string[];
  guardrail: string;
  auditRequirement: string;
  estimateImpact?: string;
  runCostImpact?: string;
}

export interface OpportunityValueEstimate {
  id: string;
  tenantId: string;
  opportunityId: string;
  valueDriver: string;
  baselineVolume?: number;
  baselineEffortHours?: number;
  baselineCycleTime?: number;
  baselineCost?: number;
  targetReductionPercent?: number;
  estimatedSavings?: number;
  implementationCost?: number;
  runCost?: number;
  paybackPeriod?: string;
  confidence: number;
  assumptions: string[];
  rateCardRef?: string;
  financeValidationStatus: 'not_started' | 'required' | 'in_review' | 'validated' | 'rejected';
}

export interface OperationalEvidenceInsight {
  id: string;
  tenantId: string;
  insightType: 'bottleneck' | 'duplicate_work' | 'recurring_incident' | 'knowledge_gap' | 'release_risk' | 'approval_delay' | 'data_quality_issue' | 'automation_candidate' | 'governance_gap';
  title: string;
  summary: string;
  evidenceRefs: string[];
  businessImpact: string;
  recommendedAction: string;
  confidence: number;
  generatedAt: string;
  usedByMoves: boolean;
}

export function contextEvidenceTypeForSource(sourceType: OperationalEvidenceSourceType): OperationalContextEvidenceType {
  switch (sourceType) {
    case 'servicenow':
      return 'ticket_evidence';
    case 'jira':
      return 'delivery_evidence';
    case 'app_log':
    case 'observability':
      return 'observability_evidence';
    case 'cmdb':
    case 'app_inventory':
      return 'process_evidence';
    case 'manual_upload':
    case 'other':
      return 'process_evidence';
  }
}

export function moveEvidenceTypeForOperationalContext(type: OperationalContextEvidenceType): MoveEvidenceType {
  switch (type) {
    case 'ticket_evidence':
    case 'delivery_evidence':
    case 'observability_evidence':
    case 'process_evidence':
      return 'current_state_systems_data';
    case 'automation_opportunity_evidence':
      return 'solution_options_decision';
    case 'control_evidence':
    case 'ownership_evidence':
      return 'data_quality_governance';
    case 'value_evidence':
      return 'kpi_value_baseline';
  }
}

export function automationOpportunityToMoveEvidenceItem(
  opportunity: AutomationOpportunity,
  artifactConsumers: MoveArtifactConsumer[] = ['solution_approach_options', 'execution_roadmap', 'business_case'],
): MoveEvidenceItem {
  return {
    id: opportunity.id,
    title: opportunity.opportunityName,
    summary: `${opportunity.currentPain} Proposed capability: ${opportunity.proposedAiCapability}`,
    evidenceType: 'automation_opportunity_evidence',
    sourceType: 'prior_artifact',
    confidence: opportunity.confidence,
    slotIds: [
      'p3_operational_automation_opportunities',
      'p4_operational_opportunity_backlog',
      'p4_operational_value_estimate',
    ],
    artifactConsumers,
    structuredFields: {
      opportunity_type: opportunity.opportunityType,
      automation_level: opportunity.automationLevel,
      value_score: opportunity.valueScore,
      feasibility_score: opportunity.feasibilityScore,
      risk_score: opportunity.riskScore,
      readiness_score: opportunity.readinessScore,
      priority: opportunity.priority,
      evidence_refs: opportunity.evidenceRefs,
    },
    citation: opportunity.evidenceRefs.join(', ') || undefined,
  };
}

export function shouldStoreRawOperationalPayload(args: {
  approvedForSensitiveText: boolean;
  containsSecretsOrCredentials: boolean;
  piiPhiFlag: boolean;
}): boolean {
  if (args.containsSecretsOrCredentials) return false;
  if (args.piiPhiFlag && !args.approvedForSensitiveText) return false;
  return args.approvedForSensitiveText;
}
