/**
 * compare-options-helpers tests
 *
 * Deterministic: pure function tests — no fixtures, no randomness.
 */

import { prepareCompareOptions } from '@/lib/reasoning/compare-options-helpers';

describe('prepareCompareOptions', () => {
  it('excludes the current id when it is a source event and keeps both groups', () => {
    const result = prepareCompareOptions('src-1', {
      sourceEvents: ['src-1', 'src-2'],
      programs: ['prg-1', 'prg-2'],
    });

    expect(result.totalCount).toBe(3);
    expect(result.groups).toEqual([
      { label: 'Source events', kind: 'source', options: ['src-2'] },
      { label: 'Programs', kind: 'program', options: ['prg-1', 'prg-2'] },
    ]);
  });

  it('excludes the current id when it is a program and keeps both groups', () => {
    const result = prepareCompareOptions('prg-1', {
      sourceEvents: ['src-1', 'src-2'],
      programs: ['prg-1', 'prg-2', 'prg-3'],
    });

    expect(result.totalCount).toBe(4);
    expect(result.groups).toEqual([
      { label: 'Source events', kind: 'source', options: ['src-1', 'src-2'] },
      { label: 'Programs', kind: 'program', options: ['prg-2', 'prg-3'] },
    ]);
  });

  it('drops a group entirely when it becomes empty after exclusion', () => {
    const result = prepareCompareOptions('src-only', {
      sourceEvents: ['src-only'],
      programs: ['prg-1'],
    });

    expect(result.totalCount).toBe(1);
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0]).toEqual({
      label: 'Programs',
      kind: 'program',
      options: ['prg-1'],
    });
  });

  it('returns no groups when current id matches the only catalogue entry', () => {
    const result = prepareCompareOptions('src-only', {
      sourceEvents: ['src-only'],
      programs: [],
    });

    expect(result.totalCount).toBe(0);
    expect(result.groups).toEqual([]);
  });
});
