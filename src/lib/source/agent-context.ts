import type { SourceAttachment, SourceAttachmentSummary } from './attachments';
import type { SourceChatIntent, SourceChatMessage, SourceSuggestedAction } from './chat-types';
import type { SourceContextQualityScore } from './context-quality';
import type {
  ScorecardApprovalState,
  ScorecardCriterion,
  ScorecardLifecycleState,
  SourceArtifactKind,
  SourceArtifactStatus,
  SourceArtifactTier,
  SourceLifecycleStatus,
  SourceRigorLevel,
  SourceStageKey,
  SourceStageStatus,
  StageGateStatus,
  ValueLedgerEntry,
} from './types';

export type { SourceValueLedgerSnapshot } from './types';

export type SourceUserRole =
  | 'cio'
  | 'cfo'
  | 'cto'
  | 'procurementLeader'
  | 'pmoLead'
  | 'legalCompliance'
  | 'businessSponsor'
  | 'sourcingLead'
  | 'operator'
  | 'viewer'
  | 'unknown';

export type SourcePersona = SourceUserRole;

export type SourceSurface =
  | 'dashboard'
  | 'eventCanvas'
  | 'scopeWorkspace'
  | 'nexusPanel'
  | 'journeyTracker'
  | 'scorecardGovernance'
  | 'artifactDrawer'
  | 'valueLedger'
  | 'vendorResponses'
  | 'executiveDecision'
  | 'unknown';

export type SourceAgentContextScope =
  | 'portfolio'
  | 'event'
  | 'stage'
  | 'artifact'
  | 'scorecard'
  | 'value'
  | 'attachment'
  | 'vendor'
  | 'pattern'
  | 'unknown';

export interface SourceTenantContext {
  tenantId: string;
  tenantKey?: string;
  tenantName?: string;
  activeClientId?: string;
  activeClientName?: string;
}

export interface SourceAuthenticatedUser {
  id: string;
  email?: string;
  name?: string;
}

export interface SourceContextSourceOfTruthTimestamp {
  source: string;
  updatedAt: string;
  stale: boolean;
}

export interface SourceAllowedAction {
  id: string;
  label: string;
  kind:
    | 'navigate'
    | 'ask'
    | 'requestInput'
    | 'assignOwner'
    | 'reviewGate'
    | 'reviewScorecard'
    | 'openArtifact'
    | 'uploadEvidence'
    | 'handoff'
    | 'none';
  allowed: boolean;
  blockedReason?: string;
  requiresGateCheck: boolean;
  requiresEvidenceCheck: boolean;
}

export interface SourceWaitState {
  status:
    | 'notWaiting'
    | 'waitingOnClient'
    | 'waitingOnVendor'
    | 'waitingOnProcurement'
    | 'waitingOnExecutive'
    | 'paused'
    | 'blocked';
  reason?: string;
  owner?: string;
  dueDate?: string;
  agingDays?: number;
  escalationThreshold?: string;
}

export interface SourceEventSnapshot {
  id: string;
  code?: string;
  name: string;
  accountName?: string;
  archetype: string;
  rigor: SourceRigorLevel;
  lifecycleStatus: SourceLifecycleStatus;
  owner: string;
  currentStageKey: SourceStageKey;
  valueAtStakeUsd?: number;
  projectedValueUsd?: number;
  realizedValueUsd?: number;
}

export interface SourceStageSnapshot {
  key: SourceStageKey;
  label: string;
  status: SourceStageStatus;
  readinessScore?: number;
  owner?: string;
  dueDate?: string;
  summary?: string;
}

export interface SourceGateSnapshot {
  id: string;
  label: string;
  status: StageGateStatus;
  ownerRole?: string;
  requiredArtifacts: string[];
  blocker?: string | null;
  evidenceRequired: string[];
}

export interface SourceRiskSnapshot {
  id: string;
  title: string;
  severity: 'info' | 'warning' | 'critical';
  description?: string;
  owner?: string;
  stageKey?: SourceStageKey;
  evidenceIds: string[];
}

export interface SourceDecisionSnapshot {
  id: string;
  title: string;
  owner?: string;
  status: 'notStarted' | 'needed' | 'inReview' | 'approved' | 'deferred' | 'rejected';
  dueDate?: string;
  options: string[];
  evidenceIds: string[];
}

export interface SourceArtifactSnapshot {
  id: string;
  title: string;
  kind: SourceArtifactKind;
  status: SourceArtifactStatus;
  tier?: SourceArtifactTier;
  readiness: 'ready' | 'needsInputs' | 'blocked';
  requiredInputIds: string[];
  evidenceIds: string[];
  updatedAt?: string;
}

export interface SourceScorecardSnapshot {
  lifecycleState?: ScorecardLifecycleState;
  approvalState: ScorecardApprovalState;
  criteria: ScorecardCriterion[];
  defaultWeights: Array<{
    criterionId: string;
    label: string;
    weight: number;
    rationale?: string;
  }>;
  overrides: Array<{
    criterionId: string;
    previousWeight: number;
    newWeight: number;
    rationale?: string;
    changedBy?: string;
    changedAt?: string;
  }>;
  lockStatus: 'unlocked' | 'locked' | 'notApplicable';
}

