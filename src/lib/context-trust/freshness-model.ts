/**
 * Context Freshness & Trust Model — Slice 4.1
 *
 * Pure, dependency-free model + builders for reasoning about how *fresh* and
 * how *trustworthy* each enterprise-context segment is, and for deriving an
 * overall grounding-confidence verdict for an answer backed by a set of
 * segments.
 *
 * This module is data + types + pure functions only. It does NOT:
 *   - change any agent prompt (that is Slice 4.2),
 *   - render any UI (later slice),
 *   - touch the database (no migration in this slice).
 *
 * Design rationale lives in
 * `docs/strategy/CONTEXT-FRESHNESS-TRUST-MODEL.md`.
 */

// ---------------------------------------------------------------------------
// Segment catalogue
// ---------------------------------------------------------------------------

/**
 * The 14 canonical enterprise-context segments. This list is the contract;
 * builders and the readiness checklist (Slice 4.3) iterate over it.
 */
export const CONTEXT_SEGMENT_KEYS = [
  'enterprise_profile',
  'org_structure',
  'it_landscape',
  'it_financials',
  'kpi_dictionary',
  'program_inventory',
  'sourcing_artifacts',
  'program_deliverables',
  'evidence_ledger',
  'operating_telemetry',
  'vendor_contracts',
  'compliance',
  'industry_context',
  'cross_program_signals',
] as const;

export type ContextSegmentKey = (typeof CONTEXT_SEGMENT_KEYS)[number];

// ---------------------------------------------------------------------------
// Source type — how the segment data arrived
// ---------------------------------------------------------------------------

/**
 * How a segment's data was obtained. Source type caps the maximum trust rung
 * a segment can ever reach: an `inferred` segment can never be `verified`,
 * no matter how recently it was generated.
 */
export type ContextSourceType =
  /** Confirmed by a named human owner or an authoritative system of record. */
  | 'verified'
  /** Imported from a real tenant artifact / connector but not human-confirmed. */
  | 'sourced'
  /** Derived, modelled, or estimated by AbarVa from other segments. */
  | 'inferred'
  /** No data has ever been loaded for this segment. */
  | 'absent';

// ---------------------------------------------------------------------------
// Trust rungs
// ---------------------------------------------------------------------------

/**
 * The trust-rung ladder, highest to lowest. A segment occupies exactly one
 * rung; an answer's overall verdict is driven by the *weakest* rung among the
 * segments that materially back it.
 */
export const TRUST_RUNGS = [
  'verified', // human/system-of-record confirmed AND fresh
  'sourced', // real tenant artifact, fresh enough, not human-confirmed
  'inferred', // modelled/estimated by AbarVa, still within usable age
  'stale', // real data, but older than its refresh cadence allows
  'missing', // never loaded
] as const;

export type TrustRung = (typeof TRUST_RUNGS)[number];

/** Numeric ordering — higher is more trustworthy. Used to take the minimum. */
const TRUST_RUNG_ORDER: Record<TrustRung, number> = {
  verified: 4,
  sourced: 3,
  inferred: 2,
  stale: 1,
  missing: 0,
};

// ---------------------------------------------------------------------------
// Freshness state
// ---------------------------------------------------------------------------

/**
 * The age band of a segment relative to its expected refresh cadence.
 *  - `fresh`   : updated within the cadence window.
 *  - `aging`   : past the cadence window but within the staleness grace band.
 *  - `stale`   : beyond the staleness grace band — must not be silently trusted.
 *  - `unknown` : no `lastUpdated` date is available.
 */
export type FreshnessState = 'fresh' | 'aging' | 'stale' | 'unknown';

// ---------------------------------------------------------------------------
// Per-segment refresh cadence expectations
// ---------------------------------------------------------------------------

/**
 * Expected refresh cadence per segment, in days. A segment is `fresh` while
 * its age is within `cadenceDays`, `aging` until `staleDays`, and `stale`
 * beyond `staleDays`. Values reflect how quickly each domain actually moves.
 */
export interface SegmentCadence {
  /** Age (days) within which the segment is considered fully fresh. */
  cadenceDays: number;
  /** Age (days) beyond which the segment is considered stale. */
  staleDays: number;
}

