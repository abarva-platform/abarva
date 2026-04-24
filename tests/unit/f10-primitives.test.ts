// File 10 P0 primitives smoke tests · Cycle 3 Wave 1
//
// Each primitive is a visual component; these tests validate the
// metadata/contract surface rather than rendered DOM (React Testing
// Library isn't wired in this repo — unit-level assertions on exports).

describe('F10 primitives export contracts', () => {
  test('ConfidenceQualifier module exports the component', async () => {
    const mod = await import('@/components/agent/ConfidenceQualifier');
    expect(typeof mod.ConfidenceQualifier).toBe('function');
  });

  test('GateReadinessBanner module exports component + state types', async () => {
    const mod = await import('@/components/workflow/GateReadinessBanner');
    expect(typeof mod.GateReadinessBanner).toBe('function');
  });

  test('ErrorStateCard module exports the component', async () => {
    const mod = await import('@/components/system/ErrorStateCard');
    expect(typeof mod.ErrorStateCard).toBe('function');
  });

  test('SkeletonScreen module exports three shape helpers', async () => {
    const mod = await import('@/components/system/SkeletonScreen');
    expect(typeof mod.SkeletonLine).toBe('function');
    expect(typeof mod.SkeletonCard).toBe('function');
    expect(typeof mod.SkeletonGrid).toBe('function');
  });

  test('PhaseGateIndicator module exports the component', async () => {
    const mod = await import('@/components/workflow/PhaseGateIndicator');
    expect(typeof mod.PhaseGateIndicator).toBe('function');
  });
});
