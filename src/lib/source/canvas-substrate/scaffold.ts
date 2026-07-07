// Canvas substrate · scaffold builder
//
// Pure function that takes a sourcing event id + tenant key and returns the
// rows that should be inserted into:
//   - source_event_artifact_states     (one row per canonical artifact spec)
//   - source_event_gate_criterion_states (one row per canonical gate criterion)
//   - source_event_evidence_states     (one row per canonical evidence requirement)
//
// Used by:
//   1. The auto-scaffolding hook in `createSourcingEvent` (Slice 3) — fires on
//      INSERT of a new sourcing event so the canvas always has data to render.
//   2. The backfill script (Slice 3) — populates state rows for events that
//      pre-date the canvas substrate.
//
// Pure: no DB calls, no I/O. Returns plain row objects ready for `.insert()`.

import {
  SOURCE_ARTIFACT_SPECS,
  SOURCE_GATE_CRITERIA,
  SOURCE_EVIDENCE_REQUIREMENTS,
} from "../canonical-specs";
import {
  artifactStateRowToView,
  evidenceStateRowToView,
  gateCriterionStateRowToView,
  type SourceEventArtifactState,
  type SourceEventEvidence,
  type SourceEventGateCriterion,
  type SourceEventArtifactStateRow,
  type SourceEventEvidenceStateRow,
  type SourceEventGateCriterionStateRow,
} from "./types";

export interface ScaffoldInput {
  sourceEventId: string;
  tenantKey: string;
}

// DB-row shapes — match the column names exactly so callers can pass these
// straight into `.insert()`. We don't generate `id` here (let Postgres do it
// via the gen_random_uuid() default).

export interface NewArtifactStateRow {
  source_event_id: string;
  tenant_key: string;
  artifact_code: string;
  stage_key: string;
  artifact_family: string;
  tier: string;
  status: string;
  requirement_level: string;
  gate_defining: boolean;
}

export interface NewGateCriterionStateRow {
  source_event_id: string;
  tenant_key: string;
  criterion_id: string;
  from_stage: string;
  to_stage: string;
  state: string;
}

export interface NewEvidenceStateRow {
  source_event_id: string;
  tenant_key: string;
  requirement_id: string;
  stage_key: string;
  current_state: string;
}

export interface ScaffoldOutput {
  artifactStates: NewArtifactStateRow[];
  gateCriterionStates: NewGateCriterionStateRow[];
  evidenceStates: NewEvidenceStateRow[];
}

export interface VirtualScaffoldOutput {
  artifactStates: SourceEventArtifactState[];
  gateCriterionStates: SourceEventGateCriterion[];
  evidenceStates: SourceEventEvidence[];
}

type PersistedVirtualSlice = {
  artifactStates?: SourceEventArtifactState[];
  gateCriterionStates?: SourceEventGateCriterion[];
  evidenceStates?: SourceEventEvidence[];
};

/**
 * Build the full per-event scaffold from canonical specs. Called once on event
 * creation and again by the backfill script for legacy events.
 */
export function buildEventScaffold(input: ScaffoldInput): ScaffoldOutput {
  const { sourceEventId, tenantKey } = input;

  const artifactStates: NewArtifactStateRow[] = SOURCE_ARTIFACT_SPECS.map(
    (spec) => ({
      source_event_id: sourceEventId,
      tenant_key: tenantKey,
      artifact_code: spec.code,
      stage_key: spec.stage,
      artifact_family: spec.family,
      tier: spec.defaultTier,
      status: "not_started",
      requirement_level: spec.requirementLevel,
      gate_defining: spec.gateDefining,
    }),
  );

  const gateCriterionStates: NewGateCriterionStateRow[] =
    SOURCE_GATE_CRITERIA.map((criterion) => ({
      source_event_id: sourceEventId,
      tenant_key: tenantKey,
      criterion_id: criterion.criterionId,
      from_stage: criterion.fromStage,
      to_stage: criterion.toStage,
      state: "pending",
    }));

  const evidenceStates: NewEvidenceStateRow[] =
    SOURCE_EVIDENCE_REQUIREMENTS.map((requirement) => ({
      source_event_id: sourceEventId,
      tenant_key: tenantKey,
      requirement_id: requirement.requirementId,
      stage_key: requirement.stage,
      current_state: "Not Requested",
    }));

  return { artifactStates, gateCriterionStates, evidenceStates };
}