export const SEGMENT_CADENCE: Record<ContextSegmentKey, SegmentCadence> = {
  // Slow-moving foundational context.
  enterprise_profile: { cadenceDays: 365, staleDays: 540 },
  org_structure: { cadenceDays: 180, staleDays: 365 },
  industry_context: { cadenceDays: 180, staleDays: 365 },
  // Quarterly-ish operational context.
  it_landscape: { cadenceDays: 120, staleDays: 270 },
  kpi_dictionary: { cadenceDays: 120, staleDays: 270 },
  compliance: { cadenceDays: 120, staleDays: 270 },
  // Financials and contracts move on a quarter / renewal cycle.
  it_financials: { cadenceDays: 90, staleDays: 180 },
  vendor_contracts: { cadenceDays: 90, staleDays: 180 },
  // Programme execution context — should be near-current.
  program_inventory: { cadenceDays: 60, staleDays: 120 },
  sourcing_artifacts: { cadenceDays: 60, staleDays: 120 },
  program_deliverables: { cadenceDays: 45, staleDays: 90 },
  evidence_ledger: { cadenceDays: 45, staleDays: 90 },
  // Fast-moving signal layers.
  operating_telemetry: { cadenceDays: 30, staleDays: 60 },
  cross_program_signals: { cadenceDays: 30, staleDays: 60 },
};

// ---------------------------------------------------------------------------
// Inputs / outputs
// ---------------------------------------------------------------------------

/**
 * The freshness metadata AbarVa holds for one segment of one tenant. In
 * production this is read from the enterprise-context tables' provenance
 * columns; here it is a plain typed input so builders stay pure.
 */
export interface SegmentMetadata {
  segment: ContextSegmentKey;
  /** ISO date the underlying data was last refreshed. `null` => never loaded. */
  lastUpdated: string | null;
  /** How the data arrived. */
  sourceType: ContextSourceType;
  /** Optional named owner / system of record (informational). */
  sourceOwner?: string;
}

/** The computed freshness + trust assessment for a single segment. */
export interface SegmentTrustAssessment {
  segment: ContextSegmentKey;
  sourceType: ContextSourceType;
  /** Whole-day age of the data, or `null` if no date is available. */
  ageDays: number | null;
  freshness: FreshnessState;
  trustRung: TrustRung;
  /** Cadence expectation applied to this segment. */
  cadence: SegmentCadence;
  /** Human-readable one-liner explaining the rung. */
  rationale: string;
}

/** Overall confidence band for an answer grounded in multiple segments. */
export type GroundingConfidence = 'high' | 'partial' | 'low' | 'insufficient';

/**
 * What the agent should do with an answer given the grounding verdict.
 * Consumed by Slice 4.2 (agent confidence surfacing).
 */
export type StaleAnswerAction = 'answer' | 'caveat' | 'downgrade' | 'decline';

/** The aggregate verdict for one answer. */
export interface GroundingVerdict {
  confidence: GroundingConfidence;
  /** The weakest trust rung among the backing segments. */
  weakestRung: TrustRung;
  /** Recommended agent behaviour. */
  action: StaleAnswerAction;
  /** Per-segment assessments, in input order. */
  segments: SegmentTrustAssessment[];
  /** Segments that are stale and materially weaken the answer. */
  staleSegments: ContextSegmentKey[];
  /** Segments with no data loaded at all. */
  missingSegments: ContextSegmentKey[];
  /** A founder-readable explanation of the verdict. */
  summary: string;
}

// ---------------------------------------------------------------------------
// Builders — pure functions
// ---------------------------------------------------------------------------

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Whole-day age between `lastUpdated` and `asOf`. Returns `null` when no date
 * is available or the date cannot be parsed. Negative ages (future dates)
 * are clamped to 0.
 */
export function computeAgeDays(
  lastUpdated: string | null,
  asOf: Date = new Date(),
): number | null {
  if (!lastUpdated) return null;
  const updated = new Date(lastUpdated);
  if (Number.isNaN(updated.getTime())) return null;
  const diff = Math.floor((asOf.getTime() - updated.getTime()) / MS_PER_DAY);
  return diff < 0 ? 0 : diff;
}

/**
 * Map an age (in days) to a freshness state using the segment's cadence.
 * A `null` age yields `unknown`.
 */
export function computeFreshnessState(
  ageDays: number | null,
  cadence: SegmentCadence,
): FreshnessState {
  if (ageDays === null) return 'unknown';
  if (ageDays <= cadence.cadenceDays) return 'fresh';
  if (ageDays <= cadence.staleDays) return 'aging';
  return 'stale';
}

/**
 * Derive the trust rung from source type + freshness state.
 *
 * Source type caps the ceiling; freshness can only lower the rung:
 *  - `absent`         => always `missing`.
 *  - `stale` freshness => always `stale` (real data past its grace band).
 *  - `unknown` freshness => `inferred` ceiling (we cannot vouch for age).
 *  - otherwise the source-type ceiling applies (`verified`/`sourced`/`inferred`).
 */
export function computeTrustRung(
  sourceType: ContextSourceType,
  freshness: FreshnessState,
): TrustRung {
  if (sourceType === 'absent') return 'missing';
  if (freshness === 'stale') return 'stale';

  const ceiling: TrustRung =
    sourceType === 'verified'
      ? 'verified'
      : sourceType === 'sourced'
        ? 'sourced'
        : 'inferred';

  // No date => we cannot certify freshness; cap at `inferred`.
  if (freshness === 'unknown') {
    return TRUST_RUNG_ORDER[ceiling] < TRUST_RUNG_ORDER.inferred
      ? ceiling
      : 'inferred';
  }
  return ceiling;
}

