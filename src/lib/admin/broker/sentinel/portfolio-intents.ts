import type { CannibalizationFinding } from '@/lib/admin/broker/portfolio/cannibalization';
import type { PortfolioSequence } from '@/lib/admin/broker/portfolio/sequence-optimizer';

export type SentinelPortfolioIntent =
  | 'sequence_next'
  | 'cannibalization'
  | 'capacity_blockers'
  | 'unsupported';

export interface SentinelPortfolioQuestionInput {
  prompt: string;
  clientName: string;
  sequence: PortfolioSequence;
  programNames: Record<string, string>;
  cannibalizationFindings?: ReadonlyArray<CannibalizationFinding>;
}

export interface SentinelPortfolioAnswer {
  intent: SentinelPortfolioIntent;
  answer: string;
  citedMoves: string[];
  confidence: 'high' | 'medium' | 'low';
}

const SEQUENCE_PATTERNS = [
  /\bwhat\b.*\b(sequence|run|move|start|prioriti[sz]e)\b.*\b(next|now|first)\b/i,
  /\b(sequence|prioriti[sz]e)\b.*\bportfolio\b/i,
  /\bwhat should i sequence next\b/i,
];

const CANNIBALIZATION_PATTERNS = [
  /\b(cannibali[sz](?:e|ing|ation)|overlap|double[- ]count(?:ing)?|same value|same kpi)\b/i,
  /\bwhich\b.*\b(moves|programs)\b.*\b(overlap|double[- ]count)\b/i,
];

const CAPACITY_PATTERNS = [
  /\b(capacity|blocked|constraint|constrained|bandwidth|resource|governance council|sponsor bandwidth)\b/i,
  /\bwhere\b.*\b(blocked|constrained)\b/i,
];

export function classifySentinelPortfolioQuestion(prompt: string): SentinelPortfolioIntent {
  const text = prompt.trim();
  if (SEQUENCE_PATTERNS.some((pattern) => pattern.test(text))) return 'sequence_next';
  if (CANNIBALIZATION_PATTERNS.some((pattern) => pattern.test(text))) return 'cannibalization';
  if (CAPACITY_PATTERNS.some((pattern) => pattern.test(text))) return 'capacity_blockers';
  return 'unsupported';
}

export function answerSentinelPortfolioQuestion(input: SentinelPortfolioQuestionInput): SentinelPortfolioAnswer {
  const intent = classifySentinelPortfolioQuestion(input.prompt);
  if (intent === 'sequence_next') return answerSequenceNext(input);
  if (intent === 'cannibalization') return answerCannibalization(input);
  if (intent === 'capacity_blockers') return answerCapacityBlockers(input);

  return {
    intent,
    answer: `${input.clientName}: I can answer portfolio sequencing, value-overlap, and capacity-blocker questions from the current sequence packet. Ask which Move to run next, which Moves overlap, or where capacity is constrained.`,
    citedMoves: [],
    confidence: 'low',
  };
}

function answerSequenceNext(input: SentinelPortfolioQuestionInput): SentinelPortfolioAnswer {
  const firstQuarterWithMove = input.sequence.quarters.find((quarter) => quarter.moves.length > 0);
  const firstMove = firstQuarterWithMove?.moves[0] ?? null;
  if (!firstQuarterWithMove || !firstMove) {
    return {
      intent: 'sequence_next',
      answer: `${input.clientName}: I cannot name a next Move yet because the sequence packet has no scheduled Moves. First resolve the blocked dependencies or load a portfolio with schedulable work.`,
      citedMoves: [],
      confidence: 'low',
    };
  }

  const moveName = moveLabel(input, firstMove.moveId);
  const blocked = firstQuarterWithMove.blockedMoves[0];
  const blockedSentence = blocked
    ? ` Do not advance ${moveLabel(input, blocked.moveId)} in the same quarter; it is blocked by ${blocked.blockedBy.map((id) => moveLabel(input, id)).join(', ')}.`
    : ' No same-quarter blocker is named for the next recommended Move.';

  return {
    intent: 'sequence_next',
    answer: `${input.clientName}: sequence ${moveName} next in ${firstQuarterWithMove.quarterId}. ${firstMove.reasoning}${blockedSentence} Executive action: lock the owner, gate date, and dependency assumption before counting the value.`,
    citedMoves: [moveName],
    confidence: 'high',
  };
}

