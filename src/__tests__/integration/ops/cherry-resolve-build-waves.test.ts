// OPS11 - Build waves merge support tests.
//
// Tests the TypeScript waves-merge-utils module which mirrors the Python
// merge_build_waves logic in scripts/integration/cherry_resolve.py.
// All tests are pure in-memory — no git, no filesystem, no subprocess.

import {
  conservativeWaveValidation,
  conservativeWaveStatus,
  mergeWaveNextAction,
  unionIntArray,
  unionStringArray,
  mergeBuildWaves,
  type WaveEntry,
  type WavesDoc,
  type WaveValidationStatus,
} from '../../../lib/ops/waves-merge-utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeWave(overrides: Partial<WaveEntry> = {}): WaveEntry {
  return {
    waveId: 'wave-X',
    name: 'Test Wave',
    status: 'in_progress',
    percentComplete: 0,
    plannedSlices: ['A', 'B', 'C', 'D'],
    completedSlices: ['A'],
    skippedSlices: [],
    blockedSlices: [],
    mergedPrs: [],
    validationStatus: 'not_run',
    nextAction: 'do something',
    lastUpdated: '2026-04-26',
    ...overrides,
  };
}

function makeWavesDoc(waves: WaveEntry[]): WavesDoc {
  return {
    schemaVersion: 1,
    lastUpdated: '2026-04-26',
    waves,
  };
}

// ---------------------------------------------------------------------------
// conservativeWaveValidation
// ---------------------------------------------------------------------------

describe('conservativeWaveValidation', () => {
  it('returns HEAD unchanged when src has the same rank', () => {
    expect(conservativeWaveValidation('tests_green', 'tests_green')).toBe(
      'tests_green',
    );
  });

  it('demotes HEAD when src has a lower rank (conservative = trust worse result)', () => {
    // HEAD = tests_green (rank 2), src = tsc_clean (rank 1) → demote to tsc_clean
    expect(conservativeWaveValidation('tests_green', 'tsc_clean')).toBe(
      'tsc_clean',
    );
  });

  it('does NOT upgrade HEAD when src has a higher rank', () => {
    // HEAD = tsc_clean (rank 1), src = ci_green (rank 4) → keep HEAD (never upgrade)
    expect(conservativeWaveValidation('tsc_clean', 'ci_green')).toBe(
      'tsc_clean',
    );
  });

  it('preserves HEAD when HEAD is "failing" (sentinel)', () => {
    expect(
      conservativeWaveValidation('failing', 'full_pass'),
    ).toBe('failing');
  });

  it('preserves HEAD when src is "failing" (sentinel)', () => {
    expect(
      conservativeWaveValidation('tests_green', 'failing'),
    ).toBe('tests_green');
  });

  it('preserves "not_run" HEAD when src is also "not_run"', () => {
    expect(conservativeWaveValidation('not_run', 'not_run')).toBe('not_run');
  });

  const rankOrder: WaveValidationStatus[] = [
    'not_run',
    'tsc_clean',
    'tests_green',
    'build_green',
    'ci_green',
    'partial',
    'full_pass',
  ];

  it('never upgrades HEAD for any rank-order pair (src higher rank → keep HEAD)', () => {
    for (let h = 0; h < rankOrder.length; h++) {
      for (let s = h + 1; s < rankOrder.length; s++) {
        // src has higher rank → HEAD must be preserved (never upgrade)
        const result = conservativeWaveValidation(rankOrder[h]!, rankOrder[s]!);
        expect(result).toBe(rankOrder[h]);
      }
    }
  });

  it('demotes HEAD for lower-rank src (conservative = trust the worse result)', () => {
    // HEAD = full_pass, src = not_run → demote to not_run
    expect(conservativeWaveValidation('full_pass', 'not_run')).toBe('not_run');
  });
});

// ---------------------------------------------------------------------------
// conservativeWaveStatus
// ---------------------------------------------------------------------------

