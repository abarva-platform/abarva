// The value-type waterfall groups computed levers by value type, sums each band,
// never collapses to a headline, and surfaces insufficient levers separately.

import { buildValueWaterfall, VALUE_TYPE_ORDER } from '../evaluators/waterfall';
import type { ValueLeverResult } from '../evaluators/types';

function lever(over: Partial<ValueLeverResult>): ValueLeverResult {
  return {
    key: 'K',
    name: 'n',
    valueType: 'protected',
    low: 0,
    high: 0,
    confidence: 'med',
    basis: 'b',
    evidenceRefs: [],
    derivationTrace: 't',
    insufficientEvidence: false,
    missingEvidence: [],
    ...over,
  };
}

describe('buildValueWaterfall', () => {
  it('sums low/high within each value type', () => {
    const wf = buildValueWaterfall([
      lever({ key: 'A', valueType: 'protected', low: 100, high: 200 }),
      lever({ key: 'B', valueType: 'protected', low: 50, high: 90 }),
      lever({ key: 'C', valueType: 'incremental_negotiated', low: 10, high: 20 }),
    ]);
    const protectedBand = wf.bands.find((b) => b.valueType === 'protected')!;
    expect(protectedBand.low).toBe(150);
    expect(protectedBand.high).toBe(290);
    expect(protectedBand.leverKeys.sort()).toEqual(['A', 'B']);
    const inc = wf.bands.find((b) => b.valueType === 'incremental_negotiated')!;
    expect(inc.low).toBe(10);
    expect(inc.high).toBe(20);
  });

  it('emits bands in canonical value-type order', () => {
    const wf = buildValueWaterfall([
      lever({ key: 'A', valueType: 'risk_adjusted', low: 1, high: 2 }),
      lever({ key: 'B', valueType: 'expected_concession', low: 1, high: 2 }),
      lever({ key: 'C', valueType: 'protected', low: 1, high: 2 }),
    ]);
    const order = wf.bands.map((b) => b.valueType);
    // expected_concession (idx 0) before protected (3) before risk_adjusted (4)
    expect(order).toEqual(['expected_concession', 'protected', 'risk_adjusted']);
    for (let i = 1; i < order.length; i++) {
      expect(VALUE_TYPE_ORDER.indexOf(order[i])).toBeGreaterThan(
        VALUE_TYPE_ORDER.indexOf(order[i - 1]),
      );
    }
  });

  it('never produces a single collapsed headline — protected/risk_adjusted stay separate', () => {
    const wf = buildValueWaterfall([
      lever({ key: 'A', valueType: 'protected', low: 100, high: 100 }),
      lever({ key: 'B', valueType: 'risk_adjusted', low: 100, high: 100 }),
      lever({ key: 'C', valueType: 'incremental_negotiated', low: 100, high: 100 }),
    ]);
    expect(wf.bands).toHaveLength(3);
    // No single total field exists; each type is its own band.
    const types = wf.bands.map((b) => b.valueType);
    expect(new Set(types).size).toBe(3);
  });

  it('rolls confidence up to the weakest link within a type', () => {
    const wf = buildValueWaterfall([
      lever({ key: 'A', valueType: 'protected', low: 1, high: 2, confidence: 'high' }),
      lever({ key: 'B', valueType: 'protected', low: 1, high: 2, confidence: 'low' }),
    ]);
    expect(wf.bands[0].confidence).toBe('low');
  });

  it('excludes insufficient levers from bands and lists them separately', () => {
    const wf = buildValueWaterfall([
      lever({ key: 'A', valueType: 'protected', low: 100, high: 200 }),
      lever({ key: 'X', valueType: 'protected', insufficientEvidence: true, missingEvidence: ['f'] }),
    ]);
    const protectedBand = wf.bands.find((b) => b.valueType === 'protected')!;
    expect(protectedBand.leverKeys).toEqual(['A']);
    expect(wf.insufficientLevers).toEqual(['X']);
    expect(wf.computedLeverCount).toBe(1);
  });

  it('a value type with no computed lever produces no band (not $0)', () => {
    const wf = buildValueWaterfall([
      lever({ key: 'A', valueType: 'protected', low: 1, high: 2 }),
    ]);
    expect(wf.bands.map((b) => b.valueType)).toEqual(['protected']);
    expect(wf.bands.find((b) => b.valueType === 'solution_tightening')).toBeUndefined();
  });

  it('empty input yields empty waterfall', () => {
    const wf = buildValueWaterfall([]);
    expect(wf.bands).toEqual([]);
    expect(wf.insufficientLevers).toEqual([]);
    expect(wf.computedLeverCount).toBe(0);
  });

  it('leverKeys across bands sum to computedLeverCount', () => {
    const wf = buildValueWaterfall([
      lever({ key: 'A', valueType: 'protected', low: 1, high: 2 }),
      lever({ key: 'B', valueType: 'risk_adjusted', low: 1, high: 2 }),
      lever({ key: 'C', valueType: 'protected', low: 1, high: 2 }),
    ]);
    const total = wf.bands.reduce((n, b) => n + b.leverKeys.length, 0);
    expect(total).toBe(wf.computedLeverCount);
  });
});
