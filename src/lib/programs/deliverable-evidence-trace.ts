// PDEL8 · Deliverable Evidence Trace.
//
// Pure deterministic, file-pure read-model that projects a single
// program-deliverable artifact (PDEL inventory output) and the EVID2
// Evidence Ledger MVP into a single trace describing what evidence
// supports the deliverable, what is partially supported, what is
// blocked, what is stale, what is missing, and what must be resolved
// before the deliverable can be approved.
//
// The trace is read-only and additive over EVID2 + EVID3:
//
//   - It does NOT mutate the ledger, does NOT add new entries, and
//     does NOT fabricate citations.
//   - It works strictly with `evid-seed-` prefixed ids; no
//     production-shaped `E-\d+` tokens are constructed here.
//   - It does NOT call the Model Gateway, does NOT retrieve from any
//     persistence layer, and does NOT resolve real citations.
//   - It does NOT call Date.now / Math.random / new Date / fetch.
//
// The "approval implication" block is advisory only — it suggests a
// readiness verdict (ready / hold / blocked) but does not implement an
// approval state machine and does not flip any artifact status.
//
// This module does NOT import:
//   - src/lib/source/**, src/app/(maestro)/source/**
//   - src/lib/sentinel/**, src/lib/atlas/**, src/lib/nexus/**
//   - src/lib/agent/**, src/components/agent/**
//   - src/app/programs/**, src/app/(maestro)/preview/**, src/app/demo/**
//   - src/lib/programs/mock.ts
//   - src/lib/auth/**
//   - supabase/**

import type {
  EvidenceLedgerCitationKind,
  EvidenceLedgerEntry,
  EvidenceLedgerScope,
  EvidenceLedgerUsabilityState,
} from '@/lib/architecture/evidence-ledger-mvp';
import type {
  ProgramArtifact,
  ProgramArtifactPhaseBucket,
} from '@/lib/programs/program-artifact-inventory';

// ---------------------------------------------------------------------
// Canonical trace status tuple (order is contract).
// ---------------------------------------------------------------------

export const DELIVERABLE_EVIDENCE_TRACE_STATUSES = [
  'supported',
  'partially_supported',
  'unsupported',
  'missing',
  'stale',
  'blocked',
] as const;

export type DeliverableEvidenceTraceStatus =
  (typeof DELIVERABLE_EVIDENCE_TRACE_STATUSES)[number];

// ---------------------------------------------------------------------
// Public types.
// ---------------------------------------------------------------------

export type DeliverableEvidenceClaimBucket =
  | 'supported'
  | 'partially_supported'
  | 'unsupported'
  | 'stale'
  | 'blocked';

export type DeliverableEvidenceGapKind =
  | 'no_matching_evidence'
  | 'evidence_blocked'
  | 'evidence_stale'
  | 'tenant_scope_mismatch'
  | 'intermediate_only';

export interface DeliverableEvidenceGap {
  kind: DeliverableEvidenceGapKind;
  reason: string;
}

/**
 * Single evidence entry as it appears in the trace, with the bucket it
 * was assigned to and the underlying ledger usability state. Every
 * blocked entry MUST carry the ledger's recorded `blockReason`.
 */
export interface DeliverableEvidenceClaim {
  evidenceId: string;
  claimId: string;
  claimText: string;
  bucket: DeliverableEvidenceClaimBucket;
  ledgerState: EvidenceLedgerUsabilityState;
  scope: EvidenceLedgerScope;
  citationKind: EvidenceLedgerCitationKind;
  citationLocator: string;
  /** The seed source artifact id from EVID2 (never a fabricated path). */
  sourceArtifactId: string;
  /**
   * Present iff the entry is in `blocked` state. Carried verbatim
   * from EVID2 so the panel can surface the steward-facing reason.
   */
  blockReason?: string;
  /** Present iff the entry is flagged stale via qualityNotes. */
  staleNote?: string;
}

/**
 * Distinct source artifact referenced by one or more claim entries.
 */
export interface DeliverableEvidenceSource {
  sourceArtifactId: string;
  /** True iff at least one matching entry has reached usable_as_evidence. */
  hasUsableEntry: boolean;
  /** True iff at least one matching entry is blocked. */
  hasBlockedEntry: boolean;
  /** True iff at least one matching entry carries a stale qualityNotes annotation. */
  hasStaleEntry: boolean;
  /** Distinct ledger entry ids attributed to this source artifact. */
  entryIds: readonly string[];
}

/**
 * Advisory verdict surfaced to the panel. This is NOT an approval
 * decision — it is a deterministic readiness suggestion that operators
 * can use to decide whether to send the deliverable for sign-off.
 */
