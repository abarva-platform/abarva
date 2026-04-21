// SSE event emitter for Nexus query stream. Per spec §7.2 · event types:
// turn_started · clarifying_question · retrieval_progress · content_delta
// · source_attached · turn_complete · error.

export type NexusSseEvent =
  | { type: 'turn_started'; turnId: string; mode: string; format: string }
  | { type: 'clarifying_question'; question: string; options: Array<{ label: string; context?: string }> }
  | { type: 'retrieval_progress'; phase: string; status: string; latencyMs?: number }
  | { type: 'content_delta'; text?: string; json?: Record<string, unknown> }
  | { type: 'source_attached'; claimId: string; source: Record<string, unknown> }
  | { type: 'turn_complete'; turnId: string; payload: Record<string, unknown> }
  | { type: 'error'; code: string; recoverable: boolean; message: string };

export function encodeEvent(event: NexusSseEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}

export class NexusStreamEmitter {
  private encoder = new TextEncoder();

  constructor(private controller: ReadableStreamDefaultController<Uint8Array>) {}

  emit(event: NexusSseEvent): void {
    this.controller.enqueue(this.encoder.encode(encodeEvent(event)));
  }

  close(): void {
    this.controller.close();
  }
}

export function makeNexusStream(run: (emitter: NexusStreamEmitter) => Promise<void>): ReadableStream<Uint8Array> {
  return new ReadableStream({
    async start(controller) {
      const emitter = new NexusStreamEmitter(controller);
      try {
        await run(emitter);
      } catch (err) {
        emitter.emit({
          type: 'error',
          code: 'pipeline_error',
          recoverable: false,
          message: (err as Error).message,
        });
      } finally {
        emitter.close();
      }
    },
  });
}

export const SSE_HEADERS: HeadersInit = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
  'X-Accel-Buffering': 'no',
};
