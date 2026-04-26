// EVID3 - Evidence Claim Support Model
//
// Deterministic, file-pure evaluator that scores how well a claim made
// against a canonical work object is supported by the Evidence Ledger
// MVP (EVID2). This module is Lane D output of the parallel build pack.
//
// EVID3 is intentionally honest about what it can and cannot do:
//
//   - It does NOT call any model provider. There is no NLP, no LLM,
//     no embedding service, no live retrieval.
//   - It does NOT fabricate citations. It works strictly against
//     EVID2 entries which use the `evid-seed-` id prefix; no
//     production-shaped `E-\d+` identifiers are constructed here.
//   - It does NOT mutate inputs and does NOT reach the network or
//     the file system at runtime.
//
// What it does provide is a typed, deterministic scoring surface
// over EVID2 entries. Given a claim and a slice of EVID2 entries,
// it returns one of seven canonical support statuses with a short
// rationale and a structured list of gaps and contradictions.
//
// The seven statuses (canonical order, contract-level):
//
//   1. supported              - matching usable entries cover all expected ids.
//   2. partially_supported    - usable entries exist but expected ids missing.
//   3. unsupported            - no entry has reached usable_as_evidence.
//   4. contradicted           - a usable entry directly contradicts the claim.
//   5. missing_evidence       - no entries match the claim's work object.
//   6. stale_evidence         - matching entries are flagged stale only.
//   7. out_of_scope           - no entries match the claim's tenant.
//
// All evaluator output is tagged `evidence_claim_support_v1` so any
// downstream consumer can verify the basis without ambiguity.

import type {
  EvidenceLedgerEntry,
  EvidenceLedgerUsabilityState,
} from '@/lib/architecture/evidence-ledger-mvp';

// ---------------------------------------------------------------------
// Canonical status tuple (order is contract).
// ---------------------------------------------------------------------

export const EVIDENCE_CLAIM_SUPPORT_STATUSES = [
  'supported',
  'partially_supported',
  'unsupported',
  'contradicted',
  'missing_evidence',
  'stale_evidence',
  'out_of_scope',
] as const;

export type EvidenceClaimSupportStatus =
  typeof EVIDENCE_CLAIM_SUPPORT_STATUSES[number];

// ---------------------------------------------------------------------
// Public types.
// ---------------------------------------------------------------------

export type EvidenceClaimWorkObjectKind =
  | 'program'
  | 'phase'
  | 'workshop'
  | 'pattern'
  | 'artifact'
  | 'tower_dimension'
  | 'dataset_domain';

export interface EvidenceSupportedClaim {
  claimId: string;
  claimText: string;
  workObjectId: string;
  workObjectKind: EvidenceClaimWorkObjectKind;
  tenantKey: string;
  expectedSupportingEvidenceIds?: readonly string[];
}

export type EvidenceClaimGapKind =
  | 'no_matching_evidence'
  | 'evidence_blocked'
  | 'evidence_stale'
  | 'tenant_scope_mismatch'
  | 'work_object_mismatch';

export interface EvidenceClaimGap {
  kind: EvidenceClaimGapKind;
  reason: string;
}

export interface EvidenceClaimContradiction {
  contradictingEvidenceId: string;
  reason: string;
}

export type EvidenceClaimSupportConfidence = 'low' | 'medium' | 'high';

export interface EvidenceClaimSupportResult {
  claimId: string;
  status: EvidenceClaimSupportStatus;
  supportingEvidenceIds: readonly string[];
  gaps: readonly EvidenceClaimGap[];
  contradictions: readonly EvidenceClaimContradiction[];
  confidence: EvidenceClaimSupportConfidence;
  rationale: string;
  basis: { evaluator: 'evidence_claim_support_v1' };
  createdFrom: 'deterministic_seed';
}

export interface EvidenceClaimSupportSummary {
  totalClaims: number;
  byStatus: Record<EvidenceClaimSupportStatus, number>;
  unsupportedCount: number;
  contradictedCount: number;
  averageConfidenceLabel: EvidenceClaimSupportConfidence;
}

