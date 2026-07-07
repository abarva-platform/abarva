// Source — Category Strategy Classifier (Slice 1.1)
//
// The runtime function that maps a real sourcing event onto the encoded
// expert taxonomy from Slice 0.1. Given an event's free-text attributes plus
// the set of tenant-context segments actually loaded, it returns:
//
//   - the classified sourcing category (one of the 8 taxonomy categories);
//   - the buying motion the category implies (renewal, competitive RFP,
//     direct partner selection, framework/commit, or demand triage);
//   - the risk profile (severity + the dominant traps from the taxonomy);
//   - the evidence gaps — the *required* evidence inputs the category needs
//     that the tenant context has not loaded.
//
// Expert value: this prevents the wrong sourcing motion before an RFP is
// written. It is the step that lets Source say "this is being run as an AMS
// RFP but the real category is an AI engineering partner — and the evidence
// gaps are X, Y."
//
// This module is a PURE function: no I/O, no database, no service calls. It
// reads the static `SOURCE_CATEGORY_TAXONOMY` registry and does not mutate
// it. Safe for both the Vercel/Supabase and Azure Postgres data paths — it
// never touches a data plane; callers pass already-resolved signals in.
//
// Deferred (per the execution plan): the build/buy/partner/SI delivery-model
// gate is Slice 1.2; the should-cost / role-mix model is Slice 1.3. This
// classifier intentionally stops at category + motion + risk + gaps.

import {
  SOURCE_CATEGORY_TAXONOMY,
  type CategoryAntiPattern,
  type SourceCategory,
  type SourceCategoryId,
  type TenantContextSegment,
} from '../taxonomy/category-taxonomy';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * The buying motion a category implies. This is the *how we go to market*
 * decision, distinct from the category (the *what*). The wrong motion is the
 * most common pre-RFP failure: running a competitive RFP for what is really
 * a renewal, or a renewal for what is really a fresh partner selection.
 */
export type BuyingMotion =
  | 'demand_triage' // Stage 0 — challenge whether to source at all.
  | 'competitive_rfp' // Multi-vendor solicitation with weighted scoring.
  | 'partner_selection' // Capability-led selection of a delivery partner.
  | 'renewal_renegotiation' // Renew/renegotiate/rationalize an incumbent.
  | 'framework_commitment'; // Commit/framework tier negotiation.

/** Overall risk severity for the classified motion. */
export type RiskSeverity = 'low' | 'medium' | 'high';

/**
 * The free-text + structured attributes of a sourcing event the classifier
 * reads. All fields are optional except `name` — the classifier degrades
 * gracefully and lowers confidence when given less.
 */
export interface SourcingEventAttributes {
  /** Event name / title — the primary signal. */
  name: string;
  /** Archetype label, if the event already carries one. */
  archetype?: string;
  /** Lifecycle pattern id bound to the event, e.g. 'PAT-SRC-AMS-001'. */
  patternId?: string;
  /** Any extra description, scope text, or notes. */
  description?: string;
}

/**
 * The tenant-context signals available to ground the classification. The
 * classifier only needs to know *which* segments are loaded — the segment
 * contents are not its concern. Callers derive this from the live tenant
 * context snapshot (loaded segments) before invoking.
 */
export interface TenantContextSignals {
  /** Segment ids the tenant has loaded context for. */
  loadedSegments: readonly TenantContextSegment[];
}

/** One required evidence input the category needs but the tenant lacks. */
export interface EvidenceGap {
  /** Tenant context segment the missing evidence would come from. */
  segment: TenantContextSegment;
  /** What the expert reads from this segment for this category. */
  whatItProves: string;
}

/** The risk profile attached to a classification. */
export interface CategoryRiskProfile {
  severity: RiskSeverity;
  /** The taxonomy anti-patterns most relevant to this motion. */
  dominantTraps: readonly CategoryAntiPattern[];
  /** Plain-English summary of why the severity is what it is. */
  rationale: string;
}

