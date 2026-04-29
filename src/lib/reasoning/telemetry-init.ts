/**
 * Telemetry init — wires a write-through telemetry backend into the synthesis
 * telemetry module on first import.
 *
 * Resolution order (first match wins):
 *   1. Postgres backend, if BOTH `process.env.DATABASE_URL` is set AND
 *      `process.env.REASONING_TELEMETRY_BACKEND === 'postgres'`. Persists
 *      every recorded event + feedback signal to `reasoning_telemetry_events`
 *      (migration 20260428180000).
 *   2. Otherwise the in-memory-extended backend (capacity 5000) — same
 *      behavior as before, no DB dependency.
 *
 * Imported once from a server entry point (e.g. the telemetry route) so it
 * runs once per server boot in serverless environments. Idempotent — the
 * underlying `setTelemetryBackend` is a simple slot assignment.
 */

import { setTelemetryBackend } from '@/lib/reasoning/synthesis-telemetry';
import { inMemoryExtendedTelemetryBackend } from '@/lib/reasoning/telemetry-backends/in-memory-extended';
import { createPostgresTelemetryBackend } from '@/lib/reasoning/telemetry-backends/postgres';

let initialized = false;

function shouldUsePostgres(): boolean {
  return (
    typeof process.env.DATABASE_URL === 'string' &&
    process.env.DATABASE_URL.length > 0 &&
    process.env.REASONING_TELEMETRY_BACKEND === 'postgres'
  );
}

export function initTelemetryBackend(): void {
  if (initialized) return;
  if (shouldUsePostgres()) {
    setTelemetryBackend(createPostgresTelemetryBackend());
  } else {
    setTelemetryBackend(inMemoryExtendedTelemetryBackend);
  }
  initialized = true;
}

/** Test-only: clear the one-shot guard so the next call rewires the backend. */
export function _resetTelemetryInitForTests(): void {
  initialized = false;
}

// Run once on module import so the route module simply needs to import this
// file to opt in.
initTelemetryBackend();
