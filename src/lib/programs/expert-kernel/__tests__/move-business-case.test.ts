// Run the expert kernel for a REAL, originated Move — pack-derived inputs.
//
// `buildMoveBusinessCase` is the keystone that makes the expert kernel run for
// a Move originated through the app, not just the three hand-authored
// reference cases. These tests pin its discipline:
//
//  - it runs end-to-end for a representative Move in each of the three
//    verticals, producing a real `compileBusinessCase` result;
//  - a Move whose recorded metrics are sparse yields precise seed gaps and a
//    non-fabricated verdict — never a fake `fund`;
//  - a Move with no resolvable function returns the honest unbound result
//    without throwing.
//
// The Move fixtures are minimal — `industry_code`, `charter.functionPackKey`,
// and a `baseline_metrics` array — exactly the shape the binding and the
// kernel derivation read from an `engagements` row.

import {
  buildMoveBusinessCase,
  type MoveBusinessCaseInput,
} from '../../move-business-case';
import { CHARTER_FUNCTION_PACK_KEY } from '../../function-identity';

// ─────────────────────────────────────────────────────────────────────────────
// Minimal Move fixtures — one per vertical
// ─────────────────────────────────────────────────────────────────────────────

/** A retail Move bound to the customer-care Function Pack, with some metrics. */
const retailMove: MoveBusinessCaseInput = {
  name: 'Contact Centre Deflection & Assist',
  industry_code: 'RETAIL',
  charter: { [CHARTER_FUNCTION_PACK_KEY]: 'customer_care' },
  baseline_metrics: [
    {
      metric_name: 'First-contact resolution (FCR)',
      value: 71,
      unit: '% of contacts resolved on the first interaction',
      source: 'Service Cloud re-contact analysis',
      as_of: '2026-05-01',
    },
    {
      metric_name: 'Average handle time (AHT)',
      value: 8.4,
      unit: 'minutes per agent-handled contact',
      source: 'Contact-centre platform',
      as_of: '2026-05-01',
    },
  ],
};

/** A healthcare-provider Move bound to the patient-access Function Pack. */
const healthcareMove: MoveBusinessCaseInput = {
  name: 'Patient Access Modernisation',
  industry_code: 'HEALTHCARE_IDN',
  charter: {
    [CHARTER_FUNCTION_PACK_KEY]: 'patient_access_engagement_experience',
  },
  baseline_metrics: [
    {
      metric_name: 'No-show and same-day cancellation rate',
      value: 14,
      unit: '%',
      source: 'Scheduling system',
      as_of: '2026-04-20',
    },
  ],
};

