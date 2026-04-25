import type {
  SourceAgentContextBundle,
  SourceAgentContextScope,
  SourceContextUsed,
  SourceUserRole,
} from './agent-context';
import type { SourceContextValidationReadableReport } from './agent-validation-report';
import type { SourceWorkflowValidationReadableReport } from './workflow-validation-report';

export type SourceAgentName = 'nexus' | 'sentinel' | 'atlas' | 'steward';

export type SourceAgentBriefingMode =
  | 'dashboard'
  | 'event'
  | 'stage'
  | 'evidence'
  | 'workflow'
  | 'executive'
  | 'lowContext';

export type SourceAgentBriefingConfidence = 'low' | 'medium' | 'high';

export type SourceMultiAgentOverallReadiness =
  | 'ready'
  | 'partiallyReady'
  | 'blocked'
  | 'deferred'
  | 'lowContext';

export type SourceSuggestedAgentActionType =
  | 'showMissingInputs'
  | 'generateMinimumDataRequest'
  | 'explainReadiness'
  | 'showGateBlockers'
  | 'showRequiredApprovals'
  | 'explainWaiverPath'
  | 'showEvidenceGaps'
  | 'showContextValidation'
  | 'prepareExecutiveBrief'
  | 'showValueAtStake'
  | 'askCustomQuestion';

export interface SourceAgentBriefingInput {
  contextBundle: SourceAgentContextBundle;
  contextValidationReport?: SourceContextValidationReadableReport;
  workflowValidationReport?: SourceWorkflowValidationReadableReport;
  focusArea?: string;
  userRole?: SourceUserRole;
  mode?: SourceAgentBriefingMode;
  generatedAt?: string;
}

export interface SourceSuggestedAgentAction {
  id: string;
  label: string;
  description: string;
  actionType: SourceSuggestedAgentActionType;
  agentName: SourceAgentName;
  enabled: boolean;
  disabledReason?: string;
}

export interface SourceAgentBriefing {
  agentName: SourceAgentName;
  title: string;
  summary: string;
  primaryFinding: string;
  confidence: SourceAgentBriefingConfidence;
  contextUsed: SourceContextUsed[];
  risks: string[];
  blockers: string[];
  missingInputs: string[];
  recommendedNextAction: string;
  suggestedActions: SourceSuggestedAgentAction[];
  evidenceNotes: string[];
  validationNotes: string[];
  cannotProceedReasons: string[];
  handoffRecommendation?: string;
  generatedAt: string;
}

export interface SourceMultiAgentBriefing {
  eventId?: string;
  contextScope: SourceAgentContextScope;
  generatedAt: string;
  nexus: SourceAgentBriefing;
  sentinel: SourceAgentBriefing;
  atlas: SourceAgentBriefing;
  steward: SourceAgentBriefing;
  combinedSummary: string;
  highestPriorityAction: string;
  overallReadiness: SourceMultiAgentOverallReadiness;
  blockers: string[];
  defers: string[];
  recommendedNextSlice: string;
}
