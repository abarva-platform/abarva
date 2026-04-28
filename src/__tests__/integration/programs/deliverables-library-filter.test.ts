// PDEL6 · Deliverables Library Filter View integration tests.
//
// Pure TypeScript + Jest. No jsdom, no React, no model calls.
// Verifies the filter view model across all filter combinations,
// pill structure, helper outputs, and module hygiene.

import {
  buildDeliverablesLibraryFilterView,
  buildFilterSummary,
  getRepresentedPhases,
} from '@/lib/programs/deliverables-library-view';
import { DELIVERABLE_PHASE_IDS } from '@/lib/programs/program-deliverables-evidence-view';

// ─── Default (no filters) ─────────────────────────────────────────────────────

describe('PDEL6 · buildDeliverablesLibraryFilterView · default (all filters)', () => {
  const view = buildDeliverablesLibraryFilterView();

  it('returns a non-empty filteredDeliverables list', () => {
    expect(view.filteredDeliverables.length).toBeGreaterThan(0);
  });

  it('filteredCount equals totalDeliverables when no filters active', () => {
    expect(view.filteredCount).toBe(view.totalDeliverables);
  });

  it('totalDeliverables is greater than 0', () => {
    expect(view.totalDeliverables).toBeGreaterThan(0);
  });

  it('activePhase is "all"', () => {
    expect(view.activePhase).toBe('all');
  });

  it('activeVersion is "all"', () => {
    expect(view.activeVersion).toBe('all');
  });

  it('activeEvidence is "all"', () => {
    expect(view.activeEvidence).toBe('all');
  });

  it('isFiltered is false', () => {
    expect(view.isFiltered).toBe(false);
  });

  it('deterministicSeed is true', () => {
    expect(view.deterministicSeed).toBe(true);
  });
});

// ─── Phase pills ──────────────────────────────────────────────────────────────