function answerCannibalization(input: SentinelPortfolioQuestionInput): SentinelPortfolioAnswer {
  const findings = input.cannibalizationFindings ?? [];
  const finding = findings[0];
  if (!finding) {
    return {
      intent: 'cannibalization',
      answer: `${input.clientName}: I do not see a value-overlap finding strong enough to call cannibalization. Keep finance review on shared KPIs, but the sequence packet does not require a merge or descope action right now.`,
      citedMoves: [],
      confidence: 'medium',
    };
  }

  const moveA = moveLabel(input, finding.moveA);
  const moveB = moveLabel(input, finding.moveB);
  const recommendation = finding.recommendation.replace(/_/g, ' ');
  return {
    intent: 'cannibalization',
    answer: `${input.clientName}: the value-overlap risk is ${moveA} and ${moveB}. They both claim ${finding.overlapKpi}; estimated double-count exposure is ${formatUsd(finding.overlapMagnitudeUsd)}. Recommendation: ${recommendation}. Executive action: make finance assign one owner for the shared KPI before both value cases proceed.`,
    citedMoves: [moveA, moveB],
    confidence: finding.overlapMagnitudeUsd > 0 ? 'high' : 'medium',
  };
}

function answerCapacityBlockers(input: SentinelPortfolioQuestionInput): SentinelPortfolioAnswer {
  const tightQuarter = input.sequence.quarters.find((quarter) => {
    const utilizations = Object.values(quarter.resourceUtilization);
    return utilizations.some((value) => value >= 0.9) || quarter.blockedMoves.length > 0;
  });

  if (!tightQuarter) {
    return {
      intent: 'capacity_blockers',
      answer: `${input.clientName}: the sequence packet does not show a named capacity blocker. Keep monitoring sponsor, vendor, GCC, and governance utilization as new Moves enter the portfolio.`,
      citedMoves: [],
      confidence: 'medium',
    };
  }

  const tightResources = Object.entries(tightQuarter.resourceUtilization)
    .filter(([, value]) => value >= 0.75)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([id, value]) => `${readableResource(id)} at ${Math.round(value * 100)}%`);
  const blocked = tightQuarter.blockedMoves[0];
  const blockedSentence = blocked
    ? ` ${moveLabel(input, blocked.moveId)} is blocked by ${blocked.blockedBy.map((id) => moveLabel(input, id)).join(', ')}; ${blocked.recommendedAction}`
    : '';
  const resourceSentence = tightResources.length > 0
    ? ` The tight resource in ${tightQuarter.quarterId}: ${tightResources.join(', ')}.`
    : ` ${tightQuarter.quarterId} has blocked work even though no utilization bar crosses 75%.`;

  return {
    intent: 'capacity_blockers',
    answer: `${input.clientName}:${resourceSentence}${blockedSentence} Executive action: either add named capacity to the constrained pool or move the blocked work to the next quarter.`,
    citedMoves: blocked ? [moveLabel(input, blocked.moveId)] : [],
    confidence: 'high',
  };
}

function moveLabel(input: SentinelPortfolioQuestionInput, moveId: string): string {
  return input.programNames[moveId] ?? readableResource(moveId);
}

function readableResource(id: string): string {
  return id
    .replace(/^gcc:/, 'GCC ')
    .replace(/^sponsor:/, 'Sponsor ')
    .replace(/^vendor:/, 'Vendor ')
    .replace(/^governance:/, 'Governance ')
    .replace(/[-_:]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatUsd(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${Math.round(value)}`;
}