export type DeliverableEvidenceApprovalRecommendation =
  | 'ready_for_review'
  | 'hold_for_supporting_evidence'
  | 'blocked_until_evidence_resolved'
  | 'no_supporting_evidence';

export interface DeliverableEvidenceApprovalImplication {
  recommendation: DeliverableEvidenceApprovalRecommendation;
  /** Short rationale, no model output, never a production citation. */
  rationale: string;
  /** Ordered list of human-readable preconditions that remain. */
  preconditions: readonly string[];
  /** Always true: the implication is advisory. */
  advisoryOnly: true;
}

export interface DeliverableEvidenceTraceSummary {
  totalClaims: number;
  supportedCount: number;
  partiallySupportedCount: number;
  unsupportedCount: number;
  staleCount: number;
  blockedCount: number;
  missingCount: number;
  /** Distinct source artifact count across all matched claims. */
  sourceArtifactCount: number;
}

export interface DeliverableEvidenceTrace {
  /** The deliverable artifact id from PDEL inventory. */
  artifactId: string;
  artifactTitle: string;
  programCode: string;
  programSlug: string;
  tenantKey: string;
  phaseBucket: ProgramArtifactPhaseBucket;
  status: DeliverableEvidenceTraceStatus;
  supportedClaims: readonly DeliverableEvidenceClaim[];
  partiallySupportedClaims: readonly DeliverableEvidenceClaim[];
  unsupportedClaims: readonly DeliverableEvidenceClaim[];
  staleClaims: readonly DeliverableEvidenceClaim[];
  blockedClaims: readonly DeliverableEvidenceClaim[];
  /** Structural gaps that the panel should surface even when no claim row exists. */
  gaps: readonly DeliverableEvidenceGap[];
  sources: readonly DeliverableEvidenceSource[];
  approvalImplication: DeliverableEvidenceApprovalImplication;
  summary: DeliverableEvidenceTraceSummary;
  /**
   * Honest source caption surfaced as a footer in the panel; it names
   * the deterministic seed and disclaims live retrieval.
   */
  sourceCaption: string;
  createdFrom: 'deterministic_evidence_trace_seed';
}

// ---------------------------------------------------------------------
// Constants.
// ---------------------------------------------------------------------

/**
 * Canonical caption surfaced in the panel footer. Names the
 * deterministic seed and disclaims live retrieval / model invocation.
 */
export const DELIVERABLE_EVIDENCE_TRACE_SOURCE_CAPTION =
  'Composed deterministically from the EVID2 Evidence Ledger seed and the PDEL artifact inventory. No live retrieval, no model invocation, no fabricated citations.';

const ARTIFACT_TYPE_TO_LEDGER_DELIVERABLE_KEY: Readonly<
  Record<ProgramArtifact['type'], readonly string[]>
> = {
  generated_deliverable: [],
  uploaded_document: ['charter'],
  workshop_notes: ['workshop_summary'],
  spreadsheet: ['value_ledger'],
  presentation: [],
  evidence_artifact: [],
  decision_record: [],
  dataset: [],
  html_deliverable: [],
};

const STALE_NOTE_NEEDLE = 'stale';

// ---------------------------------------------------------------------
// Public API.
// ---------------------------------------------------------------------

/**
 * Build the deterministic evidence trace for a program-deliverable
 * artifact. Pure: same inputs → identical output.
 *
 * The matching model is conservative:
 *
 *   1. Filter by `tenantKey` — entries from other tenants are out of scope.
 *   2. Among same-tenant entries, retain those whose `linkedPrograms`
 *      includes the artifact's program slug-form (`tenantKey/programSlug`)
 *      OR whose `linkedDeliverables` includes one of the canonical
 *      ledger keys for the artifact (charter, workshop_summary,
 *      value_ledger, etc.).
 *   3. Bucket each retained entry by ledger state.
 *
 * No NLP, no scoring, no fabricated linkage. If EVID2 doesn't carry
 * a linkage today, the trace will surface honest gaps rather than
 * inventing one.
 */
