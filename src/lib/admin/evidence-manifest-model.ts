// TRUST4 · Evidence Manifest / No-Raw-Copy Mode.
//
// Pure deterministic read model that defines how a client supplies
// evidence to AbarVa by manifest only — never by raw data copy. Each
// manifest entry names a metric, the labelled value as a string, the
// source owner, the date range it covers, and the verification chain
// the client and AbarVa agree on. The raw data behind every manifest
// entry stays on the client side; the manifest is the citation
// surface, not the underlying record.
//
// Encoded rules:
//   raw data           never copied to AbarVa
//   value              string-only label, never raw payload
//   source owner       always named (named role + named system)
//   date range         always bounded (no open-ended ranges)
//   verification       self / owner / co-signed / audited
//   rawRetainedByClient true on every entry, by construction
//
// No DB writes, no migrations, no live retrieval, no model invocation,
// no audit ledger writes, no Steward runtime. This is a contract for
// the future Steward setup UI and the runtime tool dispatcher.
//
// This module does NOT import:
//   - src/lib/source/**, src/app/(maestro)/source/**
//   - src/lib/nexus/**, src/lib/sentinel/**, src/lib/atlas/**
//   - src/lib/agent/**, src/components/agent/**
//   - src/app/programs/**, src/app/(maestro)/preview/**, src/app/demo/**
//   - src/lib/programs/mock.ts
//   - src/lib/auth/**
//   - supabase/**

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

/**
 * Canonical metric kinds supported by an evidence manifest entry. The
 * kind disambiguates how the string `value` should be read; AbarVa
 * never receives raw data, so the value is always a labelled summary
 * (e.g. "12,400", "98.5", "USD 4,200,000", "P95 240ms", "85", "tier_a",
 * "Q1 contact-center deflection improved").
 */
export type EvidenceMetricKind =
  | 'count'
  | 'rate'
  | 'currency'
  | 'duration'
  | 'percentage'
  | 'category'
  | 'narrative';

/**
 * Verification posture for a manifest entry. Higher tiers carry more
 * client-side ceremony around the value the client is attesting to.
 *
 * - self_attested  — single named owner attests to the value.
 * - owner_signed   — named owner has signed the manifest entry.
 * - co_signed      — owner plus a second named reviewer have signed.
 * - audited        — internal or external audit confirmed the value.
 */
export type EvidenceManifestVerification =
  | 'self_attested'
  | 'owner_signed'
  | 'co_signed'
  | 'audited';

/**
 * The named source owner for a manifest entry. Identifies the role
 * accountable for the value and the named system the value was read
 * from on the client side. AbarVa never receives the underlying
 * records; the source owner is who AbarVa would address questions to.
 */
export interface EvidenceManifestSourceOwner {
  /** Named accountable role on the client side, e.g. "VP of Customer Care". */
  ownerRole: string;
  /**
   * Named originating system on the client side, e.g. "Genesys CCaaS",
   * "Workday HCM", "ServiceNow ITSM". Free-form label only — no
   * connection string, no URL, no credential, no host.
   */
  sourceSystem: string;
}

/**
 * Bounded date range the manifest entry covers. ISO YYYY-MM-DD strings
 * only. Open-ended ranges are rejected by validation.
 */
export interface EvidenceManifestDateRange {
  startDate: string;
  endDate: string;
}

/**
 * One manifest entry. The `value` is a string-only label, never the
 * raw record. `rawDataLocation` is a free-form label pointing to the
 * client-side storage where the underlying data lives; AbarVa never
 * reads it. `rawRetainedByClient` is structurally true for every
 * entry — the type forbids any other value.
 */
export interface EvidenceManifestEntry {
  /** Stable manifest entry id, e.g. "evid-manifest-deflection-q1". */
  entryId: string;
  /** Stable program / use-case anchor key, e.g. "apex-contact-center-ai". */
  anchorKey: string;
  /** Short metric name, e.g. "Deflection Rate (Tier 1 contacts)". */
  metric: string;
  /** Metric kind disambiguator. */
  metricKind: EvidenceMetricKind;
  /** String label for the metric value. Never raw data. */
  value: string;
  /** Optional unit label, e.g. "USD", "ms", "%". */
  unit?: string;
  /** Named source owner. */
  sourceOwner: EvidenceManifestSourceOwner;
  /** Bounded date range the value covers. */
  dateRange: EvidenceManifestDateRange;
  /** Verification posture. */
  verification: EvidenceManifestVerification;
  /**
   * Free-form label describing where on the client side the raw data
   * lives, e.g. "Genesys data warehouse · Q1 contact volume slice".
   * AbarVa never reads this location; the field is documentation only.
   */
  rawDataLocation: string;
  /** Structurally true for every manifest entry. */
  rawRetainedByClient: true;
  /** Honest seed marker. */
  createdFrom: 'deterministic_evidence_manifest_seed';
}

