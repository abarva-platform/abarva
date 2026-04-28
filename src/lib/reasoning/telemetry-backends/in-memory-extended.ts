/**
 * In-memory extended telemetry backend.
 *
 * Simulates persistence with a second, larger ring buffer (capacity 5000)
 * separate from the primary 500-event buffer in `synthesis-telemetry.ts`.
 * Lets us exercise the write-through path end-to-end in dev without
 * provisioning a database — and gives tests a deterministic place to read
 * back what was written.
 *
 * This is a stub. The real persistence layer will replace it with a
 * Postgres / D1 / KV implementation that conforms to the same
 * {@link TelemetryBackend} interface.
 */

import type {
  SynthesisFeedback,
  SynthesisTelemetryEvent,
  TelemetryBackend,
} from '@/lib/reasoning/synthesis-telemetry';

export const IN_MEMORY_EXTENDED_CAPACITY = 5000;

export class InMemoryExtendedTelemetryBackend implements TelemetryBackend {
  private readonly capacity: number;
  private readonly events: SynthesisTelemetryEvent[] = [];

  constructor(capacity: number = IN_MEMORY_EXTENDED_CAPACITY) {
    this.capacity = capacity;
  }

  async write(event: SynthesisTelemetryEvent): Promise<void> {
    // Clone so later mutations of the buffered original (e.g. feedback
    // attachment via writeFeedback) are explicit and the primary buffer
    // cannot leak into our store via shared references.
    this.events.push({ ...event });
    if (this.events.length > this.capacity) {
      this.events.splice(0, this.events.length - this.capacity);
    }
  }

  async writeFeedback(eventId: string, feedback: SynthesisFeedback): Promise<void> {
    const target = this.events.find(e => e.id === eventId);
    if (!target) return;
    target.feedback = feedback;
    target.feedbackTimestamp = new Date().toISOString();
  }

  /**
   * Read a snapshot of stored events, oldest first. Not part of the
   * {@link TelemetryBackend} interface — exposed for tests and dev tooling
   * that need to verify the write path.
   */
  read(): SynthesisTelemetryEvent[] {
    return this.events.slice();
  }

  /** Test helper: drop everything. */
  clear(): void {
    this.events.length = 0;
  }
}

/** Singleton used by the app-startup wiring in `telemetry-init.ts`. */
export const inMemoryExtendedTelemetryBackend = new InMemoryExtendedTelemetryBackend();
