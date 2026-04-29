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
 * The in-memory buffer remains the authoritative read source for dev tools
 * and admin views. A pluggable {@link TelemetryBackend} sits beside it for
 * write-through persistence (Postgres / D1 / KV / etc.) without touching
 * call sites. Backend writes are best-effort: every record path schedules
 * the write asynchronously and swallows failures so backend latency or
 * outages cannot block the in-memory write or an API response.
 *
 * Retention: a configurable retention window (default 30 days) is applied
 * at write time. Events older than `now - retentionDays * 86_400_000` ms
 * are dropped from the buffer before the new event is appended. This keeps
 * the buffer bounded by both capacity and age.
 *
 * Pure module: no side effects on import, no I/O. Safe to call from server
 * routes and from tests (use `_resetForTests()` to clear state between cases).
 */

export type SynthesisSurface = 'source' | 'programs' | 'tower';

export type SynthesisFeedback = 'up' | 'down';

/**
 * Default tenant id stamped on telemetry events when the caller does not
 * pass one through. Mirrors the `DEFAULT_TENANT_ID` exported by the source
 * and program instance modules so the multi-tenant scaffolding has one
 * canonical default. Tenancy is not enforced yet.
 */
export const DEFAULT_TELEMETRY_TENANT_ID = 'apex-retail';

