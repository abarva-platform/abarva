import { getServerSupabase } from '@/lib/supabase-server';

export interface TraceStep {
  label: string;
  kind: 'retrieval' | 'graph' | 'prompt' | 'stream' | 'background';
  latencyMs: number;
  summary?: string;
  count?: number;
  error?: string;
}

export class TurnTrace {
  private steps: TraceStep[] = [];
  private startedAt = Date.now();

  constructor(
    private readonly turnId: string | null,
    private readonly engagementId: string | null = null,
  ) {}

  async capture<T>(label: string, kind: TraceStep['kind'], fn: () => Promise<T>, extract?: (result: T) => { summary?: string; count?: number }): Promise<T> {
    const t0 = Date.now();
    try {
      const result = await fn();
      const meta = extract ? extract(result) : {};
      this.steps.push({
        label,
        kind,
        latencyMs: Date.now() - t0,
        summary: meta.summary,
        count: meta.count,
      });
      return result;
    } catch (err) {
      this.steps.push({
        label,
        kind,
        latencyMs: Date.now() - t0,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  record(step: TraceStep): void {
    this.steps.push(step);
  }

  setModel(model: string, inputTokens: number, outputTokens: number): void {
    this.model = model;
    this.inputTokens = inputTokens;
    this.outputTokens = outputTokens;
  }

  totalLatencyMs(): number {
    return Date.now() - this.startedAt;
  }

  snapshot(): {
    turnId: string | null;
    engagementId: string | null;
    steps: TraceStep[];
    model?: string;
    inputTokens?: number;
    outputTokens?: number;
    latencyMs: number;
  } {
    return {
      turnId: this.turnId,
      engagementId: this.engagementId,
      steps: [...this.steps],
      model: this.model,
      inputTokens: this.inputTokens,
      outputTokens: this.outputTokens,
      latencyMs: this.totalLatencyMs(),
    };
  }

  async persist(): Promise<void> {
    if (!this.turnId) return;
    const sb = getServerSupabase();
    await sb.from('turn_traces').upsert(
      {
        turn_id: this.turnId,
        engagement_id: this.engagementId,
        model: this.model ?? null,
        input_tokens: this.inputTokens ?? null,
        output_tokens: this.outputTokens ?? null,
        latency_ms: this.totalLatencyMs(),
        steps: this.steps,
      },
      { onConflict: 'turn_id' },
    );
  }

  private model?: string;
  private inputTokens?: number;
  private outputTokens?: number;
}
