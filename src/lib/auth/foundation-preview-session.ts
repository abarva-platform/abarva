import { auth, currentUser } from "@clerk/nextjs/server";

import { canonicalTenantKey } from "@/lib/tenant/aliases";
import { isFoundationTenantKey } from "@/lib/tenant/foundation-tenants";
import { resolveFoundationTenantKeyFromMetadata } from "@/lib/auth/foundation-route-access";

type MetadataRecord = Record<string, unknown>;

function isRecord(value: unknown): value is MetadataRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function metadataAllowsFoundationPreview(
  metadata: MetadataRecord | null | undefined,
  requestedTenantKey: string,
): boolean {
  return resolveFoundationTenantKeyFromMetadata(metadata) === requestedTenantKey;
}

export function isFoundationPreviewTenantKey(
  tenantKey: string | null | undefined,
): boolean {
  return isFoundationTenantKey(tenantKey);
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
