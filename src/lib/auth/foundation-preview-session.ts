import { auth, currentUser } from "@clerk/nextjs/server";

import { CANONICAL_AUTH_EMAILS } from "@/lib/auth/canonical-auth-roster";
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

const FOUNDATION_PREVIEW_OPERATOR_EMAILS: ReadonlySet<string> = new Set(
  CANONICAL_AUTH_EMAILS,
);

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function normalizeEmail(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

function emailFromClaims(claims: unknown): string | null {
  if (!isRecord(claims)) return null;
  const emailAddresses = Array.isArray(claims.emailAddresses)
    ? claims.emailAddresses
    : Array.isArray(claims.email_addresses)
      ? claims.email_addresses
      : [];
  const firstEmailAddress = emailAddresses.find(isRecord);
  return firstString(
    claims.emailAddress,
    claims.email,
    firstEmailAddress?.emailAddress,
  );
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

/**
 * Narrow operator bridge for the governed foundation preview only.
 *
 * This is intentionally not `isPlatformAdminSession`: founder/test launch
 * identities need to inspect the frozen Airline/Healthcare Knowledge baseline
 * before legacy tenant access is fully sunset, but that should not widen their
 * product-admin authority elsewhere.
 */
export async function isFoundationPreviewOperatorSession(): Promise<boolean> {
  let session: Awaited<ReturnType<typeof auth>> | null = null;
  try {
    session = await auth();
  } catch {
    session = null;
  }
  if (!session?.userId) return false;

  const claimsEmail = emailFromClaims(session.sessionClaims);
  if (FOUNDATION_PREVIEW_OPERATOR_EMAILS.has(normalizeEmail(claimsEmail))) {
    return true;
  }

  try {
    const user = await currentUser();
    const userEmail = firstString(
      user?.primaryEmailAddress?.emailAddress,
      user?.emailAddresses?.[0]?.emailAddress,
    );
    return FOUNDATION_PREVIEW_OPERATOR_EMAILS.has(normalizeEmail(userEmail));
  } catch {
    return false;
  }
}
