/**
 * W32A — Phase Filter View Model Tests
 *
 * Tests for src/lib/programs/phase-filter-view.ts
 * All tests exercise deterministic seed behavior only. No React. No network.
 */

import {
  buildPhaseFilterView,
  getPhaseLabel,
  getPhasesWithPrograms,
  type PhaseFilterView,
} from '@/lib/programs/phase-filter-view';

// ---------------------------------------------------------------------------
// getPhaseLabel
// ---------------------------------------------------------------------------

describe('getPhaseLabel', () => {
  it('returns Discovery for discovery', () => {
    expect(getPhaseLabel('discovery')).toBe('Discovery');
  });

  it('returns Synthesis for synthesis', () => {
    expect(getPhaseLabel('synthesis')).toBe('Synthesis');
  });

  it('returns Design for design', () => {
    expect(getPhaseLabel('design')).toBe('Design');
  });

  it('returns Build for build', () => {
    expect(getPhaseLabel('build')).toBe('Build');
  });

  it('returns Activate for activate', () => {
    expect(getPhaseLabel('activate')).toBe('Activate');
  });

  it('returns Operate for operate', () => {
    expect(getPhaseLabel('operate')).toBe('Operate');
  });
});

// ---------------------------------------------------------------------------
// getPhasesWithPrograms
// ---------------------------------------------------------------------------

