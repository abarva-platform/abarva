// Canvas substrate · query helpers
//
// Read per-event state from the three canvas-substrate tables. The canvas UI
// (Wave 1+) calls these to render the gate panel, artifact shelf, evidence
// drawer with real DB data.
//
// All queries are tenant-scoped via RLS — the caller does not need to add
// tenant predicates manually. Authentication context is handled by the
// supabase client returned by getAzureWriteFluentClient().

import { selectSourceCanvasSubstrateReadAdapter } from '@/lib/data-plane/read-adapters/sourceCanvasSubstrateReadAdapter';
import {
  artifactStateRowToView,
  evidenceStateRowToView,
  gateCriterionStateRowToView,
  type SourceEventArtifactState,
  type SourceEventEvidence,
  type SourceEventFactRow,
  type SourceEventGateCriterion,
} from './types';
import {
  deriveFactBackedEvidenceStates,
  mergeFactBackedEvidenceStates,
} from './fact-derived-evidence';

// ── Read helpers ────────────────────────────────────────────────────────────

export async function listArtifactStatesForEvent(
  sourceEventId: string,
): Promise<SourceEventArtifactState[]> {
  try {
    // Physical read goes through the data-plane seam (Supabase default,
    // Azure Postgres opt-in via ABARVA_DATA_PLANE).
    const rows = await selectSourceCanvasSubstrateReadAdapter().listArtifactStateRows(
      sourceEventId,
    );
    return rows.map(artifactStateRowToView);
  } catch (error) {
    // An unconfigured env (tests, local dev without DB) or a query error —
    // return empty so the canvas renders graceful empty state.
    console.error(
      '[listArtifactStatesForEvent]',
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

export async function listGateCriterionStatesForEvent(
  sourceEventId: string,
): Promise<SourceEventGateCriterion[]> {
  try {
    // Physical read goes through the data-plane seam (Supabase default,
    // Azure Postgres opt-in via ABARVA_DATA_PLANE).
    const rows = await selectSourceCanvasSubstrateReadAdapter().listGateCriterionStateRows(
      sourceEventId,
    );
    return rows.map(gateCriterionStateRowToView);
  } catch (error) {
    // An unconfigured env (tests, local dev without DB) or a query error —
    // return empty so the canvas renders graceful empty state.
    console.error(
      '[listGateCriterionStatesForEvent]',
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

export async function listEvidenceStatesForEvent(
  sourceEventId: string,
): Promise<SourceEventEvidence[]> {
  try {
    // Physical read goes through the data-plane seam (Supabase default,
    // Azure Postgres opt-in via ABARVA_DATA_PLANE).
    const rows = await selectSourceCanvasSubstrateReadAdapter().listEvidenceStateRows(
      sourceEventId,
    );
    return rows.map(evidenceStateRowToView);
  } catch (error) {
    // An unconfigured env (tests, local dev without DB) or a query error —
    // return empty so the canvas renders graceful empty state.
    console.error(
      '[listEvidenceStatesForEvent]',
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

export async function listEventFactsForEvent(
  sourceEventId: string,
): Promise<SourceEventFactRow[]> {
  try {
    const rows = await selectSourceCanvasSubstrateReadAdapter().listEventFactRows(
      sourceEventId,
    );
    return rows;
  } catch (error) {
    console.error(
      '[listEventFactsForEvent]',
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

export async function listEffectiveEvidenceStatesForEvent(
  sourceEventId: string,
): Promise<SourceEventEvidence[]> {
  const [persistedEvidence, facts] = await Promise.all([
    listEvidenceStatesForEvent(sourceEventId),
    listEventFactsForEvent(sourceEventId),
  ]);
  return mergeFactBackedEvidenceStates(
    persistedEvidence,
    deriveFactBackedEvidenceStates(facts),
  );
}

// ── Composite read · everything for a stage ─────────────────────────────────

export interface StageSubstrateBundle {
  artifacts: SourceEventArtifactState[];
  criteria: SourceEventGateCriterion[];
  evidence: SourceEventEvidence[];
}

/**
 * Read the substrate slice the canvas needs to render a single stage panel.
 * Filters each set to the stage in question.
 */
export async function getStageSubstrate(
  sourceEventId: string,
  stageKey: string,
): Promise<StageSubstrateBundle> {
  const [artifacts, allCriteria, evidence] = await Promise.all([
    listArtifactStatesForEvent(sourceEventId).then((rows) =>
      rows.filter((row) => row.stage === stageKey),
    ),
    listGateCriterionStatesForEvent(sourceEventId).then((rows) =>
      // Gate criteria belong to the FROM stage — they govern advancement out.
      rows.filter((row) => row.fromStage === stageKey),
    ),
    listEffectiveEvidenceStatesForEvent(sourceEventId).then((rows) =>
      rows.filter((row) => row.stage === stageKey),
    ),
  ]);

  return { artifacts, criteria: allCriteria, evidence };
}

// ── Gate-met derivation ─────────────────────────────────────────────────────

/**
 * For a given event + (fromStage → toStage) gate, count how many criteria
 * are met / total. Used by the canvas gate panel and the portfolio attention
 * derivation.
 */
export function countGateProgress(
  criteria: SourceEventGateCriterion[],
  fromStage: string,
): { met: number; total: number; allMet: boolean } {
  const slice = criteria.filter((c) => c.fromStage === fromStage);
  const met = slice.filter((c) => c.state === 'met' || c.state === 'waived').length;
  const total = slice.length;
  return { met, total, allMet: total > 0 && met === total };
}
