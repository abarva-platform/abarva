/**
 * Synthesis telemetry — lightweight in-memory ring buffer.
 *
 * Records one event per synthesis call (stream completion or cache hit) so
 * the reasoning layer has visibility into:
 *   - cache hit/miss rate
 *   - latency distribution
 *   - citation / contradiction / failure-mode counts per request
 *   - user feedback signal (thumbs up/down) attached after the fact
 *
 * This is the FOUNDATION — not the persistence layer. Events live in a
 * fixed-size circular buffer in module memory and reset on process restart.
 * A future task will pipe these into Postgres/Redis. Today the data is read
 * by `getRecentSynthesisEvents()` for inspection in dev tools / admin views.
 *
 * Pure module: no side effects on import, no I/O. Safe to call from server
 * routes and from tests (use `_resetForTests()` to clear state between cases).
 */

export type SynthesisSurface = 'source' | 'programs' | 'tower';

export type SynthesisFeedback = 'up' | 'down';

export interface SynthesisTelemetryEvent {
  /** Stable id assigned at record time. Returned to clients via header. */
  id: string;
  /** ISO-8601 timestamp when the event was recorded. */
  timestamp: string;
  /** Which synthesis surface produced the event. */
  surface: SynthesisSurface;
  /**
   * Identifier of the instance the synthesis was about.
   * For Tower the value is the literal string `'tower'` since Tower has no
   * per-instance body — its scope is the whole portfolio.
   */
  instanceId: string;
  /** Pattern id governing the synthesis, or `null` for portfolio-level Atlas. */
  patternId: string | null;
  /** Whether the response came from the in-process synthesis cache. */
  cacheHit: boolean;
  /** Wall-clock latency from request start to response settle (ms). */
  latencyMs: number;
  /** How many citation pointers were grounded in the synthesis context. */
  citationCount: number;
  /** How many contradictions were detected on the instance. */
  contradictionCount: number;
  /** How many failure-mode signals fired on the instance. */
  failureModeCount: number;
  /** How many gates were evaluated for the relevant stage. */
  gateCount: number;
  /** User feedback signal — set later via `recordFeedback()`. */
  feedback?: SynthesisFeedback;
  /** ISO-8601 timestamp when feedback was attached. */
  feedbackTimestamp?: string;
}

/**
 * Maximum events held in the buffer at any time. Older events are evicted
 * FIFO. ~500 keeps memory bounded while still giving a useful window for
 * inspection during demos.
 */
export const SYNTHESIS_TELEMETRY_CAPACITY = 500;

// Internal ring buffer. Newest event is appended at the end.
const buffer: SynthesisTelemetryEvent[] = [];

// Monotonic counter used to keep ids unique even when timestamps collide.
let idCounter = 0;

function nextEventId(): string {
  idCounter += 1;
  // Prefix keeps ids easy to spot in logs and headers.
  return `tlm_${Date.now().toString(36)}_${idCounter.toString(36)}`;
}

/**
 * Input shape for recording — caller supplies the operational data, the
 * module fills in `id` and `timestamp` deterministically.
 */
export type SynthesisTelemetryInput = Omit<
  SynthesisTelemetryEvent,
  'id' | 'timestamp' | 'feedback' | 'feedbackTimestamp'
>;

/**
 * Append an event to the ring buffer. Returns the assigned event id so the
 * caller can echo it to the client (e.g. via the `X-Synthesis-Event-Id`
 * response header).
 */
export function recordSynthesisEvent(input: SynthesisTelemetryInput): SynthesisTelemetryEvent {
  const event: SynthesisTelemetryEvent = {
    id: nextEventId(),
    timestamp: new Date().toISOString(),
    ...input,
  };
  buffer.push(event);
  if (buffer.length > SYNTHESIS_TELEMETRY_CAPACITY) {
    buffer.splice(0, buffer.length - SYNTHESIS_TELEMETRY_CAPACITY);
  }
  return event;
}

/**
 * Return the most-recent events, newest first. Defaults to the full buffer.
 */
export function getRecentSynthesisEvents(limit?: number): SynthesisTelemetryEvent[] {
  const slice = buffer.slice().reverse();
  if (typeof limit === 'number' && limit >= 0) {
    return slice.slice(0, limit);
  }
  return slice;
}

/**
 * Attach a user feedback signal to a previously recorded event.
 *
 * Returns `true` when the event was found and updated, `false` otherwise.
 * The buffer entry is mutated in place — recent events stay recent, and a
 * subsequent feedback signal will overwrite an earlier one (typical "I
 * changed my mind" UX).
 */
export function recordFeedback(eventId: string, feedback: SynthesisFeedback): boolean {
  const event = buffer.find(e => e.id === eventId);
  if (!event) return false;
  event.feedback = feedback;
  event.feedbackTimestamp = new Date().toISOString();
  return true;
}

/**
 * Test-only helper: clear the buffer and reset the id counter.
 * Exposed because Jest reuses the module across test cases — without this,
 * events from one test would leak into the next.
 */
export function _resetForTests(): void {
  buffer.length = 0;
  idCounter = 0;
}
