import type { RequestTelemetry } from './request-telemetry';

export interface PosthogEmitter {
  capture(event: string, properties: Record<string, unknown>): void;
}

export function emitRequestTelemetryToPosthog(
  telemetry: RequestTelemetry,
  emitter: PosthogEmitter | null | undefined,
): boolean {
  if (!emitter) return false;
  emitter.capture('wave0_request_telemetry', {
    requestId: telemetry.requestId,
    tenantKey: telemetry.tenantKey,
    surface: telemetry.surface,
    mode: telemetry.mode,
    latencyMs: telemetry.latencyMs,
    timedOut: telemetry.timedOut,
    modelVendor: telemetry.modelVendor,
    modelTier: telemetry.modelTier,
    inferenceCostUsd: telemetry.inferenceCostUsd,
    answerQualityScore: telemetry.answerQualityScore,
    failureKind: telemetry.userVisibleFailure?.kind ?? null,
  });
  return true;
}
