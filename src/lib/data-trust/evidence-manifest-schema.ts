// EVID1 · Evidence Manifest Schema.
//
// Pure deterministic read model that defines the claim-to-source mapping
// schema for AbarVa evidence. Every claim surfaced in the platform must
// trace back to a named source entry in an evidence manifest. This module
// defines the structural schema: claim identity, source provenance, confidence
// tier, freshness, citation display, and the blocked/missing disclosure rules.
//
// Design principles (encoded in types):
//   claim        → must name its source manifest entries
//   confidence   → deterministic tier, never model-inferred without disclosure
//   provenance   → source system + owner + date range always required
//   freshness    → staleness window defined per claim kind
//   citation     → display format contract for the UI
//   missing      → "no data" is a first-class disclosed state
//
// No DB writes, no migrations, no live retrieval, no model invocation,
// no upload/parsing pipeline, no real evidence registry, no Date.now reads,
// no random IDs.
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
// Confidence tier
// ---------------------------------------------------------------------

/**
 * Canonical confidence tiers for an evidence claim. Deterministic tiers
 * that the Sentinel agent or Steward gate assigns based on the evidence
 * manifest's verification posture, staleness, and completeness.
 *
 * - high           → audited or co-signed, within freshness window
 * - medium         → owner-signed, within freshness window
 * - low            → self-attested only
 * - stale          → outside the freshness window regardless of posture
 * - missing        → source manifest entry is absent or explicitly absent
 * - blocked        → access policy blocks the use of the source
 */
export type EvidenceConfidenceTier =
  | 'high'
  | 'medium'
  | 'low'
  | 'stale'
  | 'missing'
  | 'blocked';

/**
 * Descriptor for a confidence tier — includes label, colour token,
 * and guidance text for the UI and Steward agent.
 */
export interface EvidenceConfidenceTierDescriptor {
  tier: EvidenceConfidenceTier;
  /** Short UI label. */
  label: string;
  /** Colour token — maps to the design-system token set. */
  colourToken: 'green' | 'amber' | 'red' | 'slate' | 'orange';
  /** Single-sentence display guidance for the claim consumer. */
  guidance: string;
  /**
   * True when this tier permits the claim to be cited in a decision
   * artifact without a disclosure caveat.
   */
  permitsDecisionCitation: boolean;
  /**
   * True when this tier requires a visible disclosure caveat on the
   * claim's citation in the UI.
   */
  requiresDisclosure: boolean;
}

// ---------------------------------------------------------------------
// Provenance
// ---------------------------------------------------------------------

/**
 * Provenance record for a single manifest-backed source. Must name the
 * source system, the accountable owner role, and the bounded date range
 * the value covers. AbarVa never receives the underlying raw records.
 */
export interface EvidenceProvenanceRecord {
  /** Stable manifest entry id this provenance points to. */
  manifestEntryId: string;
  /** Named system on the client side, e.g. "Genesys CCaaS". */
  sourceSystem: string;
  /** Accountable role, e.g. "VP of Customer Care". */
  ownerRole: string;
  /** ISO YYYY-MM-DD bounded start. */
  periodStart: string;
  /** ISO YYYY-MM-DD bounded end. */
  periodEnd: string;
  /**
   * Verification posture for this source entry. Mirrors the four tiers
   * in the evidence-manifest-model (TRUST4) without importing it to
   * avoid circular coupling.
   */
  verification: 'self_attested' | 'owner_signed' | 'co_signed' | 'audited';
}

// ---------------------------------------------------------------------
// Freshness
// ---------------------------------------------------------------------

/**
 * Canonical freshness window definitions per claim kind. A claim is
 * "stale" when the gap between `periodEnd` and the evaluation date
 * exceeds the `staleDaysThreshold`.
 */
export type EvidenceClaimKind =
  | 'operational_kpi'
  | 'financial_result'
  | 'project_milestone'
  | 'vendor_benchmark'
  | 'risk_assessment'
  | 'approval_outcome'
  | 'narrative_summary';

export interface EvidenceFreshnessRule {
  claimKind: EvidenceClaimKind;
  /** Days after `periodEnd` before the claim is considered stale. */
  staleDaysThreshold: number;
  /**
   * When true, Steward must surface a staleness warning even for
   * high-confidence evidence past this window.
   */
  requiresStalenessWarning: boolean;
}