export function buildDeliverableEvidenceTrace(
  artifact: ProgramArtifact,
  ledgerEntries: readonly EvidenceLedgerEntry[],
): DeliverableEvidenceTrace {
  const sameTenant = ledgerEntries.filter(
    (entry) => entry.tenantKey === artifact.tenantKey,
  );

  if (sameTenant.length === 0) {
    return makeMissingTrace(artifact, [
      {
        kind: 'tenant_scope_mismatch',
        reason: `No EVID2 entries exist for tenant '${artifact.tenantKey}'.`,
      },
    ]);
  }

  const programLinkKey = `${artifact.tenantKey}/${artifact.programSlug}`;
  const deliverableKeys = ARTIFACT_TYPE_TO_LEDGER_DELIVERABLE_KEY[artifact.type];

  const matching = sameTenant.filter((entry) => {
    if (entry.linkedPrograms.includes(programLinkKey)) return true;
    for (const key of deliverableKeys) {
      if (entry.linkedDeliverables.includes(key)) return true;
    }
    return false;
  });

  if (matching.length === 0) {
    return makeMissingTrace(artifact, [
      {
        kind: 'no_matching_evidence',
        reason: `No tenant-${artifact.tenantKey} EVID2 entry is linked to program '${artifact.programSlug}' or to any canonical deliverable key for this artifact type.`,
      },
    ]);
  }

  const supported: DeliverableEvidenceClaim[] = [];
  const partial: DeliverableEvidenceClaim[] = [];
  const unsupported: DeliverableEvidenceClaim[] = [];
  const stale: DeliverableEvidenceClaim[] = [];
  const blocked: DeliverableEvidenceClaim[] = [];
  const gaps: DeliverableEvidenceGap[] = [];

  for (const entry of matching) {
    const staleNote = findStaleNote(entry);

    if (entry.state === 'blocked') {
      // Hard rule: blocked entries MUST carry their reason verbatim.
      blocked.push(toClaim(entry, 'blocked', staleNote));
      gaps.push({
        kind: 'evidence_blocked',
        reason:
          entry.blockReason && entry.blockReason.trim().length > 0
            ? `Entry ${entry.id} blocked: ${entry.blockReason}`
            : `Entry ${entry.id} blocked: no reason recorded in EVID2.`,
      });
      continue;
    }

    if (staleNote !== undefined) {
      stale.push(toClaim(entry, 'stale', staleNote));
      gaps.push({
        kind: 'evidence_stale',
        reason: `Entry ${entry.id} flagged stale: ${staleNote}`,
      });
      continue;
    }

    if (entry.state === 'usable_as_evidence') {
      supported.push(toClaim(entry, 'supported', undefined));
      continue;
    }

    if (entry.state === 'cited' || entry.state === 'quality_checked') {
      // Cited / quality_checked entries carry partial backing — they
      // have moved past intermediate stages but have not yet reached
      // usable_as_evidence.
      partial.push(toClaim(entry, 'partially_supported', undefined));
      continue;
    }

    // loaded / parsed / indexed / classified / scoped — intermediate.
    unsupported.push(toClaim(entry, 'unsupported', undefined));
    gaps.push({
      kind: 'intermediate_only',
      reason: `Entry ${entry.id} is in intermediate state '${entry.state}' and has not yet reached usable_as_evidence.`,
    });
  }

  const sources = composeSources(matching);
  const status = resolveStatus({
    supportedCount: supported.length,
    partialCount: partial.length,
    unsupportedCount: unsupported.length,
    staleCount: stale.length,
    blockedCount: blocked.length,
  });

  const approvalImplication = composeApprovalImplication({
    status,
    supportedCount: supported.length,
    partialCount: partial.length,
    unsupportedCount: unsupported.length,
    staleCount: stale.length,
    blockedCount: blocked.length,
    blockedClaims: blocked,
    staleClaims: stale,
  });

  const summary: DeliverableEvidenceTraceSummary = {
    totalClaims:
      supported.length +
      partial.length +
      unsupported.length +
      stale.length +
      blocked.length,
    supportedCount: supported.length,
    partiallySupportedCount: partial.length,
    unsupportedCount: unsupported.length,
    staleCount: stale.length,
    blockedCount: blocked.length,
    missingCount: 0,
    sourceArtifactCount: sources.length,
  };

  return {
    artifactId: artifact.id,
    artifactTitle: artifact.title,
    programCode: artifact.programCode,
    programSlug: artifact.programSlug,
    tenantKey: artifact.tenantKey,
    phaseBucket: artifact.phaseBucket,
    status,
    supportedClaims: supported,
    partiallySupportedClaims: partial,
    unsupportedClaims: unsupported,
    staleClaims: stale,
    blockedClaims: blocked,
    gaps,
    sources,
    approvalImplication,
    summary,
    sourceCaption: DELIVERABLE_EVIDENCE_TRACE_SOURCE_CAPTION,
    createdFrom: 'deterministic_evidence_trace_seed',
  };
}

/**
 * Bucketed shorthand: the trace status corresponding to every
 * deliverable in an artifact list, in input order.
 */