/** The full result of classifying a sourcing event. */
export interface CategoryClassification {
  /** The classified category id. */
  categoryId: SourceCategoryId;
  /** The full taxonomy definition for the category. */
  category: SourceCategory;
  /** The buying motion the category + event signals imply. */
  buyingMotion: BuyingMotion;
  /** The risk profile for the classified motion. */
  riskProfile: CategoryRiskProfile;
  /**
   * Required evidence inputs the category needs that the tenant context has
   * NOT loaded. An empty list means the tenant is evidence-ready.
   */
  evidenceGaps: readonly EvidenceGap[];
  /** Classifier confidence in the category match. */
  confidence: RiskSeverity;
  /**
   * Human-readable reasons the classifier landed on this category — the
   * matched keywords / pattern, so the result is auditable, not a black box.
   */
  matchReasons: readonly string[];
  classifierVersion: 'source-category-classifier/v1';
}

// ---------------------------------------------------------------------------
// Keyword + pattern signal tables
// ---------------------------------------------------------------------------

/**
 * Lifecycle pattern ids that map directly to a category. A bound pattern is
 * the strongest signal — the event already declares its shape.
 */
const PATTERN_TO_CATEGORY: Readonly<Record<string, SourceCategoryId>> = {
  'PAT-SRC-AMS-001': 'ams',
  'PAT-SRC-RENEWAL-001': 'saas_renewal',
  'PAT-SRC-CAT-FINOPS-001': 'cloud_finops',
  'PAT-SRC-CAT-CDP-001': 'data_ai_platform',
  'PAT-SRC-CAT-CDW-001': 'data_ai_platform',
  'PAT-SRC-CAT-LAKE-001': 'data_ai_platform',
  'PAT-SRC-CAT-BI-001': 'data_ai_platform',
  'PAT-SRC-CAT-LLM-001': 'data_ai_platform',
  'PAT-SRC-CAT-AGENT-001': 'ai_engineering_partner',
  'PAT-SRC-CAT-IAM-001': 'cyber_grc',
};

/**
 * Per-category keyword signals. Order matters only for tie-breaking; the
 * scorer sums all hits, so a longer match list is not automatically a win.
 */
const CATEGORY_KEYWORDS: Readonly<Record<SourceCategoryId, readonly RegExp[]>> = {
  ams: [
    /\bams\b/,
    /managed service(?!s? vs)/,
    /application (?:support|maintenance|management)/,
    /application managed service/,
    /managed[- ]services? partner/,
    /run\/maintain/,
    /run and maintain/,
    /keep the lights on/,
    /l[123] support/,
    /l[123]\/l[123]/,
    /tier [123] (?:support|service)/,
    /service desk/,
  ],
  data_ai_platform: [
    /\bcdp\b/,
    /customer data platform/,
    /data (?:warehouse|lakehouse|lake|platform|fabric)/,
    /\b(?:warehouse|lakehouse)\b/,
    /feature (?:store|platform)/,
    /vector (?:store|database|db)/,
    /\bml platform\b/,
    /ai platform/,
    /analytics platform/,
  ],
  ai_engineering_partner: [
    /ai (?:engineering|delivery) partner/,
    /\bsi\b/,
    /systems integrator/,
    /build (?:an? )?(?:agent|copilot|assistant)/,
    /agentic (?:build|delivery|engagement)/,
    /model ops/,
    /\bmlops\b/,
    /implementation partner/,
    /delivery partner/,
  ],
  saas_renewal: [
    /renew(?:al)?/,
    /renegotiat/,
    /auto-?renew/,
    /subscription (?:renewal|true-?up)/,
    /true-?up/,
    /\bshelfware\b/,
    /license rationaliz/,
  ],
  cloud_finops: [
    /\bfinops\b/,
    /cloud (?:commit|spend|cost|savings plan|reserved)/,
    /\b(?:aws|azure|gcp) (?:commit|ea|eda|mca)\b/,
    /committed use/,
    /savings plan/,
    /reserved instance/,
    /rightsizing/,
  ],
  bpo_contact_centre: [
    /\bbpo\b/,
    /business process outsourc/,
    /contact (?:cent(?:er|re))/,
    /call (?:cent(?:er|re))/,
    /customer service outsourc/,
    /\bcx outsourc/,
    /back-?office outsourc/,
  ],
  bpo_shared_services: [
    /\bbpo\b/i,
    /shared services/i,
    /finance.{0,3}(and|&).{0,3}accounting|\bf&a\b/i,
    /procure.to.pay|order.to.cash|record.to.report|\bp2p\b|\bo2c\b|\br2r\b/i,
    /payroll|accounts payable|invoice processing/i,
  ],
  cyber_grc: [
    /\bgrc\b/,
    /cyber(?:security)?/,
    /\bsecurity (?:tool|platform|service|operations)/,
    /\bsoc\b/,
    /\bsiem\b/,
    /\bmssp\b/,
    /compliance (?:tool|platform)/,
    /governance(?:,? risk)/,
    /\bidentity (?:and access )?management\b/,
  ],
  staff_aug_vs_managed_service: [
    /staff aug/,
    /staff augmentation/,
    /\bcontractors?\b/,
    /\bcontingent (?:labou?r|workforce)/,
    /managed service vs/,
    /capacity vs outcome/,
    /\bt&m\b/,
    /time (?:and|&) materials/,
  ],
};

