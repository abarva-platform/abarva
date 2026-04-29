/**
 * Contradiction resolution init — wires a write-through backend into the
 * contradiction-resolution-state module on first import.
 *
 * Resolution:
 *   - Postgres backend, if BOTH `process.env.DATABASE_URL` is set AND
 *     `process.env.REASONING_RESOLUTION_BACKEND === 'postgres'`. Persists
 *     every `markResolved` call to `reasoning_resolved_contradictions`
 *     (migration 20260428190000).
 *   - Otherwise the default in-memory-only behavior — no backend installed.
 *
 * Imported once from a server entry point. Idempotent —
 * `setContradictionResolutionBackend` is a simple slot assignment.
 */

import { setContradictionResolutionBackend } from '@/lib/reasoning/contradiction-resolution-state';
import { createPostgresContradictionResolutionBackend } from '@/lib/reasoning/contradiction-resolution-backends/postgres';

let initialized = false;

function shouldUsePostgres(): boolean {
  return (
    typeof process.env.DATABASE_URL === 'string' &&
    process.env.DATABASE_URL.length > 0 &&
    process.env.REASONING_RESOLUTION_BACKEND === 'postgres'
  );
}

export function initContradictionResolutionBackend(): void {
  if (initialized) return;
  if (shouldUsePostgres()) {
    setContradictionResolutionBackend(createPostgresContradictionResolutionBackend());
  } else {
    setContradictionResolutionBackend(null);
  }
  initialized = true;
}

export function _resetContradictionResolutionInitForTests(): void {
  initialized = false;
}

initContradictionResolutionBackend();
