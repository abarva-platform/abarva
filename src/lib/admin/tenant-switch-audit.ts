/**
 * Tenant-switch audit writer — Wave 2 PR-5.
 *
 * Writes one row to `admin_audit_log` per successful tenant switch.
 * Category 'auth' is the canonical category for session-shaping events
 * per the table-schema CHECK constraint (`021_audit_log.sql`,
 * `20260426120500_admin_audit_log.sql`).
 *
 * Why a dedicated module: the route handler must stay thin and the
 * audit write needs explicit fixture-mode handling (the broker
 * boundary disallows direct supabase imports from API routes, and
 * `admin_audit_log` is not yet writable through a higher-level
 * adapter — see admin-audit-log-adapter.ts "Wave 27+ writes events").
 *
 * Failure handling: a failed audit write MUST NOT block the switch.
 * We log a structured warning instead — the structured-log line in
 * `route.ts` is the second audit channel and is always emitted.
 *
 * The `to` and `from` canonical keys are resolved to client UUIDs
 * (`clients.id`) so the foreign-key constraint on `admin_audit_log`
 * is honored. When the destination row is not yet seeded for a
 * tenant (rare on prod, common in test envs) we skip the write
 * rather than violate the constraint.
 */

import 'server-only';

import { azureRead } from '@/lib/data-plane/azureRead';
import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';
import { tenantAliasesFor } from '@/lib/tenant/aliases';
import { isFixtureMode } from '@/lib/admin/data/admin-data-mode';

export interface TenantSwitchAuditInput {
  actorUserId: string;
  fromCanonicalKey: string | null;
  toCanonicalKey: string;
}

async function resolveClientIdByCanonicalKey(
  canonicalKey: string,
): Promise<string | null> {
  try {
    const aliases = tenantAliasesFor(canonicalKey);
    for (const alias of aliases) {
      const row = await azureRead.maybeSingle<{ id: string }>({
        table: 'clients',
        columns: ['id'],
        where: { tenant_key: alias },
      });
      if (row?.id) return row.id;
    }
    for (const alias of aliases) {
      const row = await azureRead.maybeSingle<{ id: string }>({
        table: 'clients',
        columns: ['id'],
        where: { slug: alias },
      });
      if (row?.id) return row.id;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Writes one row to admin_audit_log. Returns true when the row was
 * written; false (and logs a structured warn) when either the
 * destination client_id cannot be resolved, the table is unavailable,
 * or the env is in fixture mode.
 *
 * Callers must not gate the user-visible action (the switch itself)
 * on the return value — the route handler's console.log line is the
 * second audit channel.
 */
export async function writeTenantSwitchAudit(
  input: TenantSwitchAuditInput,
): Promise<boolean> {
  if (isFixtureMode()) {
    // Fixture mode (default in test + local) — the audit row would
    // never be queryable downstream, so skip the write and rely on
    // the structured-log channel.
    return false;
  }

  const clientId = await resolveClientIdByCanonicalKey(input.toCanonicalKey);
  if (!clientId) {
    console.warn(
      JSON.stringify({
        event: 'tenant_switch_audit_skipped',
        reason: 'unresolved_client_id',
        to: input.toCanonicalKey,
      }),
    );
    return false;
  }

  try {
    const supabase = getAzureWriteFluentClient();
    const summary = input.fromCanonicalKey
      ? `Tenant switched · ${input.fromCanonicalKey} → ${input.toCanonicalKey}`
      : `Tenant switched · → ${input.toCanonicalKey}`;
    const { error } = await supabase.from('admin_audit_log').insert({
      client_id: clientId,
      actor_person_id: null,
      category: 'auth',
      action: 'tenant_switched',
      target_kind: 'tenant',
      target_id: null,
      summary,
      metadata: {
        actor_user_id: input.actorUserId,
        from_canonical_key: input.fromCanonicalKey,
        to_canonical_key: input.toCanonicalKey,
      },
    });
    if (error) {
      console.warn(
        JSON.stringify({
          event: 'tenant_switch_audit_failed',
          reason: error.message ?? 'unknown',
          to: input.toCanonicalKey,
        }),
      );
      return false;
    }
    return true;
  } catch (err) {
    console.warn(
      JSON.stringify({
        event: 'tenant_switch_audit_failed',
        reason: err instanceof Error ? err.message : 'unknown',
        to: input.toCanonicalKey,
      }),
    );
    return false;
  }
}
