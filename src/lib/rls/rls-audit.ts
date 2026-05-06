// Phase 5 · Step 8 · RLS violation audit logging
//
// When a query returns fewer rows than expected (possible RLS denial) or
// Supabase returns a policy-violation error, this module writes a structured
// record to admin_audit_log via the service_role client so the event is
// always persisted regardless of the denied user's permissions.
//
// Usage in API routes:
//   const result = await supabase.from('source_events').select('*');
//   if (result.error) {
//     await logRlsViolation({ ... });
//     return NextResponse.json({ error: 'forbidden' }, { status: 403 });
//   }
//
// Postgres does not natively signal RLS denials as errors for SELECT (it
// returns empty rows). The logRlsZeroResult helper is for cases where the
// application knows a row should exist but got nothing back.

import { getServerSupabase } from '@/lib/supabase-server';
import { auth } from '@clerk/nextjs/server';

export interface RlsViolationContext {
  attemptedTable: string;
  attemptedOperation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  attemptedTenantKey?: string | null;
  requestedResourceId?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  surface?: string;
}

// Postgres error codes that indicate an RLS or permission denial.
const RLS_ERROR_CODES = new Set([
  '42501', // insufficient_privilege
  'P0001', // raised from a USING (false) or WITH CHECK (false) policy
  '42P17', // policy_violation (Supabase extension)
]);

export function isRlsError(errorCode: string | null | undefined): boolean {
  if (!errorCode) return false;
  return RLS_ERROR_CODES.has(errorCode);
}

export async function logRlsViolation(ctx: RlsViolationContext): Promise<void> {
  try {
    const { userId, sessionClaims } = await auth();
    const claims = sessionClaims as { publicMetadata?: { role?: string; clientId?: string } } | null;
    const actorRole = (claims?.publicMetadata?.role as string | undefined) ?? 'unknown';
    const jwtTenantKey = (claims?.publicMetadata?.clientId as string | undefined) ?? null;

    // Resolve a client_id for the audit log entry. Admin_audit_log requires
    // client_id UUID. Use the service-role client to look up by tenant key.
    const sb = getServerSupabase();
    const tenantKey = ctx.attemptedTenantKey ?? jwtTenantKey;
    let clientId: string | null = null;
    if (tenantKey) {
      const { data: client } = await sb
        .from('clients')
        .select('id')
        .eq('tenant_key', tenantKey)
        .maybeSingle();
      clientId = (client as { id?: string } | null)?.id ?? null;
    }

    if (!clientId) return; // Cannot write audit log without a valid client_id

    await sb.from('admin_audit_log').insert({
      client_id: clientId,
      actor_user_id: userId ?? 'anonymous',
      actor_role: actorRole,
      action_type: 'rls_violation',
      entity_type: ctx.attemptedTable,
      entity_id: ctx.requestedResourceId ?? null,
      metadata: {
        operation: ctx.attemptedOperation,
        attempted_tenant_key: ctx.attemptedTenantKey ?? null,
        jwt_tenant_key: jwtTenantKey,
        error_code: ctx.errorCode ?? null,
        error_message: ctx.errorMessage ?? null,
        surface: ctx.surface ?? null,
      },
    });
  } catch {
    // Audit log write must never throw or break the calling path.
    // Failures here are silent — the primary defense is RLS itself.
  }
}

// logRlsZeroResult: call when you expected rows but got none.
// SELECT RLS denials return empty result, not an error. This logs the
// suspicious case where an authenticated user's own-tenant query returned
// nothing (which should not happen if seeded correctly).
export async function logRlsZeroResult(ctx: Omit<RlsViolationContext, 'attemptedOperation'>): Promise<void> {
  return logRlsViolation({ ...ctx, attemptedOperation: 'SELECT', errorCode: 'RLS_EMPTY', errorMessage: 'Expected rows but got 0 — possible RLS silent denial' });
}
