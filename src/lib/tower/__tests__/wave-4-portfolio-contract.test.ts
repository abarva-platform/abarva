import type { CannibalizationFinding } from '@/lib/admin/broker/portfolio/cannibalization';
import type { PortfolioSequence } from '@/lib/admin/broker/portfolio/sequence-optimizer';
import { answerSentinelPortfolioQuestion } from '@/lib/admin/broker/sentinel/portfolio-intents';
import { buildPortfolioSequenceView } from '../portfolio-sequence-view';

const CLIENT_CASES = [
  {
    key: 'apexretail',
    name: 'Apex Retail Group',
    expected: 'Apex Retail Contact Center AI',
    forbidden: ['Ambient Clinical Documentation', 'Crew Recovery AI'],
  },
  {
    key: 'meridian',
    name: 'Meridian Health System',
    expected: 'Ambient Clinical Documentation',
    forbidden: ['Store Associate Productivity AI', 'Crew Recovery AI'],
  },
  {
    key: 'skyharbor',
    name: 'SkyHarbor Air',
    expected: 'Crew Recovery AI',
    forbidden: ['Ambient Clinical Documentation', 'Store Associate Productivity AI'],
  },
] as const;

describe('Wave 4 portfolio sequencing contract', () => {
  it.each(CLIENT_CASES)('builds a scoped executive sequence packet for $name', (client) => {
    const model = buildPortfolioSequenceView({
      clientKey: client.key,
      clientName: client.name,
    });
    const payload = JSON.stringify(model);

    expect(model.clientName).toBe(client.name);
    expect(model.quarters).toHaveLength(4);
    expect(model.scheduledMoves).toBeGreaterThan(0);
    expect(payload).toContain(client.expected);
    for (const forbidden of client.forbidden) expect(payload).not.toContain(forbidden);
    expect(payload).not.toMatch(/\bsignal:[a-z0-9:_-]{8,}\b/i);
    expect(payload).not.toMatch(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i);
  });

  it('returns a plain empty-state contract when the client has no sequencing substrate', () => {
    const model = buildPortfolioSequenceView({
      clientKey: 'unknown-client',
      clientName: 'Unknown Client',
    });

    expect(model.dataBasis).toBe('empty');
    expect(model.quarters).toEqual([]);
    expect(model.disclosure).toBe('No portfolio-sequencing substrate is available for this client yet.');
  });

  it.each([
    ['what should we sequence next?', 'sequence_next', 'Mainframe Schedule Extraction'],
    ['which moves are double counting value?', 'cannibalization', 'Crew Recovery AI'],
    ['where are we capacity constrained?', 'capacity_blockers', 'Sponsor Ops'],
  ] as const)('answers Sentinel intent %s without leaking raw IDs', (prompt, intent, expectedText) => {
    const result = answerSentinelPortfolioQuestion({
      prompt,
      clientName: 'SkyHarbor Air',
      sequence: syntheticSequence(),
      programNames: names,
      cannibalizationFindings: findings,
    });

    expect(result.intent).toBe(intent);
    expect(result.answer).toContain(expectedText);
    expect(result.answer).toContain('Executive action');
    expect(result.answer).not.toMatch(/\bSKY-[A-Z-]+\b/);
    expect(result.answer).not.toMatch(/\bsignal:[a-z0-9:_-]{8,}\b/i);
    expect(result.answer).not.toMatch(/\btenant_id|client_id|initiative_id\b/i);
    expect(result.answer).not.toMatch(/\bMeridian|Apex|Clinical|Store Associate\b/i);
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
        moves: [],
        resourceUtilization: {},
        blockedMoves: [],
      },
      {
        quarterId: '2027-Q1',
        moves: [],
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
      '2026-Q4': 4_700_000,
      '2027-Q1': 4_700_000,
      '2027-Q2': 4_700_000,
    },
    alternativeSequences: [
      { scenario: 'Dependency-first', tradeoff: 'Clear the schedule foundation before scaling operations AI.' },
    ],
  };
}
