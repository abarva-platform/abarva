// PROG15 · Complete Future Phase Deliverables — integration test.
//
// Pure TypeScript + Jest. No jsdom, no React, no browser.
// Verifies all 8 future phase deliverables have the required shape.

import {
  getAllFuturePhaseDeliverables,
  getFutureDeliverablesByPhase,
  buildFuturePhaseDeliverablesViewModel,
  type FuturePhaseDeliverable,
} from '@/lib/programs/program-future-phase-deliverables';

describe('PROG15 · Future Phase Deliverables', () => {
  const all = getAllFuturePhaseDeliverables();

  // ----------------------------------------------------------------
  // Count
  // ----------------------------------------------------------------

  it('exports exactly 8 future phase deliverables', () => {
    expect(all).toHaveLength(8);
  });

  // ----------------------------------------------------------------
  // Required string fields — non-empty
  // ----------------------------------------------------------------

  it.each(Array.from(all.entries()))(
    'deliverable[%i] has a non-empty title',
    (_idx: number, d: FuturePhaseDeliverable) => {
      expect(typeof d.title).toBe('string');
      expect(d.title.trim().length).toBeGreaterThan(0);
    },
  );

  it.each(Array.from(all.entries()))(
    'deliverable[%i] has a non-empty description',
    (_idx: number, d: FuturePhaseDeliverable) => {
      expect(typeof d.description).toBe('string');
      expect(d.description.trim().length).toBeGreaterThan(0);
    },
  );

  it.each(Array.from(all.entries()))(
    'deliverable[%i] has a non-empty missingInput',
    (_idx: number, d: FuturePhaseDeliverable) => {
      expect(typeof d.missingInput).toBe('string');
      expect(d.missingInput.trim().length).toBeGreaterThan(0);
    },
  );

  // ----------------------------------------------------------------
  // Status: must be "draft" or "not_started"
  // ----------------------------------------------------------------

  it.each(Array.from(all.entries()))(
    'deliverable[%i] has status "draft" or "not_started"',
    (_idx: number, d: FuturePhaseDeliverable) => {
      expect(['draft', 'not_started']).toContain(d.status);
    },
  );

  // No future deliverable should be approved
  it('no future phase deliverable has status "approved"', () => {
    // The type does not include "approved", but guard against JS-land leakage.
    const hasApproved = (all as unknown as Array<{ status: string }>).some(
      (d) => d.status === 'approved',
    );
    expect(hasApproved).toBe(false);
  });

  // ----------------------------------------------------------------
  // evidenceState: must be "missing"
  // ----------------------------------------------------------------

  it.each(Array.from(all.entries()))(
    'deliverable[%i] has evidenceState "missing"',
    (_idx: number, d: FuturePhaseDeliverable) => {
      expect(d.evidenceState).toBe('missing');
    },
  );

  // ----------------------------------------------------------------
  // deterministicSeed: must be true
  // ----------------------------------------------------------------

  it.each(Array.from(all.entries()))(
    'deliverable[%i] has deterministicSeed: true',
    (_idx: number, d: FuturePhaseDeliverable) => {
      expect(d.deterministicSeed).toBe(true);
    },
  );

  // ----------------------------------------------------------------
  // Phase labels: correct canonical values
  // ----------------------------------------------------------------

  const validPhases = new Set(['design', 'build', 'activate', 'operate']);

  it.each(Array.from(all.entries()))(
    'deliverable[%i] has a valid phase label',
    (_idx: number, d: FuturePhaseDeliverable) => {
      expect(validPhases.has(d.phase)).toBe(true);
    },
  );

  // Each phase must have exactly 2 deliverables
  it('has exactly 2 deliverables in the design phase', () => {
    expect(getFutureDeliverablesByPhase('design')).toHaveLength(2);
  });

  it('has exactly 2 deliverables in the build phase', () => {
    expect(getFutureDeliverablesByPhase('build')).toHaveLength(2);
  });

  it('has exactly 2 deliverables in the activate phase', () => {
    expect(getFutureDeliverablesByPhase('activate')).toHaveLength(2);
  });

  it('has exactly 2 deliverables in the operate phase', () => {
    expect(getFutureDeliverablesByPhase('operate')).toHaveLength(2);
  });

  // ----------------------------------------------------------------
  // View model composition
  // ----------------------------------------------------------------

  describe('buildFuturePhaseDeliverablesViewModel', () => {
    const vm = buildFuturePhaseDeliverablesViewModel();

    it('returns totalCount of 8', () => {
      expect(vm.totalCount).toBe(8);
    });

    it('returns default program label when none supplied', () => {
      expect(vm.programLabel).toBe('Apex Retail · CDP Activation');
    });

    it('accepts a custom program label', () => {
      const custom = buildFuturePhaseDeliverablesViewModel({
        programLabel: 'Test Program',
      });
      expect(custom.programLabel).toBe('Test Program');
    });

    it('returns a non-empty caveat', () => {
      expect(vm.caveat.trim().length).toBeGreaterThan(0);
    });

    it('byPhase.design has 2 deliverables', () => {
      expect(vm.byPhase.design).toHaveLength(2);
    });

    it('byPhase.build has 2 deliverables', () => {
      expect(vm.byPhase.build).toHaveLength(2);
    });

    it('byPhase.activate has 2 deliverables', () => {
      expect(vm.byPhase.activate).toHaveLength(2);
    });

    it('byPhase.operate has 2 deliverables', () => {
      expect(vm.byPhase.operate).toHaveLength(2);
    });

    it('is deterministic (two calls produce identical output)', () => {
      const vm1 = buildFuturePhaseDeliverablesViewModel();
      const vm2 = buildFuturePhaseDeliverablesViewModel();
      expect(JSON.stringify(vm1)).toBe(JSON.stringify(vm2));
    });
  });

  // ----------------------------------------------------------------
  // Module hygiene
  // ----------------------------------------------------------------

  it('module source contains no Date.now reference', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const src = fs.readFileSync(
      path.resolve(
        __dirname,
        '../../../lib/programs/program-future-phase-deliverables.ts',
      ),
      'utf8',
    );
    expect(src).not.toMatch(/Date\.now/);
    expect(src).not.toMatch(/Math\.random/);
    expect(src).not.toMatch(/new Date\(/);
    expect(src).not.toMatch(/fetch\(/);
  });
});
