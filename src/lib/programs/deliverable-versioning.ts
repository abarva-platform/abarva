// PDEL6 · Deliverable Versioning MVP.
//
// Pure deterministic projection of a single ProgramArtifact into a
// version history. The future canvas / steward workflow will use this
// view-model to render the version timeline, the "current" pin, and to
// compute the legal next-state set when promotion is wired.
//
// This module does NOT generate deliverables, does NOT export files,
// and does NOT write to any database. It is a read-model only.
//
// No live runtime, no upload pipeline, no parse engine, no model calls,
// no Date.now reads, no random IDs, no migrations.
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
  ProgramArtifact,
  ProgramArtifactStatus,
} from '@/lib/programs/program-artifact-inventory';

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

/** Lifecycle state of a single deliverable version. */
export type DeliverableVersionState =
  | 'draft'
  | 'current'
  | 'superseded'
  | 'locked'
  | 'archived'
  | 'rejected';

/** Where a deliverable version originated. */
export type DeliverableVersionSource =
  | 'deterministic_seed'
  | 'generated'
  | 'uploaded'
  | 'workshop_capture'
  | 'imported'
  | 'manual_edit';

/** Conservative approval state for a deliverable version. */
export type DeliverableApprovalState =
  | 'not_reviewed'
  | 'in_review'
  | 'approved'
  | 'approved_with_conditions'
  | 'rejected'
  | 'locked';

/** Why a new version was opened (the canonical change reasons). */
export type DeliverableVersionChangeReason =
  | 'initial_seed'
  | 'iteration'
  | 'review_feedback'
  | 'rework_required'
  | 'evidence_refresh'
  | 'approval_promotion'
  | 'rollback'
  | 'archive';

/** Honest accounting of the evidence backing this version. */
export interface DeliverableVersionEvidenceBasis {
  /** Whether the version cites any concrete evidence today. */
  hasEvidence: boolean;
  /** Number of evidence references actually present (0 in MVP). */
  evidenceCount: number;
  /** Plain-English description of what evidence is missing. */
  missingEvidence: string[];
  /**
   * Whether the version is considered usable as evidence in the
   * artifact summary today.
   */
  usableAsEvidence: boolean;
}

/** A single, ordered version of a deliverable. */
export interface DeliverableVersion {
  /** Stable, deterministic version id (`<artifactId>:v<n>`). */
  id: string;
  /** ProgramArtifact.id this version belongs to. */
  artifactId: string;
  /** 1-based ordinal within the version history. */
  ordinal: number;
  /** Human-facing label, e.g. `v1`, `v2`. */
  label: string;
  /** Lifecycle state of the version. */
  state: DeliverableVersionState;
  /** Approval state — conservative defaults only in MVP. */
  approvalState: DeliverableApprovalState;
  /** Source bucket that produced the version. */
  source: DeliverableVersionSource;
  /** Why this version was opened. */
  changeReason: DeliverableVersionChangeReason;
  /** One-line honest summary of what the version represents. */
  summary: string;
  /** Honest evidence accounting. */
  evidenceBasis: DeliverableVersionEvidenceBasis;
  /**
   * One-sentence honest caption naming any limit on this version (e.g.
   * `Stub-tier deliverable; promote to Outline before rendering`).
   */
  honestFallback: string;
  /** Marker tying this row back to the deterministic seed contract. */
  createdFrom: 'deterministic_deliverable_version_seed';
}

/** Aggregated counts across an artifact's version history. */
export interface DeliverableVersionSummary {
  artifactId: string;
  totalVersions: number;
  currentOrdinal: number | null;
  currentLabel: string | null;
  byState: Record<DeliverableVersionState, number>;
  byApprovalState: Record<DeliverableApprovalState, number>;
  evidenceBackedCount: number;
}

// ---------------------------------------------------------------------
// Re-exports (canonical orderings) for test introspection
// ---------------------------------------------------------------------

export const DELIVERABLE_VERSION_STATES_IN_ORDER: ReadonlyArray<DeliverableVersionState> =
  [
    'draft',
    'current',
    'superseded',
    'locked',
    'archived',
    'rejected',
  ];

export const DELIVERABLE_APPROVAL_STATES_IN_ORDER: ReadonlyArray<DeliverableApprovalState> =
  [
    'not_reviewed',
    'in_review',
    'approved',
    'approved_with_conditions',
    'rejected',
    'locked',
  ];

export const DELIVERABLE_VERSION_SOURCES_IN_ORDER: ReadonlyArray<DeliverableVersionSource> =
  [
    'deterministic_seed',
    'generated',
    'uploaded',
    'workshop_capture',
    'imported',
    'manual_edit',
  ];

export const DELIVERABLE_VERSION_CHANGE_REASONS_IN_ORDER: ReadonlyArray<DeliverableVersionChangeReason> =
  [
    'initial_seed',
    'iteration',
    'review_feedback',
    'rework_required',
    'evidence_refresh',
    'approval_promotion',
    'rollback',
    'archive',
  ];