/**
 * The buying motion each category defaults to. Event signals can override
 * (e.g. an explicit renewal phrase forces `renewal_renegotiation`).
 */
const CATEGORY_DEFAULT_MOTION: Readonly<Record<SourceCategoryId, BuyingMotion>> = {
  ams: 'competitive_rfp',
  data_ai_platform: 'competitive_rfp',
  ai_engineering_partner: 'partner_selection',
  saas_renewal: 'renewal_renegotiation',
  cloud_finops: 'framework_commitment',
  bpo_contact_centre: 'competitive_rfp',
  bpo_shared_services: 'competitive_rfp',
  cyber_grc: 'competitive_rfp',
  staff_aug_vs_managed_service: 'demand_triage',
};

/** Phrases that, when present, force a specific motion regardless of category. */
const MOTION_OVERRIDES: ReadonlyArray<{ pattern: RegExp; motion: BuyingMotion }> = [
  { pattern: /renew(?:al)?|renegotiat|auto-?renew|true-?up/, motion: 'renewal_renegotiation' },
  { pattern: /should we (?:source|buy)|do we need|demand challenge|triage/, motion: 'demand_triage' },
  { pattern: /sole.?source|direct award|single vendor/, motion: 'partner_selection' },
  { pattern: /framework|commit(?:ment)? tier|enterprise agreement|\bea\b/, motion: 'framework_commitment' },
];

/**
 * Categories whose default motion carries elevated baseline risk — a long
 * lock-in horizon, consumption-pricing exposure, or a high mis-categorisation
 * cost. Used as one input to the severity calculation.
 */
const HIGH_BASELINE_RISK: ReadonlySet<SourceCategoryId> = new Set<SourceCategoryId>([
  'ams',
  'data_ai_platform',
  'ai_engineering_partner',
  'bpo_contact_centre',
]);

// ---------------------------------------------------------------------------
// Classifier
// ---------------------------------------------------------------------------

/**
 * Classify a sourcing event onto the IT sourcing category taxonomy.
 *
 * Pure function — same inputs always yield the same output. The result is
 * fully auditable: `matchReasons` records every signal that contributed.
 *
 * @param event   The sourcing event's free-text + structured attributes.
 * @param signals The tenant-context segments currently loaded.
 */
