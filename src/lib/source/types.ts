export type SourceRouteKey = 'dashboard' | 'events' | 'value';

export type SourceRigorLevel = 'standard' | 'enhanced' | 'strategic';

export type SourcePlatformFoundationKey =
  | 'pattern_fabric'
  | 'agent_fabric'
  | 'artifact_studio'
  | 'control_tower'
  | 'value_ledger';

export type SourceLifecycleStatus =
  | 'active'
  | 'waiting_on_client'
  | 'waiting_on_vendor'
  | 'waiting_on_procurement'
  | 'waiting_on_executive_decision'
  | 'paused'
  | 'at_risk'
  | 'completed'
  | 'archived';

export type SourcePriority = 'critical' | 'high' | 'medium' | 'low';

export type SourceStageKey =
  | 'strategy'
  | 'scope'
  | 'rfp'
  | 'responses'
  | 'evaluation'
  | 'pricing'
  | 'bafo'
  | 'executive_decision'
  | 'selection'
  | 'transition'
  | 'value'
  // Legacy keys remain readable for persisted rows/artifacts created before
  // the locked 11-stage lifecycle was normalized.
  | 'intake'
  | 'sourcing_strategy'
  | 'rfp_rfi_package'
  | 'vendor_responses'
  | 'orals_bafo'
  | 'contract_mobilization'
  | 'value_realization';

export type SourceStageStatus =
  | 'not_started'
  | 'active'
  | 'blocked'
  | 'complete'
  | 'needs_approval'
  | 'reopened';

export type StageGateStatus = 'not_started' | 'ready' | 'in_review' | 'approved' | 'blocked';

export type SourceAlertSeverity = 'info' | 'warning' | 'critical';

export type SourceAlertStatus = 'open' | 'acknowledged' | 'resolved';

export type SourceArtifactKind =
  | 'charter'
  | 'scorecard'
  | 'decision_memo'
  | 'artifact_packet'
  | 'value_ledger'
  | 'trace';

export type SourceArtifactStatus =
  | 'not_started'
  | 'draft'
  | 'needs_inputs'
  | 'needs_review'
  | 'approved'
  | 'locked'
  | 'superseded'
  | 'archived';

export type SourceArtifactTier = 'rich' | 'outline' | 'stub';

export type ScorecardLifecycleState =
  | 'default_generated'
  | 'client_edited'
  | 'rationale_added'
  | 'reviewed'
  | 'approved'
  | 'locked'
  | 'used_for_vendor_evaluation';

export type ScorecardCriterionStatus = 'draft' | 'ready' | 'approved' | 'blocked';

export type ScorecardApprovalState = 'not_started' | 'in_review' | 'approved';

export type ValueLedgerKind = 'projected' | 'realized';

export type ValueConfidence = 'high' | 'medium' | 'low';

export type SourceDataRequirementLevel = 'required' | 'recommended' | 'optional';

export type SourceDataReadinessState =
  | 'Missing'
  | 'Requested'
  | 'Uploaded'
  | 'Connected'
  | 'Loaded'
  | 'Parsed'
  | 'Available'
  | 'Usable Evidence'
  | 'Low Confidence'
  | 'Stale'
  | 'Access Restricted'
  | 'Not Applicable'
  | 'Waived';

export type SourceEvidenceUsability =
  | 'not_available'
  | 'loaded_not_usable'
  | 'available_not_validated'
  | 'usable'
  | 'low_confidence'
  | 'restricted'
  | 'waived';

export interface SourcePlatformFoundation {
  key: SourcePlatformFoundationKey;
  label: string;
  summary: string;
}

export interface StageGate {
  id: string;
  label: string;
  status: StageGateStatus;
  ownerRole: string;
  requiredArtifacts: string[];
  blocker: string | null;
}

export interface WorkflowStage {
  key: SourceStageKey;
  label: string;
  status: SourceStageStatus;
  summary: string;
  gate: StageGate;
}

export interface SourceAlert {
  id: string;
  title: string;
  detail: string;
  severity: SourceAlertSeverity;
  status: SourceAlertStatus;
}

export interface SourceDashboardAttentionItem {
  id: string;
  eventId: string;
  title: string;
  detail: string;
  severity: SourceAlertSeverity;
  owner: string;
  actionLabel: string;
}

export interface SourceArtifactSummary {
  id: string;
  title: string;
  kind: SourceArtifactKind;
  status: SourceArtifactStatus;
  tier?: SourceArtifactTier;
  summary: string;
  sourceCount: number;
  updatedAt: string;
}

export interface SourceArtifactDetail extends SourceArtifactSummary {
  eventId: string;
  sections: Array<{
    label: string;
    body: string;
  }>;
  governanceNotes: string[];
  patternLinks: string[];
}

export interface ScorecardCriterion {
  id: string;
  label: string;
  ownerRole: string;
  required: boolean;
  status: ScorecardCriterionStatus;
  note: string;
}

export interface ScorecardGovernance {
  decisionOwner: string;
  reviewCadence: string;
  // ScorecardLifecycleState covers the full governance workflow introduced in
  // Wave S4; ScorecardApprovalState is the legacy 3-value union kept for
  // backwards compat with pre-S4 seed data.
  approvalState: ScorecardApprovalState | ScorecardLifecycleState;
  criteria: ScorecardCriterion[];
}

export interface ValueLedgerEntry {
  id: string;
  eventId: string;
  eventName: string;
  kind: ValueLedgerKind;
  label: string;
  stageKey: SourceStageKey | null;
  amountUsd: number;
  confidence: ValueConfidence;
  evidenceCount: number;
  note: string;
}

export interface SourceValueLedgerSnapshot {
  updatedAt: string;
  projected: ValueLedgerEntry[];
  realized: ValueLedgerEntry[];
}

export interface SourceDataReadinessItem {
  id: string;
  category: string;
  requirementLevel: SourceDataRequirementLevel;
  readinessState: SourceDataReadinessState;
  evidenceUsability: SourceEvidenceUsability;
  owner: string;
  sourceSystemOrFile: string;
  lastUpdated: string | null;
  confidence: ValueConfidence;
  workflowImpact: string;
  agentRecommendation: string;
  stewardAdminHandoffLabel: string;
}

export interface SourcingEventSummary {
  id: string;
  code: string;
  name: string;
  accountName: string;
  leadAgent: 'Sentinel';
  archetype: string;
  rigor: SourceRigorLevel;
  status: SourceLifecycleStatus;
  statusLabel: string;
  priority: SourcePriority;
  currentStageKey: SourceStageKey;
  currentStageLabel: string;
  openAlerts: number;
  owner: string;
  agingDays: number;
  blocker: string | null;
  nextAction: string;
  isAtRisk: boolean;
  valueAtStakeUsd: number;
  projectedValueUsd: number;
  realizedValueUsd: number;
  nextDecision: string;
}

export interface SourcingEventDetail extends SourcingEventSummary {
  synopsis: string;
  problemStatement: string;
  stages: WorkflowStage[];
  alerts: SourceAlert[];
  artifacts: SourceArtifactSummary[];
  scorecard: ScorecardGovernance;
  valueLedger: SourceValueLedgerSnapshot;
  dataReadiness: SourceDataReadinessItem[];
}

export interface AbarvaSourceDashboardData {
  description: string;
  nexusSummary: string;
  metrics: {
    activeEvents: number;
    waitingEvents: number;
    atRiskEvents: number;
    decisionsNeeded: number;
    valueAtStakeUsd: number;
  };
  attentionItems: SourceDashboardAttentionItem[];
  events: SourcingEventSummary[];
}
