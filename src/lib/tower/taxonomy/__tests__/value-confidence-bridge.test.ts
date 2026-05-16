// Tower value-confidence bridge — unit tests.
//
// Purely deterministic. No DOM, no model calls, no network, no clock.
//
// Coverage:
//
// - Every 7-state readiness value maps to exactly one 3-rung value.
// - The forward mapping is total (every readiness state is keyed).
// - The mapping is deterministic — identical input, identical output.
// - The documented groupings are exactly as declared (including the
//   deliberate `declined` -> `projected` rollup).
// - The inverse rung -> minimum readiness state mapping is total and
//   round-trips: the minimum state of a rung rolls back up to that rung.

import {
  VALUE_READINESS_STATES,
  type ValueReadinessState,
} from '@/lib/tower/ai-value-outcome-ledger';
import { VALUE_RUNGS } from '@/lib/tower/taxonomy/outcome-taxonomy';
import {
  READINESS_STATE_TO_RUNG,
  RUNG_TO_MINIMUM_READINESS_STATE,
  isBridgeTotal,
  readinessStateToRung,
  rungToMinimumReadinessState,
} from '@/lib/tower/taxonomy/value-confidence-bridge';

describe('value-confidence-bridge · forward rollup', () => {
  it('maps every readiness state to exactly one rung', () => {
    for (const state of VALUE_READINESS_STATES) {
      const rung = readinessStateToRung(state);
      expect(VALUE_RUNGS).toContain(rung);
    }
  });

  it('is total — every readiness state has a mapping', () => {
    expect(Object.keys(READINESS_STATE_TO_RUNG).sort()).toEqual(
      [...VALUE_READINESS_STATES].sort(),
    );
    expect(isBridgeTotal()).toBe(true);
  });

  it('is deterministic — identical input yields identical output', () => {
    for (const state of VALUE_READINESS_STATES) {
      expect(readinessStateToRung(state)).toBe(readinessStateToRung(state));
    }
  });

  it('rolls up to the declared rung for each readiness state', () => {
    const expected: Record<ValueReadinessState, string> = {
      projected_only: 'projected',
      declined: 'projected',
      baseline_pending: 'tracked',
      baseline_set: 'tracked',
      in_pilot_measurement: 'tracked',
      measured_in_pilot: 'verified',
      measured_in_production: 'verified',
    };
    for (const state of VALUE_READINESS_STATES) {
      expect(readinessStateToRung(state)).toBe(expected[state]);
    }
  });

  it('rolls a declined claim up to the weakest rung, never verified', () => {
    expect(readinessStateToRung('declined')).toBe('projected');
  });

  it('treats only measured states as verified', () => {
    const verified = VALUE_READINESS_STATES.filter(
      (s) => readinessStateToRung(s) === 'verified',
    );
    expect(verified.sort()).toEqual(
      ['measured_in_pilot', 'measured_in_production'].sort(),
    );
  });
});

describe('value-confidence-bridge · inverse minimum state', () => {
  it('maps every rung to a valid readiness state', () => {
    for (const rung of VALUE_RUNGS) {
      const state = rungToMinimumReadinessState(rung);
      expect(VALUE_READINESS_STATES).toContain(state);
    }
  });

  it('is total — every rung has a minimum-state mapping', () => {
    expect(Object.keys(RUNG_TO_MINIMUM_READINESS_STATE).sort()).toEqual(
      [...VALUE_RUNGS].sort(),
    );
  });

  it('round-trips: a rung minimum state rolls back up to that rung', () => {
    for (const rung of VALUE_RUNGS) {
      expect(readinessStateToRung(rungToMinimumReadinessState(rung))).toBe(
        rung,
      );
    }
  });
});
