// Researched planning rate card — derivation tests.
//
// These assert the bridge from the 3-D benchmark card to the should-cost
// `RoleRateCard[]` is honest and well-formed: every should-cost role is
// covered, rates are positive, offshore is cheaper than onshore, and the
// derivation throws (never fabricates) on a genuine benchmark gap.

import {
  RESEARCHED_PLANNING_RATES,
  ANNUAL_BILLABLE_HOURS,
  ROLE_TO_SPECIALIZATION,
  PLANNING_ARCHETYPE,
  deriveRoleRateCard,
} from '../derived-planning-rate-card';
import { BENCHMARK_RATE_CARD, lookupBenchmarkRate } from '../benchmark-rate-card';
import { SHOULD_COST_ROLES } from '@/lib/source/should-cost/should-cost-model';

describe('derived planning rate card — coverage', () => {
  it('covers every should-cost role exactly once', () => {
    const roles = RESEARCHED_PLANNING_RATES.map((r) => r.role).sort();
    expect(roles).toEqual([...SHOULD_COST_ROLES].sort());
    expect(roles.length).toBeGreaterThanOrEqual(20);
  });

  it('maps every should-cost role to a benchmark specialization', () => {
    for (const role of SHOULD_COST_ROLES) {
      expect(ROLE_TO_SPECIALIZATION[role]).toBeTruthy();
    }
  });
});

describe('derived planning rate card — band integrity', () => {
  it('every rate is a positive fully-loaded annual figure', () => {
    for (const r of RESEARCHED_PLANNING_RATES) {
      expect(r.onshoreAnnualRate).toBeGreaterThan(0);
      expect(r.offshoreAnnualRate).toBeGreaterThan(0);
    }
  });

  it('offshore delivery is cheaper than onshore in every role', () => {
    for (const r of RESEARCHED_PLANNING_RATES) {
      expect(r.offshoreAnnualRate).toBeLessThan(r.onshoreAnnualRate);
    }
  });

  it('annual rate is the hourly benchmark midpoint times the work-year', () => {
    // solution_architect maps to solution_architecture — verify the math.
    const cell = lookupBenchmarkRate(
      PLANNING_ARCHETYPE,
      'onshore',
      'solution_architecture',
    );
    expect(cell).not.toBeNull();
    const arch = RESEARCHED_PLANNING_RATES.find(
      (r) => r.role === 'solution_architect',
    );
    expect(arch?.onshoreAnnualRate).toBe(
      Math.round(cell!.band.pointUsdPerHour * ANNUAL_BILLABLE_HOURS),
    );
  });
});

describe('derived planning rate card — honesty', () => {
  it('is deterministic — same card in, same rates out', () => {
    expect(deriveRoleRateCard()).toEqual(deriveRoleRateCard());
    expect(deriveRoleRateCard()).toEqual(RESEARCHED_PLANNING_RATES);
  });

  it('throws on a benchmark card missing a required onshore cell', () => {
    // A stripped card with no onshore cells at all forces a real gap.
    const stripped = {
      ...BENCHMARK_RATE_CARD,
      entries: BENCHMARK_RATE_CARD.entries.filter(
        (e) => e.location !== 'onshore',
      ),
    };
    expect(() => deriveRoleRateCard(stripped)).toThrow(/onshore cell/);
  });
});
