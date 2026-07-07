// Wave 3 B1 - quarterly portfolio board pack model.
//
// This is a pure renderer-facing projection over the Tower board-pack one
// pager. It performs no data access and introduces no new figures; B2 can call
// it from a cron after assembling the Tower inputs through the normal read
// layer.

import type { BoardPack } from '@/lib/tower/board-pack';

export interface QuarterlyMoveStatus {
  readonly name: string;
  readonly phase: string;
  readonly status: 'on_track' | 'watch' | 'blocked' | 'paused';
  readonly owner: string;
  readonly nextGate: string;
}

export interface QuarterlyPattern {
  readonly pattern: string;
  readonly evidence: string;
  readonly action: string;
}

export interface QuarterlyBlockedDecision {
  readonly move: string;
  readonly decision: string;
  readonly owner: string;
  readonly timeInState: string;
  readonly rationale: string;
}

export interface QuarterlySequenceStep {
  readonly move: string;
  readonly sequence: string;
  readonly rationale: string;
}

export interface QuarterlyRiskLine {
  readonly title: string;
  readonly severity: 'critical' | 'high' | 'moderate' | 'low';
  readonly exposure: string;
  readonly nextAction: string;
}

export interface QuarterlyBoardQuestion {
  readonly owner: string;
  readonly question: string;
  readonly whyNow: string;
}

export interface QuarterlyBoardPackInput {
  readonly clientKey: string;
  readonly clientLabel: string;
  readonly quarter: string;
  readonly generatedOn: string;
  readonly towerBoardPack: BoardPack;
  readonly moves: readonly QuarterlyMoveStatus[];
  readonly blockedDecisions: readonly QuarterlyBlockedDecision[];
  readonly patterns: readonly QuarterlyPattern[];
  readonly recommendedSequence: readonly QuarterlySequenceStep[];
  readonly riskHorizon: readonly QuarterlyRiskLine[];
  readonly topQuestions: readonly QuarterlyBoardQuestion[];
}

export interface QuarterlyBoardPackSection {
  readonly id: string;
  readonly ordinal: string;
  readonly title: string;
  readonly summary: string;
  readonly rows: readonly { label: string; value: string; detail?: string }[];
}

export interface QuarterlyBoardPack {
  readonly clientKey: string;
  readonly clientLabel: string;
  readonly quarter: string;
  readonly generatedOn: string;
  readonly title: string;
  readonly sections: readonly QuarterlyBoardPackSection[];
  readonly evidenceGapCount: number;
  readonly disclaimer: string;
}

const DISCLAIMER =
  'Deterministic composition. This quarterly board pack is assembled from Tower board-pack inputs, Move status rows, pattern evidence, sequence recommendations, risk lines, and board questions supplied by the caller. It introduces no new figures.';

function id(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function section(
  ordinal: string,
  title: string,
  summary: string,
  rows: QuarterlyBoardPackSection['rows'],
): QuarterlyBoardPackSection {
  return { id: id(title), ordinal, title, summary, rows };
}

function usd(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000)}K`;
  return `${sign}$${Math.round(abs)}`;
}

function percent(ratio: number | null): string {
  return ratio === null ? 'Not instrumented' : `${Math.round(ratio * 100)}%`;
}

export function buildQuarterlyBoardPack(
  input: QuarterlyBoardPackInput,
): QuarterlyBoardPack {
  const board = input.towerBoardPack;
  const evidenceGapCount = board.evidenceLinks.filter((link) => link.isGap).length;
  const topQuestions = input.topQuestions.slice(0, 3);

  return {
    clientKey: input.clientKey,
    clientLabel: input.clientLabel,
    quarter: input.quarter,
    generatedOn: input.generatedOn,
    title: `${input.clientLabel} ${input.quarter} Board Pack`,
    evidenceGapCount,
    disclaimer: DISCLAIMER,
    sections: [
      section('01', 'Portfolio executive summary', board.headline, [
        { label: 'Board decisions', value: String(board.topDecisions.length) },
        {
          label: 'Spend at risk',
          value: usd(board.spendAtRisk.spendAtRiskAmount),
          detail: board.spendAtRisk.headline,
        },
        { label: 'Evidence gaps', value: String(evidenceGapCount) },
      ]),
      section('02', 'Realized vs projected portfolio-wide', board.valueChange.earningSummary, [
        {
          label: 'Realization',
          value: percent(board.valueChange.realizationRatio),
          detail: board.valueChange.adoptionHeadline,
        },
        {
          label: 'Verified earned value',
          value: usd(board.spendAtRisk.earnedVerifiedAmount),
        },
        {
          label: 'Committed value',
          value: usd(board.spendAtRisk.totalCommittedAmount),
        },
      ]),
      section(
        '03',
        'In-flight Moves status',
        `${input.moves.length} Moves are included in this quarterly pack.`,
        input.moves.map((move) => ({
          label: move.name,
          value: `${move.phase} - ${move.status.replace(/_/g, ' ')}`,
          detail: `Owner: ${move.owner}. Next gate: ${move.nextGate}.`,
        })),
      ),
      section(
        '04',
        'Blocked decisions with named owners and time in state',
        input.blockedDecisions.length === 0
          ? 'No board-level decisions are outstanding.'
          : `${input.blockedDecisions.length} decisions require board attention.`,
        input.blockedDecisions.map((decision) => ({
          label: decision.move,
          value: decision.decision,
          detail: `Owner: ${decision.owner}. Time in state: ${decision.timeInState}. ${decision.rationale}`,
        })),
      ),
      section(
        '05',
        'Cross-Move patterns surfaced this quarter',
        `${input.patterns.length} cross-Move patterns are surfaced for review.`,
        input.patterns.map((pattern) => ({
          label: pattern.pattern,
          value: pattern.evidence,
          detail: pattern.action,
        })),
      ),
      section(
        '06',
        'Recommended Move sequence next quarter',
        `${input.recommendedSequence.length} sequence recommendations are included.`,
        input.recommendedSequence.map((step) => ({
          label: step.sequence,
          value: step.move,
          detail: step.rationale,
        })),
      ),
      section(
        '07',
        'Risk and regulatory horizon',
        `${input.riskHorizon.length} risk lines are included.`,
        input.riskHorizon.map((risk) => ({
          label: `${risk.severity.toUpperCase()} - ${risk.title}`,
          value: risk.exposure,
          detail: risk.nextAction,
        })),
      ),
      section(
        '08',
        'Top 3 questions for board attention',
        `${topQuestions.length} board questions are ready for the meeting.`,
        topQuestions.map((question) => ({
          label: question.owner,
          value: question.question,
          detail: question.whyNow,
        })),
      ),
    ],
  };
}
