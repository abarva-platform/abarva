import type { SourcePersona } from './agent-context';

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
