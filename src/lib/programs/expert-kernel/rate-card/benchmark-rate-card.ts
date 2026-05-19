// Moves Expert Kernel — benchmark SI rate card.
//
// A researched, 3-dimensional benchmark rate card for the Moves
// effort-estimator. It is a *planning aid*, not a quote: every band is a
// market-derived range, sourced and confidence-noted, and is always
// overridable by a client-specific rate card.
//
// The three dimensions (see MOVES-DELIVERABLE-AND-BUSINESS-CASE-SPEC.md §5.4):
//   1. SI archetype       — who delivers the work
//   2. Delivery location  — where the team sits (the firm's OWN network)
//   3. Work specialization — what kind of work it is
//
// IMPORTANT modelling note: delivery location is a property of the *firm's own
// delivery network*, not a separate firm. A US Tier-1 (Accenture, Deloitte)
// carries BOTH an onshore US rate and an offshore Global Delivery Network
// rate. "Offshore" is never a separate archetype.
//
// Pure data module: no I/O, no clock, no randomness. Companion doc with
// methodology and citations: docs/strategy/SI-RATE-CARD-BENCHMARK.md
//
// Refresh cadence: review every 2 quarters; IT-services rates drift slowly but
// AI/ML specialization premiums are moving fast (12–18%/yr per 2026 research).
// `RATE_CARD_AS_OF` records the research vintage.

import type { Confidence } from '../types';

// ---------------------------------------------------------------------------
// Dimensions
// ---------------------------------------------------------------------------

/** Who delivers the work. */
export type SiArchetype =
  | 'us_tier1' // Accenture, Deloitte Consulting — global, premium, own GDN
  | 'india_tier1' // TCS, Infosys, Wipro — offshore-heavy, scale, own onshore
  | 'big4_advisory' // EY, KPMG, PwC, Strategy& — advisory-led, regulated work
  | 'boutique_specialist'; // focused AI/data specialists — deep, narrow

/**
 * Where the delivering team sits — a location WITHIN the chosen firm's own
 * delivery network, not a separate vendor.
 */
export type DeliveryLocation =
  | 'onshore' // US-based delivery
  | 'nearshore' // LatAm / Canada — time-zone-aligned
  | 'offshore'; // the firm's own Global Delivery Network (India et al.)

/** The kind of work — rates vary by craft, not just seniority. */
export type WorkSpecialization =
  | 'strategy_advisory' // shaping, business-case, operating-model advice
  | 'solution_architecture' // solution / enterprise / data architecture
  | 'ai_ml_engineering' // model build, MLOps, GenAI engineering
  | 'data_engineering' // pipelines, platform, governance plumbing
  | 'integration' // systems integration, APIs, middleware
  | 'process_redesign' // operating-process / workflow redesign
  | 'change_management' // adoption, training, comms, hypercare
  | 'program_management' // delivery / program / PMO leadership
  | 'run_ams'; // run, application managed services, support

// ---------------------------------------------------------------------------
// Rate band
// ---------------------------------------------------------------------------

/**
 * A blended hourly USD rate band for one archetype × location × specialization
 * cell. `low`/`high` bracket the typical market range; `point` is the
 * planning midpoint. These are blended-team rates (mixed seniority), not a
 * single role's rate.
 */
export interface RateBand {
  /** Low end of the typical market range, USD/hour. */
  lowUsdPerHour: number;
  /** Planning midpoint, USD/hour. */
  pointUsdPerHour: number;
  /** High end of the typical market range, USD/hour. */
  highUsdPerHour: number;
}

/** A single populated rate-card cell. */
export interface RateCardEntry {
  archetype: SiArchetype;
  location: DeliveryLocation;
  specialization: WorkSpecialization;
  band: RateBand;
  /** How well research supports this band. */
  confidence: Confidence;
  /** Short, honest note: what the band is based on, where it is thin. */
  note: string;
}

/**
 * The benchmark rate card. A bundle of entries plus provenance. Consumers
 * (the effort-estimator) look entries up by the 3 dimensions and ALWAYS
 * allow a client-specific override to replace a benchmark band.
 */
export interface RateCard {
  /** Currency of every band. */
  currency: 'USD';
  /** Rate basis — blended hourly, mixed seniority. */
  basis: 'blended_hourly';
  /** ISO date of the research vintage. */
  asOf: string;
  /** Plain-language disclaimer carried into any UI that shows these rates. */
  disclaimer: string;
  /** Suggested refresh cadence. */
  refreshCadence: string;
  entries: RateCardEntry[];
}

