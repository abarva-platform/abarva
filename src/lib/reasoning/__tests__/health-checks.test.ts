/**
 * Reasoning health checks tests.
 *
 * Deterministic — exercises the canonical demo fixtures (AMS + APX-CDP) and
 * asserts the public surface of `health-checks.ts`. No I/O, no randomness.
 */

import {
  runAllHealthChecks,
  summarizeLayers,
  checkSourceInstanceResolves,
  checkProgramInstanceResolves,
  checkSourcePatternResolves,
  checkProgramPatternResolves,
  checkSourceSynthesisContext,
  checkProgramSynthesisContext,
  checkCascadeWiring,
  checkLifecyclePatternCatalogue,
} from '@/lib/reasoning/health-checks';

describe('reasoning health checks · individual probes', () => {
  it('source-instance-resolves passes', () => {
    const r = checkSourceInstanceResolves();
    expect(r.name).toBe('source-instance-resolves');
    expect(r.status).toBe('pass');
    expect(r.elapsedMs).toBeGreaterThanOrEqual(0);
  });

  it('program-instance-resolves passes', () => {
    const r = checkProgramInstanceResolves();
    expect(r.status).toBe('pass');
  });

  it('source-pattern-resolves passes', () => {
    const r = checkSourcePatternResolves();
    expect(r.status).toBe('pass');
  });

  it('program-pattern-resolves passes', () => {
    const r = checkProgramPatternResolves();
    expect(r.status).toBe('pass');
  });

  it('source-synthesis-context passes and reports gate/citation counts', () => {
    const r = checkSourceSynthesisContext();
    expect(r.status).toBe('pass');
    expect(r.detail).toMatch(/gates=\d+/);
    expect(r.detail).toMatch(/citations=\d+/);
  });

  it('program-synthesis-context passes and reports gate/citation counts', () => {
    const r = checkProgramSynthesisContext();
    expect(r.status).toBe('pass');
    expect(r.detail).toMatch(/gates=\d+/);
  });

  it('cascade-source-to-program passes (AMS → APX-CDP wiring)', () => {
    const r = checkCascadeWiring();
    expect(r.status).toBe('pass');
  });

  it('lifecycle-pattern-catalogue passes with non-zero source/program counts', () => {
    const r = checkLifecyclePatternCatalogue();
    expect(r.status).toBe('pass');
    expect(r.detail).toMatch(/total=\d+/);
  });
});

describe('summarizeLayers', () => {
  it('returns counts that match the live catalogues', () => {
    const layers = summarizeLayers();
    expect(layers.lifecyclePatternCount).toBeGreaterThan(0);
    expect(layers.sourceInstanceCount).toBeGreaterThan(0);
    expect(layers.programInstanceCount).toBeGreaterThan(0);
    expect(layers.telemetryEventCount).toBeGreaterThanOrEqual(0);
    expect(layers.resolvedContradictionCount).toBeGreaterThanOrEqual(0);
    expect(layers.ingestedEvidenceItems).toBeGreaterThanOrEqual(0);
  });
});

describe('runAllHealthChecks', () => {
  const report = runAllHealthChecks();

  it('returns ok=true with the demo fixtures', () => {
    expect(report.ok).toBe(true);
  });

  it('every check has a non-empty name and a pass status', () => {
    expect(report.checks.length).toBeGreaterThanOrEqual(8);
    for (const c of report.checks) {
      expect(typeof c.name).toBe('string');
      expect(c.name.length).toBeGreaterThan(0);
      expect(c.status).toBe('pass');
      expect(c.elapsedMs).toBeGreaterThanOrEqual(0);
    }
  });

  it('check names are unique', () => {
    const names = report.checks.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('layers summary is included', () => {
    expect(report.layers).toBeDefined();
    expect(report.layers.lifecyclePatternCount).toBeGreaterThan(0);
  });

  it('computedAt is a valid ISO-8601 timestamp', () => {
    const parsed = Date.parse(report.computedAt);
    expect(Number.isFinite(parsed)).toBe(true);
  });
});
