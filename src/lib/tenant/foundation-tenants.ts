import { canonicalTenantKey } from "@/lib/tenant/aliases";

export const FOUNDATION_TENANT_KEYS = [
  "airline-demo-new",
  "healthcare-demo-new",
  "meridian-health",
  "skyharbor-air",
] as const;

export type FoundationTenantKey = (typeof FOUNDATION_TENANT_KEYS)[number];

const FOUNDATION_TENANT_SET = new Set<string>(FOUNDATION_TENANT_KEYS);

function isCanonicalFoundationTenantKey(
  tenantKey: string,
): tenantKey is FoundationTenantKey {
  return FOUNDATION_TENANT_SET.has(tenantKey);
}

export function resolveFoundationTenantKey(
  tenantKey: string | null | undefined,
): FoundationTenantKey | null {
  const canonicalKey = canonicalTenantKey(tenantKey ?? "");
  return isCanonicalFoundationTenantKey(canonicalKey) ? canonicalKey : null;
}

export function isFoundationTenantKey(
  tenantKey: string | null | undefined,
): boolean {
  return resolveFoundationTenantKey(tenantKey) !== null;
}