/** Build the full freshness + trust assessment for one segment. */
export function assessSegment(
  metadata: SegmentMetadata,
  asOf: Date = new Date(),
): SegmentTrustAssessment {
  const cadence = SEGMENT_CADENCE[metadata.segment];
  const ageDays = computeAgeDays(metadata.lastUpdated, asOf);
  const freshness = computeFreshnessState(ageDays, cadence);
  const trustRung = computeTrustRung(metadata.sourceType, freshness);

  return {
    segment: metadata.segment,
    sourceType: metadata.sourceType,
    ageDays,
    freshness,
    trustRung,
    cadence,
    rationale: buildSegmentRationale(metadata.segment, ageDays, freshness, trustRung),
  };
}

function buildSegmentRationale(
  segment: ContextSegmentKey,
  ageDays: number | null,
  freshness: FreshnessState,
  rung: TrustRung,
): string {
  if (rung === 'missing') return `${segment} has no data loaded.`;
  if (ageDays === null) {
    return `${segment} has no source date, so age cannot be certified (${rung}).`;
  }
  const months = Math.round(ageDays / 30);
  if (freshness === 'fresh') {
    return `${segment} is ${ageDays}d old — within refresh cadence (${rung}).`;
  }
  if (freshness === 'aging') {
    return `${segment} is ~${months}mo old — past cadence but usable (${rung}).`;
  }
  return `${segment} is ~${months}mo old — beyond staleness window (${rung}).`;
}

// ---------------------------------------------------------------------------
// Aggregate verdict
// ---------------------------------------------------------------------------

/**
 * Map a weakest-rung value to a grounding-confidence band and the recommended
 * agent action. The weakest backing segment dominates the verdict — a chain is
 * only as strong as its weakest link.
 */
function rungToVerdict(weakest: TrustRung): {
  confidence: GroundingConfidence;
  action: StaleAnswerAction;
} {
  switch (weakest) {
    case 'verified':
      return { confidence: 'high', action: 'answer' };
    case 'sourced':
      return { confidence: 'high', action: 'answer' };
    case 'inferred':
      return { confidence: 'partial', action: 'caveat' };
    case 'stale':
      return { confidence: 'low', action: 'downgrade' };
    case 'missing':
      return { confidence: 'insufficient', action: 'decline' };
  }
}

/**
 * Derive the overall grounding verdict for an answer backed by `metadatas`.
 *
 * The verdict is driven by the weakest trust rung among the backing segments.
 * Passing an empty list yields an `insufficient` verdict (nothing to ground on).
 */
export function deriveGroundingVerdict(
  metadatas: SegmentMetadata[],
  asOf: Date = new Date(),
): GroundingVerdict {
  const segments = metadatas.map((m) => assessSegment(m, asOf));

  if (segments.length === 0) {
    return {
      confidence: 'insufficient',
      weakestRung: 'missing',
      action: 'decline',
      segments: [],
      staleSegments: [],
      missingSegments: [],
      summary: 'No context segments back this answer; AbarVa cannot ground a response.',
    };
  }

  let weakestRung: TrustRung = 'verified';
  for (const s of segments) {
    if (TRUST_RUNG_ORDER[s.trustRung] < TRUST_RUNG_ORDER[weakestRung]) {
      weakestRung = s.trustRung;
    }
  }

  const staleSegments = segments
    .filter((s) => s.trustRung === 'stale')
    .map((s) => s.segment);
  const missingSegments = segments
    .filter((s) => s.trustRung === 'missing')
    .map((s) => s.segment);

  const { confidence, action } = rungToVerdict(weakestRung);

  return {
    confidence,
    weakestRung,
    action,
    segments,
    staleSegments,
    missingSegments,
    summary: buildVerdictSummary(confidence, weakestRung, staleSegments, missingSegments),
  };
}

function buildVerdictSummary(
  confidence: GroundingConfidence,
  weakestRung: TrustRung,
  staleSegments: ContextSegmentKey[],
  missingSegments: ContextSegmentKey[],
): string {
  if (confidence === 'insufficient') {
    const list = missingSegments.join(', ') || 'required segments';
    return `Insufficient grounding — ${list} not loaded; AbarVa should decline rather than guess.`;
  }
  if (confidence === 'low') {
    return `Low confidence — grounding relies on stale data (${staleSegments.join(', ')}); downgrade confidence and flag the stale segment(s).`;
  }
  if (confidence === 'partial') {
    return 'Partial confidence — answer leans on inferred or undated context; caveat the answer.';
  }
  return `High confidence — answer is grounded in fresh, sourced context (weakest rung: ${weakestRung}).`;
}
