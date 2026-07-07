import type { CannibalizationFinding } from '@/lib/admin/broker/portfolio/cannibalization';
import type { PortfolioSequence } from '@/lib/admin/broker/portfolio/sequence-optimizer';
import {
  answerSentinelPortfolioQuestion,
  classifySentinelPortfolioQuestion,
} from '../portfolio-intents';

describe('Sentinel portfolio intents', () => {
  it.each([
    ['what should I sequence next?', 'sequence_next'],
    ['are any of my Moves cannibalizing each other?', 'cannibalization'],
    ['where am I capacity-blocked?', 'capacity_blockers'],
    ['tell me about the weather', 'unsupported'],
  ] as const)('classifies "%s"', (prompt, expected) => {
    expect(classifySentinelPortfolioQuestion(prompt)).toBe(expected);
  });

  it('answers the sequence-next question with named entities and action', () => {
    const result = answerSentinelPortfolioQuestion({
      prompt: 'what should I sequence next?',
      clientName: 'SkyHarbor Air',
      sequence: syntheticSequence(),
      programNames: names,
      cannibalizationFindings: findings,
    });

    expect(result.intent).toBe('sequence_next');
    expect(result.confidence).toBe('high');
    expect(result.answer).toContain('SkyHarbor Air');
    expect(result.answer).toContain('Mainframe Schedule Extraction');
    expect(result.answer).toContain('Executive action');
    expect(result.answer).not.toContain('SKY-MAINFRAME-EXTRACT');
  });

  it('answers cannibalization with the overlapping Moves, KPI, dollar exposure, and recommendation', () => {
    const result = answerSentinelPortfolioQuestion({
      prompt: 'which programs are double-counting value?',
      clientName: 'SkyHarbor Air',
      sequence: syntheticSequence(),
      programNames: names,
      cannibalizationFindings: findings,
    });

    expect(result.intent).toBe('cannibalization');
    expect(result.answer).toContain('Crew Recovery AI');
    expect(result.answer).toContain('Irregular Operations Recovery AI');
    expect(result.answer).toContain('operations productivity');
    expect(result.answer).toContain('$1.3M');
    expect(result.answer).not.toContain('SKY-CREW-RECOVERY');
  });

  it('answers capacity blockers with constrained pools and blocked work', () => {
    const result = answerSentinelPortfolioQuestion({
      prompt: 'where are we capacity blocked?',
      clientName: 'SkyHarbor Air',
      sequence: syntheticSequence(),
      programNames: names,
      cannibalizationFindings: findings,
    });

    expect(result.intent).toBe('capacity_blockers');
    expect(result.answer).toContain('Sponsor Ops at 100%');
    expect(result.answer).toContain('Crew Recovery AI');
    expect(result.answer).toContain('Mainframe Schedule Extraction');
    expect(result.answer).toContain('Executive action');
  });

  it('does not leak another client into an answer', () => {
    const result = answerSentinelPortfolioQuestion({
      prompt: 'what should I sequence next?',
      clientName: 'SkyHarbor Air',
      sequence: syntheticSequence(),
      programNames: names,
      cannibalizationFindings: findings,
    });

    expect(result.answer).not.toMatch(/Meridian|Apex|Clinical|Store Associate/i);
  });
});

const names: Record<string, string> = {
  'SKY-MAINFRAME-EXTRACT': 'Mainframe Schedule Extraction',
  'SKY-CREW-RECOVERY': 'Crew Recovery AI',
  'SKY-IROPS': 'Irregular Operations Recovery AI',
};

const findings: CannibalizationFinding[] = [
  {
    moveA: 'SKY-CREW-RECOVERY',
    moveB: 'SKY-IROPS',
    overlapKpi: 'operations productivity',
    overlapMagnitudeUsd: 1_300_000,
    recommendation: 'sequence',
    rationale: 'Both programs claim operations productivity.',
  },
];

function syntheticSequence(): PortfolioSequence {
  return {
    quarters: [
      {
        quarterId: '2026-Q3',
        moves: [
          {
            moveId: 'SKY-MAINFRAME-EXTRACT',
            phase: 'Design',
            reasoning: 'Scheduled because it unblocks crew and irregular operations data readiness.',
          },
        ],
        resourceUtilization: { 'sponsor:ops': 1, 'gcc:data-engineering': 0.82 },
        blockedMoves: [
          {
            moveId: 'SKY-CREW-RECOVERY',
            blockedBy: ['SKY-MAINFRAME-EXTRACT', 'sponsor:ops'],
            recommendedAction: 'Move this work to the next quarter or add named capacity to the constrained pool.',
          },
        ],
      },
      {
        quarterId: '2026-Q4',
        moves: [
          {
            moveId: 'SKY-CREW-RECOVERY',
            phase: 'Synthesis',
            reasoning: 'Scheduled after schedule extraction clears the source-system dependency.',
          },
        ],
        resourceUtilization: { 'sponsor:ops': 0.5 },
        blockedMoves: [],
      },
      {
        quarterId: '2027-Q1',
        moves: [
          {
            moveId: 'SKY-IROPS',
            phase: 'Synthesis',
            reasoning: 'Scheduled after overlap handling protects the operations value case.',
          },
        ],
        resourceUtilization: {},
        blockedMoves: [],
      },
      {
        quarterId: '2027-Q2',
        moves: [],
        resourceUtilization: {},
        blockedMoves: [],
      },
    ],
    unmetDependencies: [],
    totalValueRealizedByQuarter: {
      '2026-Q3': 4_700_000,
      '2026-Q4': 12_100_000,
      '2027-Q1': 21_300_000,
      '2027-Q2': 21_300_000,
    },
    alternativeSequences: [
      { scenario: 'Value-first', tradeoff: 'Pull highest declared value forward.' },
    ],
  };
}
