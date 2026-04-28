import {
  buildProgramsIndexView,
  filterProgramRowsForIndex,
  getProgramsIndexEmptyStateCopy,
  normalizeProgramsIndexFilter,
} from '@/lib/programs/programs-page-view';

describe('Programs index linked-state and filters', () => {
  it('anchors APX-CDP-2026 as the linked Source flagship at P3 Design', () => {
    const view = buildProgramsIndexView('apex-retail');
    const flagship = view.programs.find((program) => program.id === 'apx-cdp-2026');

    expect(flagship).toBeDefined();
    expect(flagship?.currentPhase).toBe(3);
    expect(flagship?.gateStatus).toBe('pending');
    expect(flagship?.linkedSourceEvent).toBe(
      'SRC-AMS-2026 · AMS Vendor Consolidation 2026 · Stage 7 BAFO',
    );
    expect(flagship?.linkedSourceEventHref).toBe(
      '/source/events/apex-retail-ams-outsourcing-2026',
    );
    expect(flagship?.linkedSourceEventState).toBe(
      'Vendor C selected · Build gate dependency',
    );
  });

  it('filters active, idle, and gated rows deterministically', () => {
    const view = buildProgramsIndexView('apex-retail');

    expect(filterProgramRowsForIndex(view.programs, 'all')).toHaveLength(view.programs.length);
    expect(filterProgramRowsForIndex(view.programs, 'active')).toEqual(
      view.programs.filter((program) => !program.isIdle),
    );
    expect(filterProgramRowsForIndex(view.programs, 'idle')).toEqual(
      view.programs.filter((program) => program.isIdle),
    );
    expect(filterProgramRowsForIndex(view.programs, 'gated')).toEqual(
      view.programs.filter((program) => program.gateStatus === 'pending'),
    );
  });

  it('normalizes unknown filter keys back to all', () => {
    expect(normalizeProgramsIndexFilter(null)).toBe('all');
    expect(normalizeProgramsIndexFilter('')).toBe('all');
    expect(normalizeProgramsIndexFilter('source')).toBe('all');
    expect(normalizeProgramsIndexFilter('active')).toBe('active');
    expect(normalizeProgramsIndexFilter('idle')).toBe('idle');
    expect(normalizeProgramsIndexFilter('gated')).toBe('gated');
  });

  it('locks filter-specific empty-state copy', () => {
    expect(getProgramsIndexEmptyStateCopy('all')).toBe(
      'No programs are in the canonical portfolio yet.',
    );
    expect(getProgramsIndexEmptyStateCopy('active')).toBe(
      'No programs are currently active.',
    );
    expect(getProgramsIndexEmptyStateCopy('idle')).toBe(
      'No programs are currently idle.',
    );
    expect(getProgramsIndexEmptyStateCopy('gated')).toBe(
      'No programs have pending gate reviews.',
    );
  });
});