describe('conservativeWaveStatus', () => {
  it('keeps HEAD when statuses are equal', () => {
    expect(conservativeWaveStatus('in_progress', 'in_progress')).toBe(
      'in_progress',
    );
  });

  it('never downgrades HEAD to a lower rank', () => {
    // HEAD = merged (highest), src = planned (lowest)
    expect(conservativeWaveStatus('merged', 'planned')).toBe('merged');
  });

  it('never downgrades HEAD in_progress to planned', () => {
    expect(conservativeWaveStatus('in_progress', 'planned')).toBe(
      'in_progress',
    );
  });

  it('upgrades HEAD when src has a higher rank', () => {
    // HEAD = planned (rank 0), src = merged (rank 4)
    expect(conservativeWaveStatus('planned', 'merged')).toBe('merged');
  });

  it('upgrades HEAD from in_progress to merged', () => {
    expect(conservativeWaveStatus('in_progress', 'merged')).toBe('merged');
  });
});

// ---------------------------------------------------------------------------
// mergeWaveNextAction
// ---------------------------------------------------------------------------

describe('mergeWaveNextAction', () => {
  it('returns HEAD unchanged when src is empty', () => {
    expect(mergeWaveNextAction('do A', '')).toBe('do A');
  });

  it('returns HEAD unchanged when src equals HEAD', () => {
    expect(mergeWaveNextAction('do A', 'do A')).toBe('do A');
  });

  it('returns HEAD unchanged when src is already a substring of HEAD', () => {
    expect(mergeWaveNextAction('do A and more', 'do A')).toBe(
      'do A and more',
    );
  });

  it('appends src to HEAD when different and not substring', () => {
    const result = mergeWaveNextAction('do A', 'do B');
    expect(result).toBe('do A do B');
  });

  it('trims whitespace correctly when appending', () => {
    const result = mergeWaveNextAction('do A  ', '  do B');
    expect(result).toBe('do A do B');
  });

  it('handles empty HEAD with a non-empty src', () => {
    const result = mergeWaveNextAction('', 'do something');
    expect(result).toBe('do something');
  });
});

// ---------------------------------------------------------------------------
// unionIntArray
// ---------------------------------------------------------------------------

describe('unionIntArray', () => {
  it('returns head array unchanged when src is empty', () => {
    expect(unionIntArray([1, 2, 3], [])).toEqual([1, 2, 3]);
  });

  it('deduplicates entries already in HEAD', () => {
    expect(unionIntArray([1, 2], [1, 2])).toEqual([1, 2]);
  });

  it('appends new entries from src', () => {
    expect(unionIntArray([1, 2], [3, 4])).toEqual([1, 2, 3, 4]);
  });

  it('preserves HEAD order and appends only novel src entries', () => {
    expect(unionIntArray([10, 20], [20, 30, 10, 40])).toEqual([10, 20, 30, 40]);
  });

  it('handles empty arrays', () => {
    expect(unionIntArray([], [])).toEqual([]);
    expect(unionIntArray([], [5])).toEqual([5]);
    expect(unionIntArray([5], [])).toEqual([5]);
  });
});

// ---------------------------------------------------------------------------
// unionStringArray
// ---------------------------------------------------------------------------

describe('unionStringArray', () => {
  it('deduplicates strings', () => {
    expect(unionStringArray(['A', 'B'], ['B', 'C'])).toEqual(['A', 'B', 'C']);
  });

  it('returns head unchanged when src has no new entries', () => {
    expect(unionStringArray(['A', 'B'], ['A'])).toEqual(['A', 'B']);
  });
});

// ---------------------------------------------------------------------------
// mergeBuildWaves
// ---------------------------------------------------------------------------

