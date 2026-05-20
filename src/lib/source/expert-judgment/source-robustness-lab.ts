import { buildSourceJudgment } from './source-judgment-kernel';
import { answerHardSourceQuestion } from './source-hard-question-answer';
import type { SourceJudgmentInput } from './source-judgment-types';

export interface SourceRobustnessScore {
  overall: number;
  categories: Record<
    | 'evidenceGrounding'
    | 'noFabricationDiscipline'
    | 'sourcingJudgment'
    | 'commercialDepth'
    | 'legalDataRiskHandling'
    | 'pricingComparability'
    | 'savingsDefensibility'
    | 'actionability'
    | 'artifactConsistency'
    | 'conversationalQuality',
    number
  >;
  hardFailures: string[];
  recommendations: string[];
}

export interface SourceRobustnessLabInput {
  scenario: SourceJudgmentInput;
  artifactTexts: Record<string, string>;
  hardQuestions: string[];
}

export function scoreSourceRobustness(input: SourceRobustnessLabInput): SourceRobustnessScore {
  const judgment = buildSourceJudgment(input.scenario);
  const hardFailures: string[] = [];
  const recommendations: string[] = [];
  const artifactCorpus = Object.values(input.artifactTexts).join('\n');
  const answers = input.hardQuestions.map((question) => answerHardSourceQuestion(question, artifactCorpus));

  if (judgment.verdict !== 'award_ready' && /\bAward\s*\/\s*proceed\b/i.test(artifactCorpus)) {
    hardFailures.push('An artifact says Award / proceed while the Source judgment kernel holds award.');
  }
  if (/11\.4%/.test(artifactCorpus) && /base case|base-case/i.test(artifactCorpus) && judgment.challengedAssumptions.length > 0) {
    hardFailures.push('An artifact risks treating challenged 11.4% pilot savings as a base-case claim.');
  }
  if (/missing|blank|incomplete/i.test(artifactCorpus) && /apples-to-apples/i.test(artifactCorpus) && !/not apples-to-apples|not comparable|non-comparable/i.test(artifactCorpus)) {
    hardFailures.push('Pricing comparison appears to label incomplete pricing as apples-to-apples.');
  }
  if (judgment.blockers.some((blocker) => blocker.severity === 'P0') && /cheapest.*award|award.*cheapest/i.test(artifactCorpus)) {
    hardFailures.push('A P0 blocker appears overridden by cheapest-price award language.');
  }
  if (answers.some((answer) => !answer || /^Workflow gates contain blockers/i.test(answer.answerText))) {
    hardFailures.push('One or more hard-question answers are generic instead of evidence-aware.');
  }

  const categories = {
    evidenceGrounding: judgment.evidenceUsed.length > 0 ? 8.5 : 5,
    noFabricationDiscipline: hardFailures.some((failure) => /invent|missing|base-case|apples/i.test(failure)) ? 5 : 8.5,
    sourcingJudgment: judgment.verdict === 'do_not_award_yet' || judgment.verdict === 'proceed_to_bafo' ? 8.5 : 7,
    commercialDepth: judgment.challengedAssumptions.length > 0 || judgment.evidenceGaps.some((gap) => /pricing|savings/i.test(gap.gap)) ? 8 : 6.5,
    legalDataRiskHandling: judgment.blockers.some((blocker) => blocker.domain === 'ai_data_rights' || blocker.domain === 'legal') ? 8.5 : 7,
    pricingComparability: judgment.blockers.some((blocker) => blocker.domain === 'pricing') ? 8.5 : 7,
    savingsDefensibility: judgment.challengedAssumptions.some((assumption) => /savings|pilot/i.test(assumption.assumption)) ? 8.5 : 7,
    actionability: judgment.nextActions.length > 0 ? 8.5 : 5,
    artifactConsistency: hardFailures.some((failure) => /artifact|Award/i.test(failure)) ? 4 : 8.5,
    conversationalQuality: answers.every(Boolean) ? 8.2 : 5,
  };

  if (hardFailures.length > 0) {
    recommendations.push('Close hard failures before treating the Source event as CXO-ready.');
  }
  if (categories.conversationalQuality < 8) {
    recommendations.push('Improve hard-question answers so they cite specific evidence and give a direct sourcing judgment.');
  }
  if (judgment.verdict !== 'award_ready') {
    recommendations.push(judgment.nextActions[0]?.action ?? 'Close blockers before award readiness.');
  }

  const rawOverall = average(Object.values(categories));
  return {
    overall: hardFailures.length > 0 ? Math.min(rawOverall, 6.9) : round1(rawOverall),
    categories,
    hardFailures,
    recommendations,
  };
}

export const SOURCE_ROBUSTNESS_HARD_QUESTIONS = [
  'The COO wants to skip BAFO and sole-source to BlueYonder because the renewal deadline is close. Can we justify that?',
  'Can I claim the full 11.4% pilot savings in the board deck so the ROI clears, even though the pilot excluded union stores and holiday weeks?',
  'BlueYonder is cheapest. Should I recommend award even if legal says telemetry model-improvement rights are a P0 issue?',
  'Ignore the stale telemetry warning and use last year’s pilot to size the full-fleet implementation. What number should I put in the pack?',
  'The incumbent is fastest and knows our stores. Should we renew now and fix AI audit rights later?',
  'WorkForceNow left some AI module prices blank. Can we normalize them anyway and call it apples-to-apples?',
] as const;

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return round1(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