// ---------------------------------------------------------------------
// Citation display
// ---------------------------------------------------------------------

/**
 * Citation display contract. Defines how a claim is rendered in the
 * UI with its source label, confidence badge, and optional disclosure
 * caveat. The UI must show the disclosure caveat when
 * `confidenceTier` is 'stale', 'missing', or 'blocked'.
 */
export interface EvidenceCitationDisplay {
  /** Short display label for the cited metric or claim. */
  claimLabel: string;
  /** String-only value label. Never raw data. */
  valueLabel: string;
  /** Optional unit label, e.g. "%", "USD", "contacts". */
  unitLabel?: string;
  /** Resolved confidence tier. */
  confidenceTier: EvidenceConfidenceTier;
  /**
   * Source display label, e.g. "Genesys CCaaS · Q1 2026".
   * Must not include raw data or connection strings.
   */
  sourceDisplayLabel: string;
  /**
   * Disclosed when the confidence tier requires it. Must be surfaced
   * prominently — not hidden in a tooltip.
   */
  disclosureCaveat?: string;
  /**
   * True when this citation is backed by at least one manifest entry
   * with verification >= 'owner_signed'.
   */
  verifiedAttestation: boolean;
  createdFrom: 'deterministic_evidence_manifest_schema_seed';
}

// ---------------------------------------------------------------------
// Claim schema
// ---------------------------------------------------------------------

/**
 * Full evidence claim schema entry. A claim links a UI-surfaced
 * assertion to one or more provenance records in the evidence manifest.
 * The schema enforces that every claim names its sources; "unknown
 * source" is not a valid provenance state — the claim must be
 * downgraded to 'missing' instead.
 */
export interface EvidenceClaimSchema {
  /** Stable claim id, e.g. "claim-deflection-rate-q1-2026". */
  claimId: string;
  /** Stable anchor key linking to a program/initiative. */
  anchorKey: string;
  /** Claim kind for freshness rule lookup. */
  claimKind: EvidenceClaimKind;
  /** Human-readable claim description. */
  claimDescription: string;
  /** List of provenance records backing this claim. */
  provenanceRecords: ReadonlyArray<EvidenceProvenanceRecord>;
  /** Resolved confidence tier. */
  confidenceTier: EvidenceConfidenceTier;
  /**
   * When true, the underlying source has no manifest entry. The claim
   * must render as 'missing' and surface the disclosureCaveat.
   */
  sourceAbsent: boolean;
  /**
   * When true, the underlying source exists but access policy blocks
   * the use. The claim must render as 'blocked'.
   */
  sourceBlocked: boolean;
  citationDisplay: EvidenceCitationDisplay;
  createdFrom: 'deterministic_evidence_manifest_schema_seed';
}

/** Aggregated summary over many claim schema entries. */
export interface EvidenceClaimSchemaSummary {
  total: number;
  byConfidenceTier: Record<EvidenceConfidenceTier, number>;
  byClaimKind: Record<EvidenceClaimKind, number>;
  missingSourceCount: number;
  blockedSourceCount: number;
  requiresDisclosureCount: number;
  verifiedAttestationCount: number;
}

// ---------------------------------------------------------------------
// Canonical orderings
// ---------------------------------------------------------------------

const ALL_CONFIDENCE_TIERS: ReadonlyArray<EvidenceConfidenceTier> = [
  'high',
  'medium',
  'low',
  'stale',
  'missing',
  'blocked',
];

const ALL_CLAIM_KINDS: ReadonlyArray<EvidenceClaimKind> = [
  'operational_kpi',
  'financial_result',
  'project_milestone',
  'vendor_benchmark',
  'risk_assessment',
  'approval_outcome',
  'narrative_summary',
];

// ---------------------------------------------------------------------
// Canonical confidence tier descriptors
// ---------------------------------------------------------------------