describe('mergeBuildWaves · new wave is appended', () => {
  it('appends a wave from src that is absent in HEAD', () => {
    const head = makeWavesDoc([makeWave({ waveId: 'wave-1' })]);
    const src = makeWavesDoc([makeWave({ waveId: 'wave-2', name: 'New Wave' })]);
    const { merged, summary } = mergeBuildWaves(head, src, '2026-04-26');
    expect(merged.waves).toHaveLength(2);
    expect(merged.waves.find((w) => w.waveId === 'wave-2')).toBeDefined();
    expect(summary.merged_waves[0]).toMatchObject({ waveId: 'wave-2', added: true });
  });
});

describe('mergeBuildWaves · slice array union', () => {
  it('unions completedSlices without duplicates', () => {
    const head = makeWavesDoc([
      makeWave({ waveId: 'wave-1', completedSlices: ['A', 'B'] }),
    ]);
    const src = makeWavesDoc([
      makeWave({ waveId: 'wave-1', completedSlices: ['B', 'C'] }),
    ]);
    const { merged } = mergeBuildWaves(head, src, '2026-04-26');
    const wave = merged.waves.find((w) => w.waveId === 'wave-1')!;
    expect(wave.completedSlices).toEqual(['A', 'B', 'C']);
  });

  it('unions skippedSlices without duplicates', () => {
    const head = makeWavesDoc([
      makeWave({ waveId: 'wave-1', skippedSlices: ['X'] }),
    ]);
    const src = makeWavesDoc([
      makeWave({ waveId: 'wave-1', skippedSlices: ['X', 'Y'] }),
    ]);
    const { merged } = mergeBuildWaves(head, src, '2026-04-26');
    const wave = merged.waves.find((w) => w.waveId === 'wave-1')!;
    expect(wave.skippedSlices).toEqual(['X', 'Y']);
  });

  it('unions blockedSlices without duplicates', () => {
    const head = makeWavesDoc([
      makeWave({ waveId: 'wave-1', blockedSlices: ['Z'] }),
    ]);
    const src = makeWavesDoc([
      makeWave({ waveId: 'wave-1', blockedSlices: ['Z', 'W'] }),
    ]);
    const { merged } = mergeBuildWaves(head, src, '2026-04-26');
    const wave = merged.waves.find((w) => w.waveId === 'wave-1')!;
    expect(wave.blockedSlices).toEqual(['Z', 'W']);
  });
});

describe('mergeBuildWaves · mergedPrs union', () => {
  it('unions integer mergedPrs arrays', () => {
    const head = makeWavesDoc([
      makeWave({ waveId: 'wave-1', mergedPrs: [100, 200] }),
    ]);
    const src = makeWavesDoc([
      makeWave({ waveId: 'wave-1', mergedPrs: [200, 300] }),
    ]);
    const { merged } = mergeBuildWaves(head, src, '2026-04-26');
    const wave = merged.waves.find((w) => w.waveId === 'wave-1')!;
    expect(wave.mergedPrs).toEqual([100, 200, 300]);
  });

  it('deduplicates PR numbers already in HEAD', () => {
    const head = makeWavesDoc([
      makeWave({ waveId: 'wave-1', mergedPrs: [1, 2, 3] }),
    ]);
    const src = makeWavesDoc([
      makeWave({ waveId: 'wave-1', mergedPrs: [1, 2, 3] }),
    ]);
    const { merged } = mergeBuildWaves(head, src, '2026-04-26');
    const wave = merged.waves.find((w) => w.waveId === 'wave-1')!;
    expect(wave.mergedPrs).toEqual([1, 2, 3]);
  });
});

