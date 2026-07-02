import { demoSafeClientText } from "@/lib/client-config";

export interface HomeKnowVisibleSanitizerAudit {
  sanitizerApplied: boolean;
  sanitizerReason: "none" | "duplicate_tenant_opening";
  semanticLoss: false;
  changedFields: string[];
  beforePrefix?: string;
  afterPrefix?: string;
}

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
  return sanitizeHomeKnowVisiblePayloadWithAudit(value, key).payload;
}

export function sanitizeHomeKnowVisiblePayloadWithAudit<T>(
  value: T,
  key?: string,
): { payload: T; audit: HomeKnowVisibleSanitizerAudit } {
  const audit: HomeKnowVisibleSanitizerAudit = {
    sanitizerApplied: false,
    sanitizerReason: "none",
    semanticLoss: false,
    changedFields: [],
  };
  return {
    payload: sanitizeValue(value, key, audit, key ?? "$") as T,
    audit,
  };
}

function sanitizeValue<T>(
  value: T,
  key: string | undefined,
  audit: HomeKnowVisibleSanitizerAudit,
  path: string,
): T {
  if (typeof value === "string") {
    if (key && TECHNICAL_ID_KEYS.has(key)) {
      return value;
    }
    return collapseRepeatedTenantOpening(
      demoSafeClientText(value),
      audit,
      path,
    ) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item, index) =>
      sanitizeValue(item, undefined, audit, `${path}[${index}]`),
    ) as T;
  }

  if (value && typeof value === "object") {
    const safeObject: Record<string, unknown> = {};
    for (const [childKey, childValue] of Object.entries(value)) {
      safeObject[childKey] = sanitizeValue(
        childValue,
        childKey,
        audit,
        `${path}.${childKey}`,
      );
    }
    return safeObject as T;
  }

  return value;
}

function collapseRepeatedTenantOpening(
  value: string,
  audit: HomeKnowVisibleSanitizerAudit,
  path: string,
): string {
  return value.replace(
    /\bFor\s+([^,\n]+),\s+For\s+\1,\s*/gi,
    (match, repeatedName: string) => {
      const replacement = `For ${repeatedName.trim()}, `;
      if (!audit.sanitizerApplied) {
        audit.sanitizerApplied = true;
        audit.sanitizerReason = "duplicate_tenant_opening";
        audit.beforePrefix = prefixForAudit(value);
        audit.afterPrefix = prefixForAudit(value.replace(match, replacement));
      }
      if (!audit.changedFields.includes(path)) {
        audit.changedFields.push(path);
      }
      return replacement;
    },
  );
}

function prefixForAudit(value: string): string {
  return value.trim().slice(0, 96);
}
