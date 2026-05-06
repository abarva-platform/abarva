import {
  summarizeValueLines,
  type SourceValueLine,
  type ValueLedgerSummary,
} from '@/lib/source/value-line-types';

function makeLine(overrides: Partial<SourceValueLine> = {}): SourceValueLine {
  return {
    id: 'test-id',
    programId: 'prog-1',
    label: 'Cost savings',
    category: null,
    valueState: 'projected',
    projectedAmount: 100000,
    committedAmount: null,
    realizedAmount: null,
    valueUnit: 'usd',
    measurementOwnerId: null,
    evidenceArtifactId: null,
    notes: null,
    sortOrder: 0,
    createdAt: '2026-05-07T00:00:00Z',
    updatedAt: '2026-05-07T00:00:00Z',
    ...overrides,
  };
}

describe('summarizeValueLines', () => {
  it('returns zero-summary for empty list', () => {
    const summary = summarizeValueLines([]);
    expect(summary.totalLines).toBe(0);
    expect(summary.byState.projected).toBe(0);
    expect(summary.projectedTotalUsd).toBe(0);
    expect(summary.realizedTotalUsd).toBe(0);
  });

  it('counts lines by state', () => {
    const lines = [
      makeLine({ id: '1', valueState: 'projected' }),
      makeLine({ id: '2', valueState: 'projected' }),
      makeLine({ id: '3', valueState: 'committed' }),
      makeLine({ id: '4', valueState: 'measuring' }),
      makeLine({ id: '5', valueState: 'realized', realizedAmount: 50000 }),
    ];
    const s = summarizeValueLines(lines);
    expect(s.totalLines).toBe(5);
    expect(s.byState.projected).toBe(2);
    expect(s.byState.committed).toBe(1);
    expect(s.byState.measuring).toBe(1);
    expect(s.byState.realized).toBe(1);
  });

  it('sums USD amounts across all states', () => {
    const lines = [
      makeLine({ id: '1', projectedAmount: 200000, committedAmount: 180000, realizedAmount: null }),
      makeLine({ id: '2', projectedAmount: 50000, committedAmount: null, realizedAmount: null }),
      makeLine({ id: '3', valueState: 'realized', projectedAmount: 100000, committedAmount: 100000, realizedAmount: 95000 }),
    ];
    const s = summarizeValueLines(lines);
    expect(s.projectedTotalUsd).toBe(350000);
    expect(s.committedTotalUsd).toBe(280000);
    expect(s.realizedTotalUsd).toBe(95000);
  });

  it('excludes non-USD lines from amount totals', () => {
    const lines = [
      makeLine({ id: '1', projectedAmount: 10, valueUnit: 'fte_hours' }),
      makeLine({ id: '2', projectedAmount: 200000, valueUnit: 'usd' }),
    ];
    const s = summarizeValueLines(lines);
    expect(s.projectedTotalUsd).toBe(200000);
  });

  it('counts lines missing measurement owner', () => {
    const lines = [
      makeLine({ id: '1', measurementOwnerId: null }),
      makeLine({ id: '2', measurementOwnerId: 'user-abc' }),
      makeLine({ id: '3', measurementOwnerId: null }),
    ];
    const s = summarizeValueLines(lines);
    expect(s.linesNeedingOwner).toBe(2);
  });

  it('flags realized lines missing evidence artifact', () => {
    const lines = [
      makeLine({ id: '1', valueState: 'realized', evidenceArtifactId: null }),
      makeLine({ id: '2', valueState: 'realized', evidenceArtifactId: 'artifact-xyz' }),
      makeLine({ id: '3', valueState: 'committed', evidenceArtifactId: null }),
    ];
    const s = summarizeValueLines(lines);
    // Only realized lines without evidence count; committed lines don't
    expect(s.linesNeedingEvidence).toBe(1);
  });

  it('returns correct programId from first line', () => {
    const lines = [makeLine({ programId: 'prog-42' })];
    expect(summarizeValueLines(lines).programId).toBe('prog-42');
  });
});
