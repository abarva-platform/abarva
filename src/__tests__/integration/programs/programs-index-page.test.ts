import {
  buildProgramsIndexView,
  filterProgramRowsForIndex,
  getProgramsIndexEmptyStateCopy,
  getProgramsIndexEmptyStateTitle,
  getProgramsIndexFilterHref,
  getProgramsIndexFilterSummary,
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

  it('builds the Meridian tenant view without Apex fixture bleed', () => {
    const view = buildProgramsIndexView('meridian-health');

    expect(view.tenant).toBe('Meridian Health System');
    expect(view.phaseFilterTenantSlug).toBe('meridian-health');
    expect(view.programs).toHaveLength(2);
    expect(view.programs.every((program) => program.displayId.startsWith('MRD-'))).toBe(true);
    expect(view.programs.some((program) => program.displayId.startsWith('APX-'))).toBe(false);
    expect(view.agentRail.map((agent) => agent.job).join(' ')).not.toContain('APX-');
  });

  it('returns a fresh program array per tenant view build', () => {
    const first = buildProgramsIndexView('meridian-health');
    first.programs.push({
      id: 'test-only-row',
      displayId: 'TEST',
      name: 'Mutation Guard',
      currentPhase: 0,
      phases: [],
      gateStatus: 'pending',
      lastActiveLabel: 'test',
      nexusNote: 'test',
      actionLabel: 'Continue',
      isIdle: false,
    });

    const second = buildProgramsIndexView('meridian-health');
    expect(second.programs.some((program) => program.id === 'test-only-row')).toBe(false);
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
    expect(getProgramsIndexEmptyStateTitle('all')).toBe('No programs yet');
    expect(getProgramsIndexEmptyStateTitle('active')).toBe('No active programs');
    expect(getProgramsIndexEmptyStateTitle('idle')).toBe('No idle programs');
    expect(getProgramsIndexEmptyStateTitle('gated')).toBe('No gated programs');

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

  it('locks canonical filter hrefs and visible-count summaries', () => {
    expect(getProgramsIndexFilterHref('all')).toBe('/programs');
    expect(getProgramsIndexFilterHref('active')).toBe('/programs?filter=active');
    expect(getProgramsIndexFilterHref('idle')).toBe('/programs?filter=idle');
    expect(getProgramsIndexFilterHref('gated')).toBe('/programs?filter=gated');

    expect(getProgramsIndexFilterSummary('all', 6, 6)).toBe('6 programs shown');
    expect(getProgramsIndexFilterSummary('active', 4, 6)).toBe(
      '4 of 6 programs shown · active filter',
    );
    expect(getProgramsIndexFilterSummary('idle', 2, 6)).toBe(
      '2 of 6 programs shown · idle filter',
    );
    expect(getProgramsIndexFilterSummary('gated', 1, 6)).toBe(
      '1 of 6 programs shown · gated filter',
    );
  });
});