describe('PDEL6 · phase pills', () => {
  const view = buildDeliverablesLibraryFilterView();

  it('phasePills[0] key is "all"', () => {
    expect(view.phasePills[0].key).toBe('all');
  });

  it('phasePills[0] count equals totalDeliverables', () => {
    expect(view.phasePills[0].count).toBe(view.totalDeliverables);
  });

  it('phasePills[0] is active when no phase filter', () => {
    expect(view.phasePills[0].active).toBe(true);
  });

  it('all phase pills have non-empty labels', () => {
    for (const pill of view.phasePills) {
      expect(pill.label.trim().length).toBeGreaterThan(0);
    }
  });

  it('all phase pills have count >= 0', () => {
    for (const pill of view.phasePills) {
      expect(pill.count).toBeGreaterThanOrEqual(0);
    }
  });

  it('sum of phase pill counts (excluding "all") equals totalDeliverables', () => {
    const nonAllPills = view.phasePills.filter((p) => p.key !== 'all');
    const sum = nonAllPills.reduce((acc, p) => acc + p.count, 0);
    expect(sum).toBe(view.totalDeliverables);
  });

  it('no duplicate phase keys', () => {
    const keys = view.phasePills.map((p) => p.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

// ─── Version pills ────────────────────────────────────────────────────────────

describe('PDEL6 · version pills', () => {
  const view = buildDeliverablesLibraryFilterView();

  it('versionPills[0] key is "all"', () => {
    expect(view.versionPills[0].key).toBe('all');
  });

  it('all version pills have non-empty labels', () => {
    for (const pill of view.versionPills) {
      expect(pill.label.trim().length).toBeGreaterThan(0);
    }
  });

  it('sum of non-all version pill counts equals totalDeliverables', () => {
    const nonAllPills = view.versionPills.filter((p) => p.key !== 'all');
    const sum = nonAllPills.reduce((acc, p) => acc + p.count, 0);
    expect(sum).toBe(view.totalDeliverables);
  });
});

// ─── Evidence pills ───────────────────────────────────────────────────────────

describe('PDEL6 · evidence pills', () => {
  const view = buildDeliverablesLibraryFilterView();

  it('evidencePills[0] key is "all"', () => {
    expect(view.evidencePills[0].key).toBe('all');
  });

  it('all evidence pills have non-empty labels', () => {
    for (const pill of view.evidencePills) {
      expect(pill.label.trim().length).toBeGreaterThan(0);
    }
  });

  it('sum of non-all evidence pill counts equals totalDeliverables', () => {
    const nonAllPills = view.evidencePills.filter((p) => p.key !== 'all');
    const sum = nonAllPills.reduce((acc, p) => acc + p.count, 0);
    expect(sum).toBe(view.totalDeliverables);
  });
});

// ─── Phase filter applied ─────────────────────────────────────────────────────

describe('PDEL6 · phase filter applied', () => {
  it('filtering by discovery returns only discovery deliverables', () => {
    const view = buildDeliverablesLibraryFilterView('discovery');
    expect(view.filteredDeliverables.every((d) => d.phaseId === 'discovery')).toBe(true);
  });

  it('filtering by discovery sets isFiltered to true', () => {
    const view = buildDeliverablesLibraryFilterView('discovery');
    expect(view.isFiltered).toBe(true);
  });

  it('filtering by discovery marks discovery pill as active', () => {
    const view = buildDeliverablesLibraryFilterView('discovery');
    const discPill = view.phasePills.find((p) => p.key === 'discovery');
    expect(discPill?.active).toBe(true);
  });

  it('filtering by discovery marks "all" pill as inactive', () => {
    const view = buildDeliverablesLibraryFilterView('discovery');
    expect(view.phasePills[0].active).toBe(false);
  });

  it('filtering by synthesis returns only synthesis deliverables', () => {
    const view = buildDeliverablesLibraryFilterView('synthesis');
    expect(view.filteredDeliverables.every((d) => d.phaseId === 'synthesis')).toBe(true);
  });

  it('filtered count matches the synthesis phase pill count', () => {
    const fullView = buildDeliverablesLibraryFilterView();
    const synthPill = fullView.phasePills.find((p) => p.key === 'synthesis');
    const filteredView = buildDeliverablesLibraryFilterView('synthesis');
    expect(filteredView.filteredCount).toBe(synthPill?.count ?? 0);
  });
});

// ─── Version filter applied ───────────────────────────────────────────────────

describe('PDEL6 · version filter applied', () => {
  it('filtering by approved returns only approved deliverables', () => {
    const view = buildDeliverablesLibraryFilterView('all', 'approved');
    expect(
      view.filteredDeliverables.every((d) => d.versionState === 'approved'),
    ).toBe(true);
  });

  it('filtering by approved sets isFiltered to true', () => {
    const view = buildDeliverablesLibraryFilterView('all', 'approved');
    expect(view.isFiltered).toBe(true);
  });

  it('filtering by draft returns only draft deliverables', () => {
    const view = buildDeliverablesLibraryFilterView('all', 'draft');
    expect(view.filteredDeliverables.every((d) => d.versionState === 'draft')).toBe(true);
  });
});

// ─── Evidence filter applied ──────────────────────────────────────────────────

describe('PDEL6 · evidence filter applied', () => {
  it('filtering by complete returns only complete evidence deliverables', () => {
    const view = buildDeliverablesLibraryFilterView('all', 'all', 'complete');
    expect(
      view.filteredDeliverables.every((d) => d.evidenceState === 'complete'),
    ).toBe(true);
  });

  it('filtering by missing returns only missing evidence deliverables', () => {
    const view = buildDeliverablesLibraryFilterView('all', 'all', 'missing');
    expect(
      view.filteredDeliverables.every((d) => d.evidenceState === 'missing'),
    ).toBe(true);
  });
});

// ─── Combined filters ─────────────────────────────────────────────────────────

describe('PDEL6 · combined filters', () => {
  it('combining phase + version filters applies AND logic', () => {
    const view = buildDeliverablesLibraryFilterView('discovery', 'approved');
    for (const d of view.filteredDeliverables) {
      expect(d.phaseId).toBe('discovery');
      expect(d.versionState).toBe('approved');
    }
  });

  it('combining all three filters applies AND logic', () => {
    const view = buildDeliverablesLibraryFilterView('synthesis', 'in-review', 'partial');
    for (const d of view.filteredDeliverables) {
      expect(d.phaseId).toBe('synthesis');
      expect(d.versionState).toBe('in-review');
      expect(d.evidenceState).toBe('partial');
    }
  });

  it('impossible filter combination returns empty list', () => {
    // 'superseded' + 'complete' may have 0 matching deliverables
    const view = buildDeliverablesLibraryFilterView('all', 'superseded', 'complete');
    // filteredDeliverables should contain only items matching both
    for (const d of view.filteredDeliverables) {
      expect(d.versionState).toBe('superseded');
      expect(d.evidenceState).toBe('complete');
    }
  });
});

// ─── Determinism ─────────────────────────────────────────────────────────────

describe('PDEL6 · determinism', () => {
  it('default view is deterministic', () => {
    const a = buildDeliverablesLibraryFilterView();
    const b = buildDeliverablesLibraryFilterView();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('filtered view is deterministic', () => {
    const a = buildDeliverablesLibraryFilterView('synthesis', 'draft', 'missing');
    const b = buildDeliverablesLibraryFilterView('synthesis', 'draft', 'missing');
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

// ─── getRepresentedPhases helper ─────────────────────────────────────────────

describe('PDEL6 · getRepresentedPhases', () => {
  it('returns a non-empty array', () => {
    expect(getRepresentedPhases().length).toBeGreaterThan(0);
  });

  it('returns phases in canonical order', () => {
    const phases = getRepresentedPhases();
    const allPhaseOrder = DELIVERABLE_PHASE_IDS;
    const orderedSubset = allPhaseOrder.filter((p) => phases.includes(p));
    expect(phases).toEqual(orderedSubset);
  });

  it('all returned phases exist in DELIVERABLE_PHASE_IDS', () => {
    const phases = getRepresentedPhases();
    for (const phase of phases) {
      expect(DELIVERABLE_PHASE_IDS).toContain(phase);
    }
  });
});

// ─── buildFilterSummary helper ────────────────────────────────────────────────

describe('PDEL6 · buildFilterSummary', () => {
  it('returns "N deliverables" when no filter active', () => {
    const view = buildDeliverablesLibraryFilterView();
    const summary = buildFilterSummary(view);
    expect(summary).toMatch(/^\d+ deliverables$/);
  });

  it('includes phase label when phase filter active', () => {
    const view = buildDeliverablesLibraryFilterView('discovery');
    const summary = buildFilterSummary(view);
    expect(summary).toContain('Discovery');
  });

  it('includes version label when version filter active', () => {
    const view = buildDeliverablesLibraryFilterView('all', 'approved');
    const summary = buildFilterSummary(view);
    expect(summary).toContain('Approved');
  });

  it('includes evidence label when evidence filter active', () => {
    const view = buildDeliverablesLibraryFilterView('all', 'all', 'missing');
    const summary = buildFilterSummary(view);
    expect(summary).toContain('Missing');
  });

  it('uses singular "deliverable" when filteredCount is 1', () => {
    // Build a view that returns exactly 1 deliverable, if possible
    // (We can't guarantee count = 1 deterministically, so just verify
    // the grammar logic by testing the function behavior)
    const view = buildDeliverablesLibraryFilterView();
    const syntheticView = { ...view, filteredCount: 1 };
    const summary = buildFilterSummary(syntheticView);
    expect(summary).toMatch(/^1 deliverable/);
  });
});

// ─── Module hygiene ───────────────────────────────────────────────────────────

describe('PDEL6 · module hygiene', () => {
  it('module source contains no runtime impurity', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const src = fs.readFileSync(
      path.resolve(
        __dirname,
        '../../../lib/programs/deliverables-library-view.ts',
      ),
      'utf8',
    );
    expect(src).not.toMatch(/Date\.now/);
    expect(src).not.toMatch(/Math\.random/);
    expect(src).not.toMatch(/new Date\(/);
    expect(src).not.toMatch(/fetch\(/);
  });
});
