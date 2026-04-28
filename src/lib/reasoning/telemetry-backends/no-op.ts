/**
 * No-op telemetry backend.
 *
 * Resolves both `write` and `writeFeedback` immediately. Functionally
 * identical to leaving the backend slot `null`, but exposed as a concrete
 * implementation for two reasons:
 *
 *   1. Documentation — gives consumers a typed example of the
 *      {@link TelemetryBackend} contract to mirror.
 *   2. Opt-in to the codepath — callers that want to exercise the
 *      backend-write branch (for instrumentation, tracing, etc.) without
 *      enabling persistence can install this instead of `null`.
 */

import type {
  SynthesisFeedback,
  SynthesisTelemetryEvent,
  TelemetryBackend,
} from '@/lib/reasoning/synthesis-telemetry';

export class NoOpTelemetryBackend implements TelemetryBackend {
  async write(_event: SynthesisTelemetryEvent): Promise<void> {
    // Intentionally empty.
  }

  async writeFeedback(_eventId: string, _feedback: SynthesisFeedback): Promise<void> {
    // Intentionally empty.
  }
}

/** Convenience singleton — there's no per-instance state. */
export const noOpTelemetryBackend = new NoOpTelemetryBackend();
