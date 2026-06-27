import { canonicalTenantKey } from "@/lib/tenant/aliases";

export type TenantScopeType =
  | "runtime_client"
  | "demo_client"
  | "archived_client"
  | "global_corpus"
  | "system_bucket"
  | "unknown"
  | "inventory_snapshot"
  | "lab_only";

export interface TenantScopePolicyResult {
  tenantKey: string;
  canonicalTenantKey: string;
  scopeType: TenantScopeType;
  surfaceEligible: boolean;
  reason: string;
}

export const SEMANTIC2_RUNTIME_TENANT_KEYS = [
  "apex-retail",
  "first-capital",
  "lakeshore-holdings",
  "meridian-health",
  "skyharbor-air",
] as const;

export type Semantic2RuntimeTenantKey =
  (typeof SEMANTIC2_RUNTIME_TENANT_KEYS)[number];

const RUNTIME_TENANTS = new Set<string>(SEMANTIC2_RUNTIME_TENANT_KEYS);

const APPROVED_DEMO_TENANTS = new Set<string>([]);

function isUuidLike(value: string): boolean {
  return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
    value,
  );
}

export function canonicalSemantic2TenantKey(
  value: string | null | undefined,
): string {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!raw) return "unknown";
  return canonicalTenantKey(raw);
}

export function classifyTenantScope(
  value: string | null | undefined,
): TenantScopePolicyResult {
  const tenantKey = String(value ?? "").trim();
  const canonicalTenantKey = canonicalSemantic2TenantKey(tenantKey);

  if (!tenantKey || canonicalTenantKey === "unknown") {
    return {
      tenantKey,
      canonicalTenantKey: "unknown",
      scopeType: "unknown",
      surfaceEligible: false,
      reason: "Missing or unknown tenant key cannot answer runtime questions.",
    };
  }

  if (canonicalTenantKey.startsWith("archived:")) {
    return {
      tenantKey,
      canonicalTenantKey,
      scopeType: "archived_client",
      surfaceEligible: false,
      reason: "Archived tenant scopes are retained for audit only.",
    };
  }

  if (
    ["global", "global-corpus", "shared-corpus"].includes(canonicalTenantKey)
  ) {
    return {
      tenantKey,
      canonicalTenantKey,
      scopeType: "global_corpus",
      surfaceEligible: false,
      reason:
        "Global corpus material can inform patterns but cannot answer tenant-runtime questions.",
    };
  }

  if (
    ["inventory_snapshot", "inventory-snapshot"].includes(canonicalTenantKey)
  ) {
    return {
      tenantKey,
      canonicalTenantKey,
      scopeType: "inventory_snapshot",
      surfaceEligible: false,
      reason:
        "Inventory snapshots are operator evidence, not runtime tenant dossiers.",
    };
  }

  if (isUuidLike(canonicalTenantKey)) {
    return {
      tenantKey,
      canonicalTenantKey,
      scopeType: "system_bucket",
      surfaceEligible: false,
      reason:
        "UUID tenant buckets must be mapped to a canonical runtime tenant before use.",
    };
  }

  if (RUNTIME_TENANTS.has(canonicalTenantKey)) {
    return {
      tenantKey,
      canonicalTenantKey,
      scopeType: "runtime_client",
      surfaceEligible: true,
      reason: "Canonical runtime tenant.",
    };
  }

  if (APPROVED_DEMO_TENANTS.has(canonicalTenantKey)) {
    return {
      tenantKey,
      canonicalTenantKey,
      scopeType: "demo_client",
      surfaceEligible: true,
      reason: "Approved demo tenant.",
    };
  }

  return {
    tenantKey,
    canonicalTenantKey,
    scopeType: "lab_only",
    surfaceEligible: false,
    reason:
      "Tenant is not in the runtime allowlist or approved demo allowlist.",
  };
}