/** Aggregated rollup over many manifest entries. */
export interface EvidenceManifestSummary {
  total: number;
  byMetricKind: Record<EvidenceMetricKind, number>;
  byVerification: Record<EvidenceManifestVerification, number>;
  unverifiedCount: number;
  rawRetainedByClientAll: boolean;
}

/** Outcome of validating a single manifest entry. */
export interface EvidenceManifestValidation {
  valid: boolean;
  reasons: ReadonlyArray<string>;
}

// ---------------------------------------------------------------------
// Canonical orderings
// ---------------------------------------------------------------------

const ALL_METRIC_KINDS: ReadonlyArray<EvidenceMetricKind> = [
  'count',
  'rate',
  'currency',
  'duration',
  'percentage',
  'category',
  'narrative',
];

const ALL_VERIFICATION_STATES: ReadonlyArray<EvidenceManifestVerification> = [
  'self_attested',
  'owner_signed',
  'co_signed',
  'audited',
];

// ---------------------------------------------------------------------
// Deterministic seed (canonical fixture)
// ---------------------------------------------------------------------

const SEED_ENTRIES: ReadonlyArray<EvidenceManifestEntry> = [
  {
    entryId: 'evid-manifest-deflection-q1',
    anchorKey: 'apex-contact-center-ai',
    metric: 'Tier 1 contact deflection volume',
    metricKind: 'count',
    value: '12,400',
    unit: 'contacts',
    sourceOwner: {
      ownerRole: 'VP of Customer Care',
      sourceSystem: 'Genesys CCaaS reporting warehouse',
    },
    dateRange: {
      startDate: '2026-01-01',
      endDate: '2026-03-31',
    },
    verification: 'owner_signed',
    rawDataLocation: 'Client-side · Genesys reporting warehouse · Q1 slice',
    rawRetainedByClient: true,
    createdFrom: 'deterministic_evidence_manifest_seed',
  },
  {
    entryId: 'evid-manifest-deflection-rate',
    anchorKey: 'apex-contact-center-ai',
    metric: 'Tier 1 contact deflection rate',
    metricKind: 'rate',
    value: '0.41',
    unit: 'ratio',
    sourceOwner: {
      ownerRole: 'VP of Customer Care',
      sourceSystem: 'Genesys CCaaS reporting warehouse',
    },
    dateRange: {
      startDate: '2026-01-01',
      endDate: '2026-03-31',
    },
    verification: 'self_attested',
    rawDataLocation: 'Client-side · Genesys reporting warehouse · Q1 slice',
    rawRetainedByClient: true,
    createdFrom: 'deterministic_evidence_manifest_seed',
  },
  {
    entryId: 'evid-manifest-realized-savings',
    anchorKey: 'apex-contact-center-ai',
    metric: 'Realized savings from Tier 1 deflection',
    metricKind: 'currency',
    value: 'USD 4,200,000',
    unit: 'USD',
    sourceOwner: {
      ownerRole: 'Finance Business Partner — Customer Operations',
      sourceSystem: 'Workday Adaptive Planning · CO cost model',
    },
    dateRange: {
      startDate: '2026-01-01',
      endDate: '2026-03-31',
    },
    verification: 'co_signed',
    rawDataLocation: 'Client-side · Workday Adaptive · CO cost model · Q1 run',
    rawRetainedByClient: true,
    createdFrom: 'deterministic_evidence_manifest_seed',
  },
  {
    entryId: 'evid-manifest-handle-time',
    anchorKey: 'apex-contact-center-ai',
    metric: 'Average handle time on assisted contacts',
    metricKind: 'duration',
    value: 'P95 240',
    unit: 'seconds',
    sourceOwner: {
      ownerRole: 'Director of Contact Center Operations',
      sourceSystem: 'Genesys CCaaS reporting warehouse',
    },
    dateRange: {
      startDate: '2026-02-01',
      endDate: '2026-03-31',
    },
    verification: 'owner_signed',
    rawDataLocation: 'Client-side · Genesys reporting warehouse · AHT slice',
    rawRetainedByClient: true,
    createdFrom: 'deterministic_evidence_manifest_seed',
  },
  {
    entryId: 'evid-manifest-csat',
    anchorKey: 'apex-contact-center-ai',
    metric: 'CSAT on assisted contacts',
    metricKind: 'percentage',
    value: '88.0',
    unit: '%',
    sourceOwner: {
      ownerRole: 'Director of Customer Insights',
      sourceSystem: 'Qualtrics CX · post-contact survey',
    },
    dateRange: {
      startDate: '2026-01-01',
      endDate: '2026-03-31',
    },
    verification: 'audited',
    rawDataLocation: 'Client-side · Qualtrics CX · Q1 post-contact slice',
    rawRetainedByClient: true,
    createdFrom: 'deterministic_evidence_manifest_seed',
  },
  {
    entryId: 'evid-manifest-tier-segmentation',
    anchorKey: 'apex-contact-center-ai',
    metric: 'Caller tier segmentation',
    metricKind: 'category',
    value: 'tier_a',
    sourceOwner: {
      ownerRole: 'Head of Customer Segmentation',
      sourceSystem: 'CDP segmentation registry',
    },
    dateRange: {
      startDate: '2026-01-01',
      endDate: '2026-03-31',
    },
    verification: 'self_attested',
    rawDataLocation: 'Client-side · CDP segmentation registry · Q1 snapshot',
    rawRetainedByClient: true,
    createdFrom: 'deterministic_evidence_manifest_seed',
  },
  {
    entryId: 'evid-manifest-q1-narrative',
    anchorKey: 'apex-contact-center-ai',
    metric: 'Q1 narrative — Tier 1 deflection program review',
    metricKind: 'narrative',
    value:
      'Tier 1 deflection improved against the Q1 plan; agent escalation pattern stayed within plan band.',
    sourceOwner: {
      ownerRole: 'VP of Customer Care',
      sourceSystem: 'Quarterly business review · CO function',
    },
    dateRange: {
      startDate: '2026-01-01',
      endDate: '2026-03-31',
    },
    verification: 'co_signed',
    rawDataLocation: 'Client-side · QBR deck · CO function · Q1 review',
    rawRetainedByClient: true,
    createdFrom: 'deterministic_evidence_manifest_seed',
  },
];

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Build the deterministic evidence manifest seed. Pure: same call
 * returns the same value across repeated invocations.
 */