describe('getPhasesWithPrograms', () => {
  it('returns 4 phases for apex-retail (4 programs across 4 phases)', () => {
    const phases = getPhasesWithPrograms('apex-retail');
    expect(phases).toHaveLength(4);
  });

  it('apex-retail includes build phase', () => {
    const phases = getPhasesWithPrograms('apex-retail');
    expect(phases).toContain('build');
  });

  it('apex-retail does not include activate or operate (0 programs)', () => {
    const phases = getPhasesWithPrograms('apex-retail');
    expect(phases).not.toContain('activate');
    expect(phases).not.toContain('operate');
  });

  it('meridian returns 2 phases', () => {
    const phases = getPhasesWithPrograms('meridian');
    expect(phases).toHaveLength(2);
  });

  it('unknown tenant returns 0 phases', () => {
    const phases = getPhasesWithPrograms('unknown-tenant');
    expect(phases).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// buildPhaseFilterView — structure
// ---------------------------------------------------------------------------

describe('buildPhaseFilterView — structure', () => {
  let view: PhaseFilterView;

  beforeEach(() => {
    view = buildPhaseFilterView('apex-retail');
  });

  it('returns 6 filter options (one per phase)', () => {
    expect(view.options).toHaveLength(6);
  });

  it('activePhase defaults to all', () => {
    expect(view.activePhase).toBe('all');
  });

  it('deterministicSeed is true', () => {
    expect(view.deterministicSeed).toBe(true);
  });

  it('caveat is a non-empty string', () => {
    expect(typeof view.caveat).toBe('string');
    expect(view.caveat.length).toBeGreaterThan(10);
  });

  it('each option has a non-empty label', () => {
    for (const opt of view.options) {
      expect(opt.label.length).toBeGreaterThan(0);
    }
  });

  it('each option has a non-empty description', () => {
    for (const opt of view.options) {
      expect(opt.description.length).toBeGreaterThan(0);
    }
  });

  it('each option has a programCount >= 0', () => {
    for (const opt of view.options) {
      expect(opt.programCount).toBeGreaterThanOrEqual(0);
    }
  });
});

// ---------------------------------------------------------------------------
// buildPhaseFilterView — apex-retail data contract
// ---------------------------------------------------------------------------

describe('buildPhaseFilterView — apex-retail data contract', () => {
  it('totalPrograms is 4 for apex-retail', () => {
    const view = buildPhaseFilterView('apex-retail');
    expect(view.totalPrograms).toBe(4);
  });

  it('build phase has programCount 1', () => {
    const view = buildPhaseFilterView('apex-retail');
    const buildOpt = view.options.find((o) => o.phase === 'build');
    expect(buildOpt?.programCount).toBe(1);
  });

  it('build phase isCurrentPhase is true for apex-retail', () => {
    const view = buildPhaseFilterView('apex-retail');
    const buildOpt = view.options.find((o) => o.phase === 'build');
    expect(buildOpt?.isCurrentPhase).toBe(true);
  });

  it('only build phase has isCurrentPhase true for apex-retail', () => {
    const view = buildPhaseFilterView('apex-retail');
    const currentPhases = view.options.filter((o) => o.isCurrentPhase);
    expect(currentPhases).toHaveLength(1);
    expect(currentPhases[0].phase).toBe('build');
  });

  it('activate and operate have programCount 0 for apex-retail', () => {
    const view = buildPhaseFilterView('apex-retail');
    const activate = view.options.find((o) => o.phase === 'activate');
    const operate = view.options.find((o) => o.phase === 'operate');
    expect(activate?.programCount).toBe(0);
    expect(operate?.programCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// buildPhaseFilterView — activePhase parameter
// ---------------------------------------------------------------------------

describe('buildPhaseFilterView — activePhase parameter', () => {
  it('respects build as activePhase', () => {
    const view = buildPhaseFilterView('apex-retail', 'build');
    expect(view.activePhase).toBe('build');
  });

  it('respects all as activePhase', () => {
    const view = buildPhaseFilterView('apex-retail', 'all');
    expect(view.activePhase).toBe('all');
  });

  it('options are the same regardless of activePhase', () => {
    const viewAll = buildPhaseFilterView('apex-retail', 'all');
    const viewBuild = buildPhaseFilterView('apex-retail', 'build');
    expect(viewAll.options).toHaveLength(viewBuild.options.length);
  });
});

// ---------------------------------------------------------------------------
// buildPhaseFilterView — meridian / thin tenant
// ---------------------------------------------------------------------------

describe('buildPhaseFilterView — meridian', () => {
  it('meridian totalPrograms is 2', () => {
    const view = buildPhaseFilterView('meridian');
    expect(view.totalPrograms).toBe(2);
  });

  it('meridian-health alias totalPrograms is 2', () => {
    const view = buildPhaseFilterView('meridian-health');
    expect(view.totalPrograms).toBe(2);
  });

  it('meridian synthesis phase isCurrentPhase is true', () => {
    const view = buildPhaseFilterView('meridian');
    const synthOpt = view.options.find((o) => o.phase === 'synthesis');
    expect(synthOpt?.isCurrentPhase).toBe(true);
  });

  it('meridian-health alias synthesis phase isCurrentPhase is true', () => {
    const view = buildPhaseFilterView('meridian-health');
    const synthOpt = view.options.find((o) => o.phase === 'synthesis');
    expect(synthOpt?.isCurrentPhase).toBe(true);
  });

  it('caveat is present for meridian', () => {
    const view = buildPhaseFilterView('meridian');
    expect(view.caveat).toBeTruthy();
  });

  it('deterministicSeed is true for meridian', () => {
    const view = buildPhaseFilterView('meridian');
    expect(view.deterministicSeed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// buildPhaseFilterView — unknown/empty tenant
// ---------------------------------------------------------------------------

describe('buildPhaseFilterView — unknown tenant', () => {
  it('totalPrograms is 0 for unknown tenant', () => {
    const view = buildPhaseFilterView('unknown-tenant');
    expect(view.totalPrograms).toBe(0);
  });

  it('still returns 6 options for unknown tenant', () => {
    const view = buildPhaseFilterView('unknown-tenant');
    expect(view.options).toHaveLength(6);
  });

  it('no phase has isCurrentPhase true for unknown tenant', () => {
    const view = buildPhaseFilterView('unknown-tenant');
    const current = view.options.filter((o) => o.isCurrentPhase);
    expect(current).toHaveLength(0);
  });
});