describe('mergeBuildWaves · validationStatus conservative merge', () => {
  it('demotes HEAD validationStatus when src is lower rank (conservative = trust worse)', () => {
    const head = makeWavesDoc([
      makeWave({ waveId: 'wave-1', validationStatus: 'tests_green' }),
    ]);
    const src = makeWavesDoc([
      makeWave({ waveId: 'wave-1', validationStatus: 'tsc_clean', completedSlices: ['A', 'B'] }),
    ]);
    const { merged } = mergeBuildWaves(head, src, '2026-04-26');
    const wave = merged.waves.find((w) => w.waveId === 'wave-1')!;
    expect(wave.validationStatus).toBe('tsc_clean');
  });

  it('does not upgrade HEAD validationStatus when src is higher rank', () => {
    const head = makeWavesDoc([
      makeWave({ waveId: 'wave-1', validationStatus: 'tsc_clean' }),
    ]);
    const src = makeWavesDoc([
      makeWave({ waveId: 'wave-1', validationStatus: 'full_pass', completedSlices: ['A', 'B'] }),
    ]);
    const { merged } = mergeBuildWaves(head, src, '2026-04-26');
    const wave = merged.waves.find((w) => w.waveId === 'wave-1')!;
    expect(wave.validationStatus).toBe('tsc_clean');
  });

  it('preserves HEAD validationStatus = "failing" regardless of src', () => {
    const head = makeWavesDoc([
      makeWave({ waveId: 'wave-1', validationStatus: 'failing' as WaveValidationStatus }),
    ]);
    const src = makeWavesDoc([
      makeWave({ waveId: 'wave-1', validationStatus: 'full_pass', completedSlices: ['A', 'B', 'C'] }),
    ]);
    const { merged } = mergeBuildWaves(head, src, '2026-04-26');
    const wave = merged.waves.find((w) => w.waveId === 'wave-1')!;
    expect(wave.validationStatus).toBe('failing');
  });

  it('preserves HEAD when src is "failing"', () => {
    const head = makeWavesDoc([
      makeWave({ waveId: 'wave-1', validationStatus: 'ci_green' }),
    ]);
    const src = makeWavesDoc([
      makeWave({ waveId: 'wave-1', validationStatus: 'failing' as WaveValidationStatus }),
    ]);
    const { merged } = mergeBuildWaves(head, src, '2026-04-26');
    const wave = merged.waves.find((w) => w.waveId === 'wave-1')!;
    expect(wave.validationStatus).toBe('ci_green');
  });
});

describe('mergeBuildWaves · nextAction handling', () => {
  it('appends src nextAction when different from HEAD', () => {
    const head = makeWavesDoc([
      makeWave({ waveId: 'wave-1', nextAction: 'Lane A complete.' }),
    ]);
    const src = makeWavesDoc([
      makeWave({ waveId: 'wave-1', nextAction: 'Awaiting Lane B.', completedSlices: ['A', 'B'] }),
    ]);
    const { merged } = mergeBuildWaves(head, src, '2026-04-26');
    const wave = merged.waves.find((w) => w.waveId === 'wave-1')!;
    expect(wave.nextAction).toBe('Lane A complete. Awaiting Lane B.');
  });

  it('does not duplicate nextAction when src is already substring of HEAD', () => {
    const head = makeWavesDoc([
      makeWave({ waveId: 'wave-1', nextAction: 'Lane A complete. Awaiting Lane B.' }),
    ]);
    const src = makeWavesDoc([
      makeWave({ waveId: 'wave-1', nextAction: 'Awaiting Lane B.' }),
    ]);
    const { merged } = mergeBuildWaves(head, src, '2026-04-26');
    const wave = merged.waves.find((w) => w.waveId === 'wave-1')!;
    expect(wave.nextAction).toBe('Lane A complete. Awaiting Lane B.');
  });

  it('keeps HEAD nextAction when src nextAction is empty', () => {
    const head = makeWavesDoc([
      makeWave({ waveId: 'wave-1', nextAction: 'do A' }),
    ]);
    const src = makeWavesDoc([
      makeWave({ waveId: 'wave-1', nextAction: '' }),
    ]);
    const { merged } = mergeBuildWaves(head, src, '2026-04-26');
    const wave = merged.waves.find((w) => w.waveId === 'wave-1')!;
    expect(wave.nextAction).toBe('do A');
  });
});

