// Synthesis violations recorder · F0.3 telemetry sink.
//
// Mirrors the shape of `src/lib/reasoning/synthesis-telemetry.ts`: an
// in-memory ring buffer (default 500) is the authoritative read source
// during development; an optional pluggable backend lets prod write
// through to Postgres / KV / etc. without changing call sites.
//
// Per kickoff §4 F0.3: validator runs POST-HOC after the response has
// fully streamed to the user. Violations are logged here as alarm
// telemetry — they do NOT block streaming. The structural integrity
// mechanism for action-claims is F0.4 tool-use; this recorder catches
// the four classes the validator covers.

import type { Violation, ViolationType } from './outputValidator';

export interface SynthesisViolationEvent {
  /** Stable id assigned at record time. */
  id: string;
  /** ISO-8601 timestamp when the event was recorded. */
  timestamp: string;
  /** The agent route that produced the response (e.g. '/api/chat/agent'). */
  route: string;
  /** Surface context the route was serving (e.g. '/programs/new'). */
  surface: string | null;
  /** Multi-tenant scope. Defaults to apex-retail when not supplied. */
  tenantId: string;
  /** Person id of the signed-in user, when known. */
  userId: string | null;
  /** Number of violations detected. 0 means a clean run was logged for ratio metrics. */
  violationCount: number;
  /** Distinct violation types in this run. */
  violationTypes: ViolationType[];
  /** Full violation details (small payload — capped at ~10kb worth of details). */
  violations: Violation[];
  /** Length of the response text in characters — useful for normalizing rates. */
  responseLength: number;
}

const RING_CAPACITY = 500;
const DEFAULT_TENANT_ID = 'apex-retail';
const ID_PREFIX = 'vlt';

let counter = 0;
const ring: SynthesisViolationEvent[] = [];

export interface ViolationsBackend {
  write(event: SynthesisViolationEvent): Promise<void>;
}

let backend: ViolationsBackend | null = null;

export function setViolationsBackend(b: ViolationsBackend | null): void {
  backend = b;
}

function generateId(): string {
  counter += 1;
  const epoch = Date.now().toString(36);
  return `${ID_PREFIX}_${epoch}_${counter}`;
}

export interface RecordViolationsInput {
  route: string;
  surface?: string | null;
  tenantId?: string | null;
  userId?: string | null;
  violations: Violation[];
  responseLength: number;
}

export function recordViolations(input: RecordViolationsInput): SynthesisViolationEvent {
  const event: SynthesisViolationEvent = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    route: input.route,
    surface: input.surface ?? null,
    tenantId: input.tenantId ?? DEFAULT_TENANT_ID,
    userId: input.userId ?? null,
    violationCount: input.violations.length,
    violationTypes: Array.from(new Set(input.violations.map((v) => v.type))),
    violations: input.violations,
    responseLength: input.responseLength,
  };

  ring.push(event);
  while (ring.length > RING_CAPACITY) ring.shift();

  // Best-effort backend write. Swallow errors; never block the caller.
  if (backend) {
    backend.write(event).catch((err) => {
      console.warn('[synthesis_violations] backend write failed', err);
    });
  }

  return event;
}

export function getRecentViolations(limit = 50): SynthesisViolationEvent[] {
  if (limit <= 0) return [];
  return ring.slice(-limit).reverse();
}

// Test-only access — never imported from production code.
export const __testing__ = {
  reset(): void {
    ring.length = 0;
    counter = 0;
    backend = null;
  },
  size(): number {
    return ring.length;
  },
};