// ---------------------------------------------------------------------
// Transition table
// ---------------------------------------------------------------------

const ALLOWED_TRANSITIONS: Record<
  DeliverableVersionState,
  ReadonlyArray<DeliverableVersionState>
> = {
  draft: ['current', 'superseded', 'archived', 'rejected'],
  current: ['superseded', 'locked', 'archived', 'rejected'],
  superseded: ['archived'],
  locked: ['archived'],
  archived: [],
  rejected: ['archived'],
};

// ---------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------

/**
 * Build the deterministic version history for a single artifact. Pure:
 * same input → identical output. The shape is stable across calls.
 *
 * Versioning rules in MVP:
 * - Every artifact has exactly one initial seed version (`v1`).
 * - Artifacts whose status is `signed_off` carry a second `v2` version
 *   that reflects the sign-off promotion.
 * - Stub-tier and `archived` artifacts produce only the seed version
 *   and the seed version is marked accordingly.
 * - Exactly one version per artifact is in the `current` state.
 */
export function buildDeliverableVersionHistory(
  artifact: ProgramArtifact,
): ReadonlyArray<DeliverableVersion> {
  const seed = createDeterministicVersionSeed(artifact);
  const versions: DeliverableVersion[] = [seed];

  if (artifact.status === 'signed_off') {
    // Demote the seed and add a promoted v2 marked as `current` and
    // `approved_with_conditions` (we never claim a fully `approved`
    // verdict in MVP — that requires Steward gate wiring).
    const demoted: DeliverableVersion = {
      ...seed,
      state: 'superseded',
    };
    versions[0] = demoted;

    const promoted: DeliverableVersion = {
      id: `${artifact.id}:v2`,
      artifactId: artifact.id,
      ordinal: 2,
      label: 'v2',
      state: 'current',
      approvalState: 'approved_with_conditions',
      source: sourceForArtifact(artifact),
      changeReason: 'approval_promotion',
      summary: `${artifact.title} promoted to current after sign-off.`,
      evidenceBasis: evidenceBasisForVersion(artifact, /*isPromoted*/ true),
      honestFallback:
        'Approved-with-conditions in the seed; full Steward gate verdict is deferred.',
      createdFrom: 'deterministic_deliverable_version_seed',
    };
    versions.push(promoted);
  }

  return versions;
}

/**
 * Aggregate counts across a version history. Pure.
 */
export function summarizeDeliverableVersions(
  versions: ReadonlyArray<DeliverableVersion>,
): DeliverableVersionSummary {
  const byState = emptyByState();
  const byApprovalState = emptyByApprovalState();
  let evidenceBackedCount = 0;
  let currentOrdinal: number | null = null;
  let currentLabel: string | null = null;
  const artifactId = versions.length > 0 ? versions[0].artifactId : '';
  for (const v of versions) {
    byState[v.state] += 1;
    byApprovalState[v.approvalState] += 1;
    if (v.evidenceBasis.hasEvidence) evidenceBackedCount += 1;
    if (v.state === 'current') {
      currentOrdinal = v.ordinal;
      currentLabel = v.label;
    }
  }
  return {
    artifactId,
    totalVersions: versions.length,
    currentOrdinal,
    currentLabel,
    byState,
    byApprovalState,
    evidenceBackedCount,
  };
}

/**
 * Return the single `current` version of a history, or `null` if no
 * version is currently flagged as such (only possible when the input
 * is empty or has been entirely archived). Pure.
 */
export function getCurrentDeliverableVersion(
  versions: ReadonlyArray<DeliverableVersion>,
): DeliverableVersion | null {
  for (const v of versions) {
    if (v.state === 'current') return v;
  }
  return null;
}

/**
 * Validate whether a state transition is legal. Pure.
 *
 * The transition table is intentionally conservative for MVP:
 * - `draft` may move to `current`, `superseded`, `archived`, or `rejected`.
 * - `current` may move to `superseded`, `locked`, `archived`, or `rejected`.
 * - `superseded` may only move to `archived`.
 * - `locked` may only move to `archived`.
 * - `archived` is terminal.
 * - `rejected` may only move to `archived`.
 *
 * Self-transitions (from === to) are rejected.
 */
export function validateDeliverableVersionTransition(
  from: DeliverableVersionState,
  to: DeliverableVersionState,
): boolean {
  if (from === to) return false;
  const allowed = ALLOWED_TRANSITIONS[from];
  return allowed.includes(to);
}