describe('mergeBuildWaves · status conservative merge', () => {
  it('never downgrades HEAD status', () => {
    const head = makeWavesDoc([
      makeWave({ waveId: 'wave-1', status: 'merged' }),
    ]);
    const src = makeWavesDoc([
      makeWave({ waveId: 'wave-1', status: 'planned' }),
    ]);
    const { merged } = mergeBuildWaves(head, src, '2026-04-26');
    const wave = merged.waves.find((w) => w.waveId === 'wave-1')!;
    expect(wave.status).toBe('merged');
  });

  it('upgrades HEAD status when src has a higher rank', () => {
    const head = makeWavesDoc([
      makeWave({ waveId: 'wave-1', status: 'planned' }),
    ]);
    const src = makeWavesDoc([
      makeWave({ waveId: 'wave-1', status: 'merged', completedSlices: ['A', 'B', 'C', 'D'] }),
    ]);
    const { merged } = mergeBuildWaves(head, src, '2026-04-26');
    const wave = merged.waves.find((w) => w.waveId === 'wave-1')!;
    expect(wave.status).toBe('merged');
  });
});

describe('mergeBuildWaves · percentComplete recomputation', () => {
  it('recomputes percentComplete based on completedSlices / plannedSlices', () => {
    // HEAD has 1 of 4 completed (25%), src adds B → 2 of 4 = 50%
    const head = makeWavesDoc([
      makeWave({
        waveId: 'wave-1',
        plannedSlices: ['A', 'B', 'C', 'D'],
        completedSlices: ['A'],
        percentComplete: 25,
      }),
    ]);
    const src = makeWavesDoc([
      makeWave({
        waveId: 'wave-1',
        plannedSlices: ['A', 'B', 'C', 'D'],
        completedSlices: ['A', 'B'],
        percentComplete: 50,
      }),
    ]);
    const { merged } = mergeBuildWaves(head, src, '2026-04-26');
    const wave = merged.waves.find((w) => w.waveId === 'wave-1')!;
    expect(wave.percentComplete).toBe(50);
  });

  it('returns 0 when plannedSlices is empty', () => {
    const head = makeWavesDoc([
      makeWave({
        waveId: 'wave-1',
        plannedSlices: [],
        completedSlices: [],
        percentComplete: 0,
      }),
    ]);
    const src = makeWavesDoc([
      makeWave({ waveId: 'wave-1', plannedSlices: [], completedSlices: [] }),
    ]);
    const { merged } = mergeBuildWaves(head, src, '2026-04-26');
    const wave = merged.waves.find((w) => w.waveId === 'wave-1')!;
    expect(wave.percentComplete).toBe(0);
  });
});

describe('mergeBuildWaves · lastUpdated bumped', () => {
  it('sets lastUpdated on the returned document', () => {
    const head = makeWavesDoc([makeWave()]);
    const src = makeWavesDoc([makeWave()]);
    const { merged } = mergeBuildWaves(head, src, '2026-04-26');
    expect(merged.lastUpdated).toBe('2026-04-26');
  });
});

describe('mergeBuildWaves · waveId key (not id)', () => {
  it('correctly matches waves by waveId field', () => {
    // Ensures the fix for the waveId vs id bug works end-to-end
    const head = makeWavesDoc([
      makeWave({ waveId: 'wave-12', completedSlices: ['OPS11'] }),
    ]);
    const src = makeWavesDoc([
      makeWave({
        waveId: 'wave-12',
        completedSlices: ['OPS11', 'OPS12'],
        mergedPrs: [400],
      }),
    ]);
    const { merged } = mergeBuildWaves(head, src, '2026-04-26');
    expect(merged.waves).toHaveLength(1);
    const wave = merged.waves[0]!;
    expect(wave.waveId).toBe('wave-12');
    expect(wave.completedSlices).toEqual(['OPS11', 'OPS12']);
    expect(wave.mergedPrs).toEqual([400]);
  });
});
