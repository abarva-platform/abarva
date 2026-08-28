import { canonicalTenantKey } from "@/lib/tenant/aliases";

export const FOUNDATION_TENANT_KEYS = [
  "airline-demo-new",
  "healthcare-demo-new",
  "meridian-health",
  "skyharbor-air",
] as const;

export type FoundationTenantKey = (typeof FOUNDATION_TENANT_KEYS)[number];

const FOUNDATION_TENANT_SET = new Set<string>(FOUNDATION_TENANT_KEYS);

export function isFoundationTenantKey(
  tenantKey: string | null | undefined,
): tenantKey is FoundationTenantKey {
  return FOUNDATION_TENANT_SET.has(canonicalTenantKey(tenantKey ?? ""));
}
