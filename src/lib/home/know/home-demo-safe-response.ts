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

export function sanitizeHomeKnowVisiblePayload<T>(value: T, key?: string): T {
  if (typeof value === "string") {
    return (key && TECHNICAL_ID_KEYS.has(key)
      ? value
      : collapseRepeatedTenantOpening(demoSafeClientText(value))) as T;
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

function collapseRepeatedTenantOpening(value: string): string {
  return value.replace(
    /\bFor\s+([^,\n]+),\s+For\s+\1,\s*/gi,
    (_match, repeatedName: string) => `For ${repeatedName.trim()}, `,
  );
}
