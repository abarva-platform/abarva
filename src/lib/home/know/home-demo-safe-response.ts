import { demoSafeClientText } from "@/lib/client-config";

const TECHNICAL_ID_KEYS = new Set([
  "client",
  "clientKey",
  "dimensionId",
  "from",
  "id",
  "recordId",
  "route",
  "sourceIds",
  "tenantId",
  "tenantKey",
  "to",
]);

const INTERNAL_PROOF_KEYS = new Set([
  "anthropicTrace",
  "answerSource",
  "composerTrace",
  "finalPrompt",
  "metadata",
  "model",
  "params",
  "promptSnapshot",
  "proof",
  "safety",
  "trace",
]);

export function sanitizeHomeKnowVisiblePayload<T>(value: T, key?: string): T {
  if (key && INTERNAL_PROOF_KEYS.has(key)) {
    return value;
  }

  if (typeof value === "string") {
    return (key && TECHNICAL_ID_KEYS.has(key)
      ? value
      : demoSafeClientText(value)) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeHomeKnowVisiblePayload(item)) as T;
  }

  if (value && typeof value === "object") {
    const safeObject: Record<string, unknown> = {};
    for (const [childKey, childValue] of Object.entries(value)) {
      safeObject[childKey] = sanitizeHomeKnowVisiblePayload(
        childValue,
        childKey,
      );
    }
    return safeObject as T;
  }

  return value;
}
