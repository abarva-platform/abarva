import { writeStructuredLog } from './structured-logger';

export type ObservedSurface = 'intelligence' | 'moves' | 'source' | 'tower' | 'setup';
export type ObservedMode = 'live' | 'fallback';

export interface RequestTelemetry {
  requestId: string;
  tenantKey: string;
  surface: ObservedSurface;
  promptCategory: string;
  mode: ObservedMode;
  latencyMs: number;
  timedOut: boolean;
  modelVendor: string;
  modelTier: string;
  inferenceCostUsd: number;
  answerQualityScore: number;
  userVisibleFailure: { kind: string; message: string } | null;
  observedAt: string;
}

const telemetryBuffer: RequestTelemetry[] = [];
const MAX_BUFFER = 500;

export function recordRequestTelemetry(input: Omit<RequestTelemetry, 'observedAt'>): RequestTelemetry {
  const entry: RequestTelemetry = {
    ...input,
    latencyMs: Math.max(0, Math.round(input.latencyMs)),
    inferenceCostUsd: Math.max(0, input.inferenceCostUsd),
    answerQualityScore: Math.max(0, Math.min(100, Math.round(input.answerQualityScore))),
    observedAt: new Date().toISOString(),
  };
  telemetryBuffer.unshift(entry);
  telemetryBuffer.splice(MAX_BUFFER);
  writeStructuredLog(entry.timedOut || entry.userVisibleFailure ? 'warn' : 'info', 'wave0_request_telemetry', {
    surface: entry.surface,
    tenant: { activeClientKey: entry.tenantKey },
    metadata: { ...entry },
  });
  return entry;
}

export function listRequestTelemetry(limit = 100): RequestTelemetry[] {
  return telemetryBuffer.slice(0, limit);
}

export interface TelemetrySummary {
  total: number;
  liveModePercent: number;
  fallbackModePercent: number;
  timeoutRatePercent: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  totalCostUsd: number;
  averageQualityScore: number;
}

export function summarizeTelemetry(rows: RequestTelemetry[]): TelemetrySummary {
  const total = rows.length;
  if (total === 0) {
    return {
      total: 0,
      liveModePercent: 0,
      fallbackModePercent: 0,
      timeoutRatePercent: 0,
      p50LatencyMs: 0,
      p95LatencyMs: 0,
      totalCostUsd: 0,
      averageQualityScore: 0,
    };
  }
  const latencies = rows.map((row) => row.latencyMs).sort((a, b) => a - b);
  const live = rows.filter((row) => row.mode === 'live').length;
  const timedOut = rows.filter((row) => row.timedOut).length;
  const totalCostUsd = rows.reduce((sum, row) => sum + row.inferenceCostUsd, 0);
  const averageQualityScore =
    rows.reduce((sum, row) => sum + row.answerQualityScore, 0) / total;
  return {
    total,
    liveModePercent: percent(live, total),
    fallbackModePercent: percent(total - live, total),
    timeoutRatePercent: percent(timedOut, total),
    p50LatencyMs: percentile(latencies, 0.5),
    p95LatencyMs: percentile(latencies, 0.95),
    totalCostUsd: Number(totalCostUsd.toFixed(4)),
    averageQualityScore: Math.round(averageQualityScore),
  };
}

export function sampleTelemetry(): RequestTelemetry[] {
  return [
    {
      requestId: 'wave0-sample-1',
      tenantKey: 'apex-retail',
      surface: 'tower',
      promptCategory: 'value_question',
      mode: 'live',
      latencyMs: 820,
      timedOut: false,
      modelVendor: 'openai',
      modelTier: 'mid',
      inferenceCostUsd: 0.014,
      answerQualityScore: 88,
      userVisibleFailure: null,
      observedAt: '2026-05-31T12:00:00.000Z',
    },
    {
      requestId: 'wave0-sample-2',
      tenantKey: 'meridian-health',
      surface: 'intelligence',
      promptCategory: 'trust_question',
      mode: 'fallback',
      latencyMs: 3200,
      timedOut: false,
      modelVendor: 'fallback',
      modelTier: 'rules',
      inferenceCostUsd: 0,
      answerQualityScore: 72,
      userVisibleFailure: { kind: 'fallback', message: 'Model unavailable; deterministic fallback shown.' },
      observedAt: '2026-05-31T12:05:00.000Z',
    },
    {
      requestId: 'wave0-sample-3',
      tenantKey: 'skyharbor-air',
      surface: 'source',
      promptCategory: 'vendor_question',
      mode: 'live',
      latencyMs: 1240,
      timedOut: false,
      modelVendor: 'anthropic',
      modelTier: 'frontier',
      inferenceCostUsd: 0.041,
      answerQualityScore: 91,
      userVisibleFailure: null,
      observedAt: '2026-05-31T12:10:00.000Z',
    },
  ];
}

function percent(part: number, total: number): number {
  return Math.round((part / total) * 100);
}

function percentile(sorted: number[], p: number): number {
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * p) - 1));
  return sorted[index] ?? 0;
}
