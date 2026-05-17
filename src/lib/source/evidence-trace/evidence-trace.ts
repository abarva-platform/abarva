// Evidence-trace view-model — "where did this number come from?".
//
// A design-partner IT sourcing VP usability-tested the Source console and was
// blunt: *"Raw evidence IDs are not enough. A VP will ask: 'Where did the
// $980K benchmark come from?'"* The Decision Queue bundles and the Renewal
// Cockpit both carry `evidenceRefs` — but a ref like `apex-vc-014` or
// `it_financials` tells a VP nothing.
//
// This module turns one `evidenceRef` into a grounded, plain-language trace:
// the source record, when it was last refreshed, its confidence / trust rung,
// who owns it, the linked context segment, and a one-liner on why the number
// is usable.
//
// HONESTY RULE — when a field is genuinely unknown the trace says
// `not recorded`. It NEVER fabricates an owner or a refresh date. A trace is
// only ever as strong as the substrate behind it.
//
// Pure module: no DB, no network, no clock — `asOf` is injected. The read
// adapter projects the substrate; this module only reasons over it.

import {
  assessSegment,
  type ContextSegmentKey,
  type ContextSourceType,
  type SegmentTrustAssessment,
  type TrustRung,
} from '@/lib/context-trust/freshness-model';
import type {
  FinancialLineInput,
  SegmentFreshnessInput,
  VendorContractInput,
} from '@/lib/source/decision-queue/detector-inputs';

// ---------------------------------------------------------------------------
// The sentinel for an unknown field — never invent an owner or a date.
// ---------------------------------------------------------------------------

/** The single honest placeholder for any field the substrate does not carry. */
export const NOT_RECORDED = 'not recorded' as const;

// ---------------------------------------------------------------------------
// Segment catalogue — human-readable labels for the 14 context segments.
// ---------------------------------------------------------------------------

/**
 * Display labels for the context segments an evidence ref can resolve to.
 * Only the segments the Source surfaces actually cite are exhaustively
 * labelled; any other key falls back to a humanized form of the key itself.
 */
const SEGMENT_LABEL: Partial<Record<ContextSegmentKey, string>> = {
  vendor_contracts: 'Vendor contracts',
  it_financials: 'IT financials',
  it_landscape: 'IT landscape',
  operating_telemetry: 'Operating telemetry',
  evidence_ledger: 'Evidence ledger',
};