const CONFIDENCE_TIER_DESCRIPTORS: ReadonlyArray<EvidenceConfidenceTierDescriptor> =
  [
    {
      tier: 'high',
      label: 'High confidence',
      colourToken: 'green',
      guidance:
        'Audited or co-signed source within the freshness window. Permitted for decision citation without disclosure caveat.',
      permitsDecisionCitation: true,
      requiresDisclosure: false,
    },
    {
      tier: 'medium',
      label: 'Medium confidence',
      colourToken: 'amber',
      guidance:
        'Owner-signed source within the freshness window. Permitted for citation; consider co-sign or audit before executive review.',
      permitsDecisionCitation: true,
      requiresDisclosure: false,
    },
    {
      tier: 'low',
      label: 'Low confidence',
      colourToken: 'orange',
      guidance:
        'Self-attested source only. Permitted as supporting context; requires owner-sign before decision citation.',
      permitsDecisionCitation: false,
      requiresDisclosure: true,
    },
    {
      tier: 'stale',
      label: 'Stale — outside freshness window',
      colourToken: 'amber',
      guidance:
        'Source is outside the freshness window for this claim kind. Refresh the source or surface the staleness caveat prominently.',
      permitsDecisionCitation: false,
      requiresDisclosure: true,
    },
    {
      tier: 'missing',
      label: 'Source missing',
      colourToken: 'red',
      guidance:
        'No evidence manifest entry found for this claim. Block the citation or replace with a "data not yet available" disclosure.',
      permitsDecisionCitation: false,
      requiresDisclosure: true,
    },
    {
      tier: 'blocked',
      label: 'Source blocked',
      colourToken: 'red',
      guidance:
        'An access policy is blocking the use of this source. Resolve the policy gate before surfacing the claim.',
      permitsDecisionCitation: false,
      requiresDisclosure: true,
    },
  ];

// ---------------------------------------------------------------------
// Canonical freshness rules
// ---------------------------------------------------------------------

const FRESHNESS_RULES: ReadonlyArray<EvidenceFreshnessRule> = [
  {
    claimKind: 'operational_kpi',
    staleDaysThreshold: 90,
    requiresStalenessWarning: true,
  },
  {
    claimKind: 'financial_result',
    staleDaysThreshold: 180,
    requiresStalenessWarning: true,
  },
  {
    claimKind: 'project_milestone',
    staleDaysThreshold: 365,
    requiresStalenessWarning: false,
  },
  {
    claimKind: 'vendor_benchmark',
    staleDaysThreshold: 180,
    requiresStalenessWarning: true,
  },
  {
    claimKind: 'risk_assessment',
    staleDaysThreshold: 180,
    requiresStalenessWarning: true,
  },
  {
    claimKind: 'approval_outcome',
    staleDaysThreshold: 365,
    requiresStalenessWarning: false,
  },
  {
    claimKind: 'narrative_summary',
    staleDaysThreshold: 365,
    requiresStalenessWarning: false,
  },
];

// ---------------------------------------------------------------------
// Deterministic seed claims
// ---------------------------------------------------------------------