// ---------------------------------------------------------------------
// Internal helpers - linkage and lifecycle.
// ---------------------------------------------------------------------

const INTERMEDIATE_STATES: ReadonlySet<EvidenceLedgerUsabilityState> = new Set<
  EvidenceLedgerUsabilityState
>(['loaded', 'parsed', 'indexed', 'classified', 'scoped', 'cited', 'quality_checked']);

function entryLinksToWorkObject(
  entry: EvidenceLedgerEntry,
  kind: EvidenceClaimWorkObjectKind,
  workObjectId: string,
): boolean {
  // EVID2 only carries four linkage arrays (programs, patterns,
  // dataset domains, solution archetypes). Other work-object kinds
  // (phase, workshop, artifact, tower_dimension) match against the
  // closest EVID2 linkage class:
  //
  //   phase            -> linkedPrograms (phase belongs to a program)
  //   workshop         -> linkedPrograms (workshops attach to a program)
  //   artifact         -> linkedPrograms (artifacts ship inside a program)
  //   tower_dimension  -> linkedPatterns (tower dimensions surface patterns)
  //
  // This keeps the evaluator honest: when a richer linkage shape lands
  // we revisit, but today we never invent linkage that EVID2 doesn't
  // carry.
  switch (kind) {
    case 'program':
    case 'phase':
    case 'workshop':
    case 'artifact':
      return entry.linkedPrograms.includes(workObjectId);
    case 'pattern':
    case 'tower_dimension':
      return entry.linkedPatterns.includes(workObjectId);
    case 'dataset_domain':
      return entry.linkedDatasetDomains.includes(workObjectId);
    default:
      return false;
  }
}

function isStale(entry: EvidenceLedgerEntry): boolean {
  // EVID2 has no first-class stale state. We model staleness as a
  // qualityNotes annotation that contains the substring "stale". This
  // is the closest available signal and is documented in the slice
  // doc.
  for (const note of entry.qualityNotes) {
    if (note.toLowerCase().includes('stale')) {
      return true;
    }
  }
  return false;
}

function isContradicting(
  entry: EvidenceLedgerEntry,
  claim: EvidenceSupportedClaim,
): boolean {
  // We cannot do NLP. We model "directly contradicts the input claim"
  // as: the entry's claim.text contains the substring
  // "contradicts <claimId>". This keeps contradiction detection
  // explicit, deterministic, and traceable.
  const needle = `contradicts ${claim.claimId}`;
  if (entry.claim.text.includes(needle)) return true;
  for (const note of entry.qualityNotes) {
    if (note.includes(needle)) return true;
  }
  return false;
}

function uniqueSorted(values: readonly string[]): readonly string[] {
  return Array.from(new Set(values)).sort();
}

// ---------------------------------------------------------------------
// Core evaluator.
// ---------------------------------------------------------------------

