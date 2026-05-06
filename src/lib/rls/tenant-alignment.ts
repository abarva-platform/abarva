// Phase 5 · Step 9 · Broker tenant alignment validation
//
// Defense-in-depth: verifies the requested tenantKey matches the JWT claim
// BEFORE the request reaches the database. This is the application-tier
// guard; RLS in Postgres is the second layer.
//
// The broker boundary rule (feedback_broker_boundary.md) keeps app-tier
// code from touching the data room directly. This module lives at the
// API-route/broker seam and should be called by any route that passes a
// tenantKey to a broker or Supabase query.
//
// Usage in an API route:
//   const alignmentError = await assertTenantAlignmentWithJwt(requestedTenantKey);
//   if (alignmentError) {
//     await logRlsViolation({ ... });
//     return NextResponse.json({ error: alignmentError.message }, { status: 403 });
//   }

import { auth } from '@clerk/nextjs/server';
import { isClientKey, type ClientKey } from '@/lib/client-config';

export interface TenantAlignmentError {
  code: 'JWT_TENANT_MISMATCH' | 'JWT_MISSING_TENANT' | 'INVALID_TENANT_KEY';
  message: string;
  jwtTenantKey: string | null;
  requestedTenantKey: string;
}

// assertTenantAlignmentWithJwt: verifies the requested key is valid and
// matches the authenticated user's JWT claim. Maestro/admin roles bypass
// the tenant match (they can operate cross-tenant).
//
// Returns null on success; returns an error object on failure (non-throwing
// so callers can decide how to respond — log, 403, etc.).
export async function assertTenantAlignmentWithJwt(
  requestedTenantKey: string,
): Promise<TenantAlignmentError | null> {
  if (!isClientKey(requestedTenantKey as ClientKey)) {
    return {
      code: 'INVALID_TENANT_KEY',
      message: `Requested tenant key '${requestedTenantKey}' is not a valid ClientKey`,
      jwtTenantKey: null,
      requestedTenantKey,
    };
  }

  const { sessionClaims } = await auth();
  const claims = sessionClaims as { publicMetadata?: { role?: string; clientId?: string } } | null;
  const role = (claims?.publicMetadata?.role as string | undefined) ?? 'observer';
  const jwtTenantKey = (claims?.publicMetadata?.clientId as string | undefined) ?? null;

  // Platform-admin roles (maestro, admin, investor) can access any tenant.
  if (['maestro', 'admin', 'investor'].includes(role)) {
    return null;
  }

  if (!jwtTenantKey) {
    return {
      code: 'JWT_MISSING_TENANT',
      message: 'JWT has no tenant_key claim; cannot verify tenant alignment',
      jwtTenantKey: null,
      requestedTenantKey,
    };
  }

  if (jwtTenantKey !== requestedTenantKey) {
    return {
      code: 'JWT_TENANT_MISMATCH',
      message: `JWT tenant '${jwtTenantKey}' does not match requested tenant '${requestedTenantKey}'`,
      jwtTenantKey,
      requestedTenantKey,
    };
  }

  return null;
}

// isTenantAligned: simpler boolean variant for cases where the error detail
// is not needed (e.g., filtering, conditional logic).
export async function isTenantAligned(requestedTenantKey: string): Promise<boolean> {
  const error = await assertTenantAlignmentWithJwt(requestedTenantKey);
  return error === null;
}
