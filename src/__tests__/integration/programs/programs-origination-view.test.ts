// PROG-E-VIEW · Origination view model integration tests.
//
// Pure TypeScript + Jest. No jsdom, no React, no model calls.
// Verifies the origination wizard view model is correctly shaped,
// deterministic, and hygiene-clean.

import {
  buildOriginationViewModel,
  getOriginationStep,
  isRequiredOnStep,
  type OriginationStep,
} from '@/lib/programs/origination-view';

describe('PROG-E-VIEW · buildOriginationViewModel', () => {
  const vm = buildOriginationViewModel();

  // ----------------------------------------------------------------
  // Shape
  // ----------------------------------------------------------------

  it('has exactly 3 steps', () => {
    expect(vm.steps).toHaveLength(3);
    expect(vm.totalSteps).toBe(3);
  });

  it('steps are in the canonical slug order', () => {
    expect(vm.steps.map((s) => s.slug)).toEqual([
      'opportunity',
      'success',
      'owners',
    ]);
  });

  it('steps carry the correct 1-based n values', () => {
    expect(vm.steps.map((s) => s.n)).toEqual([1, 2, 3]);
  });

  it.each(Array.from(vm.steps.entries()))(
    'step[%i] has a non-empty label',
    (_idx: number, step: OriginationStep) => {
      expect(step.label.trim().length).toBeGreaterThan(0);
    },
  );

  it.each(Array.from(vm.steps.entries()))(
    'step[%i] has a non-empty stewardHint',
    (_idx: number, step: OriginationStep) => {
      expect(step.stewardHint.trim().length).toBeGreaterThan(0);
    },
  );

  it.each(Array.from(vm.steps.entries()))(
    'step[%i] has at least one requiredField',
    (_idx: number, step: OriginationStep) => {
      expect(step.requiredFields.length).toBeGreaterThanOrEqual(1);
    },
  );

  // ----------------------------------------------------------------
  // Required field contract
  // ----------------------------------------------------------------

  it('step 1 requires programName and problemStatement', () => {
    const s1 = vm.steps.find((s) => s.n === 1)!;
    expect(s1.requiredFields).toContain('programName');
    expect(s1.requiredFields).toContain('problemStatement');
  });

  it('step 2 requires targetOutcome and timelineHorizon', () => {
    const s2 = vm.steps.find((s) => s.n === 2)!;
    expect(s2.requiredFields).toContain('targetOutcome');
    expect(s2.requiredFields).toContain('timelineHorizon');
  });

  it('step 3 requires sponsorName and leadName', () => {
    const s3 = vm.steps.find((s) => s.n === 3)!;
    expect(s3.requiredFields).toContain('sponsorName');
    expect(s3.requiredFields).toContain('leadName');
  });

  // ----------------------------------------------------------------
  // Submit redirect
  // ----------------------------------------------------------------

  it('submitRedirectPath is the CDP flagship demo anchor', () => {
    expect(vm.submitRedirectPath).toBe('/programs/apx-cdp-2026');
  });

  it('submitRedirectPath starts with /programs/', () => {
    expect(vm.submitRedirectPath.startsWith('/programs/')).toBe(true);
  });

  // ----------------------------------------------------------------
  // Copy strings
  // ----------------------------------------------------------------

  it('stewardOpenerCopy is non-empty', () => {
    expect(vm.stewardOpenerCopy.trim().length).toBeGreaterThan(0);
  });

  it('stewardSubmitCopy is non-empty', () => {
    expect(vm.stewardSubmitCopy.trim().length).toBeGreaterThan(0);
  });

  it('stewardOpenerCopy mentions Steward', () => {
    expect(vm.stewardOpenerCopy).toContain('Steward');
  });

  it('stewardSubmitCopy mentions Nexus', () => {
    expect(vm.stewardSubmitCopy).toContain('Nexus');
  });

  // ----------------------------------------------------------------
  // Determinism
  // ----------------------------------------------------------------

  it('is deterministic across repeated calls', () => {
    const a = buildOriginationViewModel();
    const b = buildOriginationViewModel();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('deterministicSeed is true', () => {
    expect(vm.deterministicSeed).toBe(true);
  });
});

// ----------------------------------------------------------------
// getOriginationStep helper
// ----------------------------------------------------------------

describe('PROG-E-VIEW · getOriginationStep', () => {
  it('returns step 1 for n=1', () => {
    const s = getOriginationStep(1);
    expect(s.n).toBe(1);
    expect(s.slug).toBe('opportunity');
  });

  it('returns step 2 for n=2', () => {
    const s = getOriginationStep(2);
    expect(s.n).toBe(2);
    expect(s.slug).toBe('success');
  });

  it('returns step 3 for n=3', () => {
    const s = getOriginationStep(3);
    expect(s.n).toBe(3);
    expect(s.slug).toBe('owners');
  });
});

// ----------------------------------------------------------------
// isRequiredOnStep helper
// ----------------------------------------------------------------

describe('PROG-E-VIEW · isRequiredOnStep', () => {
  it('programName is required on step 1', () => {
    expect(isRequiredOnStep('programName', 1)).toBe(true);
  });

  it('programName is not required on step 2', () => {
    expect(isRequiredOnStep('programName', 2)).toBe(false);
  });

  it('sponsorName is required on step 3', () => {
    expect(isRequiredOnStep('sponsorName', 3)).toBe(true);
  });

  it('unknownField is not required on any step', () => {
    expect(isRequiredOnStep('unknownField', 1)).toBe(false);
    expect(isRequiredOnStep('unknownField', 2)).toBe(false);
    expect(isRequiredOnStep('unknownField', 3)).toBe(false);
  });
});

// ----------------------------------------------------------------
// Module hygiene
// ----------------------------------------------------------------

describe('PROG-E-VIEW · module hygiene', () => {
  it('module source contains no runtime impurity', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const src = fs.readFileSync(
      path.resolve(
        __dirname,
        '../../../lib/programs/origination-view.ts',
      ),
      'utf8',
    );
    expect(src).not.toMatch(/Date\.now/);
    expect(src).not.toMatch(/Math\.random/);
    expect(src).not.toMatch(/new Date\(/);
    expect(src).not.toMatch(/fetch\(/);
  });
});
