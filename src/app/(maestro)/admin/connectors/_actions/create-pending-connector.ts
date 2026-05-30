'use server';

/**
 * createPendingConnectorAction · PRE-W4-PR-2
 *
 * Server action invoked by the AddConnectorPanel "Save draft" button.
 * Authority-gated to client admins, then delegates to the broker
 * (`createPendingConnector`) which writes the `admin_connectors`
 * row + an `admin_audit_log` entry whose `connector_added` event is
 * the source of the Wave 4 `connector.added` notification.
 *
 * Honors the broker boundary: the action calls the broker; only the
 * broker writes to Supabase. No credentials are collected here.
 *
 * Source: docs/build/PERSONA_A_TENANT_ADMIN_DAY1_2026-05-30.md §4.3
 * + §9 fix #3.
 */

import { resolveAdminTenant } from '@/lib/admin/admin-tenant';
import {
  createPendingConnector,
  type PendingConnectorAuthMethod,
} from '@/lib/admin/broker/connector-health-broker';
import { getCurrentUser } from '@/lib/auth/current-user';
import { loadUserProgramAccessPolicy } from '@/lib/auth/program-access-policy';
import { requireTenancy, TenancyError } from '@/lib/auth/tenancy';

export interface CreatePendingConnectorActionInput {
  templateId: string;
  name: string;
  scope?: string | null;
  authMethod?: PendingConnectorAuthMethod | null;
}

export type CreatePendingConnectorActionResult =
  | { ok: true; connectorId: string }
  | { ok: false; error: string };

/**
 * Server action — invoked by the AddConnectorPanel component on
 * "Save draft" click. Returns a plain object (no redirect) so the
 * panel can transition to its inline saved-state.
 */
export async function createPendingConnectorAction(
  input: CreatePendingConnectorActionInput,
): Promise<CreatePendingConnectorActionResult> {
  // ── Auth + authority ──────────────────────────────────────────
  let ctx;
  try {
    ctx = await requireTenancy();
  } catch (err) {
    if (err instanceof TenancyError) {
      return {
        ok: false,
        error:
          err.code === 'unauthenticated'
            ? 'You must be signed in.'
            : 'No active tenant for your account.',
      };
    }
    return { ok: false, error: 'Authentication failed.' };
  }

  const policy = await loadUserProgramAccessPolicy(ctx).catch(() => null);
  if (!policy?.canAdminUsers) {
    return {
      ok: false,
      error: 'Tenant-admin permission is required to add connectors.',
    };
  }

  // ── Tenant slug + actor for audit ─────────────────────────────
  const tenant = await resolveAdminTenant();
  const user = await getCurrentUser();

  // ── Delegate to broker (which validates + writes) ─────────────
  const result = await createPendingConnector(tenant.tenantSlug, {
    templateId: input.templateId,
    name: input.name,
    scope: input.scope ?? null,
    authMethod: input.authMethod ?? null,
    actorPersonId: user?.personId ?? null,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true, connectorId: result.id };
}