// ---------------------------------------------------------------------------
// Provenance
// ---------------------------------------------------------------------------

/** Research vintage. Bump on every refresh. */
export const RATE_CARD_AS_OF = '2026-05-19';

const DISCLAIMER =
  'Benchmark planning ranges, not a quote. Every band is a market-derived ' +
  'estimate of blended hourly USD rates and carries a confidence note. ' +
  'Actual vendor pricing varies by client, scope, deal size, and ' +
  'commercial model — always override these bands with a client-specific ' +
  'rate card when one exists.';

const REFRESH_CADENCE =
  'Review every 2 quarters. Strategy/run rates drift slowly; AI/ML and data ' +
  'engineering premiums move fast (12–18%/yr per 2026 nearshore research) — ' +
  're-research those cells first.';

// ---------------------------------------------------------------------------
// Entry builder
// ---------------------------------------------------------------------------

function entry(
  archetype: SiArchetype,
  location: DeliveryLocation,
  specialization: WorkSpecialization,
  low: number,
  high: number,
  confidence: Confidence,
  note: string,
): RateCardEntry {
  if (low <= 0 || high <= 0) {
    throw new Error(
      `Rate band for ${archetype}/${location}/${specialization} must be positive.`,
    );
  }
  if (low > high) {
    throw new Error(
      `Rate band for ${archetype}/${location}/${specialization}: low (${low}) > high (${high}).`,
    );
  }
  return {
    archetype,
    location,
    specialization,
    band: {
      lowUsdPerHour: low,
      pointUsdPerHour: Math.round((low + high) / 2),
      highUsdPerHour: high,
    },
    confidence,
    note,
  };
}

// ---------------------------------------------------------------------------
// The card
// ---------------------------------------------------------------------------
//
// Coverage note: not every archetype delivers every specialization at every
// location. We populate the cells that are *commercially real* and skip cells
// that do not occur in practice (e.g. boutiques rarely run their own
// large-scale offshore GDN). Skipped cells are documented in the companion
// doc — silence here is deliberate, not a gap to be filled with invention.
//
// Bands are blended hourly USD. Anchors, in summary:
//  - US Tier-1 / Big-4 onshore advisory: $250–$850/hr (top-end advisory).
//  - US Tier-1 onshore delivery (eng): $200–$300/hr typical.
//  - Big-4 senior day rates ~£1,500–£2,120 → ~$240–$340/hr blended.
//  - India Tier-1 onshore: $100–$140/hr; offshore: $30–$55/hr.
//  - US Tier-1 OWN offshore GDN: ~$45–$120/hr (above India Tier-1 offshore;
//    premium brand, same geography).
//  - Nearshore LatAm: $35–$90/hr; AI/ML carries a 12–15% premium.