/**
 * Runtime-only scaffold for legacy/seed events that pre-date persisted
 * source_event_*_states rows. This never pretends content is authored; every
 * row is a deterministic stub/pending/not-requested view-model so the canvas
 * can show the expected stage surface instead of an empty "not loaded" state.
 */
export function buildVirtualEventScaffold(
  input: ScaffoldInput,
): VirtualScaffoldOutput {
  const nowIso = new Date().toISOString();
  const { artifactStates, gateCriterionStates, evidenceStates } =
    buildEventScaffold(input);

  return {
    artifactStates: artifactStates.map((row) =>
      artifactStateRowToView({
        ...row,
        id: `virtual:${input.sourceEventId}:artifact:${row.artifact_code}`,
        linked_artifact_id: null,
        notes: null,
        body: null,
        body_format: "markdown",
        body_authored_by: null,
        body_updated_at: null,
        body_generation_metadata: null,
        created_at: nowIso,
        updated_at: nowIso,
      } as SourceEventArtifactStateRow),
    ),
    gateCriterionStates: gateCriterionStates.map((row) =>
      gateCriterionStateRowToView({
        ...row,
        id: `virtual:${input.sourceEventId}:criterion:${row.criterion_id}`,
        reviewer_user_id: null,
        reviewed_at: null,
        notes: null,
        evidence_artifact_ids: [],
        waiver_approval_id: null,
        created_at: nowIso,
        updated_at: nowIso,
      } as SourceEventGateCriterionStateRow),
    ),
    evidenceStates: evidenceStates.map((row) =>
      evidenceStateRowToView({
        ...row,
        id: `virtual:${input.sourceEventId}:evidence:${row.requirement_id}`,
        source_artifact_id: null,
        notes: null,
        last_synced_at: null,
        created_at: nowIso,
        updated_at: nowIso,
      } as SourceEventEvidenceStateRow),
    ),
  };
}

/**
 * Merge persisted substrate rows onto the canonical virtual scaffold.
 *
 * Why this exists:
 * some legacy / seeded events have partial persisted substrate (for example,
 * Strategy rows exist but Pricing / BAFO never got scaffolded). The older
 * all-or-nothing fallback only rendered virtual rows when *all* three lists
 * were empty, which left those later stages blank. This helper treats the
 * virtual scaffold as the canonical baseline and overlays any persisted rows
 * that do exist so missing stages still render with deterministic placeholders.
 */
export function mergeMissingVirtualScaffold(
  input: ScaffoldInput,
  persisted: PersistedVirtualSlice,
): VirtualScaffoldOutput {
  const virtual = buildVirtualEventScaffold(input);
  const persistedArtifacts = new Map(
    (persisted.artifactStates ?? []).map((row) => [row.artifactCode, row]),
  );
  const persistedCriteria = new Map(
    (persisted.gateCriterionStates ?? []).map((row) => [row.criterionId, row]),
  );
  const persistedEvidence = new Map(
    (persisted.evidenceStates ?? []).map((row) => [row.requirementId, row]),
  );

  return {
    artifactStates: virtual.artifactStates.map(
      (row) => persistedArtifacts.get(row.artifactCode) ?? row,
    ),
    gateCriterionStates: virtual.gateCriterionStates.map(
      (row) => persistedCriteria.get(row.criterionId) ?? row,
    ),
    evidenceStates: virtual.evidenceStates.map(
      (row) => persistedEvidence.get(row.requirementId) ?? row,
    ),
  };
}

/**
 * Total row count produced by buildEventScaffold for a single event. Useful
 * for tests and progress logging in the backfill script.
 */
export function expectedScaffoldRowCount(): {
  artifactStates: number;
  gateCriterionStates: number;
  evidenceStates: number;
  total: number;
} {
  const a = SOURCE_ARTIFACT_SPECS.length;
  const g = SOURCE_GATE_CRITERIA.length;
  const e = SOURCE_EVIDENCE_REQUIREMENTS.length;
  return {
    artifactStates: a,
    gateCriterionStates: g,
    evidenceStates: e,
    total: a + g + e,
  };
}