export interface SourceValueLedgerLineSnapshot extends ValueLedgerEntry {
  assumption?: string;
  measurementOwner?: string;
  measurementMethod?: string;
  citationIds: string[];
}

export interface SourcePatternContext {
  id: string;
  name: string;
  version?: string;
  archetype: string;
  rigorLevel: SourceRigorLevel;
  relevantSections: SourcePatternSectionContext[];
}

export interface SourcePatternSectionContext {
  id: string;
  title: string;
  kind:
    | 'stageGuidance'
    | 'requiredInputs'
    | 'scorecardDefaults'
    | 'artifactRules'
    | 'risks'
    | 'failureModes'
    | 'interventions'
    | 'evidence'
    | 'waitStateGuidance';
  summary: string;
  confidence?: 'low' | 'medium' | 'high';
}

export interface SourceEvidenceContext {
  id: string;
  label: string;
  sourceType: 'eventState' | 'patternPack' | 'artifact' | 'attachment' | 'scorecard' | 'valueLedger' | 'citation';
  sourceId?: string;
  href?: string;
  confidence: 'low' | 'medium' | 'high';
  excerpt?: string;
}

export interface SourceCitationCoverage {
  requiredClaims: string[];
  citedClaims: string[];
  missingCitationClaims: string[];
  confidence: 'low' | 'medium' | 'high';
}

export interface SourceContextUsed {
  eventStateUsed: boolean;
  patternPackUsed?: string;
  patternSectionsUsed: string[];
  artifactsUsed: string[];
  uploadedFilesUsed: string[];
  scorecardUsed: boolean;
  valueLedgerUsed: boolean;
  citationsUsed: string[];
  deterministicFieldsUsed: string[];
  modelAssistedFieldsUsed: string[];
  evidenceGatedFieldsUsed: string[];
  missingContext: string[];
}

export interface SourceContextQualitySummary {
  label: 'low' | 'medium' | 'high';
  score: SourceContextQualityScore;
  summary: string;
}

export interface SourceContextAssemblyInput {
  tenant: SourceTenantContext;
  user: SourceAuthenticatedUser;
  route: string;
  surface: SourceSurface;
  userPrompt: string;
  eventId?: string;
  stageKey?: SourceStageKey;
  selectedAttachmentIds?: string[];
  priorConversationTurns?: SourceChatMessage[];
}

export interface SourceContextAssemblyFailure {
  code:
    | 'missingTenant'
    | 'missingUser'
    | 'eventNotFound'
    | 'stageNotFound'
    | 'patternNotFound'
    | 'evidenceUnavailable'
    | 'permissionDenied'
    | 'unknown';
  message: string;
  recoverable: boolean;
  missingFields: string[];
}

export interface SourceContextAssemblyResult {
  ok: boolean;
  bundle?: SourceAgentContextBundle;
  failure?: SourceContextAssemblyFailure;
}

export interface SourceAgentContextBundle {
  tenant: SourceTenantContext;
  user: SourceAuthenticatedUser;
  userRole: SourceUserRole;
  persona: SourcePersona;
  route: string;
  surface: SourceSurface;
  contextScope: SourceAgentContextScope;

  // Deterministic event and workflow state: never model-generated.
  sourcingEvent?: SourceEventSnapshot;
  sourcingArchetype?: string;
  rigorLevel?: SourceRigorLevel;
  workflowStage?: SourceStageSnapshot;
  lifecycleStatus?: SourceLifecycleStatus;
  stageReadinessScore?: number;
  nextAction?: string;
  nextActionOwner?: string;
  eventOwner?: string;
  stageOwner?: string;
  decisionOwner?: string;
  dueDate?: string;
  agingDays?: number;
  blockers: string[];
  waitState?: SourceWaitState;
  requiredInputs: string[];
  missingInputs: string[];
  stageGates: SourceGateSnapshot[];
  artifacts: SourceArtifactSnapshot[];
  scorecard?: SourceScorecardSnapshot;
  projectedValueLedger: SourceValueLedgerLineSnapshot[];
  realizedValueLedger?: SourceValueLedgerLineSnapshot[];
  uploadedFiles: SourceAttachment[];
  selectedAttachmentIds: string[];
  allowedActions: SourceAllowedAction[];
  sourceOfTruthTimestamps: SourceContextSourceOfTruthTimestamp[];

  // Evidence-gated state: claims need citations, confidence, or explicit limits.
  risks: SourceRiskSnapshot[];
  decisions: SourceDecisionSnapshot[];
  parsedFileSummaries: SourceAttachmentSummary[];
  evidenceCitations: SourceEvidenceContext[];
  citationCoverage?: SourceCitationCoverage;

  // Model-assisted context: may guide narrative after deterministic/evidence gates pass.
  selectedPatternPack?: SourcePatternContext;
  relevantPatternSections: SourcePatternSectionContext[];
  priorConversationTurns: SourceChatMessage[];
  userPrompt: string;
  normalizedIntent: SourceChatIntent;
  systemProposedActions: SourceSuggestedAction[];

  contextQuality: SourceContextQualityScore;
}
