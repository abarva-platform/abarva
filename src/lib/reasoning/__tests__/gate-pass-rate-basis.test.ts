import {
  describeGatePassRateBasis,
  gatePassRatePct,
  GATE_PASS_RATE_WAIVER_CAVEAT,
  type GatePassRateBasis,
} from '../gate-pass-rate-basis';
import { buildReasoningDashboardSummary } from '../dashboard-summary';

const basis = (over: Partial<GatePassRateBasis> = {}): GatePassRateBasis => ({
  cleared: 57,
  evaluated: 79,
  instances: 12,
  ...over,
});

describe('gatePassRatePct', () => {
  it('pools cleared over evaluated and rounds', () => {
    expect(gatePassRatePct(basis())).toBe(72);
  });

  it('refuses a percentage when nothing was evaluated', () => {
    expect(gatePassRatePct(basis({ cleared: 0, evaluated: 0 }))).toBeNull();
  });

  it('refuses a percentage on a negative denominator rather than inverting the sign', () => {
    expect(gatePassRatePct(basis({ evaluated: -1 }))).toBeNull();
  });
});

describe('describeGatePassRateBasis', () => {
  it('names the set the figure counts, with both counts and the stage scope', () => {
    expect(describeGatePassRateBasis(basis())).toBe(
      '57 of 79 current-stage gates cleared · 12 instances',
    );
  });

  it('never claims an average across instances', () => {
    // The old copy read "avg across all instances" over a pooled ratio. The
    // figure is not an average of per-instance rates, so the word must not
    // come back.
    const text = describeGatePassRateBasis(basis());
    expect(text).not.toMatch(/\bavg\b|\baverage\b/i);
  });

  it('states the stage scope, because the count covers current stages only', () => {
    expect(describeGatePassRateBasis(basis())).toMatch(/current-stage gates?/);
  });

  it('says nothing was evaluated instead of describing an empty set', () => {
    const text = describeGatePassRateBasis(basis({ cleared: 0, evaluated: 0, instances: 0 }));
    expect(text).toBe('no current-stage gates evaluated');
    expect(text).not.toMatch(/\b0 of 0\b/);
  });

  it('singularises one gate and one instance', () => {
    expect(describeGatePassRateBasis({ cleared: 1, evaluated: 1, instances: 1 })).toBe(
      '1 of 1 current-stage gate cleared · 1 instance',
    );
  });

  it('is derived from the counts, not from the rendered percentage', () => {
    // Two bases that round to the same percentage must still describe
    // themselves differently — otherwise the detail is a restatement of the
    // value rather than its basis.
    const a = describeGatePassRateBasis({ cleared: 1, evaluated: 2, instances: 1 });
    const b = describeGatePassRateBasis({ cleared: 2, evaluated: 4, instances: 3 });
    expect(gatePassRatePct({ cleared: 1, evaluated: 2, instances: 1 })).toBe(
      gatePassRatePct({ cleared: 2, evaluated: 4, instances: 3 }),
    );
    expect(a).not.toBe(b);
  });
});

describe('the waiver caveat', () => {
  it('states that a waived gate is inside the numerator', () => {
    expect(GATE_PASS_RATE_WAIVER_CAVEAT).toMatch(/waiver/i);
    expect(GATE_PASS_RATE_WAIVER_CAVEAT).toMatch(/cleared/i);
  });
});

describe('the summary payload carries the basis', () => {
  it('agrees with the percentage it ships alongside', () => {
    const summary = buildReasoningDashboardSummary();
    expect(summary.gatePassRate.evaluated).toBeGreaterThan(0);
    expect(gatePassRatePct(summary.gatePassRate)).toBe(summary.gatePassRatePct);
  });

  it('counts no more cleared than evaluated', () => {
    const summary = buildReasoningDashboardSummary();
    expect(summary.gatePassRate.cleared).toBeLessThanOrEqual(
      summary.gatePassRate.evaluated,
    );
  });

  it('counts at least one instance behind a non-empty denominator', () => {
    const summary = buildReasoningDashboardSummary();
    expect(summary.gatePassRate.instances).toBeGreaterThan(0);
  });
});
