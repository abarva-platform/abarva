import type {
  SourceAgentContextScope,
  SourceContextAssemblyInput,
  SourceContextUsed,
  SourcePersona,
  SourceSurface,
  SourceUserRole,
} from './agent-context';
import type {
  SourceLifecycleStatus,
  SourceStageKey,
} from './types';

export type SourceAgentValidationScore = 0 | 1 | 2 | 3 | 4 | 5;

export type SourceAgentValidationDimension =
  | 'contextGrounding'
  | 'actionability'
  | 'evidence';

export type SourceAgentValidationSeverity = 'info' | 'warning' | 'error' | 'critical';

export type SourcePersonaCrawlerVerdict = 'accept' | 'defer' | 'reject';

export type SourceVanillaResponseFlag =
  | 'missingEventContext'
  | 'missingStageContext'
  | 'genericSourcingAdvice'
  | 'missingGateCheck'
  | 'valueWithoutLedger'
  | 'scorecardWithoutDefaultsOrOverrides'
  | 'fileWithoutCitation'
  | 'missingNextAction'
  | 'genericConsultantVoice'
  | 'hallucinatedFact';

export interface SourceAgentValidationFinding {
  id: string;
  severity: SourceAgentValidationSeverity;
  dimension: SourceAgentValidationDimension | 'vanillaResponseRisk' | 'hallucination' | 'missingContext';
  message: string;
  evidence?: string;
}

export interface SourceValidationPassCriteria {
  minimumContextGrounding: 4;
  minimumActionability: 4;
  minimumEvidenceForEventSpecificAnswers: 3;
  requiresNoHallucinatedFacts: true;
  requiresNextAction: true;
  requiresSuggestedActionsWhenAppropriate: true;
}

export interface SourceAgentValidationResult {
  responseId: string;
  promptId?: string;
  eventId?: string;
  persona?: SourcePersona;
  contextGrounding: SourceAgentValidationScore;
  actionability: SourceAgentValidationScore;
  evidence: SourceAgentValidationScore;
  vanillaResponseRisk: SourceAgentValidationScore;
  hallucinationFlags: string[];
  missingContextFlags: string[];
  vanillaResponseFlags: SourceVanillaResponseFlag[];
  gateCheckPassed: boolean;
  suggestedActionsPresent: boolean;
  nextActionIncluded: boolean;
  verdict: 'pass' | 'defer' | 'fail';
  findings: SourceAgentValidationFinding[];
  reviewerNotes?: string;
}

export interface SourceGoldenPromptExpectedBehavior {
  mustMention: string[];
  mustUseContext: string[];
  mustNotDo: string[];
  requiredEvidenceLevel: SourceAgentValidationScore;
  suggestedActionsExpected: boolean;
}

export interface SourceGoldenPromptFixture {
  id: string;
  surface: string;
  persona?: SourcePersona;
  prompt: string;
  eventId?: string;
  stageKey?: string;
  expectedBehavior: SourceGoldenPromptExpectedBehavior;
  passCriteria: SourceValidationPassCriteria;
}

export const SOURCE_DEFAULT_VALIDATION_PASS_CRITERIA: SourceValidationPassCriteria = {
  minimumContextGrounding: 4,
  minimumActionability: 4,
  minimumEvidenceForEventSpecificAnswers: 3,
  requiresNoHallucinatedFacts: true,
  requiresNextAction: true,
  requiresSuggestedActionsWhenAppropriate: true,
};

export type SourceAgentValidationFixtureCategory =
  | 'portfolioAttention'
  | 'portfolioRisk'
  | 'stageGate'
  | 'missingInputs'
  | 'scorecardGovernance'
  | 'artifactReadiness'
  | 'attachmentGrounding'
  | 'patternGrounding'
  | 'valueLedgerGrounding'
  | 'waitStateGrounding';

export type SourceAgentValidationFixtureVerdict = 'pass' | 'defer' | 'fail';

export type SourceAgentValidationFixtureInput = SourceContextAssemblyInput & {
  userRole?: SourceUserRole;
  persona?: SourcePersona;
};

export interface SourceAgentValidationFixtureExpectedContext {
  contextScope: SourceAgentContextScope;
  expectedEventId?: string;
  expectedEventName?: string;
  expectedStageKey?: SourceStageKey;
  expectedLifecycleStatus?: SourceLifecycleStatus;
  requiresEvent: boolean;
  requiresStage: boolean;
  requiresLifecycleStatus: boolean;
  requiresMissingInputs: boolean;
  requiresOwner: boolean;
  requiresDueDateWhenAvailable: boolean;
  requiresAging: boolean;
  requiresPattern: boolean;
  requiresPatternSections: boolean;
  requiresScorecard: boolean;
  requiresScorecardDefaultsOrOverrides: boolean;
  requiresValueLedger: boolean;
  requiresAttachmentSummary: boolean;
  requiresArtifactReadiness: boolean;
  requiresGateCheck: boolean;
  requiredAllowedActionIds: string[];
}

export interface SourceAgentValidationFixture extends SourceGoldenPromptFixture {
  category: SourceAgentValidationFixtureCategory;
  surface: SourceSurface;
  scenario: string;
  contextInput: SourceAgentValidationFixtureInput;
  expectedContext: SourceAgentValidationFixtureExpectedContext;
  expectedVerdict: SourceAgentValidationFixtureVerdict;
  genericResponseFailureFlags: SourceVanillaResponseFlag[];
}

export interface SourceAgentValidationFixtureResult {
  fixtureId: string;
  prompt: string;
  expectedVerdict: SourceAgentValidationFixtureVerdict;
  actualVerdict: SourceAgentValidationFixtureVerdict;
  passesExpectation: boolean;
  validationResult: SourceAgentValidationResult;
  contextUsed: SourceContextUsed[];
  missingContextReasons: string[];
  genericResponseWouldFail: boolean;
  genericResponseFailureFlags: SourceVanillaResponseFlag[];
}
