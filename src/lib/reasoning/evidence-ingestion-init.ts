/**
 * Evidence ingestion init — wires a write-through backend into the
 * evidence-ingestion-store module on first import.
 *
 * Resolution:
 *   - Postgres backend, if BOTH `process.env.DATABASE_URL` is set AND
 *     `process.env.REASONING_INGESTION_BACKEND === 'postgres'`. Persists
 *     every `addEvidence` / `clearEvidenceFor` call to
 *     `reasoning_evidence_ingestions` (migration 20260428190000).
 *   - Otherwise the default in-memory-only behavior — no backend installed.
 *
 * Imported once from a server entry point. Idempotent —
 * `setEvidenceIngestionBackend` is a simple slot assignment.
 */

import { setEvidenceIngestionBackend } from '@/lib/reasoning/evidence-ingestion-store';
import { createPostgresEvidenceIngestionBackend } from '@/lib/reasoning/evidence-ingestion-backends/postgres';

let initialized = false;

function shouldUsePostgres(): boolean {
  return (
    typeof process.env.DATABASE_URL === 'string' &&
    process.env.DATABASE_URL.length > 0 &&
    process.env.REASONING_INGESTION_BACKEND === 'postgres'
  );
}

export function initEvidenceIngestionBackend(): void {
  if (initialized) return;
  if (shouldUsePostgres()) {
    setEvidenceIngestionBackend(createPostgresEvidenceIngestionBackend());
  } else {
    setEvidenceIngestionBackend(null);
  }
  initialized = true;
}

export function _resetEvidenceIngestionInitForTests(): void {
  initialized = false;
}

initEvidenceIngestionBackend();