/** Humanize a raw segment key for display ("vendor_contracts" → "Vendor contracts"). */
function humanizeSegmentKey(key: string): string {
  const known = SEGMENT_LABEL[key as ContextSegmentKey];
  if (known) return known;
  const spaced = key.replace(/_/g, ' ').trim();
  if (!spaced) return key;
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

// ---------------------------------------------------------------------------
// Inputs / outputs
// ---------------------------------------------------------------------------

/**
 * The resolution context — the already-loaded substrate an evidence ref is
 * resolved against. The caller assembles this once (from the queue / cockpit
 * loaders) and resolves many refs against it.
 */
export interface EvidenceResolutionContext {
  /** Contracts in the loaded tenant estate, keyed by `contractId`. */
  contracts: VendorContractInput[];
  /** IT-financials lines in the loaded estate, keyed by `recordId`. */
  financials: FinancialLineInput[];
  /** Per-segment freshness provenance for the cited segments. */
  segmentFreshness: SegmentFreshnessInput[];
  /** Evaluation clock — injected for deterministic age computation. */
  asOf: Date;
}

/** What kind of substrate an evidence ref points at. */
export type EvidenceRefKind =
  /** A `vendor_contracts` contract row. */
  | 'contract'
  /** An `it_financials` line. */
  | 'financial_line'
  /** A bare context-segment name (`vendor_contracts`, `it_financials`, …). */
  | 'segment'
  /** The ref could not be matched to any loaded substrate. */
  | 'unresolved';

/**
 * The resolved evidence trace for one `evidenceRef` — the six fields the VP
 * asked for, each either grounded or honestly marked `not recorded`.
 */
export interface EvidenceTrace {
  /** The raw evidence ref this trace was resolved from. */
  evidenceRef: string;
  /** What kind of substrate the ref resolved to. */
  kind: EvidenceRefKind;
  /** A short, human title for the resolved record — the drawer headline. */
  title: string;
  /** SOURCE RECORD — which table / segment / module the number came from. */
  sourceRecord: string;
  /** LAST REFRESHED — ISO date the backing segment was last refreshed, or `not recorded`. */
  lastRefreshed: string;
  /** Whole-day age of the backing segment, or `null` when undated. */
  ageDays: number | null;
  /** CONFIDENCE — the freshness model's trust rung for the backing segment. */
  trustRung: TrustRung;
  /** A plain-language confidence phrase derived from the rung + freshness. */
  confidenceLabel: string;
  /** OWNER — the named data owner, or `not recorded` when none is held. */
  owner: string;
  /** LINKED SEGMENT — the 14-segment context source, human-labelled. */
  linkedSegment: string;
  /** WHY USABLE — a plain-language one-liner on why the number can be trusted. */
  whyUsable: string;
  /** The underlying segment assessment, for callers that want the detail. */
  segmentAssessment: SegmentTrustAssessment | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A plain-language confidence phrase for a trust rung. */
const RUNG_CONFIDENCE: Record<TrustRung, string> = {
  verified: 'Verified — confirmed by a named owner or system of record',
  sourced: 'Sourced — imported from a real tenant artifact, not yet human-confirmed',
  inferred: 'Inferred — modelled by AbarVa from other context',
  stale: 'Stale — real data, but past its refresh cadence',
  missing: 'Missing — no data has been loaded for this segment',
};

/** Resolve the freshness assessment for a context segment, if it is tracked. */
function assessmentForSegment(
  segment: ContextSegmentKey,
  ctx: EvidenceResolutionContext,
): SegmentTrustAssessment | null {
  const meta = ctx.segmentFreshness.find((s) => s.segment === segment);
  if (!meta) return null;
  return assessSegment(
    {
      segment: meta.segment,
      lastUpdated: meta.lastUpdated,
      sourceType: meta.sourceType,
    },
    ctx.asOf,
  );
}

/** A trace where every field is the honest unknown placeholder. */
function unresolvedTrace(evidenceRef: string): EvidenceTrace {
  return {
    evidenceRef,
    kind: 'unresolved',
    title: evidenceRef,
    sourceRecord: NOT_RECORDED,
    lastRefreshed: NOT_RECORDED,
    ageDays: null,
    trustRung: 'missing',
    confidenceLabel: 'Unverified — this reference is not in the loaded tenant data',
    owner: NOT_RECORDED,
    linkedSegment: NOT_RECORDED,
    whyUsable:
      'AbarVa cannot trace this reference to any loaded record — treat the number as unverified.',
    segmentAssessment: null,
  };
}

/** Compose the why-usable one-liner from the rung + recency. */
function buildWhyUsable(
  subject: string,
  assessment: SegmentTrustAssessment | null,
): string {
  if (!assessment) {
    return `${subject} has no freshness provenance recorded — AbarVa cannot certify how current it is.`;
  }
  const { trustRung, ageDays, freshness } = assessment;
  if (trustRung === 'missing') {
    return `${subject} has no data loaded — do not rely on this number.`;
  }
  if (trustRung === 'stale') {
    return `${subject} is real tenant data but ${
      ageDays === null ? 'undated' : `~${Math.round(ageDays / 30)}mo old`
    } — past its refresh cadence; confirm before acting on it.`;
  }
  if (ageDays === null) {
    return `${subject} is real tenant data, but carries no source date — age cannot be certified.`;
  }
  if (freshness === 'fresh') {
    return `${subject} is ${ageDays}d old — within its refresh cadence, so the number is usable as-is.`;
  }
  return `${subject} is ~${Math.round(ageDays / 30)}mo old — past cadence but still inside the usable window; usable with a light caveat.`;
}

// ---------------------------------------------------------------------------
// Resolution
// ---------------------------------------------------------------------------

/**
 * Resolve a single `evidenceRef` into an `EvidenceTrace`.
 *
 * Resolution order — first match wins:
 *   1. a `vendor_contracts` contract row whose `contractId` equals the ref
 *   2. an `it_financials` line whose `recordId` equals the ref
 *   3. a bare context-segment name (`vendor_contracts`, `it_financials`, …)
 *   4. otherwise — `unresolved`, every field honestly `not recorded`
 *
 * Deterministic and pure: identical inputs always yield an identical trace.
 */
export function resolveEvidenceTrace(
  evidenceRef: string,
  ctx: EvidenceResolutionContext,
): EvidenceTrace {
  const ref = evidenceRef.trim();
  if (!ref) return unresolvedTrace(evidenceRef);

  // --- 1. A vendor contract row -----------------------------------------
  const contract = ctx.contracts.find((c) => c.contractId === ref);
  if (contract) {
    const assessment = assessmentForSegment('vendor_contracts', ctx);
    const subject = `${contract.vendorName} — ${contract.product}`;
    return {
      evidenceRef: ref,
      kind: 'contract',
      title: subject,
      sourceRecord: `vendor_contracts · record ${contract.contractId}`,
      lastRefreshed: assessment?.ageDays === null ? NOT_RECORDED : segmentDate('vendor_contracts', ctx),
      ageDays: assessment?.ageDays ?? null,
      trustRung: assessment?.trustRung ?? 'missing',
      confidenceLabel: assessment
        ? RUNG_CONFIDENCE[assessment.trustRung]
        : RUNG_CONFIDENCE.missing,
      owner: contract.ownerRef && contract.ownerRef.trim().length > 0
        ? contract.ownerRef.trim()
        : NOT_RECORDED,
      linkedSegment: humanizeSegmentKey('vendor_contracts'),
      whyUsable: buildWhyUsable(`This contract record (${subject})`, assessment),
      segmentAssessment: assessment,
    };
  }

  // --- 2. An IT-financials line -----------------------------------------
  const financial = ctx.financials.find((f) => f.recordId === ref);
  if (financial) {
    const assessment = assessmentForSegment('it_financials', ctx);
    const subject = `${financial.category} financial line`;
    return {
      evidenceRef: ref,
      kind: 'financial_line',
      title: subject,
      sourceRecord: `it_financials · record ${financial.recordId}`,
      lastRefreshed: assessment?.ageDays === null ? NOT_RECORDED : segmentDate('it_financials', ctx),
      ageDays: assessment?.ageDays ?? null,
      trustRung: assessment?.trustRung ?? 'missing',
      confidenceLabel: assessment
        ? RUNG_CONFIDENCE[assessment.trustRung]
        : RUNG_CONFIDENCE.missing,
      // IT-financials lines carry no per-row owner in the projected substrate.
      owner: NOT_RECORDED,
      linkedSegment: humanizeSegmentKey('it_financials'),
      whyUsable: buildWhyUsable(`This ${financial.category} benchmark line`, assessment),
      segmentAssessment: assessment,
    };
  }

  // --- 3. A bare context-segment name -----------------------------------
  const segMeta = ctx.segmentFreshness.find((s) => s.segment === ref);
  if (segMeta) {
    const assessment = assessmentForSegment(segMeta.segment, ctx);
    const label = humanizeSegmentKey(segMeta.segment);
    return {
      evidenceRef: ref,
      kind: 'segment',
      title: `${label} context segment`,
      sourceRecord: `Context segment · ${segMeta.segment}`,
      lastRefreshed:
        assessment === null || assessment.ageDays === null
          ? NOT_RECORDED
          : segmentDate(segMeta.segment, ctx),
      ageDays: assessment?.ageDays ?? null,
      trustRung: assessment?.trustRung ?? 'missing',
      confidenceLabel: assessment
        ? RUNG_CONFIDENCE[assessment.trustRung]
        : RUNG_CONFIDENCE.missing,
      owner: ownerForSegment(segMeta.sourceType),
      linkedSegment: label,
      whyUsable: buildWhyUsable(`The ${label} segment`, assessment),
      segmentAssessment: assessment,
    };
  }

  // --- 4. Unresolved -----------------------------------------------------
  return unresolvedTrace(ref);
}

/**
 * The ISO refresh date for a segment, read straight from the freshness
 * metadata (NOT re-derived) so the drawer shows the real recorded date.
 * Returns `not recorded` when the segment is untracked or carries no date.
 */
function segmentDate(
  segment: ContextSegmentKey,
  ctx: EvidenceResolutionContext,
): string {
  const meta = ctx.segmentFreshness.find((s) => s.segment === segment);
  return meta?.lastUpdated ?? NOT_RECORDED;
}

/**
 * The honest owner read for a bare segment. The substrate's
 * `SegmentFreshnessInput` carries no named owner, so a `verified` segment
 * means a human/system-of-record stands behind it but is not itself named,
 * and anything else is genuinely `not recorded`.
 */
function ownerForSegment(sourceType: ContextSourceType): string {
  if (sourceType === 'verified') {
    return 'Confirmed by a system of record (owner not named)';
  }
  return NOT_RECORDED;
}

/**
 * Resolve every ref in a list, de-duplicating by raw ref so a drawer never
 * shows the same trace twice. Order is preserved (first occurrence wins).
 */
export function resolveEvidenceTraces(
  evidenceRefs: string[],
  ctx: EvidenceResolutionContext,
): EvidenceTrace[] {
  const seen = new Set<string>();
  const out: EvidenceTrace[] = [];
  for (const ref of evidenceRefs) {
    const key = ref.trim();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(resolveEvidenceTrace(ref, ctx));
  }
  return out;
}