const ENTRIES: RateCardEntry[] = [
  // === US Tier-1 — onshore ================================================
  entry(
    'us_tier1', 'onshore', 'strategy_advisory',
    300, 850, 'medium',
    'Top-end digital-transformation advisory; firms treat rates as trade ' +
      'secrets so the high end is characterized, not quoted.',
  ),
  entry(
    'us_tier1', 'onshore', 'solution_architecture',
    250, 400, 'medium',
    'Senior architect blended; derived from Deloitte senior-staff ' +
      '~$258/hr and management-exec ~$373/hr public data points.',
  ),
  entry(
    'us_tier1', 'onshore', 'ai_ml_engineering',
    220, 380, 'low',
    'AI/ML premium over baseline delivery; US Tier-1 onshore AI rates are ' +
      'thinly disclosed — band is inferred from US AI-consultant $300–500/hr ' +
      'context and a delivery (non-advisory) discount.',
  ),
  entry(
    'us_tier1', 'onshore', 'data_engineering',
    200, 320, 'medium',
    'Onshore delivery-engineering band; below AI/ML, above integration.',
  ),
  entry(
    'us_tier1', 'onshore', 'integration',
    190, 300, 'medium',
    'Aligns with the $200–300/hr large-provider delivery range.',
  ),
  entry(
    'us_tier1', 'onshore', 'process_redesign',
    220, 360, 'low',
    'Operating-process redesign blends advisory and delivery staff; band ' +
      'is interpolated, not directly sourced.',
  ),
  entry(
    'us_tier1', 'onshore', 'change_management',
    180, 300, 'medium',
    'Adoption / training / comms; below architecture, above run.',
  ),
  entry(
    'us_tier1', 'onshore', 'program_management',
    200, 340, 'medium',
    'Consistent with Big-4 senior-manager day rates ~£1,500–£2,120.',
  ),
  entry(
    'us_tier1', 'onshore', 'run_ams',
    140, 240, 'medium',
    'Onshore run/AMS; most run work shifts offshore so onshore is leaner.',
  ),
  // === US Tier-1 — offshore (the firm's OWN GDN) ==========================
  entry(
    'us_tier1', 'offshore', 'solution_architecture',
    70, 130, 'medium',
    "Firm's own Global Delivery Network architect; premium over India " +
      'Tier-1 offshore for the same geography (brand + integrated delivery).',
  ),
  entry(
    'us_tier1', 'offshore', 'ai_ml_engineering',
    65, 120, 'low',
    'GDN AI/ML capacity is growing fast; rates are not publicly broken out ' +
      '— band carries a deliberate AI premium over GDN baseline.',
  ),
  entry(
    'us_tier1', 'offshore', 'data_engineering',
    55, 100, 'medium',
    "Firm's own GDN data engineering; above commodity offshore.",
  ),
  entry(
    'us_tier1', 'offshore', 'integration',
    50, 95, 'medium',
    'GDN integration / build; the workhorse offshore cell.',
  ),
  entry(
    'us_tier1', 'offshore', 'run_ams',
    35, 70, 'medium',
    'GDN run/AMS; the lowest-cost cell, where most run work lands.',
  ),
  // === India-HQ Tier-1 (TCS / Infosys / Wipro) — onshore ==================
  entry(
    'india_tier1', 'onshore', 'solution_architecture',
    110, 160, 'medium',
    'India Tier-1 onsite (US) rates; "$150 or more" for large-client ' +
      'architects per market commentary.',
  ),
  entry(
    'india_tier1', 'onshore', 'ai_ml_engineering',
    110, 170, 'low',
    'India Tier-1 onsite AI/ML; premium over generic onsite, but onshore ' +
      'AI capacity is limited — band is characterized.',
  ),
  entry(
    'india_tier1', 'onshore', 'data_engineering',
    100, 145, 'medium',
    'Onsite data engineering; within the $100–140/hr onsite range.',
  ),
  entry(
    'india_tier1', 'onshore', 'integration',
    100, 140, 'high',
    'Squarely the cited $100–140/hr onsite range — well-corroborated.',
  ),
  entry(
    'india_tier1', 'onshore', 'program_management',
    120, 180, 'medium',
    'Onsite delivery/program leads; can reach $250–300/hr for very senior ' +
      'staff but blended program management sits lower.',
  ),
  entry(
    'india_tier1', 'onshore', 'run_ams',
    80, 130, 'medium',
    'Onsite run/AMS coordination; most run delivery is offshore.',
  ),
  // === India-HQ Tier-1 — offshore =========================================
  entry(
    'india_tier1', 'offshore', 'solution_architecture',
    45, 80, 'medium',
    'Offshore senior architect; upper end of the offshore band.',
  ),
  entry(
    'india_tier1', 'offshore', 'ai_ml_engineering',
    40, 75, 'low',
    'Offshore AI/ML; demand-driven 12–15% premium over offshore baseline, ' +
      'but disclosed rates are sparse.',
  ),
  entry(
    'india_tier1', 'offshore', 'data_engineering',
    35, 60, 'medium',
    'Offshore data engineering; within the cited $30–50/hr offshore range.',
  ),
  entry(
    'india_tier1', 'offshore', 'integration',
    30, 50, 'high',
    'The well-corroborated $30–50/hr offshore developer/integration range.',
  ),
  entry(
    'india_tier1', 'offshore', 'run_ams',
    25, 45, 'high',
    'Offshore run/AMS — the lowest-cost, best-corroborated cell.',
  ),
  // === Big-4 advisory (EY / KPMG / PwC / Strategy&) — onshore =============
  entry(
    'big4_advisory', 'onshore', 'strategy_advisory',
    300, 800, 'medium',
    'Top-end strategy advisory; EY-Parthenon-class work. High end is ' +
      'characterized — partner day rates reach ~£3,800 but rarely billed direct.',
  ),
  entry(
    'big4_advisory', 'onshore', 'solution_architecture',
    260, 420, 'medium',
    'Big-4 tech architecture; derived from senior-manager day rates ' +
      '~£1,706–£2,120.',
  ),
  entry(
    'big4_advisory', 'onshore', 'process_redesign',
    240, 400, 'medium',
    'Operating-model / process redesign is core Big-4 advisory work.',
  ),
  entry(
    'big4_advisory', 'onshore', 'change_management',
    200, 340, 'medium',
    'Change / adoption advisory; strong Big-4 practice area.',
  ),
  entry(
    'big4_advisory', 'onshore', 'program_management',
    220, 360, 'medium',
    'Program leadership / PMO; consistent with Big-4 senior day rates.',
  ),
  // === Big-4 advisory — offshore (own delivery centers) ===================
  entry(
    'big4_advisory', 'offshore', 'data_engineering',
    50, 95, 'low',
    'Big-4 delivery-center data work; Big-4 are advisory-led so offshore ' +
      'delivery rates are less visible than for the SI Tier-1s.',
  ),
  entry(
    'big4_advisory', 'offshore', 'integration',
    45, 90, 'low',
    "Big-4 offshore delivery centers; band borrows from SI-Tier-1 GDN " +
      'with a small premium for advisory packaging — research is thin here.',
  ),
  // === Boutique / specialist — onshore ====================================
  entry(
    'boutique_specialist', 'onshore', 'ai_ml_engineering',
    180, 350, 'medium',
    'Specialist AI/ML boutiques; below Tier-1 advisory but deep — US AI ' +
      'consultancies cited at $300–500/hr for senior work.',
  ),
  entry(
    'boutique_specialist', 'onshore', 'data_engineering',
    160, 280, 'medium',
    'Specialist data-engineering boutiques; senior, narrow, hands-on.',
  ),
  entry(
    'boutique_specialist', 'onshore', 'solution_architecture',
    170, 300, 'low',
    'Specialist architecture; boutique pricing varies widely by niche — ' +
      'band is broad on purpose.',
  ),
  entry(
    'boutique_specialist', 'onshore', 'strategy_advisory',
    200, 450, 'low',
    'Independent senior advisors $75–200/hr at the low end up to ' +
      'firm-level $450/hr; very wide, low-confidence band.',
  ),
  // === Boutique / specialist — nearshore (LatAm) ==========================
  entry(
    'boutique_specialist', 'nearshore', 'ai_ml_engineering',
    45, 90, 'medium',
    'LatAm senior AI/ML with US experience $35–70/hr + a 12–15% AI ' +
      'premium; time-zone-aligned.',
  ),
  entry(
    'boutique_specialist', 'nearshore', 'data_engineering',
    40, 80, 'medium',
    'LatAm data engineering; mid-senior $35–70/hr range, Argentina cheaper, ' +
      'Chile dearer.',
  ),
  entry(
    'boutique_specialist', 'nearshore', 'integration',
    35, 75, 'medium',
    'LatAm integration / build; the corroborated $35–70/hr nearshore band.',
  ),
  entry(
    'boutique_specialist', 'nearshore', 'solution_architecture',
    55, 100, 'low',
    'LatAm senior architects; upper nearshore band, fewer data points.',
  ),
  // === US Tier-1 — nearshore (own LatAm centers) ==========================
  entry(
    'us_tier1', 'nearshore', 'integration',
    80, 140, 'low',
    "US Tier-1 own LatAm delivery centers; priced above independent " +
      'nearshore for brand + integrated delivery — thinly disclosed.',
  ),
  entry(
    'us_tier1', 'nearshore', 'data_engineering',
    85, 150, 'low',
    'US Tier-1 nearshore data engineering; characterized band, premium ' +
      'over independent LatAm boutiques.',
  ),
];

/** The exported benchmark rate card. Treat as immutable. */
export const BENCHMARK_RATE_CARD: RateCard = {
  currency: 'USD',
  basis: 'blended_hourly',
  asOf: RATE_CARD_AS_OF,
  disclaimer: DISCLAIMER,
  refreshCadence: REFRESH_CADENCE,
  entries: ENTRIES,
};

// ---------------------------------------------------------------------------
// Lookup
// ---------------------------------------------------------------------------

/**
 * Look up a benchmark band by the 3 dimensions. Returns null when the cell is
 * not populated — callers must handle the miss (fall back to a broader cell
 * or a client override), never fabricate a rate.
 *
 * A client-specific rate card always takes precedence over this benchmark;
 * this lookup is the *default* the effort-estimator uses only when no client
 * rate exists for the cell.
 */
export function lookupBenchmarkRate(
  archetype: SiArchetype,
  location: DeliveryLocation,
  specialization: WorkSpecialization,
  card: RateCard = BENCHMARK_RATE_CARD,
): RateCardEntry | null {
  return (
    card.entries.find(
      (e) =>
        e.archetype === archetype &&
        e.location === location &&
        e.specialization === specialization,
    ) ?? null
  );
}