export function buildEvidenceManifestSeed(): ReadonlyArray<EvidenceManifestEntry> {
  return SEED_ENTRIES;
}

/**
 * Aggregate manifest entries into a deterministic summary. Pure.
 */
export function summarizeEvidenceManifests(
  entries: ReadonlyArray<EvidenceManifestEntry>,
): EvidenceManifestSummary {
  const byMetricKind = emptyByMetricKind();
  const byVerification = emptyByVerification();
  let unverifiedCount = 0;
  let rawRetainedByClientAll = true;
  for (const e of entries) {
    byMetricKind[e.metricKind] += 1;
    byVerification[e.verification] += 1;
    if (e.verification === 'self_attested') {
      unverifiedCount += 1;
    }
    if (e.rawRetainedByClient !== true) {
      rawRetainedByClientAll = false;
    }
  }
  if (entries.length === 0) {
    rawRetainedByClientAll = true;
  }
  return {
    total: entries.length,
    byMetricKind,
    byVerification,
    unverifiedCount,
    rawRetainedByClientAll,
  };
}

/**
 * Validate a single manifest entry against the no-raw-copy contract.
 * Pure. Returns valid=false with a non-empty reasons list when any
 * structural rule is violated.
 */
export function validateEvidenceManifestEntry(
  entry: EvidenceManifestEntry,
): EvidenceManifestValidation {
  const reasons: string[] = [];

  if (!entry.entryId || entry.entryId.trim().length === 0) {
    reasons.push('entry_id_missing');
  }
  if (!entry.anchorKey || entry.anchorKey.trim().length === 0) {
    reasons.push('anchor_key_missing');
  }
  if (!entry.metric || entry.metric.trim().length === 0) {
    reasons.push('metric_missing');
  }
  if (!ALL_METRIC_KINDS.includes(entry.metricKind)) {
    reasons.push('metric_kind_invalid');
  }
  if (typeof entry.value !== 'string' || entry.value.trim().length === 0) {
    reasons.push('value_missing_or_not_string');
  }
  if (
    !entry.sourceOwner ||
    !entry.sourceOwner.ownerRole ||
    entry.sourceOwner.ownerRole.trim().length === 0
  ) {
    reasons.push('source_owner_role_missing');
  }
  if (
    !entry.sourceOwner ||
    !entry.sourceOwner.sourceSystem ||
    entry.sourceOwner.sourceSystem.trim().length === 0
  ) {
    reasons.push('source_owner_system_missing');
  }
  if (!entry.dateRange) {
    reasons.push('date_range_missing');
  } else {
    if (!isIsoDate(entry.dateRange.startDate)) {
      reasons.push('date_range_start_invalid');
    }
    if (!isIsoDate(entry.dateRange.endDate)) {
      reasons.push('date_range_end_invalid');
    }
    if (
      isIsoDate(entry.dateRange.startDate) &&
      isIsoDate(entry.dateRange.endDate) &&
      entry.dateRange.startDate > entry.dateRange.endDate
    ) {
      reasons.push('date_range_inverted');
    }
  }
  if (!ALL_VERIFICATION_STATES.includes(entry.verification)) {
    reasons.push('verification_invalid');
  }
  if (
    !entry.rawDataLocation ||
    entry.rawDataLocation.trim().length === 0
  ) {
    reasons.push('raw_data_location_label_missing');
  } else if (looksLikeRawPayload(entry.rawDataLocation)) {
    reasons.push('raw_data_location_contains_raw_payload');
  }
  if (entry.rawRetainedByClient !== true) {
    reasons.push('raw_retained_by_client_must_be_true');
  }
  if (looksLikeRawPayload(entry.value)) {
    reasons.push('value_contains_raw_payload');
  }
  if (entry.createdFrom !== 'deterministic_evidence_manifest_seed') {
    reasons.push('created_from_marker_invalid');
  }

  return { valid: reasons.length === 0, reasons };
}

