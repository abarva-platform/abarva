/**
 * Mission state init — wires a write-through backend into the mission-state
 * store on first import.
 *
 * Resolution:
 *   - Postgres backend, if BOTH `process.env.DATABASE_URL` is set AND
 *     `process.env.REASONING_MISSION_BACKEND === 'postgres'`. Persists every
 *     `setMissionState` / `clearMissionState` call to
 *     `reasoning_mission_states` (migration 20260428190000).
 *   - Otherwise the default in-memory-only behavior — no backend installed.
 *
 * Imported once from a server entry point so it runs once per server boot in
 * serverless environments. Idempotent — `setMissionStateBackend` is a simple
 * slot assignment.
 */

import { setMissionStateBackend } from '@/lib/reasoning/mission-state-store';
import { createPostgresMissionStateBackend } from '@/lib/reasoning/mission-state-backends/postgres';

let initialized = false;

function shouldUsePostgres(): boolean {
  return (
    typeof process.env.DATABASE_URL === 'string' &&
    process.env.DATABASE_URL.length > 0 &&
    process.env.REASONING_MISSION_BACKEND === 'postgres'
  );
}

export function initMissionStateBackend(): void {
  if (initialized) return;
  if (shouldUsePostgres()) {
    setMissionStateBackend(createPostgresMissionStateBackend());
  } else {
    setMissionStateBackend(null);
  }
  initialized = true;
}

/** Test-only: clear the one-shot guard so the next call rewires the backend. */
export function _resetMissionStateInitForTests(): void {
  initialized = false;
}

initMissionStateBackend();