export function evaluateClaimSupport(
  claim: EvidenceSupportedClaim,
  evidenceEntries: readonly EvidenceLedgerEntry[],
): EvidenceClaimSupportResult {
  const basis = { evaluator: 'evidence_claim_support_v1' as const };

  // Step 1 - tenant filter.
  const sameTenant = evidenceEntries.filter(
    (entry) => entry.tenantKey === claim.tenantKey,
  );
  if (sameTenant.length === 0) {
    return {
      claimId: claim.claimId,
      status: 'out_of_scope',
      supportingEvidenceIds: [],
      gaps: [
        {
          kind: 'tenant_scope_mismatch',
          reason: `No evidence entries match tenant '${claim.tenantKey}'.`,
        },
      ],
      contradictions: [],
      confidence: 'low',
      rationale: `Claim is out of scope: no evidence entries exist for tenant ${claim.tenantKey}.`,
      basis,
      createdFrom: 'deterministic_seed',
    };
  }

  // Step 2 - work-object filter.
  const matching = sameTenant.filter((entry) =>
    entryLinksToWorkObject(entry, claim.workObjectKind, claim.workObjectId),
  );
  if (matching.length === 0) {
    return {
      claimId: claim.claimId,
      status: 'missing_evidence',
      supportingEvidenceIds: [],
      gaps: [
        {
          kind: 'no_matching_evidence',
          reason: `No tenant-${claim.tenantKey} evidence is linked to ${claim.workObjectKind} '${claim.workObjectId}'.`,
        },
      ],
      contradictions: [],
      confidence: 'low',
      rationale: `Claim has no matching evidence: tenant ${claim.tenantKey} has no entries linked to ${claim.workObjectKind} ${claim.workObjectId}.`,
      basis,
      createdFrom: 'deterministic_seed',
    };
  }

  // Step 3 - contradiction check across the matching slice.
  const contradictions: EvidenceClaimContradiction[] = [];
  for (const entry of matching) {
    if (isContradicting(entry, claim)) {
      contradictions.push({
        contradictingEvidenceId: entry.id,
        reason: `Entry ${entry.id} contradicts claim ${claim.claimId}.`,
      });
    }
  }

  const usableEntries = matching.filter(
    (entry) => entry.state === 'usable_as_evidence',
  );
  const blockedEntries = matching.filter((entry) => entry.state === 'blocked');
  const staleEntries = matching.filter((entry) => isStale(entry));
  const intermediateEntries = matching.filter((entry) =>
    INTERMEDIATE_STATES.has(entry.state),
  );

  // Step 4 - contradicted by a usable contradicting entry takes
  // precedence over plain support.
  const usableContradicting = contradictions.filter((c) => {
    const e = matching.find((m) => m.id === c.contradictingEvidenceId);
    return !!e && e.state === 'usable_as_evidence';
  });
  if (usableContradicting.length > 0) {
    return {
      claimId: claim.claimId,
      status: 'contradicted',
      supportingEvidenceIds: uniqueSorted(usableEntries.map((e) => e.id)),
      gaps: [],
      contradictions,
      confidence: 'high',
      rationale: `Claim is contradicted by ${usableContradicting.length} usable evidence entry(ies).`,
      basis,
      createdFrom: 'deterministic_seed',
    };
  }

  // Step 5 - blocked-only.
  if (blockedEntries.length === matching.length && usableEntries.length === 0) {
    return {
      claimId: claim.claimId,
      status: 'unsupported',
      supportingEvidenceIds: [],
      gaps: [
        {
          kind: 'evidence_blocked',
          reason: `All ${blockedEntries.length} matching entry(ies) are blocked.`,
        },
      ],
      contradictions,
      confidence: 'low',
      rationale: `Claim is unsupported: every matching evidence entry is blocked.`,
      basis,
      createdFrom: 'deterministic_seed',
    };
  }

  // Step 6 - stale-only (no usable, only stale-flagged among matching).
  if (
    usableEntries.length === 0 &&
    staleEntries.length > 0 &&
    staleEntries.length === matching.length - blockedEntries.length
  ) {
    return {
      claimId: claim.claimId,
      status: 'stale_evidence',
      supportingEvidenceIds: [],
      gaps: [
        {
          kind: 'evidence_stale',
          reason: `All ${staleEntries.length} non-blocked matching entry(ies) are flagged stale.`,
        },
      ],
      contradictions,
      confidence: 'low',
      rationale: `Claim has only stale evidence: ${staleEntries.length} matching entry(ies) carry a stale qualityNotes annotation.`,
      basis,
      createdFrom: 'deterministic_seed',
    };
  }

  // Step 7 - intermediate-only (no usable_as_evidence reached yet).
  if (usableEntries.length === 0) {
    return {
      claimId: claim.claimId,
      status: 'unsupported',
      supportingEvidenceIds: [],
      gaps: [
        {
          kind: 'no_matching_evidence',
          reason: `No matching entry has reached usable_as_evidence (states present: ${uniqueSorted(intermediateEntries.map((e) => e.state)).join(', ') || 'none'}).`,
        },
      ],
      contradictions,
      confidence: 'low',
      rationale: `Claim is unsupported: matching entries exist but none have reached usable_as_evidence.`,
      basis,
      createdFrom: 'deterministic_seed',
    };
  }

  // Step 8 - usable entries exist. Check expected ids.
  const supportingIds = uniqueSorted(usableEntries.map((e) => e.id));
  const expected = claim.expectedSupportingEvidenceIds ?? [];
  if (expected.length > 0) {
    const missing = expected.filter((id) => !supportingIds.includes(id));
    if (missing.length > 0) {
      return {
        claimId: claim.claimId,
        status: 'partially_supported',
        supportingEvidenceIds: supportingIds,
        gaps: [
          {
            kind: 'no_matching_evidence',
            reason: `Expected supporting evidence ids missing: ${missing.join(', ')}.`,
          },
        ],
        contradictions,
        confidence: 'medium',
        rationale: `Claim is partially supported: ${supportingIds.length} usable entry(ies) match but ${missing.length} expected id(s) are missing.`,
        basis,
        createdFrom: 'deterministic_seed',
      };
    }
  }

  return {
    claimId: claim.claimId,
    status: 'supported',
    supportingEvidenceIds: supportingIds,
    gaps: [],
    contradictions,
    confidence: 'high',
    rationale: `Claim is supported: ${supportingIds.length} usable evidence entry(ies) match the work object${expected.length > 0 ? ' and all expected ids are present' : ''}.`,
    basis,
    createdFrom: 'deterministic_seed',
  };
}

