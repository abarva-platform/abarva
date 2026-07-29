import { auth, currentUser } from "@clerk/nextjs/server";

import { canonicalTenantKey } from "@/lib/tenant/aliases";

const FOUNDATION_PREVIEW_TENANTS = new Set([
  "airline-demo-new",
  "healthcare-demo-new",
]);

type MetadataRecord = Record<string, unknown>;

function isRecord(value: unknown): value is MetadataRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

function metadataTenantKey(metadata: MetadataRecord | null | undefined) {
  return (
    metadataString(metadata, "foundationTenantKey") ??
    metadataString(metadata, "tenantKey") ??
    metadataString(metadata, "clientId") ??
    metadataString(metadata, "defaultClientId")
  );
}

function metadataAllowsFoundationPreview(
  metadata: MetadataRecord | null | undefined,
  requestedTenantKey: string,
): boolean {
  if (!metadata) return false;
  if (
    !metadataBoolean(metadata, "foundationTenant") &&
    !metadataBoolean(metadata, "proofLogin")
  ) {
    return false;
  }
  const tenantKey = canonicalTenantKey(metadataTenantKey(metadata) ?? "");
  return tenantKey === requestedTenantKey;
}

export function isFoundationPreviewTenantKey(
  tenantKey: string | null | undefined,
): boolean {
  return FOUNDATION_PREVIEW_TENANTS.has(canonicalTenantKey(tenantKey ?? ""));
}

export async function isFoundationPreviewTenantSession(
  requestedTenantKey: string | null | undefined,
): Promise<boolean> {
  const tenantKey = canonicalTenantKey(requestedTenantKey ?? "");
  if (!isFoundationPreviewTenantKey(tenantKey)) return false;

  let session: Awaited<ReturnType<typeof auth>> | null = null;
  try {
    session = await auth();
  } catch {
    session = null;
  }
  if (!session?.userId) return false;

  const claimsMetadata = isRecord(session.sessionClaims)
    ? isRecord(session.sessionClaims.publicMetadata)
      ? session.sessionClaims.publicMetadata
      : null
    : null;
  if (metadataAllowsFoundationPreview(claimsMetadata, tenantKey)) return true;

  try {
    const user = await currentUser();
    const userMetadata = isRecord(user?.publicMetadata)
      ? user.publicMetadata
      : null;
    return metadataAllowsFoundationPreview(userMetadata, tenantKey);
  } catch {
    return false;
  }
}
