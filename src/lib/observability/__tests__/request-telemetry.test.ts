import {
  recordRequestTelemetry,
  sampleTelemetry,
  summarizeTelemetry,
} from '../request-telemetry';
import { emitRequestTelemetryToPosthog } from '../posthog-emitter';

jest.mock('../structured-logger', () => ({
  writeStructuredLog: jest.fn(),
}));

describe('request telemetry', () => {
  it('summarizes live/fallback, latency, timeout, cost, and quality', () => {
    const summary = summarizeTelemetry(sampleTelemetry());

    expect(summary).toMatchObject({
      total: 3,
      liveModePercent: 67,
      fallbackModePercent: 33,
      timeoutRatePercent: 0,
      p50LatencyMs: 1240,
      p95LatencyMs: 3200,
      averageQualityScore: 84,
    });
    expect(summary.totalCostUsd).toBe(0.055);
  });

  it('records normalized telemetry and emits to PostHog adapter', () => {
    const row = recordRequestTelemetry({
      requestId: 'req-1',
      tenantKey: 'apex-retail',
      surface: 'moves',
      promptCategory: 'cost_question',
      mode: 'live',
      latencyMs: 12.4,
      timedOut: false,
      modelVendor: 'openai',
      modelTier: 'mid',
      inferenceCostUsd: 0.003,
      answerQualityScore: 101,
      userVisibleFailure: null,
    });
    const emitter = { capture: jest.fn() };

    expect(row.answerQualityScore).toBe(100);
    expect(emitRequestTelemetryToPosthog(row, emitter)).toBe(true);
    expect(emitter.capture).toHaveBeenCalledWith(
      'wave0_request_telemetry',
      expect.objectContaining({ requestId: 'req-1', tenantKey: 'apex-retail' }),
    );
  });
});
