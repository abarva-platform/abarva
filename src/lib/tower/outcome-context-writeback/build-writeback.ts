// Tower → Outcome → Context write-back · Wave 3, Slice 3.7 · pure builder.
//
// Pure transform from a resolved `outcome_ledger` row to the
// `enterprise_context_records` row that closes the decision loop. No
// clock, no randomness, no I/O — the caller supplies the row; this
// module only projects it.
//
// LOOP CLOSURE. The end-to-end loop is Context → Intelligence → Moves →
// Source → Tower → Outcome. The outcome ledger (3.1) and the
// outcome-pattern-feedback table (3.6) capture realized value, but the
// arrow back from a verified Outcome into the tenant's Context layer
// was never wired — so the story-pack generator could never set
// `loopClosed: true`. This builder is that arrow: a verified outcome
// becomes a labeled, tenant-scoped Context record so a future
// Intelligence query is grounded in what actually happened.
//
// TENANT-FACING BY DESIGN. Unlike the 3.6 feedback record (which is
// privacy-first / cross-tenant and DROPS labels), this projection KEEPS
// the subject label and the realized figures. That is correct: the
// record never leaves the tenant boundary — RLS scopes
// `enterprise_context_records` by `tenant_key` — and a grounded answer
// needs the concrete prior bet, not an anonymized bucket.

import type { OutcomeLedgerRow } from '@/lib/tower/outcome-ledger';
import type { ValueReadinessState } from '@/lib/tower/ai-value-outcome-ledger';
import {
  OUTCOME_CONTEXT_WRITEBACK_SCHEMA_VERSION,
  OUTCOME_LEARNING_RECORD_TYPE,
  type OutcomeContextWritebackPlan,
  type OutcomeLearningContextRow,
  type OutcomeLearningPayload,
  type OutcomeLearningVerdict,
} from './types';

/**
 * The value rungs that represent a *resolved* outcome — one whose value
 * has been measured (or which was explicitly abandoned). Only ledger
 * rows at one of these rungs carry closed-loop learning. Mirrors the
 * 3.6 `RESOLVED_RUNGS` set so the two feedback paths fire on exactly
 * the same trigger.
 */
const RESOLVED_RUNGS: ReadonlySet<ValueReadinessState> = new Set<ValueReadinessState>([
  'measured_in_pilot',
  'measured_in_production',
  'declined',
]);

/**
 * True when a ledger row represents a verified / realized (or declined)
 * outcome and therefore carries a learning signal to write back into
 * the tenant Context layer.
 */
export function isResolvedForWriteback(row: OutcomeLedgerRow): boolean {
  return RESOLVED_RUNGS.has(row.valueRung);
}

/** Classify a resolved outcome into its coarse tenant-facing verdict. */
function verdictOf(
  row: OutcomeLedgerRow,
  realizationRatio: number | null,
): OutcomeLearningVerdict {
  if (row.valueRung === 'declined') return 'declined';
  if (realizationRatio === null) return 'met';
  if (realizationRatio > 1.1) return 'exceeded';
  if (realizationRatio < 0.9) return 'shortfall';
  return 'met';
}

/** A deterministic, replay-safe Context record id for one ledger entry. */
function canonicalRecordIdOf(sourceEntryId: string): string {
  return `outcome-learning-${sourceEntryId}`;
}

/** Build the plain-English learning line a retrieval layer surfaces. */
function learningSummaryOf(
  row: OutcomeLedgerRow,
  verdict: OutcomeLearningVerdict,
  varianceAbs: number | null,
): string {
  if (verdict === 'declined') {
    return `The bet "${row.subjectLabel}" was declined before a realized value was measured; projected ${row.projectedAmount} ${row.measurementUnit}.`;
  }
  const realized = row.realizedAmount;
  const base = `The bet "${row.subjectLabel}" projected ${row.projectedAmount} ${row.measurementUnit} and realized ${realized} ${row.measurementUnit}`;
  if (verdict === 'exceeded') {
    return `${base} — exceeded the projection${varianceAbs !== null ? ` by ${varianceAbs} ${row.measurementUnit}` : ''}.`;
  }
  if (verdict === 'shortfall') {
    return `${base} — fell short of the projection${varianceAbs !== null ? ` by ${Math.abs(varianceAbs)} ${row.measurementUnit}` : ''}.`;
  }
  return `${base} — met the projection.`;
}

/**
 * Build the Context-layer write-back plan for one outcome-ledger row.
 *
 * Returns `{ written: false, reason: 'not_resolved' }` when the row is
 * not yet at a verified / realized (or declined) rung — such a row
 * carries no closed-loop learning and MUST NOT write back, so the loop
 * stays open until the outcome is real.
 *
 * Returns `{ written: true, row }` with a fully-formed
 * `enterprise_context_records` row body when the loop can close.
 *
 * @param row a persisted `outcome_ledger` row (read, never mutated).
 */
export function buildOutcomeContextWriteback(
  row: OutcomeLedgerRow,
): OutcomeContextWritebackPlan {
  if (!isResolvedForWriteback(row)) {
    return { written: false, reason: 'not_resolved' };
  }

  const projected = row.projectedAmount;
  const realized = row.realizedAmount;

  const canCompute =
    row.valueRung !== 'declined' &&
    realized !== null &&
    Number.isFinite(realized) &&
    Number.isFinite(projected) &&
    projected !== 0;

  const varianceAbs = canCompute ? (realized as number) - projected : null;
  const realizationRatio = canCompute ? (realized as number) / projected : null;
  const verdict = verdictOf(row, realizationRatio);
  const learningSummary = learningSummaryOf(row, verdict, varianceAbs);

  const payload: OutcomeLearningPayload = {
    sourceEntryId: row.id,
    subjectKind: row.subjectKind,
    subjectRef: row.subjectRef,
    subjectLabel: row.subjectLabel,
    valueCategory: row.valueCategory,
    measurementUnit: row.measurementUnit,
    verdict,
    outcomeRung: row.valueRung,
    projectedAmount: projected,
    realizedAmount: realized,
    varianceAbs,
    realizationRatio,
    counterfactualConfidence: row.counterfactualConfidence,
    learningSummary,
    recordedAt: row.recordedAt,
    writebackSchemaVersion: OUTCOME_CONTEXT_WRITEBACK_SCHEMA_VERSION,
  };

  const contextRow: OutcomeLearningContextRow = {
    tenant_key: row.tenantClientKey,
    client_id: row.clientId,
    canonical_record_id: canonicalRecordIdOf(row.id),
    record_type: OUTCOME_LEARNING_RECORD_TYPE,
    record_subtype: verdict,
    title: `Realized outcome — ${row.subjectLabel}`,
    source_system: 'tower_outcome_ledger',
    source_record_id: row.id,
    lifecycle_state: 'active',
    evidence_pointer: row.evidencePointer,
    payload,
  };

  return { written: true, row: contextRow };
}

/**
 * Build write-back rows for a batch of ledger rows, skipping any that
 * are not yet resolved. Order is preserved. Returns only the
 * `enterprise_context_records` row bodies that the loop can close on.
 */
export function buildOutcomeContextWritebackBatch(
  rows: readonly OutcomeLedgerRow[],
): readonly OutcomeLearningContextRow[] {
  const out: OutcomeLearningContextRow[] = [];
  for (const row of rows) {
    const plan = buildOutcomeContextWriteback(row);
    if (plan.written) out.push(plan.row);
  }
  return out;
}
