// Canvas substrate · query helpers
//
// Read per-event state from the three canvas-substrate tables. The canvas UI
// (Wave 1+) calls these to render the gate panel, artifact shelf, evidence
// drawer with real DB data.
//
// All queries are tenant-scoped via RLS — the caller does not need to add
// tenant predicates manually. Authentication context is handled by the
// supabase client returned by getServerSupabase().

import { getServerSupabase } from '@/lib/supabase-server';
import {
  artifactStateRowToView,
  evidenceStateRowToView,
  gateCriterionStateRowToView,
  type SourceEventArtifactState,
  type SourceEventArtifactStateRow,
  type SourceEventEvidence,
  type SourceEventEvidenceStateRow,
  type SourceEventGateCriterion,
  type SourceEventGateCriterionStateRow,
} from './types';

// ── Read helpers ────────────────────────────────────────────────────────────

export async function listArtifactStatesForEvent(
  sourceEventId: string,
): Promise<SourceEventArtifactState[]> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('source_event_artifact_states')
    .select('*')
    .eq('source_event_id', sourceEventId)
    .order('artifact_code', { ascending: true });

  if (error) {
    console.error('[listArtifactStatesForEvent]', error.message);
    return [];
  }
  return ((data as SourceEventArtifactStateRow[] | null) ?? []).map(artifactStateRowToView);
}

export async function listGateCriterionStatesForEvent(
  sourceEventId: string,
): Promise<SourceEventGateCriterion[]> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('source_event_gate_criterion_states')
    .select('*')
    .eq('source_event_id', sourceEventId)
    .order('criterion_id', { ascending: true });

  if (error) {
    console.error('[listGateCriterionStatesForEvent]', error.message);
    return [];
  }
  return ((data as SourceEventGateCriterionStateRow[] | null) ?? []).map(
    gateCriterionStateRowToView,
  );
}

export async function listEvidenceStatesForEvent(
  sourceEventId: string,
): Promise<SourceEventEvidence[]> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('source_event_evidence_states')
    .select('*')
    .eq('source_event_id', sourceEventId)
    .order('requirement_id', { ascending: true });

  if (error) {
    console.error('[listEvidenceStatesForEvent]', error.message);
    return [];
  }
  return ((data as SourceEventEvidenceStateRow[] | null) ?? []).map(evidenceStateRowToView);
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
    listEvidenceStatesForEvent(sourceEventId).then((rows) =>
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