export function classifySourcingEvent(
  event: SourcingEventAttributes,
  signals: TenantContextSignals,
): CategoryClassification {
  const haystack = [event.name, event.archetype, event.description]
    .filter((s): s is string => typeof s === 'string' && s.length > 0)
    .join(' ')
    .toLowerCase();

  const matchReasons: string[] = [];

  // 1. Score every category by keyword hits.
  const scores = new Map<SourceCategoryId, number>();
  for (const [id, patterns] of Object.entries(CATEGORY_KEYWORDS) as Array<
    [SourceCategoryId, readonly RegExp[]]
  >) {
    let score = 0;
    for (const re of patterns) {
      if (re.test(haystack)) score += 1;
    }
    if (score > 0) scores.set(id, score);
  }

  // 2. A bound lifecycle pattern is the strongest signal — heavy boost.
  const patternCategory = event.patternId
    ? PATTERN_TO_CATEGORY[event.patternId]
    : undefined;
  if (patternCategory) {
    scores.set(patternCategory, (scores.get(patternCategory) ?? 0) + 5);
    matchReasons.push(`Bound lifecycle pattern ${event.patternId} maps to ${patternCategory}.`);
  }

  // 3. Pick the winner. Ties broken by taxonomy order (Object.keys order).
  let categoryId: SourceCategoryId;
  let topScore = 0;
  if (scores.size === 0) {
    // No signal at all — fall back to AMS-shaped competitive RFP, the most
    // common enterprise sourcing motion, and flag low confidence.
    categoryId = 'ams';
    matchReasons.push('No category keyword or pattern matched; defaulted to AMS at low confidence.');
  } else {
    categoryId = 'ams';
    for (const id of Object.keys(SOURCE_CATEGORY_TAXONOMY) as SourceCategoryId[]) {
      const s = scores.get(id) ?? 0;
      if (s > topScore) {
        topScore = s;
        categoryId = id;
      }
    }
    const matchedKeywords = collectMatchedKeywords(categoryId, haystack);
    if (matchedKeywords.length > 0) {
      matchReasons.push(
        `Matched ${categoryId} on: ${matchedKeywords.join(', ')}.`,
      );
    }
  }

  const category = SOURCE_CATEGORY_TAXONOMY[categoryId];

  // 4. Determine buying motion: an explicit override beats the default.
  let buyingMotion = CATEGORY_DEFAULT_MOTION[categoryId];
  for (const { pattern, motion } of MOTION_OVERRIDES) {
    if (pattern.test(haystack)) {
      if (motion !== buyingMotion) {
        matchReasons.push(`Event text forces buying motion '${motion}' (overrides category default).`);
      }
      buyingMotion = motion;
      break;
    }
  }

  // 5. Evidence gaps — required inputs the tenant has not loaded.
  const loaded = new Set<TenantContextSegment>(signals.loadedSegments);
  const evidenceGaps: EvidenceGap[] = category.evidenceInputs
    .filter((input) => input.required && !loaded.has(input.segment))
    .map((input) => ({ segment: input.segment, whatItProves: input.whatItProves }));

  // 6. Risk profile.
  const riskProfile = deriveRiskProfile(category, buyingMotion, evidenceGaps.length);

  // 7. Confidence — pattern-bound or strong keyword match is high.
  const confidence = deriveConfidence(topScore, Boolean(patternCategory), scores.size);

  return {
    categoryId,
    category,
    buyingMotion,
    riskProfile,
    evidenceGaps,
    confidence,
    matchReasons,
    classifierVersion: 'source-category-classifier/v1',
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function collectMatchedKeywords(id: SourceCategoryId, haystack: string): string[] {
  const matched: string[] = [];
  for (const re of CATEGORY_KEYWORDS[id]) {
    const m = haystack.match(re);
    if (m) matched.push(m[0].trim());
  }
  return matched;
}

function deriveRiskProfile(
  category: SourceCategory,
  motion: BuyingMotion,
  gapCount: number,
): CategoryRiskProfile {
  const highBaseline = HIGH_BASELINE_RISK.has(category.id);
  // Demand triage is the *safest* motion — it precedes commitment. A bound
  // commitment/RFP motion with unmet evidence is the riskiest combination.
  let severity: RiskSeverity;
  const rationaleParts: string[] = [];

  if (motion === 'demand_triage') {
    severity = gapCount > 0 ? 'medium' : 'low';
    rationaleParts.push('Motion is demand triage — judgment precedes any commitment.');
  } else if (gapCount >= 2 || (highBaseline && gapCount >= 1)) {
    severity = 'high';
    rationaleParts.push(
      `${gapCount} required evidence input(s) unmet for a ${highBaseline ? 'high-baseline-risk' : ''} category — proceeding now risks the wrong motion.`.replace(
        / {2,}/g,
        ' ',
      ),
    );
  } else if (gapCount === 1 || highBaseline) {
    severity = 'medium';
    rationaleParts.push(
      highBaseline
        ? 'Category carries elevated lock-in / mis-categorisation cost.'
        : 'One required evidence input is unmet.',
    );
  } else {
    severity = 'low';
    rationaleParts.push('Required evidence is loaded and the motion is well-matched.');
  }

  // The dominant traps are the taxonomy anti-patterns — surfaced verbatim so
  // the expert framing is reused, not re-invented.
  const dominantTraps = category.antiPatterns.slice(0, severity === 'high' ? 3 : 2);

  return {
    severity,
    dominantTraps,
    rationale: rationaleParts.join(' '),
  };
}

function deriveConfidence(
  topScore: number,
  patternBound: boolean,
  matchedCategories: number,
): RiskSeverity {
  if (matchedCategories === 0) return 'low';
  if (patternBound || topScore >= 3) return 'high';
  if (topScore === 2) return 'medium';
  // A single weak keyword, or several categories tied on one hit each.
  return matchedCategories > 1 ? 'low' : 'medium';
}