/** A financial-services Move bound to the customer-servicing Function Pack. */
const finservMove: MoveBusinessCaseInput = {
  name: 'Servicing Contact-Centre AI',
  industry_code: 'FINSERV',
  charter: {
    [CHARTER_FUNCTION_PACK_KEY]: 'customer_servicing_contact_center',
  },
  baseline_metrics: [
    {
      metric_name: 'First-contact resolution (FCR)',
      value: 66,
      unit: '%',
      source: 'CRM ticketing system',
      as_of: '2026-05-10',
    },
    {
      metric_name: 'Cost per contact',
      value: 7.1,
      unit: 'USD per contact',
      source: 'Contact-centre cost ledger',
      as_of: '2026-05-10',
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// End-to-end across the three verticals
// ─────────────────────────────────────────────────────────────────────────────

describe('buildMoveBusinessCase — end-to-end across the three verticals', () => {
  const cases: ReadonlyArray<readonly [string, MoveBusinessCaseInput]> = [
    ['retail', retailMove],
    ['healthcare-provider', healthcareMove],
    ['financial-services', finservMove],
  ];

  for (const [vertical, move] of cases) {
    describe(`${vertical} Move`, () => {
      const result = buildMoveBusinessCase(move);

      it('binds a curated Function Pack and runs the kernel', () => {
        expect(result.bound).toBe(true);
        expect(result.skeleton).not.toBeNull();
        expect(result.binding.bound).toBe(true);
        expect(result.unboundReason).toBe('');
      });

      it('produces a real compileBusinessCase skeleton', () => {
        const sk = result.skeleton!;
        expect(sk.moveName).toBe(move.name);
        // All eight required business-case elements are present.
        expect(sk.baseline.metrics.length).toBeGreaterThan(0);
        expect(sk.valueRange).toBeDefined();
        expect(sk.effortRange).toBeDefined();
        expect(sk.assumptions.assumptions.length).toBeGreaterThan(0);
        expect(sk.sensitivity).toBeDefined();
        expect(sk.killCriteria.length).toBeGreaterThan(0);
        expect(['fund', 'shape', 'kill']).toContain(sk.recommendation);
        expect(sk.towerHandoff.length).toBeGreaterThan(0);
        expect(sk.critic).toBeDefined();
      });

      it('fills recorded metrics from the Move and seed-gaps the rest', () => {
        const sk = result.skeleton!;
        // The Move records a subset of the pack metrics — they appear as
        // recorded baseline values, the rest as precise seed gaps.
        expect(sk.baseline.recordedMetrics.length).toBeGreaterThan(0);
        expect(sk.baseline.seedGaps.length).toBeGreaterThan(0);
        for (const gap of sk.baseline.seedGaps) {
          // A seed gap is never a fabricated value and always self-describing.
          expect(gap.value).toBeNull();
          expect(gap.seedGapReason && gap.seedGapReason.length).toBeGreaterThan(
            0,
          );
        }
      });

      it('builds the value forecast from the pack and applies a haircut', () => {
        const sk = result.skeleton!;
        // The forecast passes through the mandatory haircut model.
        expect(sk.valueRange.point).toBeGreaterThan(0);
        // The value rests on curated planning benchmarks — never claimed as a
        // monetisable dollar return.
        expect(sk.economics.monetisable).toBe(false);
      });

      it('costs the effort as a planning range, not a quote', () => {
        const sk = result.skeleton!;
        expect(sk.effort.workstreams.length).toBe(8);
        expect(sk.effortRange.low).toBeLessThanOrEqual(sk.effortRange.point);
        expect(sk.effortRange.point).toBeLessThanOrEqual(sk.effortRange.high);
        // The estimate names a planning-estimate (not a quote) assumption.
        const planningAssumption = sk.assumptions.assumptions.find(
          (a) => a.key === 'effort_is_planning_estimate',
        );
        expect(planningAssumption).toBeDefined();
      });

      it('hands the operating metrics to the Tower with honest readiness', () => {
        const sk = result.skeleton!;
        // Every Tower metric carries a readiness note; a seed-gapped metric is
        // flagged as not measurable, never given a fabricated target.
        for (const handoff of sk.towerHandoff) {
          expect(handoff.readinessNote.length).toBeGreaterThan(0);
          expect(handoff.targetValue).toBeNull();
        }
        const seedGapHandoffs = sk.towerHandoff.filter(
          (h) => h.baselineValue === null,
        );
        expect(seedGapHandoffs.length).toBeGreaterThan(0);
        for (const h of seedGapHandoffs) {
          expect(h.readinessNote).toContain('SEED GAP');
        }
      });

      it('records derivation notes that surface the planning-proxy reliance', () => {
        expect(result.derivationNotes.length).toBeGreaterThan(0);
        // The notes name the value-as-proxy honesty explicitly.
        expect(
          result.derivationNotes.some((n) => /proxy/i.test(n)),
        ).toBe(true);
      });

      it('returns the binding so a renderer can reuse the inherited outline', () => {
        expect(result.binding.deliverableOutline.length).toBeGreaterThan(0);
        expect(result.binding.expectedMetrics.length).toBeGreaterThan(0);
      });
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Sparse-data Move — seed gaps + a non-fabricated verdict
// ─────────────────────────────────────────────────────────────────────────────

describe('buildMoveBusinessCase — a Move with sparse recorded metrics', () => {
  // A real Move that has barely been instrumented — no recorded metrics at all.
  const sparseMove: MoveBusinessCaseInput = {
    name: 'Thinly-Instrumented Care Move',
    industry_code: 'RETAIL',
    charter: { [CHARTER_FUNCTION_PACK_KEY]: 'customer_care' },
    baseline_metrics: [],
  };
  const result = buildMoveBusinessCase(sparseMove);

  it('still binds and runs the kernel', () => {
    expect(result.bound).toBe(true);
    expect(result.skeleton).not.toBeNull();
  });

  it('turns every expected metric into a precise seed gap', () => {
    const sk = result.skeleton!;
    expect(sk.baseline.recordedMetrics.length).toBe(0);
    expect(sk.baseline.seedGaps.length).toBe(sk.baseline.metrics.length);
    expect(sk.baseline.coverage).toBe(0);
  });

  it('does not fabricate a fund verdict on thin data', () => {
    const sk = result.skeleton!;
    // With monetisation blocked and the baseline empty, the critic must raise
    // a blocker and the recommendation must NOT be a fake `fund`.
    expect(sk.critic.hasBlocker).toBe(true);
    expect(sk.recommendation).not.toBe('fund');
    expect(['shape', 'kill']).toContain(sk.recommendation);
  });

  it('blocks a claimable payback when monetisation rests on a seed gap', () => {
    const sk = result.skeleton!;
    expect(sk.economics.monetisable).toBe(false);
    // A blocked monetisation surfaces an explicit kill criterion.
    expect(
      sk.killCriteria.some((k) => k.code === 'kill_monetisation_unresolved'),
    ).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Unbound Move — honest result, no throw
// ─────────────────────────────────────────────────────────────────────────────

describe('buildMoveBusinessCase — a Move with no resolvable function', () => {
  it('returns the honest unbound result for an unknown industry code', () => {
    const move: MoveBusinessCaseInput = {
      name: 'Unknown-Industry Move',
      industry_code: 'NOT_A_REAL_CODE',
      charter: { [CHARTER_FUNCTION_PACK_KEY]: 'customer_care' },
      baseline_metrics: [],
    };
    const result = buildMoveBusinessCase(move);
    expect(result.bound).toBe(false);
    expect(result.skeleton).toBeNull();
    expect(result.unboundReason.length).toBeGreaterThan(0);
  });

  it('returns the honest unbound result for a charter with no function key', () => {
    const move: MoveBusinessCaseInput = {
      name: 'No-Charter-Function Move',
      industry_code: 'RETAIL',
      charter: {},
      baseline_metrics: [],
    };
    const result = buildMoveBusinessCase(move);
    expect(result.bound).toBe(false);
    expect(result.skeleton).toBeNull();
    expect(result.unboundReason.length).toBeGreaterThan(0);
  });

  it('returns the honest unbound result for an uncatalogued function key', () => {
    const move: MoveBusinessCaseInput = {
      name: 'Uncatalogued-Function Move',
      industry_code: 'RETAIL',
      charter: { [CHARTER_FUNCTION_PACK_KEY]: 'not_a_real_function' },
      baseline_metrics: [],
    };
    const result = buildMoveBusinessCase(move);
    expect(result.bound).toBe(false);
    expect(result.skeleton).toBeNull();
    expect(result.unboundReason.length).toBeGreaterThan(0);
  });

  it('never throws — the unbound path is a return, not an exception', () => {
    expect(() =>
      buildMoveBusinessCase({ industry_code: null, charter: null }),
    ).not.toThrow();
  });

  it('is deterministic — same Move yields the same result', () => {
    const a = buildMoveBusinessCase(retailMove);
    const b = buildMoveBusinessCase(retailMove);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