/**
 * Build the deterministic seed version (`v1`) for an artifact. Pure.
 *
 * The seed version's state depends on the artifact's status:
 * - `archived` artifacts produce a seed in `archived` state.
 * - `signed_off` artifacts produce a seed that is later demoted to
 *   `superseded` by `buildDeliverableVersionHistory`; on its own the
 *   seed is `current` so callers using the seed directly still see a
 *   meaningful `current` row.
 * - All other statuses produce a seed in `current` state, with an
 *   approval state derived conservatively from the artifact status.
 */
export function createDeterministicVersionSeed(
  artifact: ProgramArtifact,
): DeliverableVersion {
  const state = seedStateForArtifact(artifact);
  const approvalState = seedApprovalStateForArtifact(artifact);
  const evidenceBasis = evidenceBasisForVersion(artifact, /*isPromoted*/ false);
  return {
    id: `${artifact.id}:v1`,
    artifactId: artifact.id,
    ordinal: 1,
    label: 'v1',
    state,
    approvalState,
    source: sourceForArtifact(artifact),
    changeReason: 'initial_seed',
    summary: `${artifact.title} seeded from the deterministic program plan.`,
    evidenceBasis,
    honestFallback: artifact.honestFallback,
    createdFrom: 'deterministic_deliverable_version_seed',
  };
}

// ---------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------

function seedStateForArtifact(
  artifact: ProgramArtifact,
): DeliverableVersionState {
  if (artifact.status === 'archived') return 'archived';
  // Note: when the artifact is `signed_off`, the seed is initially
  // `current` and is later demoted to `superseded` by
  // `buildDeliverableVersionHistory` so that the promoted v2 can take
  // over the `current` slot. Callers that read the seed directly still
  // see a single coherent `current` row.
  return 'current';
}

function seedApprovalStateForArtifact(
  artifact: ProgramArtifact,
): DeliverableApprovalState {
  switch (artifact.status) {
    case 'in_review':
      return 'in_review';
    case 'signed_off':
      // The seed v1 is the pre-promotion row when sign-off happens; we
      // surface it as `in_review` because there is no Steward gate
      // verdict in MVP. The promoted v2 carries `approved_with_conditions`.
      return 'in_review';
    case 'archived':
      return 'locked';
    case 'draft':
    case 'pending':
    default:
      return 'not_reviewed';
  }
}

function sourceForArtifact(
  artifact: ProgramArtifact,
): DeliverableVersionSource {
  switch (artifact.type) {
    case 'uploaded_document':
      return 'uploaded';
    case 'workshop_notes':
      return 'workshop_capture';
    case 'generated_deliverable':
    case 'html_deliverable':
      return 'generated';
    case 'spreadsheet':
    case 'presentation':
    case 'evidence_artifact':
    case 'decision_record':
    case 'dataset':
    default:
      return 'deterministic_seed';
  }
}

function evidenceBasisForVersion(
  artifact: ProgramArtifact,
  isPromoted: boolean,
): DeliverableVersionEvidenceBasis {
  const missingEvidence: string[] = [];
  if (artifact.evidenceUsability !== 'usable') {
    missingEvidence.push(
      'Evidence registry binding deferred (no usable E-id citations yet).',
    );
  }
  if (artifact.type === 'uploaded_document') {
    missingEvidence.push(
      'Upload + parse pipeline deferred; this row is a charter placeholder.',
    );
  }
  if (artifact.type === 'spreadsheet') {
    missingEvidence.push(
      'Baseline / target / realized capture deferred to value ledger slice.',
    );
  }
  if (artifact.type === 'dataset') {
    missingEvidence.push(
      'Dataset inspector deferred to ADM4 / explorer wiring.',
    );
  }
  if (!isPromoted) {
    missingEvidence.push(
      'Initial seed version; no live edit / regenerate has executed yet.',
    );
  }
  // hasEvidence is intentionally conservative — even for a `signed_off`
  // artifact, the version row only claims `hasEvidence: true` when the
  // upstream artifact says `evidenceUsability === 'usable'`, because we
  // never invent citations.
  const hasEvidence = artifact.evidenceUsability === 'usable';
  return {
    hasEvidence,
    evidenceCount: 0,
    missingEvidence,
    usableAsEvidence: hasEvidence,
  };
}

function emptyByState(): Record<DeliverableVersionState, number> {
  return {
    draft: 0,
    current: 0,
    superseded: 0,
    locked: 0,
    archived: 0,
    rejected: 0,
  };
}

function emptyByApprovalState(): Record<DeliverableApprovalState, number> {
  return {
    not_reviewed: 0,
    in_review: 0,
    approved: 0,
    approved_with_conditions: 0,
    rejected: 0,
    locked: 0,
  };
}

// ---------------------------------------------------------------------
// Status surface for tests — re-export so tests don't need to import
// from the artifact inventory module.
// ---------------------------------------------------------------------

export const PROGRAM_ARTIFACT_STATUSES_IN_ORDER: ReadonlyArray<ProgramArtifactStatus> =
  ['draft', 'in_review', 'signed_off', 'archived', 'pending'];