export function buildTracesForArtifacts(
  artifacts: readonly ProgramArtifact[],
  ledgerEntries: readonly EvidenceLedgerEntry[],
): readonly DeliverableEvidenceTrace[] {
  return artifacts.map((artifact) =>
    buildDeliverableEvidenceTrace(artifact, ledgerEntries),
  );
}

// ---------------------------------------------------------------------
// Internals.
// ---------------------------------------------------------------------

interface StatusCounts {
  supportedCount: number;
  partialCount: number;
  unsupportedCount: number;
  staleCount: number;
  blockedCount: number;
}

function resolveStatus(counts: StatusCounts): DeliverableEvidenceTraceStatus {
  const total =
    counts.supportedCount +
    counts.partialCount +
    counts.unsupportedCount +
    counts.staleCount +
    counts.blockedCount;
  if (total === 0) return 'missing';

  // Blocked is the strongest negative signal — when blocked entries are
  // present and no usable entries exist, the deliverable is blocked.
  if (counts.blockedCount > 0 && counts.supportedCount === 0) {
    return 'blocked';
  }

  // Stale-only branch (no usable, no blocked, only stale + intermediate).
  if (
    counts.supportedCount === 0 &&
    counts.blockedCount === 0 &&
    counts.staleCount > 0 &&
    counts.partialCount === 0
  ) {
    return 'stale';
  }

  // No usable, no partial → unsupported (intermediate-only or mixed).
  if (counts.supportedCount === 0 && counts.partialCount === 0) {
    return 'unsupported';
  }

  // Has usable AND has any negative signal → partially supported.
  if (
    counts.supportedCount > 0 &&
    (counts.partialCount > 0 ||
      counts.unsupportedCount > 0 ||
      counts.staleCount > 0 ||
      counts.blockedCount > 0)
  ) {
    return 'partially_supported';
  }

  // Has only partial entries (cited / quality_checked) and nothing usable.
  if (counts.supportedCount === 0 && counts.partialCount > 0) {
    return 'partially_supported';
  }

  // Pure usable.
  return 'supported';
}

function composeApprovalImplication(input: {
  status: DeliverableEvidenceTraceStatus;
  supportedCount: number;
  partialCount: number;
  unsupportedCount: number;
  staleCount: number;
  blockedCount: number;
  blockedClaims: readonly DeliverableEvidenceClaim[];
  staleClaims: readonly DeliverableEvidenceClaim[];
}): DeliverableEvidenceApprovalImplication {
  const preconditions: string[] = [];

  for (const blockedClaim of input.blockedClaims) {
    const reason =
      blockedClaim.blockReason && blockedClaim.blockReason.trim().length > 0
        ? blockedClaim.blockReason
        : 'no reason recorded in EVID2';
    preconditions.push(
      `Resolve blocked evidence ${blockedClaim.evidenceId}: ${reason}`,
    );
  }

  for (const staleClaim of input.staleClaims) {
    preconditions.push(
      `Refresh stale evidence ${staleClaim.evidenceId}: ${staleClaim.staleNote ?? 'flagged stale in EVID2 qualityNotes'}`,
    );
  }

  if (input.partialCount > 0 && input.supportedCount === 0) {
    preconditions.push(
      'Promote partially supported evidence to usable_as_evidence (cited / quality_checked → quality review).',
    );
  }

  if (input.unsupportedCount > 0 && input.supportedCount === 0) {
    preconditions.push(
      'Advance intermediate evidence through the EVID2 lifecycle (loaded → … → usable_as_evidence).',
    );
  }

  if (input.status === 'blocked') {
    return {
      recommendation: 'blocked_until_evidence_resolved',
      rationale:
        'At least one supporting evidence entry is blocked and no usable entry covers the deliverable.',
      preconditions,
      advisoryOnly: true,
    };
  }

  if (input.status === 'missing') {
    return {
      recommendation: 'no_supporting_evidence',
      rationale:
        'No EVID2 entries match this deliverable for the tenant; approval cannot rest on evidence today.',
      preconditions: [
        'Add at least one EVID2 entry that links to this program or deliverable type.',
      ],
      advisoryOnly: true,
    };
  }

  if (input.status === 'stale' || input.status === 'unsupported') {
    return {
      recommendation: 'hold_for_supporting_evidence',
      rationale:
        input.status === 'stale'
          ? 'All matching evidence is flagged stale; refresh before approval.'
          : 'No matching evidence has reached usable_as_evidence yet.',
      preconditions,
      advisoryOnly: true,
    };
  }

  if (input.status === 'partially_supported') {
    return {
      recommendation: 'hold_for_supporting_evidence',
      rationale:
        'Some matching evidence is usable, but partial / blocked / stale entries remain. Resolve before approval.',
      preconditions,
      advisoryOnly: true,
    };
  }

  // supported
  return {
    recommendation: 'ready_for_review',
    rationale:
      'All matching EVID2 entries are usable_as_evidence; deliverable is ready for steward review.',
    preconditions: [],
    advisoryOnly: true,
  };
}

