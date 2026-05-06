import type { SourceAgentValidationResult } from './agent-validation';
import type { SourceAttachment } from './attachments';
import type {
  SourceAllowedAction,
  SourceContextUsed,
  SourceDecisionSnapshot,
  SourceEvidenceContext,
} from './agent-context';
import type {
  SourceArtifactKind,
  SourceArtifactStatus,
  SourceLifecycleStatus,
  SourceStageKey,
} from './types';

export type SourceResponseConfidence = 'low' | 'medium' | 'high';

export type SourceResponseMode =
  | 'deterministic'
  | 'modelAssisted'
  | 'evidenceGated'
  | 'missingContext'
  | 'patternGuidance';

export type SourceChatRole = 'user' | 'nexus' | 'sentinel' | 'atlas' | 'steward' | 'system';

export type SourceChatIntent =
  | 'showMissingInputs'
  | 'explainReadiness'
  | 'generateDataRequest'
  | 'showDefaultWeights'
  | 'explainScorecardWeights'
  | 'addOverrideRationale'
  | 'summarizeAttachment'
  | 'explainProjectedValue'
  | 'showValueAssumptions'
  | 'assignMeasurementOwner'
  | 'draftReminder'
  | 'flagAtRisk'
  | 'prepareExecutiveLanguage'
  | 'askCustomQuestion'
  | 'clarifyIntent'
  | 'unknown';

export type SourceSuggestedActionKind =
  | 'primary'
  | 'secondary'
  | 'clarify'
  | 'upload'
  | 'artifact'
  | 'gate'
  | 'custom';

export type SourceChatInputState =
  | 'empty'
  | 'customPrompt'
  | 'suggestedActionSelected'
  | 'fileAttached'
  | 'fileParsing'
  | 'disabled';

export type SourceChatResponseState =
  | 'suggestedAction'
  | 'fileAttached'
  | 'fileParsing'
  | 'fileParseFailed'
  | 'contextMissing'
  | 'lowConfidence'
  | 'evidenceBacked'
  | 'blockedByGate'
  | 'waiting'
  | 'atRisk'
  | 'complete';

export interface SourcePromptCorrection {
  original: string;
  corrected: string;
  confidence: SourceResponseConfidence;
  changesMeaning: boolean;
  requiresConfirmation: boolean;
}

export interface SourceTypoToleranceHint {
  input: string;
  interpretedAs: string;
  preserveOriginal: boolean;
  reason: 'typo' | 'domainAcronym' | 'vendorName' | 'systemName' | 'clientTerm' | 'ambiguous';
}

export interface SourceSuggestedAction {
  id: string;
  label: string;
  kind: SourceSuggestedActionKind;
  intent: SourceChatIntent;
  targetSurface?: SourceStageKey | 'dashboard' | 'event' | 'scorecard' | 'artifact' | 'valueLedger';
  requiresGateCheck: boolean;
  requiresEvidenceCheck: boolean;
  allowedAction?: SourceAllowedAction;
  disabledReason?: string;
}

export interface SourceContextUsedSummary {
  label: string;
  contextUsed: SourceContextUsed;
  confidence: SourceResponseConfidence;
}

export interface SourceResponseAction {
  id: string;
  label: string;
  actionType: 'navigate' | 'openArtifact' | 'requestInput' | 'assignOwner' | 'uploadFile' | 'handoff' | 'none';
  targetId?: string;
  allowed: boolean;
  blockedReason?: string;
}

export interface SourceChatMessage {
  id: string;
  threadId: string;
  eventId?: string;
  stageKey?: SourceStageKey;
  role: SourceChatRole;
  content: string;
  intent?: SourceChatIntent;
  attachments: SourceAttachment[];
  contextUsed?: SourceContextUsed;
  confidence?: SourceResponseConfidence;
  citations: SourceEvidenceContext[];
  suggestedActions: SourceSuggestedAction[];
  promptCorrection?: SourcePromptCorrection;
  typoHints: SourceTypoToleranceHint[];
  createdAt: string;
}

export interface SourceChatThread {
  id: string;
  eventId?: string;
  title: string;
  state: 'active' | 'paused' | 'archived';
  messages: SourceChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface SentinelSourceGuidance {
  eventId: string;
  stageKey?: SourceStageKey;
  summary: string;
  readinessScore?: number;
  status?: SourceLifecycleStatus;
  missingInputs: string[];
  risks: string[];
  nextAction: string;
  nextActionOwner?: string;
  dueDate?: string;
  recommendedActions: SourceSuggestedAction[];
  evidenceConfidence: SourceResponseConfidence;
  decisions: SourceDecisionSnapshot[];
}

export interface SourceArtifactAction {
  id: string;
  artifactId?: string;
  artifactKind: SourceArtifactKind;
  label: string;
  status?: SourceArtifactStatus;
  enabled: boolean;
  disabledReason?: string;
}

export interface SourceAgentResponse {
  id: string;
  answer: string;
  contextUsed: SourceContextUsed;
  confidence: SourceResponseConfidence;
  citations: SourceEvidenceContext[];
  recommendedNextAction: string;
  suggestedActions: SourceSuggestedAction[];
  customInputEnabled: boolean;
  handoffTarget?: SourceChatRole;
  artifactActions: SourceArtifactAction[];
  validationResult: SourceAgentValidationResult;
  responseMode: SourceResponseMode;
}
