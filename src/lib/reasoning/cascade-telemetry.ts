/**
 * Cascade telemetry — lightweight in-memory ring buffer of cross-instance
 * cascade impacts that have been computed and surfaced in synthesis.
 *
 * Sister module to {@link './synthesis-telemetry.ts'}. Where synthesis
 * telemetry records ONE event per synthesis call (latency, cache hit,
 * citation counts, etc.), cascade telemetry records ONE event per
 * `CascadeImpact` that flowed into a synthesis context — i.e. which
 * cross-instance edges were actually live during context build.
 *
 * Useful for answering "is this AMS → CDP impact actively affecting
 * synthesis output?" — admins can scan the recent buffer instead of
 * re-deriving the impact from raw fixtures.
 *
 * Pure module: no side effects on import, no I/O. Safe to call from
 * server routes and from tests (use `_resetForTests()` between cases).
 */

import type { LinkType } from './types';

/**
 * Where the cascade impact was computed. Maps to the three synthesis
 * context builders that call into the cross-instance reasoner.
 */
export type CascadeBuildContext =
  | 'source-synthesis'
  | 'program-synthesis'
  | 'tower-synthesis';

/**
 * A single cascade event — one row of "this cross-instance edge was live
 * when synthesis context was built."
 */
export interface CascadeTelemetryEvent {
  /** Stable id assigned at record time. */
  id: string;
  /** ISO-8601 timestamp when the event was recorded. */
  timestamp: string;
  /** The instance whose state change is the trigger. */
  sourceInstanceId: string;
  /** The instance that will be affected. */
  targetInstanceId: string;
  /** The type of link that propagates the impact. */
  linkType: LinkType | string;
  /** Directional severity from the reasoner (`blocking` / `accelerating` / `informational`). */
  severity: 'low' | 'medium' | 'high';
  /** Risk-tier severity from the reasoner (REASON-9). */
  impactSeverity?: 'low' | 'medium' | 'high';
  /** Which synthesis builder recorded the event. */
  buildContext: CascadeBuildContext;
}

/**
 * Maximum events held in the buffer at any time. Older events are evicted
 * FIFO. ~500 keeps memory bounded while still giving a useful window for
 * inspection during demos.
 */
export const CASCADE_TELEMETRY_CAPACITY = 500;

// Internal ring buffer. Newest event is appended at the end.
const buffer: CascadeTelemetryEvent[] = [];

// Monotonic counter used to keep ids unique even when timestamps collide.
let idCounter = 0;

function nextEventId(): string {
  idCounter += 1;
  return `csc_${Date.now().toString(36)}_${idCounter.toString(36)}`;
}

/**
 * Input shape for recording — caller supplies the operational fields, the
 * module fills in `id` and `timestamp`.
 */
export type CascadeTelemetryInput = Omit<
  CascadeTelemetryEvent,
  'id' | 'timestamp'
>;

/**
 * Append a cascade event to the ring buffer. Returns the recorded event.
 *
 * Best-effort: callers in synthesis context builders should not block on
 * this. Errors thrown here would be a programmer bug — there is no I/O.
 */
export function recordCascadeEvent(
  input: CascadeTelemetryInput,
): CascadeTelemetryEvent {
  const event: CascadeTelemetryEvent = {
    id: nextEventId(),
    timestamp: new Date().toISOString(),
    ...input,
  };
  buffer.push(event);
  if (buffer.length > CASCADE_TELEMETRY_CAPACITY) {
    buffer.splice(0, buffer.length - CASCADE_TELEMETRY_CAPACITY);
  }
  return event;
}

/**
 * Return the most-recent cascade events, newest first. Defaults to the
 * full buffer.
 */
export function getRecentCascadeEvents(
  limit?: number,
): CascadeTelemetryEvent[] {
  const slice = buffer.slice().reverse();
  if (typeof limit === 'number' && limit >= 0) {
    return slice.slice(0, limit);
  }
  return slice;
}

/**
 * Test-only helper: clear the buffer and reset the id counter. Exposed
 * because Jest reuses the module across test cases — without this, events
 * from one test would leak into the next.
 */
export function _resetForTests(): void {
  buffer.length = 0;
  idCounter = 0;
}