function makeMissingTrace(
  artifact: ProgramArtifact,
  gaps: readonly DeliverableEvidenceGap[],
): DeliverableEvidenceTrace {
  const summary: DeliverableEvidenceTraceSummary = {
    totalClaims: 0,
    supportedCount: 0,
    partiallySupportedCount: 0,
    unsupportedCount: 0,
    staleCount: 0,
    blockedCount: 0,
    missingCount: 1,
    sourceArtifactCount: 0,
  };
  return {
    artifactId: artifact.id,
    artifactTitle: artifact.title,
    programCode: artifact.programCode,
    programSlug: artifact.programSlug,
    tenantKey: artifact.tenantKey,
    phaseBucket: artifact.phaseBucket,
    status: 'missing',
    supportedClaims: [],
    partiallySupportedClaims: [],
    unsupportedClaims: [],
    staleClaims: [],
    blockedClaims: [],
    gaps,
    sources: [],
    approvalImplication: {
      recommendation: 'no_supporting_evidence',
      rationale:
        'No EVID2 entries match this deliverable for the tenant; approval cannot rest on evidence today.',
      preconditions: [
        'Add at least one EVID2 entry that links to this program or deliverable type.',
      ],
      advisoryOnly: true,
    },
    summary,
    sourceCaption: DELIVERABLE_EVIDENCE_TRACE_SOURCE_CAPTION,
    createdFrom: 'deterministic_evidence_trace_seed',
  };
}

function toClaim(
  entry: EvidenceLedgerEntry,
  bucket: DeliverableEvidenceClaimBucket,
  staleNote: string | undefined,
): DeliverableEvidenceClaim {
  const claim: DeliverableEvidenceClaim = {
    evidenceId: entry.id,
    claimId: entry.claim.claimId,
    claimText: entry.claim.text,
    bucket,
    ledgerState: entry.state,
    scope: entry.scope,
    citationKind: entry.citation.kind,
    citationLocator: entry.citation.locator,
    sourceArtifactId: entry.sourceArtifactId,
  };
  if (entry.state === 'blocked') {
    claim.blockReason =
      entry.blockReason && entry.blockReason.trim().length > 0
        ? entry.blockReason
        : 'no reason recorded in EVID2';
  }
  if (staleNote !== undefined) {
    claim.staleNote = staleNote;
  }
  return claim;
}

function findStaleNote(entry: EvidenceLedgerEntry): string | undefined {
  for (const note of entry.qualityNotes) {
    if (note.toLowerCase().includes(STALE_NOTE_NEEDLE)) {
      return note;
    }
  }
  return undefined;
}

function composeSources(
  entries: readonly EvidenceLedgerEntry[],
): readonly DeliverableEvidenceSource[] {
  const map = new Map<
    string,
    {
      sourceArtifactId: string;
      hasUsableEntry: boolean;
      hasBlockedEntry: boolean;
      hasStaleEntry: boolean;
      entryIds: Set<string>;
    }
  >();
  for (const entry of entries) {
    const existing = map.get(entry.sourceArtifactId) ?? {
      sourceArtifactId: entry.sourceArtifactId,
      hasUsableEntry: false,
      hasBlockedEntry: false,
      hasStaleEntry: false,
      entryIds: new Set<string>(),
    };
    if (entry.state === 'usable_as_evidence') existing.hasUsableEntry = true;
    if (entry.state === 'blocked') existing.hasBlockedEntry = true;
    if (findStaleNote(entry) !== undefined) existing.hasStaleEntry = true;
    existing.entryIds.add(entry.id);
    map.set(entry.sourceArtifactId, existing);
  }
  return Array.from(map.values())
    .map((source) => ({
      sourceArtifactId: source.sourceArtifactId,
      hasUsableEntry: source.hasUsableEntry,
      hasBlockedEntry: source.hasBlockedEntry,
      hasStaleEntry: source.hasStaleEntry,
      entryIds: Array.from(source.entryIds).sort(),
    }))
    .sort((a, b) => a.sourceArtifactId.localeCompare(b.sourceArtifactId));
}

// ---------------------------------------------------------------------
// Re-exports for test introspection.
// ---------------------------------------------------------------------

export const DELIVERABLE_EVIDENCE_CLAIM_BUCKETS: readonly DeliverableEvidenceClaimBucket[] =
  ['supported', 'partially_supported', 'unsupported', 'stale', 'blocked'];
