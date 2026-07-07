import { demoSafeClientText } from "@/lib/client-config";

export interface HomeKnowVisibleSanitizerAudit {
  sanitizerApplied: boolean;
  sanitizerReason:
    | "none"
    | "duplicate_tenant_opening"
    | "markdown_markup"
    | "executive_wording";
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
    const demoSafeValue = demoSafeClientText(value);
    return collapseRepeatedTenantOpening(
      improveExecutiveWording(
        stripVisibleMarkdownMarkup(demoSafeValue, audit, path),
        audit,
        path,
      ),
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

function stripVisibleMarkdownMarkup(
  value: string,
  audit: HomeKnowVisibleSanitizerAudit,
  path: string,
): string {
  const normalized = value
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/__([^_\n]+)__/g, "$1")
    .replace(/^#{1,6}\s+/gm, "");
  if (normalized === value) return value;
  recordSanitizerChange(audit, "markdown_markup", path, value, normalized);
  return normalized;
}

function improveExecutiveWording(
  value: string,
  audit: HomeKnowVisibleSanitizerAudit,
  path: string,
): string {
  const normalized = value.replace(
    /\bimplementation detail\b/gi,
    "source trail and evidence ownership",
  );
  if (normalized === value) return value;
  recordSanitizerChange(audit, "executive_wording", path, value, normalized);
  return normalized;
}

function collapseRepeatedTenantOpening(
  value: string,
  audit: HomeKnowVisibleSanitizerAudit,
  path: string,
): string {
  const openingCollapsed = value.replace(
    /^\s*For\s+([^,\n]+),\s+For\s+([^,\n]+),\s*/i,
    (match, firstName: string) => {
      const replacement = `For ${firstName.trim()}, `;
      recordSanitizerChange(
        audit,
        "duplicate_tenant_opening",
        path,
        value,
        value.replace(match, replacement),
      );
      return replacement;
    },
  );
  return openingCollapsed.replace(
    /\bFor\s+([^,\n]+),\s+For\s+\1,\s*/gi,
    (match, repeatedName: string) => {
      const replacement = `For ${repeatedName.trim()}, `;
      recordSanitizerChange(
        audit,
        "duplicate_tenant_opening",
        path,
        openingCollapsed,
        openingCollapsed.replace(match, replacement),
      );
      return replacement;
    },
  );
}

function recordSanitizerChange(
  audit: HomeKnowVisibleSanitizerAudit,
  reason: Exclude<HomeKnowVisibleSanitizerAudit["sanitizerReason"], "none">,
  path: string,
  before: string,
  after: string,
): void {
  if (!audit.sanitizerApplied) {
    audit.sanitizerApplied = true;
    audit.sanitizerReason = reason;
    audit.beforePrefix = prefixForAudit(before);
    audit.afterPrefix = prefixForAudit(after);
  }
  if (!audit.changedFields.includes(path)) {
    audit.changedFields.push(path);
  }
}

function prefixForAudit(value: string): string {
  return value.trim().slice(0, 96);
}
