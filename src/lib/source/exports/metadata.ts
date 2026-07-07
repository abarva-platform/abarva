import type { SourceDeliverableSpec } from "./types";

export function eventCodeFromPayload(
  payload: unknown,
  fallback: string,
): string {
  if (payload && typeof payload === "object" && "eventCode" in payload) {
    const value = (payload as { eventCode?: unknown }).eventCode;
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return fallback;
}

export function eventCodeFromSpec(
  spec: SourceDeliverableSpec,
  fallback = spec.sourceEventId,
): string {
  return eventCodeFromPayload(spec.payload, fallback);
}
