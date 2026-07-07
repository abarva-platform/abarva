import { requirementsForQuestion, type ReadinessQuestionKind } from './per-question-requirements';

export interface ReadinessAssessment {
  questionId: string;
  requiredSubstrateDimensions: string[];
  presentDimensions: string[];
  missingDimensions: string[];
  completenessPercent: number;
  readinessVerdict: 'sufficient' | 'partial' | 'insufficient';
  recommendedAction: string;
}

export interface ScoreReadinessInput {
  questionId: string;
  questionKind: ReadinessQuestionKind;
  presentDimensions: string[];
}

export function scoreReadiness(input: ScoreReadinessInput): ReadinessAssessment {
  const required = requirementsForQuestion(input.questionKind);
  const presentSet = new Set(input.presentDimensions);
  const present = required.filter((dimension) => presentSet.has(dimension));
  const missing = required.filter((dimension) => !presentSet.has(dimension));
  const completenessPercent = Math.round((present.length / required.length) * 100);

  return {
    questionId: input.questionId,
    requiredSubstrateDimensions: required,
    presentDimensions: present,
    missingDimensions: missing,
    completenessPercent,
    readinessVerdict: verdictFor(completenessPercent),
    recommendedAction: recommendationFor(missing, completenessPercent),
  };
}

export function answerPrefixForReadiness(assessment: ReadinessAssessment): string | null {
  if (assessment.completenessPercent >= 70) return null;
  const missing = assessment.missingDimensions.join(', ');
  if (assessment.completenessPercent < 40) {
    return `I am missing ${missing}, so I should not advise yet. Loading those dimensions would unlock a grounded answer.`;
  }
  return `I am missing ${missing}. Loading those dimensions would improve the answer; here is the bounded view from current evidence.`;
}

function verdictFor(completenessPercent: number): ReadinessAssessment['readinessVerdict'] {
  if (completenessPercent >= 70) return 'sufficient';
  if (completenessPercent >= 40) return 'partial';
  return 'insufficient';
}

function recommendationFor(missing: string[], completenessPercent: number): string {
  if (missing.length === 0) return 'Proceed with answer; required substrate is present.';
  const load = `Load ${missing.join(', ')}.`;
  if (completenessPercent < 40) return `${load} Refuse advisory guidance until these dimensions are present.`;
  return `${load} Lead the answer with these gaps and avoid unsupported precision.`;
}
