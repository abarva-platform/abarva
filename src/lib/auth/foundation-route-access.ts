import { canonicalTenantKey } from "@/lib/tenant/aliases";
import {
  type FoundationTenantKey,
  isFoundationTenantKey,
} from "@/lib/tenant/foundation-tenants";

type MetadataRecord = Record<string, unknown>;

export const FOUNDATION_KNOWLEDGE_ROUTE = "/knowledge-preview";

export function foundationKnowledgePath(tenantKey: FoundationTenantKey): string {
  return `${FOUNDATION_KNOWLEDGE_ROUTE}?provider=http&tenant=${encodeURIComponent(tenantKey)}`;
}

function metadataString(
  metadata: MetadataRecord | null | undefined,
  key: string,
): string | null {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function metadataBoolean(
  metadata: MetadataRecord | null | undefined,
  key: string,
): boolean {
  return metadata?.[key] === true;
}

export function resolveFoundationTenantKeyFromMetadata(
  metadata: MetadataRecord | null | undefined,
): FoundationTenantKey | null {
  if (!metadata) return null;
  if (
    !metadataBoolean(metadata, "foundationTenant") &&
    !metadataBoolean(metadata, "proofLogin")
  ) {
    return null;
  }
  const rawTenantKey =
    metadataString(metadata, "foundationTenantKey") ??
    metadataString(metadata, "tenantKey") ??
    metadataString(metadata, "clientId") ??
    metadataString(metadata, "defaultClientId");
  const tenantKey = canonicalTenantKey(rawTenantKey ?? "");
  return isFoundationTenantKey(tenantKey) ? tenantKey : null;
}

export function resolveFoundationTenantKeyFromSessionInput(input: {
  clientId?: string | null;
  defaultClientId?: string | null;
  foundationTenantKey?: string | null;
  tenantKey?: string | null;
}): FoundationTenantKey | null {
  for (const rawTenantKey of [
    input.foundationTenantKey,
    input.tenantKey,
    input.clientId,
    input.defaultClientId,
  ]) {
    const tenantKey = canonicalTenantKey(rawTenantKey ?? "");
    if (isFoundationTenantKey(tenantKey)) return tenantKey;
  }
  return null;
}

export function isFoundationRouteAllowed(pathname: string): boolean {
  return (
    pathname === FOUNDATION_KNOWLEDGE_ROUTE ||
    pathname.startsWith(`${FOUNDATION_KNOWLEDGE_ROUTE}/`) ||
    pathname.startsWith("/api/knowledge/") ||
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/responsible-ai/")
  );
}