export interface SynthesisTelemetryEvent {
  /** Stable id assigned at record time. Returned to clients via header. */
  id: string;
  /** ISO-8601 timestamp when the event was recorded. */
  timestamp: string;
  /** Which synthesis surface produced the event. */
  surface: SynthesisSurface;
  /**
   * Multi-tenant scope for the event. Defaults to `'apex-retail'` when the
   * recorder does not supply one. Reasoning admin views can filter by
   * tenant via this field; tenancy is not enforced yet.
   */
  tenantId: string;
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

/** Default retention window applied at write time. */
export const DEFAULT_TELEMETRY_RETENTION_DAYS = 30;

const MS_PER_DAY = 86_400_000;

/**
 * Pluggable persistence backend. Implementations should treat both methods
 * as write-only and idempotent — telemetry callers do not await them and do
 * not surface errors.
 */
export interface TelemetryBackend {
  /** Persist a freshly-recorded event. */
  write(event: SynthesisTelemetryEvent): Promise<void>;
  /** Persist a feedback signal for a previously-written event. */
  writeFeedback(eventId: string, feedback: SynthesisFeedback): Promise<void>;
}

// Internal ring buffer. Newest event is appended at the end.
const buffer: SynthesisTelemetryEvent[] = [];

// Monotonic counter used to keep ids unique even when timestamps collide.
let idCounter = 0;

// Retention window in days. Mutable via `setRetentionDays` for tests + ops.
let retentionDays = DEFAULT_TELEMETRY_RETENTION_DAYS;

// Active backend, or `null` for the default (in-memory only) behavior.
let activeBackend: TelemetryBackend | null = null;

function nextEventId(): string {
  idCounter += 1;
  // Prefix keeps ids easy to spot in logs and headers.
  return `tlm_${Date.now().toString(36)}_${idCounter.toString(36)}`;
}

/**
 * Drop events older than the configured retention window. Operates in place
 * on the shared buffer. Called immediately before every record so old data
 * is never returned by `getRecentSynthesisEvents`.
 */
function applyRetention(now: number): void {
  if (retentionDays <= 0) return;
  const cutoff = now - retentionDays * MS_PER_DAY;
  // Buffer is append-ordered, so the first element younger than `cutoff` is
  // the new head — splice everything before it.
  let drop = 0;
  for (const event of buffer) {
    const ts = Date.parse(event.timestamp);
    if (Number.isFinite(ts) && ts < cutoff) {
      drop += 1;
    } else {
      break;
    }
  }
  if (drop > 0) {
    buffer.splice(0, drop);
  }
}

/**
 * Input shape for recording — caller supplies the operational data, the
 * module fills in `id` and `timestamp` deterministically.
 *
 * `tenantId` is optional for back-compat: callers that have not yet been
 * threaded through with a tenant scope omit it and the recorder fills in
 * the default tenant. New call sites should pass the request-scoped tenant.
 */
export type SynthesisTelemetryInput = Omit<
  SynthesisTelemetryEvent,
  'id' | 'timestamp' | 'feedback' | 'feedbackTimestamp' | 'tenantId'
> & { tenantId?: string };

/**
 * Append an event to the ring buffer. Returns the assigned event id so the
 * caller can echo it to the client (e.g. via the `X-Synthesis-Event-Id`
 * response header).
 *
 * Side effects:
 *   - Applies the retention window before append.
 *   - Schedules a best-effort write to the configured backend (if any).
 *     Backend rejections are swallowed — they never propagate to the caller.
 */
export function recordSynthesisEvent(input: SynthesisTelemetryInput): SynthesisTelemetryEvent {
  const now = Date.now();
  applyRetention(now);

  const { tenantId, ...rest } = input;
  const event: SynthesisTelemetryEvent = {
    id: nextEventId(),
    timestamp: new Date(now).toISOString(),
    tenantId: tenantId ?? DEFAULT_TELEMETRY_TENANT_ID,
    ...rest,
  };
  buffer.push(event);
  if (buffer.length > SYNTHESIS_TELEMETRY_CAPACITY) {
    buffer.splice(0, buffer.length - SYNTHESIS_TELEMETRY_CAPACITY);
  }

  if (activeBackend) {
    // Fire-and-forget: do NOT await, do NOT propagate failures.
    void activeBackend.write(event).catch(() => {});
  }

  return event;
}

/**
 * Return the most-recent events, newest first. Defaults to the full buffer.
 *
 * Pass `options.tenantId` to filter the returned events to a single tenant.
 * When omitted, every event is returned (back-compat for existing callers).
 */
export function getRecentSynthesisEvents(
  limit?: number,
  options?: { tenantId?: string },
): SynthesisTelemetryEvent[] {
  let slice = buffer.slice().reverse();
  if (options?.tenantId !== undefined) {
    const tid = options.tenantId;
    slice = slice.filter((e) => e.tenantId === tid);
  }
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
 *
 * As with `recordSynthesisEvent`, when a backend is configured the feedback
 * is forwarded best-effort (no await, no propagated failures).
 */
export function recordFeedback(eventId: string, feedback: SynthesisFeedback): boolean {
  const event = buffer.find(e => e.id === eventId);
  if (!event) return false;
  event.feedback = feedback;
  event.feedbackTimestamp = new Date().toISOString();

  if (activeBackend) {
    void activeBackend.writeFeedback(eventId, feedback).catch(() => {});
  }

  return true;
}

/**
 * Override the retention window in days. Pass `0` (or a negative value) to
 * disable retention pruning entirely. Visible to tests and ops; not part of
 * the typical request-time hot path.
 */
export function setRetentionDays(days: number): void {
  retentionDays = days;
}

/** Read the currently-configured retention window. */
export function getRetentionDays(): number {
  return retentionDays;
}

/**
 * Install a write-through backend for telemetry persistence. Pass `null` to
 * restore the default in-memory-only behavior.
 *
 * The backend interface is intentionally narrow — `write` and `writeFeedback`
 * — so swapping in a Postgres / D1 / KV implementation is a one-file change.
 */
export function setTelemetryBackend(backend: TelemetryBackend | null): void {
  activeBackend = backend;
}

/** Read the currently-installed backend (mostly for tests + diagnostics). */
export function getTelemetryBackend(): TelemetryBackend | null {
  return activeBackend;
}

/**
 * Test-only helper: clear the buffer, reset the id counter, and restore the
 * default retention window + null backend. Exposed because Jest reuses the
 * module across test cases — without this, events from one test would leak
 * into the next.
 */
export function _resetForTests(): void {
  buffer.length = 0;
  idCounter = 0;
  retentionDays = DEFAULT_TELEMETRY_RETENTION_DAYS;
  activeBackend = null;
}