// ---------------------------------------------------------------------
// Bulk evaluators and summarizer.
// ---------------------------------------------------------------------

export function evaluateClaimsForWorkObject(
  claims: readonly EvidenceSupportedClaim[],
  evidenceEntries: readonly EvidenceLedgerEntry[],
): readonly EvidenceClaimSupportResult[] {
  return claims.map((claim) => evaluateClaimSupport(claim, evidenceEntries));
}

export function summarizeClaimSupport(
  results: readonly EvidenceClaimSupportResult[],
): EvidenceClaimSupportSummary {
  const byStatus: Record<EvidenceClaimSupportStatus, number> = {
    supported: 0,
    partially_supported: 0,
    unsupported: 0,
    contradicted: 0,
    missing_evidence: 0,
    stale_evidence: 0,
    out_of_scope: 0,
  };

  const confidenceWeights: Record<EvidenceClaimSupportConfidence, number> = {
    low: 1,
    medium: 2,
    high: 3,
  };

  let confidenceTotal = 0;

  for (const result of results) {
    byStatus[result.status] += 1;
    confidenceTotal += confidenceWeights[result.confidence];
  }

  const unsupportedCount =
    byStatus.unsupported +
    byStatus.missing_evidence +
    byStatus.stale_evidence;
  const contradictedCount = byStatus.contradicted;

  let averageConfidenceLabel: EvidenceClaimSupportConfidence = 'low';
  if (results.length > 0) {
    const average = confidenceTotal / results.length;
    if (average >= 2.5) {
      averageConfidenceLabel = 'high';
    } else if (average >= 1.5) {
      averageConfidenceLabel = 'medium';
    } else {
      averageConfidenceLabel = 'low';
    }
  }

  return {
    totalClaims: results.length,
    byStatus,
    unsupportedCount,
    contradictedCount,
    averageConfidenceLabel,
  };
}

export function getUnsupportedClaims(
  results: readonly EvidenceClaimSupportResult[],
): readonly EvidenceClaimSupportResult[] {
  const flagged: ReadonlySet<EvidenceClaimSupportStatus> = new Set<
    EvidenceClaimSupportStatus
  >(['unsupported', 'missing_evidence', 'stale_evidence', 'contradicted']);
  return results.filter((result) => flagged.has(result.status));
}