const SEED_CLAIMS: ReadonlyArray<EvidenceClaimSchema> = [
  {
    claimId: 'claim-deflection-rate-q1-2026',
    anchorKey: 'apex-contact-center-ai',
    claimKind: 'operational_kpi',
    claimDescription: 'Tier 1 contact deflection rate for Q1 2026',
    provenanceRecords: [
      {
        manifestEntryId: 'evid-manifest-deflection-rate',
        sourceSystem: 'Genesys CCaaS reporting warehouse',
        ownerRole: 'VP of Customer Care',
        periodStart: '2026-01-01',
        periodEnd: '2026-03-31',
        verification: 'self_attested',
      },
    ],
    confidenceTier: 'low',
    sourceAbsent: false,
    sourceBlocked: false,
    citationDisplay: {
      claimLabel: 'Tier 1 deflection rate',
      valueLabel: '0.41',
      unitLabel: 'ratio',
      confidenceTier: 'low',
      sourceDisplayLabel: 'Genesys CCaaS · Q1 2026',
      disclosureCaveat:
        'Self-attested source only — requires owner sign-off before decision citation.',
      verifiedAttestation: false,
      createdFrom: 'deterministic_evidence_manifest_schema_seed',
    },
    createdFrom: 'deterministic_evidence_manifest_schema_seed',
  },
  {
    claimId: 'claim-realized-savings-q1-2026',
    anchorKey: 'apex-contact-center-ai',
    claimKind: 'financial_result',
    claimDescription: 'Realized savings from Tier 1 deflection in Q1 2026',
    provenanceRecords: [
      {
        manifestEntryId: 'evid-manifest-realized-savings',
        sourceSystem: 'Workday Adaptive Planning · CO cost model',
        ownerRole: 'Finance Business Partner — Customer Operations',
        periodStart: '2026-01-01',
        periodEnd: '2026-03-31',
        verification: 'co_signed',
      },
    ],
    confidenceTier: 'high',
    sourceAbsent: false,
    sourceBlocked: false,
    citationDisplay: {
      claimLabel: 'Realized savings from deflection',
      valueLabel: 'USD 4,200,000',
      unitLabel: 'USD',
      confidenceTier: 'high',
      sourceDisplayLabel: 'Workday Adaptive Planning · CO cost model · Q1 2026',
      verifiedAttestation: true,
      createdFrom: 'deterministic_evidence_manifest_schema_seed',
    },
    createdFrom: 'deterministic_evidence_manifest_schema_seed',
  },
  {
    claimId: 'claim-csat-q1-2026',
    anchorKey: 'apex-contact-center-ai',
    claimKind: 'operational_kpi',
    claimDescription: 'CSAT on assisted contacts for Q1 2026',
    provenanceRecords: [
      {
        manifestEntryId: 'evid-manifest-csat',
        sourceSystem: 'Qualtrics CX · post-contact survey',
        ownerRole: 'Director of Customer Insights',
        periodStart: '2026-01-01',
        periodEnd: '2026-03-31',
        verification: 'audited',
      },
    ],
    confidenceTier: 'high',
    sourceAbsent: false,
    sourceBlocked: false,
    citationDisplay: {
      claimLabel: 'CSAT on assisted contacts',
      valueLabel: '88.0',
      unitLabel: '%',
      confidenceTier: 'high',
      sourceDisplayLabel: 'Qualtrics CX · Q1 post-contact survey',
      verifiedAttestation: true,
      createdFrom: 'deterministic_evidence_manifest_schema_seed',
    },
    createdFrom: 'deterministic_evidence_manifest_schema_seed',
  },
  {
    claimId: 'claim-vendor-benchmark-missing',
    anchorKey: 'apex-contact-center-ai',
    claimKind: 'vendor_benchmark',
    claimDescription: 'Vendor benchmark comparison — source not yet available',
    provenanceRecords: [],
    confidenceTier: 'missing',
    sourceAbsent: true,
    sourceBlocked: false,
    citationDisplay: {
      claimLabel: 'Vendor benchmark comparison',
      valueLabel: 'Not available',
      confidenceTier: 'missing',
      sourceDisplayLabel: 'No source manifest entry found',
      disclosureCaveat:
        'Source data not yet available — claim cannot be cited until a manifest entry is provided.',
      verifiedAttestation: false,
      createdFrom: 'deterministic_evidence_manifest_schema_seed',
    },
    createdFrom: 'deterministic_evidence_manifest_schema_seed',
  },
  {
    claimId: 'claim-handle-time-q1-2026',
    anchorKey: 'apex-contact-center-ai',
    claimKind: 'operational_kpi',
    claimDescription: 'Average handle time on assisted contacts for Q1 2026',
    provenanceRecords: [
      {
        manifestEntryId: 'evid-manifest-handle-time',
        sourceSystem: 'Genesys CCaaS reporting warehouse',
        ownerRole: 'Director of Contact Center Operations',
        periodStart: '2026-02-01',
        periodEnd: '2026-03-31',
        verification: 'owner_signed',
      },
    ],
    confidenceTier: 'medium',
    sourceAbsent: false,
    sourceBlocked: false,
    citationDisplay: {
      claimLabel: 'Average handle time',
      valueLabel: 'P95 240',
      unitLabel: 'seconds',
      confidenceTier: 'medium',
      sourceDisplayLabel: 'Genesys CCaaS · Feb–Mar 2026',
      verifiedAttestation: true,
      createdFrom: 'deterministic_evidence_manifest_schema_seed',
    },
    createdFrom: 'deterministic_evidence_manifest_schema_seed',
  },
];

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * List all canonical confidence tier descriptors in display order.
 * Pure: same call → identical output.
 */
export function listEvidenceConfidenceTiers(): ReadonlyArray<EvidenceConfidenceTierDescriptor> {
  return CONFIDENCE_TIER_DESCRIPTORS;
}

/**
 * List all canonical freshness rules by claim kind.
 * Pure.
 */
export function listEvidenceFreshnessRules(): ReadonlyArray<EvidenceFreshnessRule> {
  return FRESHNESS_RULES;
}