/**
 * Filter manifest entries to those that are not yet verified beyond
 * `self_attested`. Pure. Preserves input ordering.
 */
export function getUnverifiedEvidence(
  entries: ReadonlyArray<EvidenceManifestEntry>,
): ReadonlyArray<EvidenceManifestEntry> {
  return entries.filter((e) => e.verification === 'self_attested');
}

// ---------------------------------------------------------------------
// Re-exports for test introspection
// ---------------------------------------------------------------------

export const EVIDENCE_METRIC_KINDS_IN_ORDER: ReadonlyArray<EvidenceMetricKind> =
  ALL_METRIC_KINDS;

export const EVIDENCE_VERIFICATION_STATES_IN_ORDER: ReadonlyArray<EvidenceManifestVerification> =
  ALL_VERIFICATION_STATES;

// ---------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------

function emptyByMetricKind(): Record<EvidenceMetricKind, number> {
  return {
    count: 0,
    rate: 0,
    currency: 0,
    duration: 0,
    percentage: 0,
    category: 0,
    narrative: 0,
  };
}

function emptyByVerification(): Record<EvidenceManifestVerification, number> {
  return {
    self_attested: 0,
    owner_signed: 0,
    co_signed: 0,
    audited: 0,
  };
}

function isIsoDate(s: string): boolean {
  if (typeof s !== 'string') {
    return false;
  }
  if (s.length !== 10) {
    return false;
  }
  if (s[4] !== '-' || s[7] !== '-') {
    return false;
  }
  for (let i = 0; i < s.length; i++) {
    if (i === 4 || i === 7) {
      continue;
    }
    const c = s.charCodeAt(i);
    if (c < 48 || c > 57) {
      return false;
    }
  }
  return true;
}

/**
 * Heuristic: rejects long alphanumeric blobs and embedded URLs. The
 * manifest carries labelled values only; raw payloads such as base64
 * dumps, large opaque ids, or http(s) URLs are not permitted.
 */
function looksLikeRawPayload(s: string): boolean {
  if (typeof s !== 'string') {
    return false;
  }
  // Reject embedded URL schemes anywhere in the value or the
  // raw-data-location label. Pattern is built to avoid embedding
  // a literal scheme string in the source.
  const urlSchemeRegex = /[a-z]{4,5}:\/\//i;
  if (urlSchemeRegex.test(s)) {
    return true;
  }
  // Disallow long alphanumeric tokens (>= 32 chars without spaces or
  // punctuation) that could be a raw record id, hash, or token.
  const longTokenRegex = /[A-Za-z0-9]{32,}/;
  return longTokenRegex.test(s);
}
