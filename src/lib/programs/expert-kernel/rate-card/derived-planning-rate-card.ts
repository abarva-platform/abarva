// Moves Expert Kernel — researched planning rate card, derived for the
// effort-estimator.
//
// The effort-estimator's should-cost engine consumes a `RoleRateCard[]` —
// fully-loaded ANNUAL cost per `ShouldCostRole`, split onshore / offshore.
// The researched benchmark card (`benchmark-rate-card.ts`) is, instead,
// blended HOURLY USD bands across 3 dimensions (archetype × location ×
// specialization). This module is the single, documented bridge between the
// two: it projects the benchmark card onto the six should-cost roles so the
// estimator's effort/cost numbers rest on researched market bands rather than
// a hand-set placeholder.
//
// The projection is deliberately narrow and honest:
//   - Archetype is fixed to `us_tier1` — the kernel's planning audience is a
//     US enterprise scoping a Tier-1-class delivery partner. A client with a
//     different delivery model overrides the whole card (rate-card discipline).
//   - Each should-cost role maps to one benchmark work-specialization.
//   - Onshore annual = onshore band midpoint; offshore annual = the firm's own
//     GDN (`offshore`) band midpoint; both × annual billable hours.
//   - Where an offshore cell is genuinely not populated (the benchmark card
//     does not invent cells that do not occur in practice — program management
//     is not sold as a standalone offshore line), we fall back to a documented
//     proxy cell rather than fabricating a rate.
//
// Pure data module: deterministic, no I/O.

import type {
  RoleRateCard,
  ShouldCostRole,
} from '@/lib/source/should-cost/should-cost-model';
import {
  BENCHMARK_RATE_CARD,
  lookupBenchmarkRate,
  type RateCard,
  type SiArchetype,
  type WorkSpecialization,
} from './benchmark-rate-card';

/**
 * Annual billable hours for one fully-utilised FTE. The standard 2,080-hour
 * work-year; converts an hourly benchmark band into a fully-loaded annual
 * rate. (Utilisation drag is already carried by the estimator's conservative
 * multiplier, so this stays the gross work-year.)
 */
export const ANNUAL_BILLABLE_HOURS = 2080;

/** The archetype the kernel's planning default is projected from. */
export const PLANNING_ARCHETYPE: SiArchetype = 'us_tier1';

/**
 * How each should-cost delivery role maps onto a benchmark work
 * specialization. A role is a seniority/function label; a specialization is a
 * craft — this is the deliberate, reviewable bridge between the two.
 */
export const ROLE_TO_SPECIALIZATION: Record<ShouldCostRole, WorkSpecialization> = {
  engagement_lead: 'program_management',
  solution_architect: 'solution_architecture',
  senior_engineer: 'ai_ml_engineering',
  engineer: 'integration',
  analyst: 'data_engineering',
  project_manager: 'program_management',
};

/**
 * Offshore-cell fallbacks. The benchmark card honestly omits cells that do not
 * occur as a standalone commercial line — notably offshore `program_management`
 * (program leadership is sold onshore/onsite, not as an offshore line item).
 * Where the primary specialization has no offshore cell we use a documented
 * proxy of comparable seniority rather than inventing a rate.
 */
const OFFSHORE_SPECIALIZATION_FALLBACK: Partial<
  Record<WorkSpecialization, WorkSpecialization>
> = {
  // No offshore program-management line — proxy to the offshore architecture
  // cell (a comparably senior GDN role).
  program_management: 'solution_architecture',
};

/** Round to whole dollars — annual rates are never quoted to the cent. */
function toAnnual(hourlyPoint: number): number {
  return Math.round(hourlyPoint * ANNUAL_BILLABLE_HOURS);
}

/**
 * Derive the kernel's planning `RoleRateCard[]` from a researched benchmark
 * card. Pure and deterministic. Throws if a required onshore cell is missing —
 * a missing onshore cell is a real gap in the benchmark card, not something to
 * paper over.
 */
export function deriveRoleRateCard(
  card: RateCard = BENCHMARK_RATE_CARD,
  archetype: SiArchetype = PLANNING_ARCHETYPE,
): RoleRateCard[] {
  const roles = Object.keys(ROLE_TO_SPECIALIZATION) as ShouldCostRole[];

  return roles.map((role) => {
    const specialization = ROLE_TO_SPECIALIZATION[role];

    const onshore = lookupBenchmarkRate(
      archetype,
      'onshore',
      specialization,
      card,
    );
    if (!onshore) {
      throw new Error(
        `Benchmark rate card has no onshore cell for ${archetype}/` +
          `${specialization} — cannot derive the '${role}' planning rate.`,
      );
    }

    // Offshore: the firm's own GDN. Fall back to a documented proxy cell when
    // the primary specialization is not sold as an offshore line.
    let offshore = lookupBenchmarkRate(
      archetype,
      'offshore',
      specialization,
      card,
    );
    if (!offshore) {
      const proxy = OFFSHORE_SPECIALIZATION_FALLBACK[specialization];
      if (proxy) {
        offshore = lookupBenchmarkRate(archetype, 'offshore', proxy, card);
      }
    }
    if (!offshore) {
      throw new Error(
        `Benchmark rate card has no offshore cell (or proxy) for ` +
          `${archetype}/${specialization} — cannot derive the '${role}' ` +
          `offshore planning rate.`,
      );
    }

    return {
      role,
      onshoreAnnualRate: toAnnual(onshore.band.pointUsdPerHour),
      offshoreAnnualRate: toAnnual(offshore.band.pointUsdPerHour),
    };
  });
}

/**
 * The researched planning rate card, projected onto the six should-cost roles.
 * Computed once at module load — the benchmark card is immutable.
 */
export const RESEARCHED_PLANNING_RATES: RoleRateCard[] = deriveRoleRateCard();
