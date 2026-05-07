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
} from '../canonical-specs';

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

/**
 * Build the full per-event scaffold from canonical specs. Called once on event
 * creation and again by the backfill script for legacy events.
 */
export function buildEventScaffold(input: ScaffoldInput): ScaffoldOutput {
  const { sourceEventId, tenantKey } = input;

  const artifactStates: NewArtifactStateRow[] = SOURCE_ARTIFACT_SPECS.map((spec) => ({
    source_event_id: sourceEventId,
    tenant_key: tenantKey,
    artifact_code: spec.code,
    stage_key: spec.stage,
    artifact_family: spec.family,
    tier: spec.defaultTier,
    status: 'not_started',
    requirement_level: spec.requirementLevel,
    gate_defining: spec.gateDefining,
  }));

  const gateCriterionStates: NewGateCriterionStateRow[] = SOURCE_GATE_CRITERIA.map(
    (criterion) => ({
      source_event_id: sourceEventId,
      tenant_key: tenantKey,
      criterion_id: criterion.criterionId,
      from_stage: criterion.fromStage,
      to_stage: criterion.toStage,
      state: 'pending',
    }),
  );

  const evidenceStates: NewEvidenceStateRow[] = SOURCE_EVIDENCE_REQUIREMENTS.map(
    (requirement) => ({
      source_event_id: sourceEventId,
      tenant_key: tenantKey,
      requirement_id: requirement.requirementId,
      stage_key: requirement.stage,
      current_state: 'Not Requested',
    }),
  );

  return { artifactStates, gateCriterionStates, evidenceStates };
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
