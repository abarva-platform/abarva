/**
 * Alert acknowledgment init — wires a write-through backend into the
 * alert-acknowledgment store on first import.
 *
 * Resolution:
 *   - Postgres backend, if BOTH `process.env.DATABASE_URL` is set AND
 *     `process.env.REASONING_ALERT_BACKEND === 'postgres'`. Persists every
 *     `setAlertState` / `clearAlertState` call to `reasoning_alert_states`.
 *   - Otherwise the default in-memory-only behavior — no backend installed.
 *
 * Imported once from a server entry point so it runs once per server boot in
 * serverless environments. Idempotent — `setAlertAcknowledgmentBackend` is a
 * simple slot assignment.
 */

import { setAlertAcknowledgmentBackend } from '@/lib/reasoning/alert-acknowledgment-state';
import { createPostgresAlertAcknowledgmentBackend } from '@/lib/reasoning/alert-acknowledgment-backends/postgres';

let initialized = false;

function shouldUsePostgres(): boolean {
  return (
    typeof process.env.DATABASE_URL === 'string' &&
    process.env.DATABASE_URL.length > 0 &&
    process.env.REASONING_ALERT_BACKEND === 'postgres'
  );
}

export function initAlertAcknowledgmentBackend(): void {
  if (initialized) return;
  if (shouldUsePostgres()) {
    setAlertAcknowledgmentBackend(createPostgresAlertAcknowledgmentBackend());
  } else {
    setAlertAcknowledgmentBackend(null);
  }
  initialized = true;
}

/** Test-only: clear the one-shot guard so the next call rewires the backend. */
export function _resetAlertAcknowledgmentInitForTests(): void {
  initialized = false;
}

initAlertAcknowledgmentBackend();
