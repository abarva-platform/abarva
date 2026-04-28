/**
 * instance-resolver tests
 *
 * Deterministic: no network, no LLM calls, no randomness. Verifies that the
 * unified resolver finds source events + programs by id, returns null for
 * unknowns, and that the id catalogue covers both kinds.
 */

import {
  getAllInstanceIds,
  resolveAnyInstance,
} from '@/lib/reasoning/instance-resolver';

describe('instance-resolver', () => {
  it('resolves the AMS source event by id with kind="source"', () => {
    const result = resolveAnyInstance('apex-retail-ams-outsourcing-2026');
    expect(result).not.toBeNull();
    expect(result?.kind).toBe('source');
    if (result?.kind === 'source') {
      expect(result.instance.patternId).toBe('PAT-SRC-AMS-001');
      expect(result.instance.currentStage).toBe('BAFO');
    }
  });

  it('resolves the CDP program by id with kind="program"', () => {
    const result = resolveAnyInstance('APX-CDP-2026');
    expect(result).not.toBeNull();
    expect(result?.kind).toBe('program');
    if (result?.kind === 'program') {
      expect(result.instance.patternId).toBe('PAT-PRG-CDP-001');
      expect(typeof result.instance.currentPhase).toBe('number');
    }
  });

  it('returns null for unknown ids and the empty string', () => {
    expect(resolveAnyInstance('not-a-real-instance')).toBeNull();
    expect(resolveAnyInstance('')).toBeNull();
  });

  it('getAllInstanceIds includes the AMS source event and all 4 Apex programs', () => {
    const { sourceEvents, programs } = getAllInstanceIds();
    expect(sourceEvents).toContain('apex-retail-ams-outsourcing-2026');
    expect(sourceEvents.length).toBeGreaterThanOrEqual(1);

    expect(programs).toContain('APX-CDP-2026');
    expect(programs.length).toBeGreaterThanOrEqual(4);
  });

  it('source-event ids and program ids do not overlap', () => {
    const { sourceEvents, programs } = getAllInstanceIds();
    const overlap = sourceEvents.filter((id) => programs.includes(id));
    expect(overlap).toEqual([]);
  });

  it('every resolved id round-trips back to its catalogue kind', () => {
    const { sourceEvents, programs } = getAllInstanceIds();
    for (const id of sourceEvents) {
      expect(resolveAnyInstance(id)?.kind).toBe('source');
    }
    for (const id of programs) {
      expect(resolveAnyInstance(id)?.kind).toBe('program');
    }
  });
});
