/**
 * Telemetry init — wires the in-memory-extended backend into the synthesis
 * telemetry module on first import. This is a stub; the real persistence
 * layer will replace this file with a Postgres / D1 / KV initializer.
 *
 * Imported once from a server entry point (e.g. the telemetry route) so it
 * runs once per server boot in serverless environments. Idempotent — the
 * underlying `setTelemetryBackend` is a simple slot assignment.
 */

import { setTelemetryBackend } from '@/lib/reasoning/synthesis-telemetry';
import { inMemoryExtendedTelemetryBackend } from '@/lib/reasoning/telemetry-backends/in-memory-extended';

let initialized = false;

export function initTelemetryBackend(): void {
  if (initialized) return;
  setTelemetryBackend(inMemoryExtendedTelemetryBackend);
  initialized = true;
}

// Run once on module import so the route module simply needs to import this
// file to opt in.
initTelemetryBackend();