/**
 * Look up the freshness rule for a specific claim kind.
 * Returns undefined if the kind is not in the canonical set.
 * Pure.
 */
export function getFreshnessRule(
  kind: EvidenceClaimKind,
): EvidenceFreshnessRule | undefined {
  return FRESHNESS_RULES.find((r) => r.claimKind === kind);
}

/**
 * Look up a confidence tier descriptor by tier value.
 * Returns undefined for unknown tiers.
 * Pure.
 */
export function getConfidenceTierDescriptor(
  tier: EvidenceConfidenceTier,
): EvidenceConfidenceTierDescriptor | undefined {
  return CONFIDENCE_TIER_DESCRIPTORS.find((d) => d.tier === tier);
}

/**
 * Build the deterministic evidence claim schema seed. Pure.
 */
export function buildEvidenceClaimSchemaSeed(): ReadonlyArray<EvidenceClaimSchema> {
  return SEED_CLAIMS;
}

/**
 * Evaluate the confidence tier for a claim given verification posture and
 * a simplified staleness indicator. Pure — does not read the clock.
 *
 * @param verification - The verification posture of the backing manifest entry.
 * @param isStale - True when the caller has already determined the source is outside the freshness window.
 * @param sourceAbsent - True when no manifest entry exists for this claim.
 * @param sourceBlocked - True when an access policy blocks the source.
 */
export function resolveConfidenceTier(
  verification: 'self_attested' | 'owner_signed' | 'co_signed' | 'audited',
  isStale: boolean,
  sourceAbsent: boolean,
  sourceBlocked: boolean,
): EvidenceConfidenceTier {
  if (sourceBlocked) {
    return 'blocked';
  }
  if (sourceAbsent) {
    return 'missing';
  }
  if (isStale) {
    return 'stale';
  }
  if (verification === 'audited' || verification === 'co_signed') {
    return 'high';
  }
  if (verification === 'owner_signed') {
    return 'medium';
  }
  return 'low';
}

/**
 * Summarize a collection of claim schema entries. Pure.
 */
export function summarizeEvidenceClaimSchema(
  claims: ReadonlyArray<EvidenceClaimSchema>,
): EvidenceClaimSchemaSummary {
  const byConfidenceTier = emptyByConfidenceTier();
  const byClaimKind = emptyByClaimKind();
  let missingSourceCount = 0;
  let blockedSourceCount = 0;
  let requiresDisclosureCount = 0;
  let verifiedAttestationCount = 0;

  for (const claim of claims) {
    byConfidenceTier[claim.confidenceTier] += 1;
    byClaimKind[claim.claimKind] += 1;
    if (claim.sourceAbsent) {
      missingSourceCount += 1;
    }
    if (claim.sourceBlocked) {
      blockedSourceCount += 1;
    }
    const tierDesc = CONFIDENCE_TIER_DESCRIPTORS.find(
      (d) => d.tier === claim.confidenceTier,
    );
    if (tierDesc?.requiresDisclosure) {
      requiresDisclosureCount += 1;
    }
    if (claim.citationDisplay.verifiedAttestation) {
      verifiedAttestationCount += 1;
    }
  }

  return {
    total: claims.length,
    byConfidenceTier,
    byClaimKind,
    missingSourceCount,
    blockedSourceCount,
    requiresDisclosureCount,
    verifiedAttestationCount,
  };
}

// ---------------------------------------------------------------------
// Re-exports for test introspection
// ---------------------------------------------------------------------

export const EVIDENCE_CONFIDENCE_TIERS_IN_ORDER: ReadonlyArray<EvidenceConfidenceTier> =
  ALL_CONFIDENCE_TIERS;

export const EVIDENCE_CLAIM_KINDS_IN_ORDER: ReadonlyArray<EvidenceClaimKind> =
  ALL_CLAIM_KINDS;

// ---------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------

function emptyByConfidenceTier(): Record<EvidenceConfidenceTier, number> {
  return {
    high: 0,
    medium: 0,
    low: 0,
    stale: 0,
    missing: 0,
    blocked: 0,
  };
}

function emptyByClaimKind(): Record<EvidenceClaimKind, number> {
  return {
    operational_kpi: 0,
    financial_result: 0,
    project_milestone: 0,
    vendor_benchmark: 0,
    risk_assessment: 0,
    approval_outcome: 0,
    narrative_summary: 0,
  };
}
